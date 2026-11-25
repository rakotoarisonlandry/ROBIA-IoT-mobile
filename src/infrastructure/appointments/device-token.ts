import * as SecureStore from 'expo-secure-store';

const KEY = 'robia.appointment-device.v1';
const PENDING = 'robia.appointment-pending.v1';
export const deviceToken = {
  get: () => SecureStore.getItemAsync(KEY),
  save: (value: string) => SecureStore.setItemAsync(KEY, value),
  pending: () => SecureStore.getItemAsync(PENDING),
  savePending: (value: string) => SecureStore.setItemAsync(PENDING, value),
  clearPending: () => SecureStore.deleteItemAsync(PENDING),
};
