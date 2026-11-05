export type Coordinates = { latitude: number; longitude: number };
export type TravelMode = 'driving' | 'walking';
export type MapPlace = { name: string; address?: string; placeId?: string; coordinates?: Coordinates; straightLineMeters?: number };
export type MapRoute = {
  coordinates: Coordinates[];
  distanceMeters: number;
  durationSeconds: number;
  steps: { instruction: string; distanceMeters: number }[];
  warnings: string[];
};
export type MapSearch = { position: Coordinates | null; area: string };
export type RouteRequest = { origin: Coordinates; destination: MapPlace; mode: TravelMode };
export type MapErrorCode = 'configuration' | 'invalid-request' | 'provider-error' | 'no-route' | 'rate-limit';
export class MapError extends Error {
  constructor(public readonly code: MapErrorCode) { super(code); this.name = 'MapError'; }
}
export type UserLocation = { coords: Coordinates & { accuracy: number | null }; timestamp: number };
export type LocationResult =
  | { status: 'ready'; location: UserLocation }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'disabled' | 'error' };

export function isValidCoordinates(value: unknown): value is Coordinates {
  if (!value || typeof value !== 'object' || !('latitude' in value) || !('longitude' in value)) return false;
  return typeof value.latitude === 'number' && typeof value.longitude === 'number'
    && Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}
