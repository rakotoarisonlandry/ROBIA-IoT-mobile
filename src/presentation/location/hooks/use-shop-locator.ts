import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppServices } from '../../../composition/app-services-provider';
import { MapError, type Coordinates, type MapPlace, type MapRoute, type TravelMode } from '../../../domain/location/entities';
import { useCurrentLocation } from './use-current-location';

function mapMessage(error: unknown): string {
  if (error instanceof MapError) {
    if (error.code === 'configuration') return 'Le service de carte n’est pas encore activé. Réessayez après son activation.';
    if (error.code === 'no-route') return 'Aucun trajet disponible. Essayez un autre mode de déplacement.';
    if (error.code === 'rate-limit') return 'Trop de recherches rapprochées. Patientez une minute puis réessayez.';
    if (error.code === 'invalid-request') return 'Utilisez votre position ou indiquez une ville pour rechercher une boutique.';
  }
  return 'Impossible de charger ces informations. Vérifiez votre connexion puis réessayez.';
}

export function useShopLocator() {
  const app = useAppServices();
  const gps = useCurrentLocation();
  const [area, setArea] = useState('');
  const [searchArea, setSearchArea] = useState('');
  const [mode, setMode] = useState<TravelMode>('driving');
  const [selected, setSelected] = useState<MapPlace | null>(null);
  const [places, setPlaces] = useState<MapPlace[]>([]);
  const [route, setRoute] = useState<MapRoute | null>(null);
  const [mapError, setMapError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [routeRequested, setRouteRequested] = useState(false);
  const searchRequest = useRef<AbortController | null>(null);
  const position = gps.location?.coords ?? null;
  const search = useCallback(async (origin: Coordinates | null, query: string) => {
    searchRequest.current?.abort();
    const controller = new AbortController(); searchRequest.current = controller;
    setIsSearching(true); setMapError(''); setHasSearched(false);
    setPlaces([]); setSelected(null); setRoute(null); setRouteRequested(false); setIsRouting(false); setSearchArea(query);
    try {
      const results = await app.maps.search({ position: origin, area: query }, controller.signal);
      if (!controller.signal.aborted) { setPlaces(results); setHasSearched(true); }
    } catch (error) { if (!controller.signal.aborted) setMapError(mapMessage(error)); }
    finally { if (!controller.signal.aborted) setIsSearching(false); }
  }, [app]);
  useEffect(() => () => searchRequest.current?.abort(), []);
  useEffect(() => {
    if (!routeRequested || !selected || !position) return;
    const controller = new AbortController();
    void (async () => {
      setIsRouting(true); setRoute(null); setMapError('');
      try {
        const result = await app.maps.route({ origin: position, destination: selected, mode }, controller.signal);
        if (!controller.signal.aborted) setRoute(result);
      } catch (error) { if (!controller.signal.aborted) setMapError(mapMessage(error)); }
      finally { if (!controller.signal.aborted) setIsRouting(false); }
    })();
    return () => controller.abort();
  }, [app, mode, position, routeRequested, selected]);
  const locate = async () => {
    setArea(''); const location = await gps.locate();
    if (location) await search(location.coords, '');
  };
  const select = (place: MapPlace) => { setSelected(place); setRouteRequested(false); setRoute(null); setIsRouting(false); setMapError(''); };
  const directions = (place: MapPlace) => {
    setSelected(place); setRouteRequested(true);
    if (!position) void gps.locate();
  };
  const clearRoute = () => { setRouteRequested(false); setRoute(null); setIsRouting(false); };
  const openSettings = () => { void app.openLocationSettings().catch(() => setMapError('Autorisez la localisation dans les paramètres de votre appareil.')); };
  return { ...gps, locate, position, isLocating: gps.status === 'locating', area, setArea, searchArea, mode, setMode, selected, select, places, route, mapError, isSearching, isRouting, hasSearched, search: () => search(position, area), directions, clearRoute, openSettings };
}
