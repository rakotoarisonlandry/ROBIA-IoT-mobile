import type { Customer } from '../../domain/booking/entities';
import { validateCustomer } from '../../domain/booking/rules';

const KEY = 'robia.profile.v1';
export const profileStore = {
  async load(): Promise<Customer | null> {
    const value = localStorage.getItem(KEY);
    if (!value) return null;
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== 'object' || !('name' in data) || !('cin' in data) || !('phone' in data) || typeof data.name !== 'string' || typeof data.cin !== 'string' || typeof data.phone !== 'string') throw new Error('Invalid profile');
    const customer = { name: data.name, cin: data.cin, phone: data.phone };
    validateCustomer(customer);
    return customer;
  },
  async save(customer: Customer) { validateCustomer(customer); localStorage.setItem(KEY, JSON.stringify(customer)); },
};
