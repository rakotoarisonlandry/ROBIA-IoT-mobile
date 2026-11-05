export type Coordinates = { latitude: number; longitude: number };
export type TravelMode = 'driving' | 'walking';
export type MapPlace = {
  name: string;
  address?: string;
  placeId?: string;
  coordinates?: Coordinates;
};

export function isValidCoordinates(value: Coordinates): boolean {
  return Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180;
}

function coordinatesText(value: Coordinates) {
  if (!isValidCoordinates(value)) throw new Error('Position invalide');
  return `${value.latitude},${value.longitude}`;
}

function mapsUrl(action: string, params: Record<string, string>) {
  return `https://www.google.com/maps/${action}/?${Object.entries({ api: '1', ...params })
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')}`;
}

/** Google performs the actual nearby-business search, without inventing a catalogue. */
export function nearbyShopsUrl(position: Coordinates | null, area = '') {
  const location = area.trim() || (position ? coordinatesText(position) : 'moi');
  return mapsUrl('search', { query: `boutique Orange près de ${location}` });
}

export function placeUrl(place: MapPlace) {
  return mapsUrl('search', {
    query: [place.name, place.address].filter(Boolean).join(', '),
    ...(place.placeId ? { query_place_id: place.placeId } : {}),
  });
}

export function directionsUrl(place: MapPlace, mode: TravelMode, origin: Coordinates | null) {
  return mapsUrl('dir', {
    destination: place.coordinates ? coordinatesText(place.coordinates)
      : [place.name, place.address].filter(Boolean).join(', '),
    ...(place.placeId ? { destination_place_id: place.placeId } : {}),
    // Omit origin if GPS is unavailable: Google Maps asks for the departure point.
    ...(origin ? { origin: coordinatesText(origin) } : {}),
    travelmode: mode,
  });
}
