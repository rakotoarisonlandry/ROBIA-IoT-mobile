import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TicketRepository } from '../../application/booking/ports';
import type { Ticket, TicketDraft } from '../../domain/booking/entities';

const KEY = '@robia/demo-tickets-v1';

/** Local demo data only; queue numbers are not shared with the store. */
export class AsyncStorageTicketRepository implements TicketRepository {
  private pending: Promise<unknown> = Promise.resolve();

  async getAll(): Promise<Ticket[]> {
    await this.pending;
    const value = await AsyncStorage.getItem(KEY);
    return value ? JSON.parse(value) as Ticket[] : [];
  }

  async findByReference(reference: string): Promise<Ticket | null> {
    return (await this.getAll()).find(ticket => ticket.reference === reference) ?? null;
  }

  reserve(draft: TicketDraft, queuePrefix: string): Promise<Ticket> {
    const operation = this.pending.then(async () => {
      const value = await AsyncStorage.getItem(KEY);
      const tickets: Ticket[] = value ? JSON.parse(value) : [];
      if (tickets.some(ticket => ticket.reference === draft.reference)) throw new Error('Duplicate ticket reference');
      const sequence = tickets.filter(ticket => ticket.shopId === draft.shopId).length + 1;
      const ticket = { ...draft, id: `${queuePrefix}${String(sequence).padStart(2, '0')}` };
      await AsyncStorage.setItem(KEY, JSON.stringify([ticket, ...tickets]));
      return ticket;
    });
    this.pending = operation.catch(() => {});
    return operation;
  }
}
