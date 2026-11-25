export async function scheduleBookingReminder(_appointmentAt: string, _shop: string): Promise<'unsupported'> { return 'unsupported'; }
export function observeNotificationResponses(_onOpen: () => void): () => void { return () => {}; }
export async function registerAppointmentPush(_register: (token: string) => Promise<unknown>, _askPermission = false): Promise<boolean> { return false; }
