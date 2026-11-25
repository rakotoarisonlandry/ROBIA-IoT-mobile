import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { useAppServices } from '../../../composition/app-services-provider';
import { APPOINTMENT_TIMES, appointmentDate, validateCustomer } from '../../../domain/booking/rules';
import { assessTravel, TRAVEL_ESTIMATE_MAX_AGE_MS } from '../../../domain/booking/travel-feasibility';
import { simulatedSlotAvailability } from '../../../domain/booking/slot-availability';
import { findRemoteSlot, groupSlotsByDay } from '../../../application/booking/remote-booking-mapping';
import type { RemoteSlot } from '../../../application/booking/remote-appointments';
import type { Ticket } from '../../../domain/booking/entities';
import { useProfile } from '../../profile/profile-provider';
import { bookingErrorMessage } from '../models/booking-messages';
import { useLiveEvents } from './use-live-events';
import { toServiceViewModel, toShopViewModel, toTicketViewModel, type TicketViewModel } from '../models/booking-view-models';

export function useBookingWorkflow() {
  const app = useAppServices();
  const { profile } = useProfile();
  const [catalog, setCatalog] = useState(() => app.getCatalog());
  const services = useMemo(() => catalog.services.map(toServiceViewModel), [catalog]);
  const shops = useMemo(() => catalog.shops.map(toShopViewModel), [catalog]);
  // Suspended shops stay in `shops` (after the open ones) only to label past tickets.
  const bookableShops = useMemo(() => shops.filter(item => item.bookable !== false), [shops]);
  const localDates = useMemo(() => app.getUpcomingDays(), [app]);
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([0]);
  const [shop, setShop] = useState(0);
  const selectedShopId = useRef<string | null>(null);
  const { name = '', cin = '', phone = '' } = profile ?? {};
  const [verifiedProfile, setVerifiedProfile] = useState('');
  const profileKey = JSON.stringify([name, cin, phone]);
  const resumeBooking = useRef(false);
  const [chosenTime, setTime] = useState('09:00');
  const [chosenDay, setDay] = useState(0);
  const [slotsAt, setSlotsAt] = useState(0);
  const [slotsTick, setSlotsTick] = useState(0);
  const liveRef = useRef(false);
  const ticketRefresh = useRef<((withShops?: boolean) => Promise<void>) | null>(null);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<TicketViewModel[]>([]);
  const [slotTickets, setSlotTickets] = useState<Ticket[] | null>(null);
  const [remoteSlots, setRemoteSlots] = useState<RemoteSlot[] | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [cancelTarget, setCancelTarget] = useState('');
  const [slotError, setSlotError] = useState('');
  const [ticket, setTicket] = useState<TicketViewModel | null>(null);
  const openTicket = useRef<TicketViewModel | null>(null);
  useEffect(() => { openTicket.current = ticket; }, [ticket]);
  /**
   * Once the shop has recorded the outcome of the visit, the ticket is done:
   * it leaves the app (the agent's message stays in Notifications).
   */
  const showTickets = useCallback((items: readonly Ticket[], current: ReturnType<typeof app.getCatalog>) => {
    const shown = openTicket.current;
    if (shown && items.some(item => item.id === shown.id && item.serviceResult)) { setModal(false); setTicket(null); }
    setTickets(items.filter(item => !item.serviceResult).map(item => toTicketViewModel(item, current.shops, current.services)).filter(item => item.shop >= 0));
  }, [app]);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [pdfMessage, setPdfMessage] = useState('');
  const [readReferences, setReadReferences] = useState<string[]>([]);
  const [travel, setTravel] = useState<{ shopId: string; checkedAt: number; seconds: number; meters: number } | null>(null);
  const [travelError, setTravelError] = useState('');
  const [checkingTravel, setCheckingTravel] = useState(false);
  const [acceptedRisk, setAcceptedRisk] = useState('');
  const [acceptedUnverified, setAcceptedUnverified] = useState('');
  const [evaluationAt, setEvaluationAt] = useState(0);
  const travelRequest = useRef(0);
  const travelPending = useRef(false);
  const bookingPending = useRef(false);
  const exportPending = useRef(false);
  const ticketRevision = useRef(0);
  const slotRequest = useRef(0);
  const pendingRequest = useRef<{ choice: string; key: string } | null>(null);
  useEffect(() => () => { travelRequest.current++; }, []);
  /** Closes the booking sheet when the chosen shop was suspended meanwhile. */
  const applyShopChanges = useCallback((currentCatalog: ReturnType<typeof app.getCatalog>) => {
    const open = currentCatalog.shops.filter(item => item.bookable !== false);
    const previousId = selectedShopId.current;
    const nextIndex = previousId ? open.findIndex(item => item.id === previousId) : 0;
    if (previousId && nextIndex < 0) { selectedShopId.current = null; setShop(0); setModal(false); setCatalogError('La boutique sélectionnée n’est plus disponible.'); }
    else { if (previousId) setShop(nextIndex); setCatalogError(open.length ? '' : 'Aucune boutique ouverte aux rendez-vous pour le moment.'); }
    setCatalog(currentCatalog);
  }, [app]);

  useFocusEffect(useCallback(() => {
    let active = true;
    if (resumeBooking.current) { resumeBooking.current = false; setModal(true); }
    const revision = ticketRevision.current;
    void app.refreshCatalog().then(currentCatalog => {
      if (!active) return;
      applyShopChanges(currentCatalog);
      return app.listTickets();
    }).then(tickets => {
      if (!tickets) return;
      if (active) setTicketsLoaded(true);
      if (active && ticketRevision.current === revision) {
        const currentCatalog = app.getCatalog();
        setCatalog(currentCatalog);
        setSlotTickets(tickets); setSlotError('');
        showTickets(tickets, currentCatalog);
      }
    }).catch(() => { if (active) { setTicketsLoaded(true); setSlotTickets(null); setSlotError('Impossible de charger vos rendez-vous.'); setCatalogError('Impossible de charger les boutiques ou vos rendez-vous. Vérifiez votre connexion.'); } });
    void AsyncStorage.getItem('@robia/read-notifications-v1').then(value => {
      if (active) setReadReferences(value ? JSON.parse(value) : []);
    }).catch(() => {});
    return () => { active = false; };
  }, [app, applyShopChanges, showTickets]));

  useFocusEffect(useCallback(() => {
    if (!app.appointmentsApi.configured) return;
    let active = true;
    let pending = false;
    const refresh = async (withShops = false) => {
      if (!active || pending || AppState.currentState !== 'active') return;
      pending = true;
      const revision = ticketRevision.current;
      try {
        if (withShops) applyShopChanges(await app.refreshCatalog());
        const items = await app.listTickets();
        if (active && ticketRevision.current === revision) {
          const currentCatalog = app.getCatalog();
          setCatalog(currentCatalog);
          showTickets(items, currentCatalog);
        }
      } catch { /* A later refresh retries without interrupting the current screen. */ }
      finally { pending = false; }
    };
    ticketRefresh.current = refresh;
    // Fallback only: while the live stream is connected, events drive updates.
    const timer = setInterval(() => { if (!liveRef.current) void refresh(true); }, 10000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(true); });
    return () => { active = false; ticketRefresh.current = null; clearInterval(timer); subscription.remove(); };
  }, [app, applyShopChanges, showTickets]));
  const live = useLiveEvents(event => {
    if (event.type === 'ready' || event.type.startsWith('booking.')) void ticketRefresh.current?.();
    if (event.type === 'slots.changed' && event.data.locationId === selectedShopId.current) setSlotsTick(tick => tick + 1);
    if (event.type === 'shop.changed') void ticketRefresh.current?.(true);
  });
  useEffect(() => { liveRef.current = live; }, [live]);

  const open = (service?: number, store?: number) => {
    if (!bookableShops.length) { setCatalogError('Aucune boutique ouverte aux rendez-vous pour le moment. Réessayez plus tard.'); return; }
    if (service !== undefined) setSelected([service]);
    if (store !== undefined) { setShop(store); selectedShopId.current = shops[store]?.id ?? null; }
    else selectedShopId.current = shops[shop]?.id ?? null;
    travelRequest.current++; travelPending.current = false; setCheckingTravel(false); setTravel(null); setTravelError(''); setAcceptedRisk(''); setAcceptedUnverified('');
    setRemoteSlots(null); setVerifiedProfile(''); setStep(profile ? 1 : 0); setError(''); setReminderMessage(''); setPdfMessage(''); setTicket(null); setModal(true);
  };
  const editProfile = () => { setModal(false); resumeBooking.current = true; router.push('/profil'); };
  const validate = () => {
    try { validateCustomer({ name, cin, phone }); setError(''); return true; }
    catch (error) { setError(bookingErrorMessage(error)); return false; }
  };
  const chooseShop = (value: number) => {
    if (value === shop) return;
    travelRequest.current++; slotRequest.current++; setRemoteSlots(null); travelPending.current = false; setCheckingTravel(false); setTravel(null); setTravelError(''); setAcceptedRisk(''); setAcceptedUnverified(''); selectedShopId.current = shops[value]?.id ?? null; setShop(value);
  };
  // Connected mode: days, times and seats come only from the shop's real slots.
  const remoteDays = useMemo(
    () => (app.appointmentsApi.configured && remoteSlots ? groupSlotsByDay(remoteSlots, new Date(slotsAt)) : null),
    [app, remoteSlots, slotsAt],
  );
  const dates = useMemo(() => (app.appointmentsApi.configured ? remoteDays?.map(entry => entry.date) ?? [] : localDates), [app, remoteDays, localDates]);
  const day = Math.min(chosenDay, Math.max(0, dates.length - 1));
  const appointmentTimes = app.appointmentsApi.configured ? remoteDays?.[day]?.slots.map(entry => entry.time) ?? [] : APPOINTMENT_TIMES;
  const availableFor = (slot: string): number | null => app.appointmentsApi.configured
    ? (remoteDays ? remoteDays[day]?.slots.find(entry => entry.time === slot)?.slot.available ?? 0 : null)
    : slotTickets && dates[day] ? simulatedSlotAvailability(shops[shop]?.id, dates[day], slot, slotTickets) : null;
  // Keep the customer's choice when it is still open; otherwise move to the first free time of the day.
  const time = app.appointmentsApi.configured && remoteDays && !(availableFor(chosenTime) ?? 0)
    ? appointmentTimes.find(slot => (availableFor(slot) ?? 0) > 0) ?? chosenTime
    : chosenTime;
  const reloadSlots = async () => {
    try { if (app.appointmentsApi.configured) { const id = shops[shop]?.id; if (!id) throw new Error(); const requestId = ++slotRequest.current; setRemoteSlots(null); const slots = await app.appointmentsApi.slots(id); if (requestId !== slotRequest.current) return; setRemoteSlots(slots); setSlotsAt(Date.now()); } else { const items = await app.listTickets(); setSlotTickets(items); } setSlotError(''); setError(''); }
    catch { setSlotError('Impossible de charger les créneaux. Réessayez.'); }
  };
  useEffect(() => {
    if (!modal || step !== 2 || !app.appointmentsApi.configured || !shops[shop]?.id) return;
    let active = true;
    const requests = slotRequest;
    const shopId = shops[shop].id;
    const load = (initial: boolean) => {
      const requestId = ++requests.current;
      void app.appointmentsApi.slots(shopId).then(items => { if (active && requestId === requests.current) { setRemoteSlots(items); setSlotsAt(Date.now()); setSlotError(''); } }).catch(() => { if (active && requestId === requests.current && initial) { setRemoteSlots(null); setSlotError('Impossible de charger les créneaux. Réessayez.'); } });
    };
    load(true);
    // Seats change while the customer hesitates: refresh them quietly.
    const timer = setInterval(() => { if (AppState.currentState === 'active' && !liveRef.current) load(false); }, 15000);
    return () => { active = false; clearInterval(timer); requests.current++; };
  }, [app, modal, step, shop, shops, slotsTick]);
  const currentTravel = travel?.shopId === shops[shop]?.id ? travel : null;
  const choiceKey = currentTravel ? `${currentTravel.shopId}:${currentTravel.checkedAt}:${day}:${time}` : '';
  const unverifiedKey = `${shops[shop]?.id}:${day}:${time}`;
  let travelAssessment: ReturnType<typeof assessTravel> | null = null;
  if (currentTravel) {
    try { travelAssessment = assessTravel(appointmentDate(dates[day], time, new Date(evaluationAt || currentTravel.checkedAt)), new Date(evaluationAt || currentTravel.checkedAt), currentTravel.seconds); } catch { /* Booking validation handles invalid dates. */ }
  }
  const checkTravel = useCallback(async () => {
    if (travelPending.current) return;
    setError('');
    const target = shops[shop];
    if (!target?.coordinates) { setTravel(null); setTravelError('La position de cette boutique n’est pas renseignée. Le trajet ne peut pas être vérifié.'); return; }
    const id = ++travelRequest.current;
    travelPending.current = true;
    setCheckingTravel(true); setTravelError(''); setTravel(null); setAcceptedRisk(''); setAcceptedUnverified('');
    try {
      const result = await app.locateUser();
      if (id !== travelRequest.current) return;
      if (result.status !== 'ready') {
        setTravelError(result.status === 'denied' ? 'Autorisez la localisation pour vérifier le trajet.' : 'Position indisponible. Activez le GPS et réessayez.');
        return;
      }
      const route = await app.maps.estimateDrivingTime(result.location.coords, target.coordinates);
      if (id === travelRequest.current) { const now = Date.now(); setEvaluationAt(now); setTravel({ shopId: target.id, checkedAt: now, ...route }); }
    } catch { if (id === travelRequest.current) setTravelError('Impossible de vérifier le trajet. Vérifiez votre connexion et réessayez.'); }
    finally { if (id === travelRequest.current) { travelPending.current = false; setCheckingTravel(false); } }
  }, [app, shop, shops]);
  const cancelTravelCheck = useCallback(() => {
    travelRequest.current++; travelPending.current = false; setCheckingTravel(false);
  }, []);
  const confirm = async () => {
    if (bookingPending.current || checkingTravel) return;
    if (!validate() || verifiedProfile !== profileKey) { setError('Vérifiez et confirmez vos informations avant de continuer.'); return; }
    if (!currentTravel && acceptedUnverified !== unverifiedKey) {
      setError('Vérifiez votre trajet ou confirmez que vous poursuivez sans estimation.'); return;
    }
    if (currentTravel) {
      setEvaluationAt(Date.now());
      if (Date.now() - currentTravel.checkedAt > TRAVEL_ESTIMATE_MAX_AGE_MS) {
        setTravel(null); setAcceptedRisk(''); setError('L’estimation du trajet a expiré. Vérifiez-la à nouveau ou continuez sans vérification.'); return;
      }
      try {
        if (assessTravel(appointmentDate(dates[day], time, new Date()), new Date(), currentTravel.seconds).isTight && acceptedRisk !== choiceKey) {
          setError('Ce créneau semble trop proche compte tenu du trajet. Choisissez un autre horaire ou confirmez que vous avez prévu votre déplacement.'); return;
        }
      } catch (error) { setError(bookingErrorMessage(error)); return; }
    }
    bookingPending.current = true;
    ticketRevision.current++;
    setError('');
    try {
      if (app.appointmentsApi.configured) {
        const chosenSlot = remoteSlots && dates[day] ? findRemoteSlot(remoteSlots, dates[day], time) : undefined;
        if (!chosenSlot || chosenSlot.available <= 0) { setError('Ce créneau n’est plus disponible. Choisissez un autre horaire.'); void reloadSlots(); return; }
        const serviceIds = selected.map(index => services[index]?.id);
        const choice = JSON.stringify([chosenSlot.id, name, phone, serviceIds]);
        if (pendingRequest.current?.choice !== choice) pendingRequest.current = { choice, key: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}` };
        const result = await app.appointmentsApi.book({ slotId: chosenSlot.id, idempotencyKey: pendingRequest.current.key, customerName: name.trim(), phone: phone || undefined, serviceIds });
        pendingRequest.current = null;
        const currentTicket: Ticket = { id: result.id, reference: result.id, shopId: shops[shop].id, serviceIds, appointmentAt: chosenSlot.startsAt, customerName: name, status: result.status };
        const mapped = toTicketViewModel(currentTicket, catalog.shops, catalog.services);
        setTicket(mapped); setStep(3); setReminderMessage('La boutique doit confirmer votre demande.');
        void app.registerAppointmentPush(true).catch(() => {});
        try { const updated = await app.listTickets(); showTickets(updated, catalog); } catch { /* The reservation was saved; refresh later. */ }
        return;
      }
      const latestTickets = await app.listTickets();
      setSlotTickets(latestTickets); setSlotError('');
      if (simulatedSlotAvailability(shops[shop]?.id, dates[day], time, latestTickets) === 0) {
        setError('Ce créneau est complet. Choisissez un autre horaire.'); return;
      }
      const result = await app.bookAppointment({
        customer: { name, cin, phone }, shopId: shops[shop]?.id,
        serviceIds: selected.map(index => services[index]?.id),
        day: dates[day], time,
      });
      const updatedTickets = await app.listTickets();
      setSlotTickets(updatedTickets);
      setTickets(updatedTickets.map(ticket => toTicketViewModel(ticket, catalog.shops, catalog.services)));
      const confirmed = toTicketViewModel(result, catalog.shops, catalog.services);
      void app.scheduleBookingReminder(result.appointmentAt, shops[confirmed.shop]?.name ?? 'votre boutique').then(status => {
        if (status === 'scheduled') setReminderMessage('Un rappel est prévu une heure avant votre rendez-vous.');
        else if (status === 'denied') setReminderMessage('Activez les notifications dans les réglages de votre appareil pour recevoir les prochains rappels.');
        else setReminderMessage('Aucun rappel ne peut être programmé pour ce rendez-vous.');
      }).catch(() => setReminderMessage('Le rappel n’a pas pu être programmé. Votre rendez-vous reste enregistré sur cet appareil.'));
      setTicket(confirmed);
      setStep(3);
    } catch (error) {
      setError(app.appointmentsApi.configured && error instanceof Error ? error.message : bookingErrorMessage(error));
      // Another customer may have taken the last seat: show the fresh availability.
      if (app.appointmentsApi.configured) void reloadSlots();
    }
    finally { bookingPending.current = false; }
  };
  const pdf = async (ticket: TicketViewModel) => {
    if (exportPending.current) return;
    exportPending.current = true;
    setError(''); setPdfMessage(''); setBusy(true);
    try {
      let result: 'saved' | 'shared';
      if (app.appointmentsApi.configured) {
        const selectedShop = shops[ticket.shop];
        if (!selectedShop) throw new Error('Boutique introuvable');
        result = await app.exportBookingDocument({ id: ticket.code, reference: ticket.reference, name: ticket.name, shopName: selectedShop.name, address: selectedShop.address, agent: selectedShop.agent, date: ticket.date, time: ticket.time, services: ticket.services.map(index => services[index]?.name).filter(Boolean), status: ticket.status });
      } else result = await app.exportTicket(ticket.reference);
      if (result === 'saved') setPdfMessage(`Ticket enregistré : Ticket-Robia-${ticket.code}.pdf`);
    }
    catch (cause) {
      if (__DEV__) console.warn('Ticket PDF export failed', cause);
      // The reason helps support if it happens on a customer's phone.
      const reason = cause instanceof Error && cause.message ? ` (${cause.message.slice(0, 120)})` : '';
      setError(`Le ticket PDF n’a pas pu être enregistré. Vérifiez l’espace disponible puis réessayez.${reason}`);
    }
    finally { setBusy(false); exportPending.current = false; }
  };
  const cancelBooking = async (reference: string) => {
    if (busy) return;
    setBusy(true); setCatalogError('');
    try { await app.appointmentsApi.cancel(reference); const updated = await app.listTickets(); const currentCatalog = app.getCatalog(); setCatalog(currentCatalog); showTickets(updated, currentCatalog); setCancelTarget(''); }
    catch (error) { setCatalogError(error instanceof Error ? error.message : 'Impossible d’annuler le rendez-vous.'); }
    finally { setBusy(false); }
  };
  const refreshBookings = async () => {
    setCatalogError('');
    try { await app.refreshCatalog(); const updated = await app.listTickets(); const currentCatalog = app.getCatalog(); setCatalog(currentCatalog); showTickets(updated, currentCatalog); }
    catch { setCatalogError('Impossible de charger les boutiques et rendez-vous. Vérifiez votre connexion.'); }
  };
  return {
    services, shops, bookableShops, dates, appointmentTimes, slotsLoaded: !app.appointmentsApi.configured || !!remoteDays, live,
    modal, setModal, step, setStep, selected, setSelected, shop, setShop: chooseShop,
    name, cin, phone, time, setTime, day, setDay, editProfile,
    profileConfirmed: verifiedProfile === profileKey && !!profile,
    setProfileConfirmed: (value: boolean) => { setError(''); setVerifiedProfile(value ? profileKey : ''); },
    error, setError, tickets, ticket, setTicket, busy, help, setHelp, reminderMessage, pdfMessage,
    currentTravel, travelAssessment, travelError, checkingTravel, checkTravel, cancelTravelCheck, riskAccepted: acceptedRisk === choiceKey && !!choiceKey,
    availableFor, slotError, reloadSlots,
    isRemote: app.appointmentsApi.configured, catalogError, refreshBookings, ticketsLoaded,
    cancelTarget, setCancelTarget, cancelBooking,
    setRiskAccepted: (value: boolean) => { setError(''); setAcceptedRisk(value ? choiceKey : ''); },
    unverifiedAccepted: acceptedUnverified === unverifiedKey,
    setUnverifiedAccepted: (value: boolean) => { setError(''); setAcceptedUnverified(value ? unverifiedKey : ''); },
    unreadNotifications: tickets.filter(item => !readReferences.includes(`${item.reference}:${item.status ?? 'local'}:${item.serviceResult ?? ''}`)).length,
    open, validate, confirm, pdf,
  };
}
export type BookingWorkflow = ReturnType<typeof useBookingWorkflow>;
