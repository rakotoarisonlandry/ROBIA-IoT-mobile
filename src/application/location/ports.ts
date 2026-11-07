import type { LocationResult } from '../../domain/location/entities';
export interface LocationGateway {
  locate(): Promise<LocationResult>;
  openSettings(): Promise<void>;
}
