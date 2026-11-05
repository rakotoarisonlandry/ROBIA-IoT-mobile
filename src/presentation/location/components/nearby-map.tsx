import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAppServices } from '../../../composition/app-services-provider';
import MapPlaceholder from './map-placeholder';
import type { NearbyMapProps } from './map.types';

export default function NearbyMap({ position, selected, onSelect, places, route }: NearbyMapProps) {
  const { mapConfiguration } = useAppServices();
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const enabled = Platform.OS === 'android' ? mapConfiguration.androidEnabled : mapConfiguration.iosEnabled;
  useEffect(() => {
    if (!ready) return;
    const points = route?.coordinates ?? places.flatMap(place => place.coordinates ? [place.coordinates] : []);
    const coordinates = [...points, ...(position ? [position] : []), ...(selected?.coordinates ? [selected.coordinates] : [])];
    if (coordinates.length > 1) map.current?.fitToCoordinates(coordinates, { edgePadding: { top: 55, bottom: 65, left: 45, right: 45 }, animated: true });
    else if (coordinates.length === 1) map.current?.animateToRegion({ ...coordinates[0], latitudeDelta: .025, longitudeDelta: .025 }, 400);
  }, [places, position, ready, route, selected]);
  if (!enabled) return <MapPlaceholder />;
  const selectedInResults = selected && places.some(place => place.placeId === selected.placeId);
  return <View style={s.container}><MapView ref={map} style={StyleSheet.absoluteFill} provider={PROVIDER_GOOGLE}
    initialRegion={{ latitude: -18.8792, longitude: 47.5079, latitudeDelta: .15, longitudeDelta: .15 }}
    onMapReady={() => setReady(true)} showsUserLocation={!!position} showsMyLocationButton={!!position} showsCompass toolbarEnabled={false}
    onPoiClick={({ nativeEvent }) => { if (/\borange\b/i.test(nativeEvent.name)) onSelect({ name: nativeEvent.name, placeId: nativeEvent.placeId, coordinates: nativeEvent.coordinate }); }}>
    {places.map(place => place.coordinates && <Marker key={place.placeId ?? place.name} coordinate={place.coordinates} title={place.name} description={place.address} pinColor={selected?.placeId === place.placeId ? '#222222' : '#ff6600'} onPress={() => onSelect(place)} />)}
    {selected?.coordinates && !selectedInResults && <Marker coordinate={selected.coordinates} title={selected.name} pinColor="#222222" />}
    {route && <Polyline coordinates={route.coordinates} strokeWidth={5} strokeColor="#ff6600" />}
  </MapView></View>;
}
const s = StyleSheet.create({ container: { height: 350, borderRadius: 15, overflow: 'hidden' } });
