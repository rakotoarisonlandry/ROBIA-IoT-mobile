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
      const code: MapErrorCode = response.status === 503 ? 'configuration' : response.status === 429 ? 'rate-limit' : 'provider-error';
      throw new MapError(code);
    }
    return json as T;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
