export type RemoteShop = { id: string; name: string; address: string | null; city: string | null; latitude: number | null; longitude: number | null };
export type RemoteSlot = { id: string; startsAt: string; available: number };
export type RemoteAppointment = { id: string; slotId: string; customerName: string; serviceIds: string[]; status: 'pending' | 'confirmed' | 'rejected' | 'cancelled'; slot?: { startsAt: string; location: { id: string; name: string; address: string | null } } };
export type RemoteBookingInput = { slotId: string; idempotencyKey: string; customerName: string; phone?: string; serviceIds: string[] };
