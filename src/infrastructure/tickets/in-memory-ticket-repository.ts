import type { TicketRepository } from '../../application/booking/ports';
import type { Ticket, TicketDraft } from '../../domain/booking/entities';

const copy = (ticket: Ticket): Ticket => ({ ...ticket, serviceIds: [...ticket.serviceIds] });
/** Session-only storage. A new application instance starts with no bookings. */
export class InMemoryTicketRepository implements TicketRepository {
  private readonly tickets: Ticket[] = [];
  async getAll(): Promise<Ticket[]> { return this.tickets.map(copy); }
  async findByReference(reference: string): Promise<Ticket | null> {
    const ticket = this.tickets.find(ticket => ticket.reference === reference);
    return ticket ? copy(ticket) : null;
  }
  async reserve(draft: TicketDraft, queuePrefix: string): Promise<Ticket> {
    if (this.tickets.some(ticket => ticket.reference === draft.reference)) throw new Error('Duplicate ticket reference');
    const sequence = this.tickets.filter(ticket => ticket.shopId === draft.shopId).length + 1;
    const ticket: Ticket = { ...draft, serviceIds: [...draft.serviceIds], id: `${queuePrefix}${String(sequence).padStart(2, '0')}` };
    this.tickets.unshift(ticket);
    return copy(ticket);
  }
}
