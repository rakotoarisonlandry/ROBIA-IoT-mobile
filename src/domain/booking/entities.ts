export const SERVICE_IDS = ['orange-money', 'orange-number', 'subscription', 'purchase'] as const;
export type ServiceId = typeof SERVICE_IDS[number];

export type Service = { id: ServiceId; name: string; description: string };
export type Shop = {
  id: string;
  name: string;
  address: string;
  agent: string;
  queuePrefix: string;
  isDemo: boolean;
  coordinates?: { latitude: number; longitude: number };
};
export type Customer = { name: string; cin: string; phone: string };
export type Ticket = {
  id: string;
  reference: string;
  shopId: string;
  serviceIds: ServiceId[];
  appointmentAt: string;
  customerName: string;
};
export type TicketDraft = Omit<Ticket, 'id'>;

export type BookingErrorCode = 'invalid-customer' | 'invalid-phone' | 'invalid-services'
  | 'invalid-shop' | 'invalid-date' | 'invalid-time' | 'past-appointment' | 'ticket-not-found';
export class BookingError extends Error {
  constructor(public readonly code: BookingErrorCode) {
    super(code);
    this.name = 'BookingError';
  }
}
