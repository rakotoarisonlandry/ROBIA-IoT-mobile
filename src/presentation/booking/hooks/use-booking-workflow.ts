import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppServices } from '../../../composition/app-services-provider';
import { APPOINTMENT_TIMES, appointmentDate, validateCustomer } from '../../../domain/booking/rules';
import { assessTravel, TRAVEL_ESTIMATE_MAX_AGE_MS } from '../../../domain/booking/travel-feasibility';
import { bookingErrorMessage } from '../models/booking-messages';
import { toServiceViewModel, toShopViewModel, toTicketViewModel, type TicketViewModel } from '../models/booking-view-models';

export function useBookingWorkflow() {
  const app = useAppServices();
  const catalog = useMemo(() => app.getCatalog(), [app]);
  const services = useMemo(() => catalog.services.map(toServiceViewModel), [catalog]);
  const shops = useMemo(() => catalog.shops.map(toShopViewModel), [catalog]);
  const dates = useMemo(() => app.getUpcomingDays(), [app]);
  const [modal, setModal] = useState(false);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number[]>([0]);
  const [shop, setShop] = useState(0);
  const [name, setName] = useState('');
  const [cin, setCin] = useState('');
  const [phone, setPhone] = useState('');
  const [time, setTime] = useState('09:00');
  const [day, setDay] = useState(0);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<TicketViewModel[]>([]);
  const [ticket, setTicket] = useState<TicketViewModel | null>(null);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
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
  useEffect(() => () => { travelRequest.current++; }, []);

  useFocusEffect(useCallback(() => {
    let active = true;
    const revision = ticketRevision.current;
    void app.listTickets().then(tickets => {
      if (active && ticketRevision.current === revision) {
        setTickets(tickets.map(ticket => toTicketViewModel(ticket, catalog.shops, catalog.services)));
      }
    }).catch(() => { if (active) setError('Les tickets n’ont pas pu être chargés.'); });
    void AsyncStorage.getItem('@robia/read-notifications-v1').then(value => {
      if (active) setReadReferences(value ? JSON.parse(value) : []);
    }).catch(() => {});
    return () => { active = false; };
  }, [app, catalog]));

  const open = (service?: number, store?: number) => {
    if (service !== undefined) setSelected([service]);
    if (store !== undefined) setShop(store);
    travelRequest.current++; travelPending.current = false; setCheckingTravel(false); setTravel(null); setTravelError(''); setAcceptedRisk(''); setAcceptedUnverified('');
    setStep(0); setError(''); setReminderMessage(''); setTicket(null); setModal(true);
  };
  const validate = () => {
    try { validateCustomer({ name, cin, phone }); setError(''); return true; }
    catch (error) { setError(bookingErrorMessage(error)); return false; }
  };
  const chooseShop = (value: number) => {
    if (value === shop) return;
    travelRequest.current++; travelPending.current = false; setCheckingTravel(false); setTravel(null); setTravelError(''); setAcceptedRisk(''); setAcceptedUnverified(''); setShop(value);
  };
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
      const result = await app.bookAppointment({
        customer: { name, cin, phone }, shopId: shops[shop]?.id,
        serviceIds: selected.map(index => services[index]?.id),
        day: dates[day], time,
      });
      setTickets((await app.listTickets()).map(ticket => toTicketViewModel(ticket, catalog.shops, catalog.services)));
      const confirmed = toTicketViewModel(result, catalog.shops, catalog.services);
      void app.scheduleBookingReminder(result.appointmentAt, shops[confirmed.shop]?.name ?? 'votre boutique').then(status => {
        if (status === 'scheduled') setReminderMessage('Un rappel est prévu une heure avant votre rendez-vous.');
        else if (status === 'denied') setReminderMessage('Activez les notifications dans les réglages de votre appareil pour recevoir les prochains rappels.');
        else setReminderMessage('Aucun rappel ne peut être programmé pour ce rendez-vous.');
      }).catch(() => setReminderMessage('Le rappel n’a pas pu être programmé. Votre rendez-vous reste enregistré sur cet appareil.'));
      setTicket(confirmed);
      setStep(3);
    } catch (error) { setError(bookingErrorMessage(error)); }
    finally { bookingPending.current = false; }
  };
  const pdf = async (ticket: TicketViewModel) => {
    if (exportPending.current) return;
    exportPending.current = true;
    setError(''); setBusy(true);
    try { await app.exportTicket(ticket.reference); }
    catch { setError('Le ticket PDF n’a pas pu être généré. Veuillez réessayer.'); }
    finally { setBusy(false); exportPending.current = false; }
  };
  return {
    services, shops, dates, appointmentTimes: APPOINTMENT_TIMES,
    modal, setModal, step, setStep, selected, setSelected, shop, setShop: chooseShop,
    name, setName, cin, setCin, phone, setPhone, time, setTime, day, setDay,
    error, setError, tickets, ticket, setTicket, busy, help, setHelp, reminderMessage,
    currentTravel, travelAssessment, travelError, checkingTravel, checkTravel, cancelTravelCheck, riskAccepted: acceptedRisk === choiceKey && !!choiceKey,
    setRiskAccepted: (value: boolean) => { setError(''); setAcceptedRisk(value ? choiceKey : ''); },
    unverifiedAccepted: acceptedUnverified === unverifiedKey,
    setUnverifiedAccepted: (value: boolean) => { setError(''); setAcceptedUnverified(value ? unverifiedKey : ''); },
    unreadNotifications: tickets.filter(item => !readReferences.includes(item.reference)).length,
    open, validate, confirm, pdf,
  };
}
export type BookingWorkflow = ReturnType<typeof useBookingWorkflow>;
