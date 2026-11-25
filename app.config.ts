import type { ConfigContext, ExpoConfig } from 'expo/config';
import { existsSync } from 'node:fs';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: config.name ?? 'robia-IoT',
    slug: config.slug ?? 'robia-IoT',
    android: {
      ...config.android,
      ...(existsSync('./google-services.json') ? { googleServicesFile: './google-services.json' } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      ['expo-location', {
        locationWhenInUsePermission: 'Robia utilise votre position pour trouver les boutiques Orange proches et préparer votre itinéraire.',
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      }],
    ],
  };
};
