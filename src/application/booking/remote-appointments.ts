export type RemoteShop = { id: string; name: string; address: string | null; city: string | null; phone?: string | null; latitude: number | null; longitude: number | null };
export type RemoteSlot = { id: string; startsAt: string; available: number };
export type RemoteAppointment = { id: string; slotId: string; customerName: string; serviceIds: string[]; status: 'pending' | 'confirmed' | 'rejected' | 'cancelled'; serviceResult?: 'treated' | 'not_treated' | null; serviceMessage?: string | null; slot?: { startsAt: string; location: { id: string; name: string; address: string | null } } };
export type RemoteBookingInput = { slotId: string; idempotencyKey: string; customerName: string; phone?: string; serviceIds: string[] };
/** One message of the live appointment stream (no personal data). */
export type LiveEvent = {
  type: 'ready' | 'booking.created' | 'booking.updated' | 'slots.changed' | 'shop.changed' | (string & {});
  data: { locationId?: string; bookingId?: string; status?: string; [key: string]: unknown };
};
