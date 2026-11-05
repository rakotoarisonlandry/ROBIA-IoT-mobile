import type { MapGateway } from '../../application/location/ports';
import { MapError, type MapPlace, type MapRoute } from '../../domain/location/entities';
import { mapJson } from './map-http';

export function createHttpMapGateway(baseUrl: string | null, fetcher: typeof fetch = fetch): MapGateway {
  const request = async <T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> => {
    if (baseUrl === null) throw new MapError('configuration');
    return mapJson<T>(fetcher, `${baseUrl}/api/maps/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }, signal);
  };
  return {
    async search(input, signal) { return (await request<{ places: MapPlace[] }>('search', input, signal)).places; },
    async route(input, signal) { return (await request<{ route: MapRoute }>('route', input, signal)).route; },
  };
}
