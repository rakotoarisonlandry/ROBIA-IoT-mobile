import type { CatalogRepository } from '../booking/ports';
import { MapError, isValidCoordinates, type Coordinates, type MapPlace, type MapSearch } from '../../domain/location/entities';

export function distanceBetween(a: Coordinates, b: Coordinates): number {
  const rad = (value: number) => value * Math.PI / 180;
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr').trim();

/** Local catalogue only: no Places, geocoding or Routes requests. */
export function createSearchShops(catalog: Pick<CatalogRepository, 'getShops'>) {
  return (request: MapSearch): MapPlace[] => {
    if (!request || typeof request.area !== 'string' || request.area.length > 120
      || (request.position != null && !isValidCoordinates(request.position))) throw new MapError('invalid-request');
    const query = normalize(request.area);
    return catalog.getShops()
      .filter(shop => normalize(shop.name + ' ' + shop.address).includes(query))
      .map(shop => {
        const coordinates = isValidCoordinates(shop.coordinates) ? { ...shop.coordinates } : undefined;
        return {
          shopId: shop.id, name: shop.name, address: shop.address, isDemo: shop.isDemo,
          ...(coordinates ? { coordinates } : {}),
          ...(coordinates && request.position ? { straightLineMeters: distanceBetween(request.position, coordinates) } : {}),
        };
      })
      .sort((a, b) => {
        if (a.straightLineMeters == null) return b.straightLineMeters == null ? 0 : 1;
        return b.straightLineMeters == null ? -1 : a.straightLineMeters - b.straightLineMeters;
      });
  };
}
