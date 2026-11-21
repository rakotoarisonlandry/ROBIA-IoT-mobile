import { deviceToken } from './device-token';
import type { RemoteShop, RemoteSlot, RemoteAppointment, RemoteBookingInput } from '../../application/booking/remote-appointments';

export class AppointmentsApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function createAppointmentsApi(baseUrl: string | undefined, store = deviceToken, request: typeof fetch = fetch) {
  const url = baseUrl?.trim().replace(/\/+$/, '') ?? '';
  let identityPending: Promise<string> | null = null;
  const call = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    if (!url || (!url.startsWith('https://') && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url))) throw new AppointmentsApiError(0, 'Le service de rendez-vous n’est pas configuré.');
    let response: Response;
    try { response = await request(`${url}/appointments${path}`, options); }
    catch { throw new AppointmentsApiError(0, 'Connexion au service de rendez-vous impossible.'); }
    if (!response.ok) throw new AppointmentsApiError(response.status, response.status === 409 ? 'Ce créneau n’est plus disponible.' : response.status === 401 ? 'Votre accès a expiré. Récupérez votre accès par e-mail.' : 'Le service de rendez-vous est indisponible.');
    try { return await response.json() as T; } catch { throw new AppointmentsApiError(0, 'Réponse du serveur invalide.'); }
  };
  const json = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const identity = async () => {
    const existing = await store.get();
    if (existing) return existing;
    if (!identityPending) identityPending = (async () => {
      const created = await call<{ token: string }>('/devices', { method: 'POST' });
      if (!/^[A-Za-z0-9_-]{43}$/.test(created.token)) throw new AppointmentsApiError(0, 'Réponse du serveur invalide.');
      await store.save(created.token);
      return created.token;
    })().finally(() => { identityPending = null; });
    return identityPending;
  };
  const authorized = async <T>(path: string, options: RequestInit = {}) => {
    const token = await identity();
    return call<T>(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
  };
  return {
    configured: !!url,
    shops: () => call<RemoteShop[]>('/shops'),
    slots: (shopId: string) => call<RemoteSlot[]>(`/shops/${encodeURIComponent(shopId)}/slots`),
    list: () => authorized<RemoteAppointment[]>('/mine'),
    book: (input: RemoteBookingInput) => authorized<RemoteAppointment>('', json(input)),
    cancel: (id: string) => authorized<{ id: string; status: string }>(`/${encodeURIComponent(id)}/cancel`, { method: 'POST' }),
    requestEmailVerification: (email: string) => authorized<{ message: string }>('/email/verify/request', json({ email })),
    verifyEmail: (email: string, code: string) => authorized<{ verified: boolean }>('/email/verify', json({ email, code })),
    requestRecovery: (email: string) => call<{ message: string }>('/email/recover/request', json({ email })),
    recover: async (email: string, code: string) => {
      const result = await call<{ token: string }>('/email/recover', json({ email, code }));
      if (!/^[A-Za-z0-9_-]{43}$/.test(result.token)) throw new AppointmentsApiError(0, 'Réponse du serveur invalide.');
      await store.save(result.token);
    },
  };
}
