import Constants from 'expo-constants';

export function readMapConfiguration() {
  return {
    androidEnabled: Constants.expoConfig?.extra?.googleMaps?.androidEnabled === true,
    iosEnabled: Constants.expoConfig?.extra?.googleMaps?.iosEnabled === true,
  };
}
