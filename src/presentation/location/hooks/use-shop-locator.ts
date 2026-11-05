import { useState } from 'react';
import { useAppServices } from '../../../composition/app-services-provider';
import type { MapPlace, TravelMode } from '../../../domain/location/entities';
import { useCurrentLocation } from './use-current-location';

export function useShopLocator() {
  const app = useAppServices();
  const locationState = useCurrentLocation();
  const [area, setArea] = useState('');
  const [mode, setMode] = useState<TravelMode>('driving');
  const [selected, setSelected] = useState<MapPlace | null>(null);
  const [linkError, setLinkError] = useState('');
  const position = locationState.location?.coords ?? null;

  const open = (action: () => Promise<void>) => {
    setLinkError('');
    // Run in the original press handler so web retains user activation.
    void action().catch(() => setLinkError('Google Maps n’a pas pu s’ouvrir. Vérifiez votre connexion puis réessayez.'));
  };
  const openSettings = () => {
    void app.openLocationSettings().catch(() => setLinkError('Ouvrez les paramètres de votre appareil pour autoriser la localisation.'));
  };
  return {
    ...locationState, position,
    isLocating: locationState.status === 'locating',
    area, setArea, mode, setMode, selected, setSelected, linkError,
    openNearby: () => open(() => app.maps.openNearby(position, area)),
    openPlace: (place: MapPlace) => open(() => app.maps.openPlace(place)),
    directions: (place: MapPlace) => open(() => app.maps.openDirections(place, mode, position)),
    openSettings,
  };
}
