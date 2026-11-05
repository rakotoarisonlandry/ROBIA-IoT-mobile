import Constants from 'expo-constants';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapPlaceholder from './map-placeholder';
import type { NearbyMapProps } from './map.types';

export default function NearbyMap({ position, selected, onSelect }: NearbyMapProps) {
  const enabled = Platform.OS === 'android'
    ? Constants.expoConfig?.extra?.googleMaps?.androidEnabled
    : Constants.expoConfig?.extra?.googleMaps?.iosEnabled;
  // Never mount a Google Map in an APK without a configured native key.
  if (!enabled) return <MapPlaceholder />;
  return <View style={s.container}><MapView
    key={position ? `${position.latitude},${position.longitude}` : 'overview'}
    style={StyleSheet.absoluteFill}
    provider={PROVIDER_GOOGLE}
    initialRegion={{ ...(position ?? { latitude: -18.8792, longitude: 47.5079 }), latitudeDelta: position ? .04 : .3, longitudeDelta: position ? .04 : .3 }}
    showsUserLocation={!!position}
    showsMyLocationButton={!!position}
    showsCompass
    toolbarEnabled={false}
    onPoiClick={({ nativeEvent }) => {
      if (/\borange\b/i.test(nativeEvent.name)) onSelect({
        name: nativeEvent.name, placeId: nativeEvent.placeId,
        coordinates: nativeEvent.coordinate,
      });
    }}
  >{selected?.coordinates && <Marker coordinate={selected.coordinates} title={selected.name} pinColor="#ff6600" />}</MapView></View>;
}
const s = StyleSheet.create({ container: { height: 350, borderRadius: 15, overflow: 'hidden' } });
