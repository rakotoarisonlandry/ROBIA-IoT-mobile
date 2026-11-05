import { BookingError, type Customer } from './entities';

export function validateCustomer(customer: Customer): void {
  if (!customer.name.trim() || !/^\d{12}$/.test(customer.cin)) {
    throw new BookingError('invalid-customer');
  }
  if (customer.phone && !/^\+?[\d\s]{9,15}$/.test(customer.phone)) {
    throw new BookingError('invalid-phone');
  }
}

export function appointmentDate(day: Date, time: string, now: Date): Date {
  if (!Number.isFinite(day.getTime())) throw new BookingError('invalid-date');
  // Slots start every 30 minutes, including 08:00 and 16:00.
  if (!/^(?:0[89]|1[0-5]):(?:00|30)$|^16:00$/.test(time)) {
    throw new BookingError('invalid-time');
  }
  const [hours, minutes] = time.split(':').map(Number);
  const appointment = new Date(day);
  appointment.setHours(hours, minutes, 0, 0);
  if (appointment <= now) throw new BookingError('past-appointment');
  return appointment;
}

export function upcomingDays(now: Date, count = 7): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() + index + 1);
    date.setHours(0, 0, 0, 0);
    return date;
  });
}

export const APPOINTMENT_TIMES = Array.from({ length: 17 }, (_, index) =>
  `${String(8 + Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);
