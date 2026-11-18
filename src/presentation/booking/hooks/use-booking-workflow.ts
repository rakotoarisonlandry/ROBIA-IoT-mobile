import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppServices } from '../../../composition/app-services-provider';
import { APPOINTMENT_TIMES, validateCustomer } from '../../../domain/booking/rules';
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
  const bookingPending = useRef(false);
  const exportPending = useRef(false);
  const ticketRevision = useRef(0);

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
    setStep(0); setError(''); setReminderMessage(''); setTicket(null); setModal(true);
  };
  const validate = () => {
    try { validateCustomer({ name, cin, phone }); setError(''); return true; }
    catch (error) { setError(bookingErrorMessage(error)); return false; }
  };
  const confirm = async () => {
    if (bookingPending.current) return;
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
      }).catch(() => setReminderMessage('Le rappel n’a pas pu être programmé. Votre réservation reste confirmée.'));
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
    modal, setModal, step, setStep, selected, setSelected, shop, setShop,
    name, setName, cin, setCin, phone, setPhone, time, setTime, day, setDay,
    error, setError, tickets, ticket, setTicket, busy, help, setHelp, reminderMessage,
    unreadNotifications: tickets.filter(item => !readReferences.includes(item.reference)).length,
    open, validate, confirm, pdf,
  };
}
export type BookingWorkflow = ReturnType<typeof useBookingWorkflow>;
