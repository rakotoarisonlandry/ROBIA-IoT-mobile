const assert = require('node:assert/strict');
require('./test-support/register-typescript.cjs');
const { createSearchShops, distanceBetween } = require('../src/application/location/map-use-cases.ts');
const { demoCatalog } = require('../src/infrastructure/catalog/demo-catalog.ts');

(async () => {
  const position = { latitude: -18.8792, longitude: 47.5079 };
  const near = { id: 'near', name: 'Orange École', address: 'Analakely', isDemo: false, coordinates: position };
  const far = { id: 'far', name: 'Orange loin', address: 'Autre quartier', isDemo: false, coordinates: { latitude: -19, longitude: 48 } };
  const unknown = { id: 'unknown', name: 'Orange sans position', address: 'Quartier', isDemo: true };
  const invalid = { ...unknown, id: 'invalid', coordinates: { latitude: NaN, longitude: 0 } };
  const catalog = { getShops: () => [unknown, far, near, invalid] };
  const search = createSearchShops(catalog);
  const originalFetch = global.fetch;
  global.fetch = () => { throw Error('Minimal map must not make any HTTP request'); };
  try {
    const ordered = await search({ position, area: '' });
    assert.deepEqual(ordered.map(p => p.shopId), ['near', 'far', 'unknown', 'invalid']);
    assert.equal(ordered[0].straightLineMeters, 0);
    assert.equal(ordered[2].coordinates, undefined);
    assert.equal(ordered[2].straightLineMeters, undefined);
    assert.equal(ordered[3].coordinates, undefined);
    assert.equal((await search({ position: null, area: '' })).length, 4);
    assert.equal((await search({ position: null, area: ' ECOLE ' }))[0].shopId, 'near');
    assert.equal((await search({ position: null, area: 'analakely' }))[0].shopId, 'near');
    assert.equal((await search({ position, area: 'inconnu' })).length, 0);
    assert.equal(distanceBetween(position, position), 0);
    assert.throws(() => search({ position: { latitude: 100, longitude: 0 }, area: '' }), e => e.code === 'invalid-request');
    assert.throws(() => search({ position: null, area: 'x'.repeat(121) }), e => e.code === 'invalid-request');
    const results = await search({ position, area: '' });
    results[0].coordinates.latitude = 10;
    assert.equal(near.coordinates.latitude, position.latitude, 'Search results must not mutate the catalogue');
    const demos = await createSearchShops(demoCatalog)({ position, area: '' });
    assert.equal(demos.length, 3);
    assert.ok(demos.every(p => p.isDemo && !p.coordinates && p.straightLineMeters == null), 'No invented locations or distances for demo shops');
  } finally { global.fetch = originalFetch; }
  console.log('Minimal maps: local filtering, distances, missing coordinates, demo labels and zero HTTP requests — OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
