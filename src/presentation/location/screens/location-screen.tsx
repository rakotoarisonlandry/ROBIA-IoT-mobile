import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Brand, Elevation, Radius } from '../../shared/brand';
import { Text, TextInput } from '../../shared/components/text';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../booking/components/booking-icon';
import type { MapPlace } from '../../../domain/location/entities';
import { LocationIcon } from '../components/location-icon';
import NearbyMap from '../components/nearby-map';
import { useShopLocator } from '../hooks/use-shop-locator';

export default function LocationScreen() {
  const { shopId, itineraire } = useLocalSearchParams<{ shopId?: string; itineraire?: string }>();
  const insets = useSafeAreaInsets();
  const locator = useShopLocator();
  const { selected, select, clearSelection, places, allPlaces, position, locate, isLocating, message, status, canAskAgain, openSettings, area, setArea } = locator;
  const [mapHeight, setMapHeight] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [routeShopId, setRouteShopId] = useState<string | null>(() => itineraire === '1' ? shopId ?? null : null);
  const [routeRevision, setRouteRevision] = useState(0);
  const initializedShop = useRef<string | null>(null);

  useEffect(() => {
    if (shopId && initializedShop.current !== shopId) {
      const place = allPlaces.find(item => item.shopId === shopId);
      if (place) { initializedShop.current = shopId; select(place); }
    }
  }, [shopId, allPlaces, select]);

  const choose = (place: MapPlace) => {
    Keyboard.dismiss(); setSearchOpen(false); setArea(''); setRouteShopId(null); select(place);
  };
  const showRoute = !!selected && selected.shopId === routeShopId;

  return <View style={s.root} onLayout={event => setMapHeight(event.nativeEvent.layout.height)}>
    {mapHeight > 0 && <NearbyMap key={routeRevision} height={mapHeight} position={position} places={allPlaces} selected={selected} onSelect={choose} showRoute={showRoute} />}
    <SafeAreaView edges={['top', 'left', 'right']} pointerEvents="box-none" style={s.top}>
      <View style={s.searchBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.back}><View style={{ transform: [{ scaleX: -1 }] }}><Icon name="arrow" size={20} color={Brand.ink} /></View></Pressable>
        <Icon name="search" size={19} color={Brand.textTertiary} />
        <TextInput style={s.input} value={area} onFocus={() => setSearchOpen(true)} onChangeText={value => { setRouteShopId(null); setArea(value); setSearchOpen(true); }} placeholder="Rechercher une boutique" accessibilityLabel="Rechercher une boutique" returnKeyType="search" onSubmitEditing={() => { if (places.length === 1) choose(places[0]); else Keyboard.dismiss(); }} maxLength={120} />
        {(searchOpen || !!area) && <Pressable accessibilityRole="button" accessibilityLabel="Fermer la recherche" onPress={() => { Keyboard.dismiss(); setSearchOpen(false); if (area) setArea(''); }} style={s.close}><Icon name="close" size={18} color={Brand.textSecondary} /></Pressable>}
      </View>
      {searchOpen && <View style={s.results}><Text style={s.resultsTitle}>{area.trim() ? 'RÉSULTATS' : 'BOUTIQUES DU CATALOGUE'}</Text><ScrollView keyboardShouldPersistTaps="handled" style={s.resultsList}>
        {places.length ? places.map(place => <Pressable key={place.shopId} accessibilityRole="button" onPress={() => choose(place)} style={s.result}><View style={s.resultIcon}><Icon name="shop" color={Brand.orange} size={19} /></View><View style={s.resultCopy}><Text style={s.resultName}>{place.name}</Text><Text style={s.resultAddress} numberOfLines={2}>{place.address}</Text>{!place.coordinates && <Text style={s.resultNote}>Position non renseignée</Text>}</View></Pressable>) : <Text style={s.empty}>{locator.mapError || (area.trim() ? 'Aucune boutique trouvée. Essayez un autre nom.' : 'Aucune boutique disponible pour le moment.')}</Text>}
      </ScrollView></View>}
    </SafeAreaView>
    {!searchOpen && <View pointerEvents="box-none" style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={s.bottomInner}>
        {!!message && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{message}</Text>{status === 'denied' && !canAskAgain && (Platform.OS === 'web' ? <Text style={s.noticeText}>Autorisez la localisation dans le navigateur.</Text> : <Pressable onPress={openSettings}><Text style={s.link}>Ouvrir les paramètres</Text></Pressable>)}</View>}
        {selected ? <View style={s.sheet}><View style={s.sheetHead}><View style={s.sheetIcon}><Icon name="shop" size={20} color={Brand.white} /></View><View style={s.sheetCopy}><Text style={s.sheetLabel}>VOTRE DESTINATION</Text><Text style={s.sheetTitle} numberOfLines={1}>{selected.name}</Text><Text style={s.sheetAddress} numberOfLines={1}>{selected.address}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Fermer la destination" onPress={() => { setRouteShopId(null); clearSelection(); }} style={s.close}><Icon name="close" size={18} color={Brand.textSecondary} /></Pressable></View>
          {selected.isDemo && selected.coordinates && <Text style={s.helper}>Emplacement à confirmer avant votre visite.</Text>}
          {!selected.coordinates ? <Text style={s.helper}>Itinéraire indisponible : les coordonnées de cette boutique ne sont pas renseignées.</Text> : <Pressable accessibilityRole="button" disabled={isLocating} onPress={() => { if (!position) { setRouteShopId(selected.shopId); void locate(); } else { setRouteShopId(selected.shopId); setRouteRevision(value => value + 1); } }} style={s.primary}>{isLocating ? <ActivityIndicator size="small" color="white" /> : <Icon name="arrow" size={18} color="white" />}<Text style={s.primaryText}>{isLocating ? 'Recherche de votre position…' : position ? showRoute ? 'Recalculer le trajet' : 'Afficher l’itinéraire' : 'Me localiser et calculer le trajet'}</Text></Pressable>}
        </View> : <View style={s.emptySheet}><View style={s.sheetCopy}><Text style={s.sheetTitle}>Où souhaitez-vous aller ?</Text><Text style={s.sheetAddress}>Recherchez une boutique dans le catalogue.</Text></View><Pressable onPress={() => setSearchOpen(true)} accessibilityRole="button" style={s.choose}><Text style={s.chooseText}>Choisir</Text></Pressable></View>}
      </View>
    </View>}
    {!searchOpen && <Pressable accessibilityRole="button" accessibilityLabel="Actualiser ma position" disabled={isLocating} onPress={() => void locate()} style={[s.floatingLocate, { bottom: Math.max(insets.bottom, 12) + (selected ? 205 : 105) }]}>{isLocating ? <ActivityIndicator size="small" color={Brand.orange} /> : <LocationIcon size={21} />}</Pressable>}
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.canvas },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 14, zIndex: 5 },
  searchBar: { minHeight: 58, marginTop: 8, backgroundColor: Brand.surface, borderRadius: Radius.pill, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 6, ...Elevation.floating },
  back: { width: 46, height: 46, borderRadius: 23, backgroundColor: Brand.canvas, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minWidth: 0, height: 52, fontSize: 15, fontWeight: '500' },
  close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  results: { marginTop: 10, backgroundColor: Brand.surface, borderRadius: Radius.card, paddingTop: 16, overflow: 'hidden', ...Elevation.floating },
  resultsTitle: { color: Brand.textTertiary, fontSize: 11, fontWeight: '800', letterSpacing: 1.3, paddingHorizontal: 18, paddingBottom: 8 },
  resultsList: { maxHeight: 300 },
  result: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderColor: Brand.border },
  resultIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: Brand.orangeLight, alignItems: 'center', justifyContent: 'center' },
  resultCopy: { flex: 1, minWidth: 0, gap: 2 },
  resultName: { fontSize: 15, fontWeight: '700' },
  resultAddress: { fontSize: 13, lineHeight: 18, color: Brand.textSecondary },
  resultNote: { fontSize: 12, color: Brand.textTertiary },
  empty: { padding: 18, color: Brand.textSecondary, fontSize: 14 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14 },
  bottomInner: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 10 },
  notice: { backgroundColor: '#FFF2DF', padding: 14, borderRadius: Radius.control, gap: 6, ...Elevation.card },
  noticeText: { color: '#A96707', fontSize: 13, lineHeight: 19, fontWeight: '500' },
  link: { color: Brand.orangeDark, fontSize: 14, fontWeight: '700' },
  sheet: { backgroundColor: Brand.surface, padding: 16, borderRadius: Radius.lg, gap: 12, ...Elevation.floating },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: Brand.orange, alignItems: 'center', justifyContent: 'center', ...Elevation.glow },
  sheetCopy: { flex: 1, minWidth: 0, gap: 2 },
  sheetLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '800', color: Brand.orange },
  sheetTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4 },
  sheetAddress: { fontSize: 13, color: Brand.textSecondary },
  helper: { color: Brand.textSecondary, fontSize: 13, lineHeight: 19 },
  primary: { backgroundColor: Brand.orange, borderRadius: Radius.control + 2, minHeight: 56, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, ...Elevation.glow },
  primaryText: { color: Brand.white, fontWeight: '700', fontSize: 16 },
  emptySheet: { backgroundColor: Brand.surface, padding: 18, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', gap: 12, ...Elevation.floating },
  choose: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 20, borderRadius: Radius.pill, backgroundColor: Brand.orange },
  chooseText: { color: Brand.white, fontWeight: '700', fontSize: 15 },
  floatingLocate: { position: 'absolute', right: 16, width: 52, height: 52, borderRadius: 26, backgroundColor: Brand.surface, alignItems: 'center', justifyContent: 'center', ...Elevation.floating },
});
