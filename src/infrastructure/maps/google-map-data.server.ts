import type { MapGateway } from '../../application/location/ports';
import { isValidCoordinates, MapError } from '../../domain/location/entities';
import { decodePolyline } from './decode-polyline';
import { mapJson } from './map-http';

type GooglePlace = { id?: string; displayName?: { text?: string }; formattedAddress?: string; location?: { latitude: number; longitude: number }; businessStatus?: string };
type GoogleRoute = {
  distanceMeters?: number; duration?: string; polyline?: { encodedPolyline?: string }; warnings?: string[];
  legs?: { steps?: { navigationInstruction?: { instructions?: string }; distanceMeters?: number }[] }[];
};

/** Server-only credentials. This module is imported only by API route composition. */
export function createGoogleMapData(apiKey: string | undefined, fetcher: typeof fetch = fetch): MapGateway {
  const headers = (fields: string) => {
    if (!apiKey?.trim()) throw new MapError('configuration');
    return { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': fields };
  };
  return {
    async search(input, signal) {
      const data = await mapJson<{ places?: GooglePlace[] }>(fetcher, 'https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: headers('places.id,places.displayName,places.formattedAddress,places.location,places.businessStatus'),
        body: JSON.stringify({
          textQuery: `boutique Orange ${input.area}`.trim(), languageCode: 'fr', pageSize: 15,
          ...(input.position && !input.area ? { locationBias: { circle: { center: input.position, radius: 15000 } }, rankPreference: 'DISTANCE' } : {}),
        }),
      }, signal);
      return (data.places ?? []).filter(place => place.id && place.displayName?.text
        && /\borange\b/i.test(place.displayName.text) && isValidCoordinates(place.location)
        && (!place.businessStatus || place.businessStatus === 'OPERATIONAL')).map(place => ({
          name: place.displayName!.text!, address: place.formattedAddress ?? '',
          placeId: place.id!, coordinates: place.location!,
        }));
    },
    async route(input, signal) {
      const data = await mapJson<{ routes?: GoogleRoute[] }>(fetcher, 'https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: headers('routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction.instructions,routes.legs.steps.distanceMeters,routes.warnings'),
        body: JSON.stringify({
          origin: { location: { latLng: input.origin } },
          destination: input.destination.placeId ? { placeId: input.destination.placeId } : { location: { latLng: input.destination.coordinates } },
          travelMode: input.mode === 'walking' ? 'WALK' : 'DRIVE',
          languageCode: 'fr-FR', units: 'METRIC', computeAlternativeRoutes: false, polylineQuality: 'OVERVIEW',
        }),
      }, signal);
      const route = data.routes?.[0];
      if (!route?.polyline?.encodedPolyline || !/^\d+(\.\d+)?s$/.test(route.duration ?? '')) throw new MapError('no-route');
      return {
        coordinates: decodePolyline(route.polyline.encodedPolyline),
        distanceMeters: route.distanceMeters ?? NaN,
        durationSeconds: Number(route.duration!.slice(0, -1)),
        steps: (route.legs ?? []).flatMap(leg => (leg.steps ?? []).map(step => ({
          instruction: step.navigationInstruction?.instructions ?? '', distanceMeters: step.distanceMeters ?? 0,
        })).filter(step => step.instruction)),
        warnings: route.warnings ?? [],
      };
    },
  };
}
