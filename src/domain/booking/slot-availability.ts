import type { Ticket } from './entities';

export const SIMULATED_SLOT_CAPACITY = 5;

/** Illustrative baseline, stable for a shop and local date/time; never a real availability. */
export function simulatedSlotAvailability(shopId: string, day: Date, time: string, tickets: readonly Ticket[]): number {
  if (!shopId || !Number.isFinite(day.getTime()) || !/^\d{2}:\d{2}$/.test(time)) return 0;
  const dateKey = `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
  const seed = `${shopId}|${dateKey}|${time}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (Math.imul(hash, 31) + seed.charCodeAt(i)) >>> 0;
  const initialAvailable = hash % (SIMULATED_SLOT_CAPACITY + 1);
  const localBookings = tickets.filter(ticket => {
    if (ticket.shopId !== shopId) return false;
    const at = new Date(ticket.appointmentAt);
    if (!Number.isFinite(at.getTime())) return false;
    const ticketTime = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
    return at.getFullYear() === day.getFullYear() && at.getMonth() === day.getMonth()
      && at.getDate() === day.getDate() && ticketTime === time;
  }).length;
  return Math.max(0, initialAvailable - localBookings);
}
