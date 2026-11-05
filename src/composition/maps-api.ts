import { createGetRoute, createSearchShops } from '../application/location/map-use-cases';
import { MapError, type MapSearch, type RouteRequest } from '../domain/location/entities';
import { createGoogleMapData } from '../infrastructure/maps/google-map-data.server';

const requests = new Map<string, { count: number; expires: number }>();
const response = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function createMapApiHandlers(key: () => string | undefined = () => process.env.GOOGLE_MAPS_SERVER_API_KEY, fetcher: typeof fetch = fetch) {
  const handle = async (request: Request, operation: 'search' | 'route') => {
    try {
      if (!key()?.trim()) return response({ error: 'configuration' }, 503);
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
      const now = Date.now();
      const bucket = requests.get(ip);
      if (bucket && bucket.expires > now && bucket.count >= 30) return response({ error: 'rate-limit' }, 429);
      if (bucket && bucket.expires > now) bucket.count++;
      else {
        if (requests.size >= 1000) requests.clear();
        requests.set(ip, { count: 1, expires: now + 60000 });
      }
      const body = await request.text();
      if (body.length > 8000) return response({ error: 'invalid-request' }, 400);
      let input: unknown;
      try { input = JSON.parse(body); } catch { return response({ error: 'invalid-request' }, 400); }
      const gateway = createGoogleMapData(key(), fetcher);
      return operation === 'search'
        ? response({ places: await createSearchShops(gateway)(input as MapSearch, request.signal) })
        : response({ route: await createGetRoute(gateway)(input as RouteRequest, request.signal) });
    } catch (error) {
      const code = error instanceof MapError ? error.code : 'provider-error';
      return response({ error: code }, code === 'invalid-request' ? 400 : code === 'configuration' ? 503 : 502);
    }
  };
  return { search: (request: Request) => handle(request, 'search'), route: (request: Request) => handle(request, 'route') };
}
export const mapApi = createMapApiHandlers();
