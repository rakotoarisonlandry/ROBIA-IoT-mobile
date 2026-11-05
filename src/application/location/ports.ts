import type { LocationResult, MapPlace, MapRoute, MapSearch, RouteRequest } from '../../domain/location/entities';
export interface LocationGateway {
  locate(): Promise<LocationResult>;
  openSettings(): Promise<void>;
}
export interface MapGateway {
  search(request: MapSearch, signal?: AbortSignal): Promise<MapPlace[]>;
  route(request: RouteRequest, signal?: AbortSignal): Promise<MapRoute>;
}
