import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={s.back}><Text style={s.backText}>‹</Text></Pressable>
        <Icon name="search" size={19} color="#777" />
        <TextInput style={s.input} value={area} onFocus={() => setSearchOpen(true)} onChangeText={value => { setRouteShopId(null); setArea(value); setSearchOpen(true); }} placeholder="Rechercher une boutique" placeholderTextColor="#888" accessibilityLabel="Rechercher une boutique" returnKeyType="search" onSubmitEditing={() => { if (places.length === 1) choose(places[0]); else Keyboard.dismiss(); }} maxLength={120} />
        {(searchOpen || !!area) && <Pressable accessibilityRole="button" accessibilityLabel="Fermer la recherche" onPress={() => { Keyboard.dismiss(); setSearchOpen(false); if (area) setArea(''); }} style={s.close}><Text style={s.closeText}>×</Text></Pressable>}
      </View>
      {searchOpen && <View style={s.results}><Text style={s.resultsTitle}>{area.trim() ? 'RÉSULTATS' : 'BOUTIQUES DU CATALOGUE'}</Text><ScrollView keyboardShouldPersistTaps="handled" style={s.resultsList}>
        {places.length ? places.map(place => <Pressable key={place.shopId} accessibilityRole="button" onPress={() => choose(place)} style={s.result}><View style={s.resultIcon}><Icon name="shop" color="#e65b00" size={19} /></View><View style={s.resultCopy}><Text style={s.resultName}>{place.name}</Text><Text style={s.resultAddress} numberOfLines={2}>{place.address}</Text>{!place.coordinates && <Text style={s.resultNote}>Position non renseignée</Text>}</View></Pressable>) : <Text style={s.empty}>Aucune boutique trouvée. Essayez un autre nom.</Text>}
      </ScrollView></View>}
    </SafeAreaView>
    {!searchOpen && <View pointerEvents="box-none" style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={s.bottomInner}>
        {!!message && <View style={s.notice}><Text accessibilityRole="alert" style={s.noticeText}>{message}</Text>{status === 'denied' && !canAskAgain && (Platform.OS === 'web' ? <Text style={s.noticeText}>Autorisez la localisation dans le navigateur.</Text> : <Pressable onPress={openSettings}><Text style={s.link}>Ouvrir les paramètres</Text></Pressable>)}</View>}
        {selected ? <View style={s.sheet}><View style={s.sheetHead}><View style={s.sheetIcon}><Icon name="shop" size={20} color="#e65b00" /></View><View style={s.sheetCopy}><Text style={s.sheetLabel}>VOTRE DESTINATION</Text><Text style={s.sheetTitle} numberOfLines={1}>{selected.name}</Text><Text style={s.sheetAddress} numberOfLines={1}>{selected.address}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Fermer la destination" onPress={() => { setRouteShopId(null); clearSelection(); }} style={s.close}><Text style={s.closeText}>×</Text></Pressable></View>
          {selected.isDemo && selected.coordinates && <Text style={s.helper}>Emplacement à confirmer avant votre visite.</Text>}
          {!selected.coordinates ? <Text style={s.helper}>Itinéraire indisponible : les coordonnées de cette boutique ne sont pas renseignées.</Text> : <Pressable accessibilityRole="button" disabled={isLocating} onPress={() => { if (!position) { setRouteShopId(selected.shopId); void locate(); } else { setRouteShopId(selected.shopId); setRouteRevision(value => value + 1); } }} style={s.primary}>{isLocating ? <ActivityIndicator size="small" color="white" /> : <Icon name="arrow" size={18} color="white" />}<Text style={s.primaryText}>{isLocating ? 'Recherche de votre position…' : position ? showRoute ? 'Recalculer le trajet' : 'Afficher l’itinéraire' : 'Me localiser et calculer le trajet'}</Text></Pressable>}
        </View> : <View style={s.emptySheet}><View style={s.sheetCopy}><Text style={s.sheetTitle}>Où souhaitez-vous aller ?</Text><Text style={s.sheetAddress}>Recherchez une boutique dans le catalogue.</Text></View><Pressable onPress={() => setSearchOpen(true)} accessibilityRole="button" style={s.choose}><Text style={s.chooseText}>Choisir</Text></Pressable></View>}
      </View>
    </View>}
    {!searchOpen && <Pressable accessibilityRole="button" accessibilityLabel="Actualiser ma position" disabled={isLocating} onPress={() => void locate()} style={[s.floatingLocate, { bottom: Math.max(insets.bottom, 12) + (selected ? 205 : 105) }]}>{isLocating ? <ActivityIndicator size="small" color="#e65b00" /> : <LocationIcon size={21} />}</Pressable>}
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f3f3f3' }, top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 12, zIndex: 5 }, searchBar: { minHeight: 56, marginTop: 8, backgroundColor: 'white', borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 6, elevation: 4, shadowColor: '#000', shadowOpacity: .12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, back: { width: 46, height: 52, alignItems: 'center', justifyContent: 'center' }, backText: { color: '#252525', fontSize: 30, lineHeight: 34 }, input: { flex: 1, minWidth: 0, height: 52, color: '#222', fontSize: 14 }, close: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 24, color: '#777' }, results: { marginTop: 8, backgroundColor: 'white', borderRadius: 16, paddingTop: 14, elevation: 4, shadowColor: '#000', shadowOpacity: .12, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, resultsTitle: { color: '#999', fontSize: 10, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 16, paddingBottom: 8 }, resultsList: { maxHeight: 260 }, result: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderColor: '#f3f3f3' }, resultIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#fff0e5', alignItems: 'center', justifyContent: 'center' }, resultCopy: { flex: 1, minWidth: 0, gap: 2 }, resultName: { fontSize: 14, fontWeight: '700', color: '#222' }, resultAddress: { fontSize: 12, lineHeight: 17, color: '#777' }, resultNote: { fontSize: 11, color: '#9a8b80' }, empty: { padding: 16, color: '#777', fontSize: 13 }, bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 12 }, bottomInner: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 8 }, notice: { backgroundColor: '#fff3e8', padding: 12, borderRadius: 12, gap: 5 }, noticeText: { color: '#744c30', fontSize: 12, lineHeight: 18 }, link: { color: '#df5d00', fontSize: 12, fontWeight: '700' }, sheet: { backgroundColor: 'white', padding: 14, borderRadius: 18, gap: 10, elevation: 5, shadowColor: '#000', shadowOpacity: .14, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } }, sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10 }, sheetIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff0e5', alignItems: 'center', justifyContent: 'center' }, sheetCopy: { flex: 1, minWidth: 0, gap: 2 }, sheetLabel: { fontSize: 10, letterSpacing: .7, fontWeight: '800', color: '#d85b00' }, sheetTitle: { fontSize: 15, fontWeight: '800', color: '#222' }, sheetAddress: { fontSize: 12, color: '#777' }, helper: { color: '#777', fontSize: 12, lineHeight: 18 }, primary: { backgroundColor: '#ff6600', borderRadius: 12, minHeight: 46, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 }, primaryText: { color: 'white', fontWeight: '700', fontSize: 13 }, emptySheet: { backgroundColor: 'white', padding: 16, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 5, shadowColor: '#000', shadowOpacity: .14, shadowRadius: 12, shadowOffset: { width: 0, height: 3 } }, choose: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#fff0e5' }, chooseText: { color: '#df5d00', fontWeight: '700' }, floatingLocate: { position: 'absolute', right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: .14, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
});
