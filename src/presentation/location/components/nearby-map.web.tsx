import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { Text } from '../../shared/components/text';
import { geoapifyMapHtml } from '../models/geoapify-map';
import type { NearbyMapProps } from './map.types';

export default function NearbyMap({ position, selected, places, onSelect, showRoute, height = 350 }: NearbyMapProps) {
  const key = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ?? '';
  const iframe = useRef<HTMLIFrameElement>(null);
  const html = useMemo(() => geoapifyMapHtml(key, position, places, selected, showRoute), [key, position, places, selected, showRoute]);
  useEffect(() => { const handler = (event: MessageEvent) => { if (event.source !== iframe.current?.contentWindow || typeof event.data !== 'string') return; try { const data = JSON.parse(event.data); const place = places.find(item => item.shopId === data.id); if (data.type === 'select' && place) onSelect(place); } catch { /* Ignore malformed messages. */ } }; window.addEventListener('message', handler); return () => window.removeEventListener('message', handler); }, [places, onSelect]);
  return <View style={{ overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
    {key ? <iframe ref={iframe} title="Carte Geoapify" srcDoc={html} sandbox="allow-scripts" style={{ width: '100%', height, border: 0 }} /> : <Text style={{ height, padding: 24 }}>La clé Geoapify n’est pas configurée pour cette version.</Text>}
  </View>;
}
