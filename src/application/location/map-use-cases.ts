import { MapError, isValidCoordinates, type Coordinates, type MapSearch, type RouteRequest } from '../../domain/location/entities';
import type { MapGateway } from './ports';

export function distanceBetween(a: Coordinates, b: Coordinates): number {
  const rad = (value: number) => value * Math.PI / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function createSearchShops(gateway: MapGateway) {
  return async (request: MapSearch, signal?: AbortSignal) => {
    if (!request || typeof request.area !== 'string' || request.area.length > 120
      || (request.position != null && !isValidCoordinates(request.position))
      || (!request.position && !request.area.trim())) throw new MapError('invalid-request');
    const places = await gateway.search({ position: request.position ?? null, area: request.area.trim() }, signal);
    return places.filter(place => isValidCoordinates(place.coordinates)).map(place => ({
      ...place,
      ...(request.position ? { straightLineMeters: distanceBetween(request.position, place.coordinates!) } : {}),
    })).sort((a, b) => (a.straightLineMeters ?? 0) - (b.straightLineMeters ?? 0));
  };
}

export function createGetRoute(gateway: MapGateway) {
  return async (request: RouteRequest, signal?: AbortSignal) => {
    if (!request || !isValidCoordinates(request.origin) || !request.destination
      || typeof request.destination.name !== 'string'
      || (request.mode !== 'walking' && request.mode !== 'driving')) throw new MapError('invalid-request');
    const { placeId, coordinates } = request.destination;
    if (!(typeof placeId === 'string' && /^[\w-]{1,200}$/.test(placeId)) && !isValidCoordinates(coordinates)) throw new MapError('invalid-request');
    const route = await gateway.route(request, signal);
    if (route.coordinates.length < 2 || route.coordinates.some(point => !isValidCoordinates(point))
      || !Number.isFinite(route.distanceMeters) || route.distanceMeters < 0
      || !Number.isFinite(route.durationSeconds) || route.durationSeconds < 0) throw new MapError('no-route');
    return route;
  };
}
