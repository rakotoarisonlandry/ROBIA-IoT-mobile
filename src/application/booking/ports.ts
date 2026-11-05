import type { Service, Shop, Ticket, TicketDraft } from '../../domain/booking/entities';

export interface CatalogRepository {
  getServices(): readonly Service[];
  getShops(): readonly Shop[];
}
export interface TicketRepository {
  getAll(): Promise<Ticket[]>;
  findByReference(reference: string): Promise<Ticket | null>;
  /** Implementations allocate the queue number atomically. */
  reserve(draft: TicketDraft, queuePrefix: string): Promise<Ticket>;
}
export interface Clock { now(): Date }
export interface ReferenceGenerator { generate(): string }
export type TicketDocument = {
  id: string;
  reference: string;
  name: string;
  shopName: string;
  address: string;
  date: string;
  time: string;
  services: string[];
  agent: string;
};
export interface TicketExporter { export(document: TicketDocument): Promise<void> }
