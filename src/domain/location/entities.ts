export type Coordinates = { latitude: number; longitude: number };
export type MapPlace = {
  shopId: string;
  name: string;
  address: string;
  isDemo: boolean;
  coordinates?: Coordinates;
  straightLineMeters?: number;
};
export type MapSearch = { position: Coordinates | null; area: string };
export class MapError extends Error {
  constructor(public readonly code: 'invalid-request') { super(code); this.name = 'MapError'; }
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
