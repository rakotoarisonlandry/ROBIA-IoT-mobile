import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppServices } from '../../../composition/app-services-provider';
import type { MapPlace } from '../../../domain/location/entities';
import { useCurrentLocation } from './use-current-location';

export function useShopLocator() {
  const app = useAppServices();
  const gps = useCurrentLocation();
  const [area, setArea] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState('');
  const mounted = useRef(true);
  const position = gps.location?.coords ?? null;
  const result = useMemo(() => {
    try { return { places: app.maps.search({ position, area: query }), error: '' }; }
    catch { return { places: [], error: 'Impossible de filtrer les boutiques. Utilisez un nom ou un quartier de moins de 120 caractères.' }; }
  }, [app, position, query]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const selected = result.places.find(place => place.shopId === selectedId) ?? null;
  const select = (place: MapPlace) => setSelectedId(place.shopId);
  const search = () => { setQuery(area); setSelectedId(null); setSettingsError(''); };
  const openSettings = () => { void app.openLocationSettings().catch(() => { if (mounted.current) setSettingsError('Autorisez la localisation dans les paramètres de votre appareil.'); }); };
  return { ...gps, position, isLocating: gps.status === 'locating', area, setArea,
    selected, select, places: result.places, mapError: result.error || settingsError,
    isSearching: false, search, openSettings };
}
