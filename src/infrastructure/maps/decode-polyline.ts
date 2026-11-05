import { isValidCoordinates, MapError, type Coordinates } from '../../domain/location/entities';

export function decodePolyline(encoded: string): Coordinates[] {
  if (typeof encoded !== 'string' || encoded.length > 200000) throw new MapError('no-route');
  let index = 0, latitude = 0, longitude = 0;
  const read = () => {
    let result = 0, shift = 0, byte = 0;
    do {
      if (index >= encoded.length || shift > 30) throw new MapError('no-route');
      byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 63) throw new MapError('no-route');
      result |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    return result & 1 ? ~(result >>> 1) : result >>> 1;
  };
  const coordinates: Coordinates[] = [];
  while (index < encoded.length) {
    latitude += read(); longitude += read();
    const coordinate = { latitude: latitude / 1e5, longitude: longitude / 1e5 };
    if (!isValidCoordinates(coordinate)) throw new MapError('no-route');
    coordinates.push(coordinate);
  }
  return coordinates;
}
