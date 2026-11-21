import * as SecureStore from 'expo-secure-store';

const KEY = 'robia.appointment-device.v1';
export const deviceToken = {
  get: () => SecureStore.getItemAsync(KEY),
  save: (value: string) => SecureStore.setItemAsync(KEY, value),
};
