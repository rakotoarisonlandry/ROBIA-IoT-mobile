import { isValidCoordinates, type Coordinates } from '../../../domain/location/entities';

/** Official OSM embedded map: no key, geocoding, routing or invented shop location. */
export function openStreetMapUrl(position: Coordinates | null, selected: Coordinates | undefined): string {
  const marker = isValidCoordinates(selected) ? selected : isValidCoordinates(position) ? position : null;
  const center = marker ?? { latitude: -18.8792, longitude: 47.5079 };
  const latitude = Math.max(-85, Math.min(85, center.latitude));
  const latitudeSpan = .015;
  const longitudeSpan = .015 / Math.max(.1, Math.cos(latitude * Math.PI / 180));
  const bbox = [
    Math.max(-180, center.longitude - longitudeSpan), Math.max(-85.05, latitude - latitudeSpan),
    Math.min(180, center.longitude + longitudeSpan), Math.min(85.05, latitude + latitudeSpan),
  ].join(',');
  const params = new URLSearchParams({ bbox, layer: 'mapnik' });
  if (marker && Math.abs(marker.latitude) <= 85.05) params.set('marker', `${marker.latitude},${marker.longitude}`);
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}
