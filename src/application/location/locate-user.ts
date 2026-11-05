import { isValidCoordinates, type LocationResult } from '../../domain/location/entities';
import type { LocationGateway } from './ports';

export function createLocateUser(gateway: LocationGateway) {
  return async (): Promise<LocationResult> => {
    try {
      const result = await gateway.locate();
      if (result.status === 'ready' && !isValidCoordinates(result.location.coords)) return { status: 'error' };
      return result;
    } catch { return { status: 'error' }; }
  };
}
