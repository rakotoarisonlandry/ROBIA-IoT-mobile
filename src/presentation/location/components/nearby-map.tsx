import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../shared/components/text';
import { WebView } from 'react-native-webview';
import { geoapifyMapHtml } from '../models/geoapify-map';
import type { NearbyMapProps } from './map.types';

export default function NearbyMap({ position, selected, places, onSelect, showRoute, height = 350 }: NearbyMapProps) {
  const key = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ?? '';
  const html = useMemo(() => geoapifyMapHtml(key, position, places, selected, showRoute), [key, position, places, selected, showRoute]);
  const source = useMemo(() => ({ html, baseUrl: 'https://localhost/' }), [html]);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  return <View style={s.surface}><View style={{ height }}>
    {key ? <WebView key={revision} source={source} style={s.webview} originWhitelist={['*']} javaScriptEnabled domStorageEnabled startInLoadingState
      onShouldStartLoadWithRequest={request => request.url === 'about:blank' || request.url === 'https://localhost/'}
      onMessage={event => { try { const data = JSON.parse(event.nativeEvent.data); const place = places.find(item => item.shopId === data.id); if (data.type === 'select' && place) onSelect(place); } catch { /* Ignore malformed messages. */ } }}
      onError={() => setError(true)} renderLoading={() => <View style={s.loading}><ActivityIndicator color="#ff6600" /><Text style={s.caption}>Chargement de la carte…</Text></View>} /> : <View style={s.loading}><Text style={s.message}>La clé Geoapify n’est pas configurée pour cette version.</Text></View>}
    {error && <View style={s.loading}><Text style={s.message}>La carte n’a pas pu être chargée.</Text><Pressable onPress={() => { setError(false); setRevision(n => n + 1); }}><Text style={s.action}>Réessayer</Text></Pressable></View>}
  </View></View>;
}
const s = StyleSheet.create({ surface: { overflow: 'hidden', backgroundColor: '#f5f5f5' }, webview: { flex: 1, backgroundColor: '#f5f5f5' }, loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#fff7f0', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }, caption: { color: '#777', fontSize: 12 }, message: { color: '#555', textAlign: 'center', fontSize: 13, lineHeight: 21 }, action: { color: '#e65b00', fontSize: 13, fontWeight: '600', padding: 12 } });
