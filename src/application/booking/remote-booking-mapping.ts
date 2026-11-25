import { SERVICE_IDS, type ServiceId, type Shop, type Ticket } from '../../domain/booking/entities';
import type { RemoteAppointment, RemoteShop, RemoteSlot } from './remote-appointments';

/** The backend IDs are authoritative; never match a booking to a shop by name. */
export function remoteShopToShop(shop: RemoteShop): Shop {
  const validCoordinates = typeof shop.latitude === 'number' && Number.isFinite(shop.latitude) && Math.abs(shop.latitude) <= 90 && typeof shop.longitude === 'number' && Number.isFinite(shop.longitude) && Math.abs(shop.longitude) <= 180;
  return {
    id: shop.id, name: shop.name, address: shop.address || shop.city || 'Adresse non renseignée', agent: 'À confirmer', queuePrefix: '', isDemo: false,
    ...(shop.city ? { city: shop.city } : {}),
    ...(shop.phone?.trim() ? { phone: shop.phone.trim() } : {}),
    ...(validCoordinates ? { coordinates: { latitude: shop.latitude!, longitude: shop.longitude! } } : {}),
  };
}

export function remoteAppointmentToTicket(item: RemoteAppointment): Ticket | null {
  if (!item.slot || !item.slot.location || !Number.isFinite(Date.parse(item.slot.startsAt))) return null;
  const serviceIds = item.serviceIds.filter((id): id is ServiceId => (SERVICE_IDS as readonly string[]).includes(id));
  return { id: item.id, reference: item.id, shopId: item.slot.location.id, serviceIds, appointmentAt: item.slot.startsAt, customerName: item.customerName, status: item.status, serviceResult: item.serviceResult, serviceMessage: item.serviceMessage };
}

export type SlotDay = { key: string; date: Date; slots: { time: string; slot: RemoteSlot }[] };

/** Madagascar calendar day and time (UTC+3, no daylight saving) of a slot. */
export function slotLocalParts(startsAt: string): { day: string; time: string } | null {
  const date = new Date(startsAt);
  if (!Number.isFinite(date.getTime())) return null;
  const iso = new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString();
  return { day: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/**
 * Days and times offered to the customer come only from the shop's real slots.
 * Each day's `date` is a local-midnight Date so it stays compatible with `findRemoteSlot`.
 */
export function groupSlotsByDay(slots: readonly RemoteSlot[], now: Date): SlotDay[] {
  const days = new Map<string, SlotDay>();
  for (const slot of slots) {
    const parts = slotLocalParts(slot.startsAt);
    if (!parts || Date.parse(slot.startsAt) <= now.getTime()) continue;
    let entry = days.get(parts.day);
    if (!entry) {
      const [y, m, d] = parts.day.split('-').map(Number);
      entry = { key: parts.day, date: new Date(y, m - 1, d), slots: [] };
      days.set(parts.day, entry);
    }
    if (!entry.slots.some(item => item.time === parts.time)) entry.slots.push({ time: parts.time, slot });
  }
  return [...days.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(entry => ({ ...entry, slots: entry.slots.sort((a, b) => a.time.localeCompare(b.time)) }));
}

/** First future slot that still has room, or null. */
export function nextOpenSlot(slots: readonly RemoteSlot[], now: Date): RemoteSlot | null {
  return [...slots]
    .filter(slot => slot.available > 0 && Date.parse(slot.startsAt) > now.getTime())
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0] ?? null;
}

/** Slot matching always uses Madagascar time, independent of the phone timezone. */
export function findRemoteSlot(slots: readonly RemoteSlot[], day: Date, time: string): RemoteSlot | undefined {
  const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  return slots.find(slot => {
    const date = new Date(slot.startsAt);
    if (!Number.isFinite(date.getTime())) return false;
    const local = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    const slotDay = local.toISOString().slice(0, 10);
    const slotTime = local.toISOString().slice(11, 16);
    return slotDay === dayKey && slotTime === time;
  });
}
