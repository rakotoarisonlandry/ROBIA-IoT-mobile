import * as Linking from 'expo-linking';
import type { MapGateway } from '../../application/location/ports';
import { directionsUrl, nearbyShopsUrl, placeUrl } from './google-maps-urls';

export const googleMapsGateway: MapGateway = {
  async openNearby(position, area) { await Linking.openURL(nearbyShopsUrl(position, area)); },
  async openPlace(place) { await Linking.openURL(placeUrl(place)); },
  async openDirections(place, mode, origin) { await Linking.openURL(directionsUrl(place, mode, origin)); },
};
