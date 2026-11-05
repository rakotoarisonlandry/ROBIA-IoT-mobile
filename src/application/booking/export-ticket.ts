import { BookingError } from '../../domain/booking/entities';
import type { CatalogRepository, TicketExporter, TicketRepository } from './ports';

export function createExportTicket(dependencies: {
  tickets: TicketRepository;
  catalog: CatalogRepository;
  exporter: TicketExporter;
}) {
  return async (reference: string): Promise<void> => {
    const ticket = await dependencies.tickets.findByReference(reference);
    if (!ticket) throw new BookingError('ticket-not-found');
    const shop = dependencies.catalog.getShops().find(shop => shop.id === ticket.shopId);
    if (!shop) throw new BookingError('invalid-shop');
    const date = new Date(ticket.appointmentAt);
    await dependencies.exporter.export({
      id: ticket.id, reference: ticket.reference, name: ticket.customerName,
      shopName: shop.name, address: shop.address, agent: shop.agent,
      date: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
      services: ticket.serviceIds.map(id => dependencies.catalog.getServices().find(service => service.id === id)!.name),
    });
  };
}
