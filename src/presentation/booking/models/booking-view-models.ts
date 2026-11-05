import type { Service, ServiceId, Shop, Ticket } from '../../../domain/booking/entities';

const serviceAppearance: Record<ServiceId, { icon: string; bg: string; color: string }> = {
  'orange-money': { icon: 'money', bg: '#fff0e5', color: '#e76c20' },
  'orange-number': { icon: 'phone', bg: '#edf4ff', color: '#6087c4' },
  subscription: { icon: 'wifi', bg: '#f2edff', color: '#9471c9' },
  purchase: { icon: 'bag', bg: '#eaf6ee', color: '#5d9975' },
};
const shopPhotos: Record<string, string> = {
  analakely: 'photo-1441986300917-64674bd600d8',
  ankorondrano: 'photo-1441984904996-e0b6ba687e04',
  tanjombato: 'photo-1519567241046-7f570eee3ce6',
};
export function toServiceViewModel(service: Service) {
  return { ...service, sub: service.description, ...serviceAppearance[service.id] };
}
export function toShopViewModel(shop: Shop) {
  return { ...shop, prefix: shop.queuePrefix, photo: shopPhotos[shop.id] };
}
export type TicketViewModel = {
  id: string; reference: string; shop: number; services: number[];
  date: string; time: string; name: string;
};
export function toTicketViewModel(ticket: Ticket, shops: readonly Shop[], services: readonly Service[]): TicketViewModel {
  const date = new Date(ticket.appointmentAt);
  return {
    id: ticket.id, reference: ticket.reference,
    shop: shops.findIndex(shop => shop.id === ticket.shopId),
    services: ticket.serviceIds.map(id => services.findIndex(service => service.id === id)),
    date: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    name: ticket.customerName,
  };
}
