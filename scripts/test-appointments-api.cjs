const assert = require('node:assert/strict');
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === 'expo-secure-store') return { getItemAsync: async () => null, setItemAsync: async () => {} };
  return originalLoad.call(this, name, ...args);
};
require('./test-support/register-typescript.cjs');
const { createAppointmentsApi, parseSseBlock } = require('../src/infrastructure/appointments/appointments-api.ts');

(async () => {
  const token = 'A'.repeat(43);
  let saved = null;
  let pending = null;
  let registrations = 0;
  const requests = [];
  const store = { get: async () => saved, save: async value => { saved = value; }, pending: async () => pending, savePending: async value => { pending = value; }, clearPending: async () => { pending = null; } };
  const fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (url.endsWith('/devices')) { registrations++; return { ok: true, json: async () => ({ token }) }; }
    if (url.endsWith('/mine')) return { ok: true, json: async () => [] };
    if (url.endsWith('/devices/push-token')) return { ok: true, json: async () => ({ registered: true }) };
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
  await api.registerPushToken('ExpoPushToken[test]');
  const push = requests.find(r => r.url.endsWith('/devices/push-token'));
  assert.equal(push.options.headers.Authorization, `Bearer ${token}`);
  assert.equal(JSON.parse(push.options.body).token, 'ExpoPushToken[test]');
  await api.removePushToken();
  assert.equal(requests[requests.length - 1].options.method, 'DELETE');
  await assert.rejects(api.book({ slotId: 'slot', idempotencyKey: '1234567890123456', customerName: 'Test', serviceIds: ['purchase'] }), error => error.status === 409);
  await assert.rejects(api.book({ slotId: 'slot', idempotencyKey: 'different-key-123', customerName: 'Test', serviceIds: ['purchase'] }), error => error.status === 409);
  assert.equal(JSON.parse(requests[requests.length - 1].options.body).idempotencyKey, '1234567890123456');
  assert.equal(registrations, 1);
  await assert.rejects(createAppointmentsApi(undefined, store, fetch).shops(), error => error.status === 0);
  assert.deepEqual(parseSseBlock('event: booking.updated\nid: 4\ndata: {"locationId":"shop-a","status":"confirmed"}'), { type: 'booking.updated', data: { locationId: 'shop-a', status: 'confirmed' } });
  assert.equal(parseSseBlock(': keep-alive'), null);
  assert.equal(parseSseBlock('event: broken\ndata: {oops'), null);
  console.log('Appointments API: secure identity reuse, shop paths, conflicts, configuration and live stream parsing — OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
