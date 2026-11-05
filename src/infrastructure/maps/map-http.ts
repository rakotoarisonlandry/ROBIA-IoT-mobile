import { MapError, type MapErrorCode } from '../../domain/location/entities';

export async function mapJson<T>(fetcher: typeof fetch, url: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 15000);
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal });
    const json = await response.json();
    if (!response.ok) {
      const knownCodes: MapErrorCode[] = ['configuration', 'invalid-request', 'provider-error', 'no-route', 'rate-limit'];
      const code: MapErrorCode = typeof json?.error === 'string' && knownCodes.includes(json.error)
        ? json.error : response.status === 429 ? 'rate-limit' : 'provider-error';
      throw new MapError(code);
    }
    return json as T;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
