import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppServices } from '../../../composition/app-services-provider';
import type { MapPlace } from '../../../domain/location/entities';
import { useCurrentLocation } from './use-current-location';

export function useShopLocator() {
  const app = useAppServices();
  const gps = useCurrentLocation();
  const [area, setAreaValue] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState('');
  const [, setCatalogRevision] = useState(0);
  const mounted = useRef(true);
  const position = gps.location?.coords ?? null;
  const result = (() => {
    try { return { places: app.maps.search({ position, area: query }), error: '' }; }
    catch { return { places: [], error: 'Impossible de filtrer les boutiques. Utilisez un nom ou un quartier de moins de 120 caractères.' }; }
  })();
  const allPlaces = (() => {
    try { return app.maps.search({ position, area: '' }); }
    catch { return []; }
  })();
  useFocusEffect(useCallback(() => {
    let active = true;
    if (app.appointmentsApi.configured) void app.refreshCatalog().then(catalog => { if (active) { setCatalogRevision(value => value + 1); setSettingsError(catalog.shops.length ? '' : 'Aucune boutique ouverte aux rendez-vous pour le moment.'); } }).catch(() => { if (active) setSettingsError('Impossible de charger les boutiques. Vérifiez votre connexion.'); });
    return () => { active = false; };
  }, [app]));
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const selected = result.places.find(place => place.shopId === selectedId) ?? null;
  const setArea = (value: string) => { setAreaValue(value); setQuery(value); setSelectedId(null); setSettingsError(''); };
  const select = (place: MapPlace) => setSelectedId(place.shopId);
  const search = () => { setQuery(area); setSelectedId(null); setSettingsError(''); };
  const openSettings = () => { void app.openLocationSettings().catch(() => { if (mounted.current) setSettingsError('Autorisez la localisation dans les paramètres de votre appareil.'); }); };
  return { ...gps, position, isLocating: gps.status === 'locating', area, setArea,
    selected, select, clearSelection: () => setSelectedId(null), places: result.places, allPlaces, mapError: result.error || settingsError,
    isSearching: false, search, openSettings };
}
