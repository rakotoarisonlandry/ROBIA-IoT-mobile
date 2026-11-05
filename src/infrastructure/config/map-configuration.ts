import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function readMapConfiguration() {
  return {
    androidEnabled: Constants.expoConfig?.extra?.googleMaps?.androidEnabled === true,
    iosEnabled: Constants.expoConfig?.extra?.googleMaps?.iosEnabled === true,
    webKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY?.trim() ?? '',
  };
}

export function readMapApiUrl(): string | null {
  if (Platform.OS === 'web') return '';
  const configured = process.env.EXPO_PUBLIC_MAPS_API_URL?.trim().replace(/\/$/, '');
  if (configured && /^https:\/\//.test(configured)) return configured;
  if (__DEV__) {
    if (configured && /^http:\/\//.test(configured)) return configured;
    const host = Constants.expoConfig?.hostUri;
    if (host) return `http://${host}`;
  }
  return null;
}
