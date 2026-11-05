import { createElement } from 'react';
import { View } from 'react-native';
import { useAppServices } from '../../../composition/app-services-provider';
import MapPlaceholder from './map-placeholder';
import type { NearbyMapProps } from './map.types';

export default function NearbyMap({ position, selected, route, mode, searchArea }: NearbyMapProps) {
  const { mapConfiguration } = useAppServices();
  if (!mapConfiguration.webKey) return <MapPlaceholder />;
  const params: Record<string, string> = { key: mapConfiguration.webKey, language: 'fr' };
  let mapMode = 'search';
  if (route && position && selected) {
    mapMode = 'directions'; params.origin = `${position.latitude},${position.longitude}`;
    params.destination = selected.placeId ? `place_id:${selected.placeId}` : selected.name; params.mode = mode;
  } else if (selected) {
    mapMode = 'place'; params.q = selected.placeId ? `place_id:${selected.placeId}` : selected.name;
  } else {
    params.q = `boutique Orange ${searchArea || (position ? `${position.latitude},${position.longitude}` : 'Antananarivo')}`;
    if (position && !searchArea) params.center = `${position.latitude},${position.longitude}`;
    params.zoom = '13';
  }
  const query = Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
  return <View style={{ height: 350, borderRadius: 15, overflow: 'hidden' }}>{createElement('iframe', {
    title: 'Carte des boutiques Orange et itinéraire', src: `https://www.google.com/maps/embed/v1/${mapMode}?${query}`,
    style: { width: '100%', height: '100%', border: 0 }, referrerPolicy: 'strict-origin-when-cross-origin',
    sandbox: 'allow-scripts allow-same-origin allow-forms', allowFullScreen: true,
  })}</View>;
}
