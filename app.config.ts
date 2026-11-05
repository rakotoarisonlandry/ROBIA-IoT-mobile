import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const androidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const iosKey = process.env.GOOGLE_MAPS_IOS_API_KEY?.trim();
  return {
    ...config,
    name: config.name ?? 'robia-IoT',
    slug: config.slug ?? 'robia-IoT',
    plugins: [
      ...(config.plugins ?? []),
      ['expo-location', {
        locationWhenInUsePermission: 'Robia utilise votre position pour trouver les boutiques Orange proches et préparer votre itinéraire.',
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      }],
      ...(androidKey || iosKey ? [['react-native-maps', {
        ...(androidKey ? { androidGoogleMapsApiKey: androidKey } : {}),
        ...(iosKey ? { iosGoogleMapsApiKey: iosKey } : {}),
      }] as [string, Record<string, string>]] : []),
    ],
    extra: {
      ...config.extra,
      googleMaps: { androidEnabled: !!androidKey, iosEnabled: !!iosKey },
    },
  };
};
