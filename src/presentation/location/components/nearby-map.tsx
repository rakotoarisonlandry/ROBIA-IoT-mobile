import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { openStreetMapUrl } from '../models/openstreetmap';
import type { NearbyMapProps } from './map.types';

export default function NearbyMap({ position, selected }: NearbyMapProps) {
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [away, setAway] = useState(false);
  const uri = useMemo(() => openStreetMapUrl(position, selected?.coordinates), [position, selected?.coordinates]);
  const source = useMemo(() => ({ uri }), [uri]);
  const reset = () => { setError(false); setAway(false); setRevision(value => value + 1); };
  return <View style={s.surface}>
    <View style={s.map}>
      <WebView key={uri + ':' + revision} source={source} style={s.webview}
        applicationNameForUserAgent="Robia/1.0 (com.robia.mobile)"
        originWhitelist={['https://www.openstreetmap.org', 'https://openstreetmap.org']}
        javaScriptEnabled domStorageEnabled cacheEnabled startInLoadingState
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={request => request.url === 'about:blank' || /^https:\/\/(www\.)?openstreetmap\.org\//.test(request.url)}
        onNavigationStateChange={state => setAway(!state.url.includes('/export/embed.html'))}
        onError={() => setError(true)}
        onHttpError={event => { if (event.nativeEvent.url === uri) setError(true); }}
        renderLoading={() => <View style={s.loading}><ActivityIndicator color="#ff6600" /><Text style={s.caption}>Chargement de la carte…</Text></View>}
      />
      {error && <View style={s.loading}><Text style={s.message}>La carte n’a pas pu être chargée. Vérifiez votre connexion internet.</Text><Pressable onPress={reset} style={s.retry}><Text style={s.action}>Réessayer</Text></Pressable></View>}
    </View>
    <View style={s.footer}>
      <Text style={s.caption}>© OpenStreetMap contributors · Carte en ligne</Text>
      {away && <Pressable onPress={reset} style={s.retry}><Text style={s.action}>Retour à la carte</Text></Pressable>}
    </View>
  </View>;
}
const s = StyleSheet.create({
  surface: { borderRadius: 15, overflow: 'hidden', backgroundColor: 'white', borderWidth: 1, borderColor: '#eee' },
  map: { height: 350 },
  webview: { flex: 1, backgroundColor: '#f5f5f5' },
  loading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#fff7f0', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  footer: { paddingHorizontal: 12, minHeight: 40, justifyContent: 'center' },
  caption: { color: '#777', fontSize: 10 },
  message: { color: '#555', textAlign: 'center', fontSize: 13, lineHeight: 21 },
  retry: { minHeight: 44, justifyContent: 'center' },
  action: { color: '#e65b00', fontSize: 12, fontWeight: '600' },
});
