// Session storage avoids persisting a bearer credential unencrypted in the browser.
const KEY = 'robia.appointment-device.v1';
const PENDING = 'robia.appointment-pending.v1';
export const deviceToken = {
  async get(): Promise<string | null> { return sessionStorage.getItem(KEY); },
  async save(value: string): Promise<void> { sessionStorage.setItem(KEY, value); },
  async pending(): Promise<string | null> { return sessionStorage.getItem(PENDING); },
  async savePending(value: string): Promise<void> { sessionStorage.setItem(PENDING, value); },
  async clearPending(): Promise<void> { sessionStorage.removeItem(PENDING); },
};
