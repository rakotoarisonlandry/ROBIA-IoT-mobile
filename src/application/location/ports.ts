import type { Coordinates, LocationResult, MapPlace, TravelMode } from '../../domain/location/entities';
export interface LocationGateway {
  locate(): Promise<LocationResult>;
  openSettings(): Promise<void>;
}
export interface MapGateway {
  openNearby(position: Coordinates | null, area: string): Promise<void>;
  openPlace(place: MapPlace): Promise<void>;
  openDirections(place: MapPlace, mode: TravelMode, origin: Coordinates | null): Promise<void>;
}
