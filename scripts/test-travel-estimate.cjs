const assert = require('node:assert/strict');
require('./test-support/register-typescript.cjs');
const { estimateDrivingTime } = require('../src/infrastructure/location/geoapify-travel.ts');

(async () => {
  const oldFetch = global.fetch;
  const oldKey = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
  process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY = 'test-key';
  try {
    global.fetch = async url => {
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get('waypoints'), '-21.45,47.09|-15.72,46.31');
      assert.equal(parsed.searchParams.get('mode'), 'drive');
      return { ok: true, json: async () => ({ features: [{ properties: { time: 40000, distance: 600000 } }] }) };
    };
    const origin = { latitude: -21.45, longitude: 47.09 };
    const destination = { latitude: -15.72, longitude: 46.31 };
    assert.deepEqual(await estimateDrivingTime(origin, destination), { seconds: 40000, meters: 600000 });
    global.fetch = async () => ({ ok: true, json: async () => ({ features: [] }) });
    await assert.rejects(estimateDrivingTime(origin, destination));
    global.fetch = async () => ({ ok: false });
    await assert.rejects(estimateDrivingTime(origin, destination));
    await assert.rejects(estimateDrivingTime({ latitude: 100, longitude: 0 }, destination));
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
    else process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY = oldKey;
  }
  console.log('Travel estimate: route units, invalid coordinates and unavailable responses — OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
