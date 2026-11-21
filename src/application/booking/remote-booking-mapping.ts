import { SERVICE_IDS, type ServiceId, type Shop, type Ticket } from '../../domain/booking/entities';
import type { RemoteAppointment, RemoteShop, RemoteSlot } from './remote-appointments';

/** The backend IDs are authoritative; never match a booking to a shop by name. */
export function remoteShopToShop(shop: RemoteShop): Shop {
  const validCoordinates = typeof shop.latitude === 'number' && Number.isFinite(shop.latitude) && Math.abs(shop.latitude) <= 90 && typeof shop.longitude === 'number' && Number.isFinite(shop.longitude) && Math.abs(shop.longitude) <= 180;
  return { id: shop.id, name: shop.name, address: shop.address || shop.city || 'Adresse non renseignée', agent: 'À confirmer', queuePrefix: '', isDemo: false, ...(validCoordinates ? { coordinates: { latitude: shop.latitude!, longitude: shop.longitude! } } : {}) };
}

export function remoteAppointmentToTicket(item: RemoteAppointment): Ticket | null {
  if (!item.slot || !item.slot.location || !Number.isFinite(Date.parse(item.slot.startsAt))) return null;
  const serviceIds = item.serviceIds.filter((id): id is ServiceId => (SERVICE_IDS as readonly string[]).includes(id));
  return { id: item.id, reference: item.id, shopId: item.slot.location.id, serviceIds, appointmentAt: item.slot.startsAt, customerName: item.customerName, status: item.status };
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
