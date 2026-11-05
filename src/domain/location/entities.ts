export type Coordinates = { latitude: number; longitude: number };
export type TravelMode = 'driving' | 'walking';
export type MapPlace = { name: string; address?: string; placeId?: string; coordinates?: Coordinates };
export type UserLocation = { coords: Coordinates & { accuracy: number | null }; timestamp: number };
export type LocationResult =
  | { status: 'ready'; location: UserLocation }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'disabled' | 'error' };

export function isValidCoordinates(value: Coordinates): boolean {
  return Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}
