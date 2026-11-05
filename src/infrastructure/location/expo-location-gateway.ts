import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';
import type { LocationGateway } from '../../application/location/ports';
import type { LocationResult } from '../../domain/location/entities';

export const expoLocationGateway: LocationGateway = {
  async locate(): Promise<LocationResult> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied', canAskAgain: permission.canAskAgain };
    if (!await Location.hasServicesEnabledAsync()) return { status: 'disabled' };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Location timeout')), 20_000); }),
      ]);
      return { status: 'ready', location: {
        coords: { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy },
        timestamp: location.timestamp,
      } };
    } finally { if (timeout) clearTimeout(timeout); }
  },
  async openSettings() {
    if (Platform.OS === 'web') throw new Error('Use browser permissions');
    await Linking.openSettings();
  },
};
