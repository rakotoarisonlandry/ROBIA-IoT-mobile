const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'expo-secure-store') return { getItemAsync: async () => null, setItemAsync: async () => {} };
  return originalLoad.call(this, name, ...args);
};
require('./test-support/register-typescript.cjs');
const { createAppointmentsApi } = require('../src/infrastructure/appointments/appointments-api.ts');

(async () => {
  const token = 'A'.repeat(43);
  let saved = null;
  let registrations = 0;
  const requests = [];
  const store = { get: async () => saved, save: async value => { saved = value; } };
  const fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (url.endsWith('/devices')) { registrations++; return { ok: true, json: async () => ({ token }) }; }
    if (url.endsWith('/mine')) return { ok: true, json: async () => [] };
    if (url.includes('/slots')) return { ok: true, json: async () => [{ id: 'slot', startsAt: '2026-12-01T07:00:00Z', available: 1 }] };
    return { ok: false, status: 409 };
  };
  const api = createAppointmentsApi('https://api.example.test/', store, fetch);
  await Promise.all([api.list(), api.list()]);
  assert.equal(registrations, 1);
  assert.equal(saved, token);
  assert.equal(requests.filter(r => r.url.endsWith('/mine'))[0].options.headers.Authorization, `Bearer ${token}`);
  assert.equal((await api.slots('shop/1'))[0].available, 1);
  assert.ok(requests.some(r => r.url.endsWith('/shops/shop%2F1/slots')));
  await assert.rejects(api.book({ slotId: 'slot', idempotencyKey: '1234567890123456', customerName: 'Test', serviceIds: ['purchase'] }), error => error.status === 409);
  assert.equal(registrations, 1);
  await assert.rejects(createAppointmentsApi(undefined, store, fetch).shops(), error => error.status === 0);
  console.log('Appointments API: secure identity reuse, shop paths, conflicts and configuration — OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
