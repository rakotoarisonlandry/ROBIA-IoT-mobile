const assert = require('node:assert/strict');
require('./test-support/register-typescript.cjs');
const { createSearchShops, createGetRoute } = require('../src/application/location/map-use-cases.ts');
const { createGoogleMapData } = require('../src/infrastructure/maps/google-map-data.server.ts');
const { createHttpMapGateway } = require('../src/infrastructure/maps/http-map-gateway.ts');
const { createMapApiHandlers } = require('../src/composition/maps-api.ts');
const { decodePolyline } = require('../src/infrastructure/maps/decode-polyline.ts');
const { isValidCoordinates } = require('../src/domain/location/entities.ts');

(async () => {
  const position = { latitude: -18.8792, longitude: 47.5079 };
  const near = { name: 'Orange proche', placeId: 'id-near', coordinates: { latitude: -18.88, longitude: 47.51 } };
  const far = { name: 'Orange loin', placeId: 'id-far', coordinates: { latitude: -19, longitude: 48 } };
  const ordered = await createSearchShops({ search: async () => [far, near, { name: 'Sans coordonnees' }] })({ position, area: '' });
  assert.equal(ordered.length, 2);
  assert.equal(ordered[0].placeId, near.placeId);
  assert.ok(ordered[0].straightLineMeters < ordered[1].straightLineMeters);
  await assert.rejects(() => createSearchShops({})({ position: null, area: '' }), error => error.code === 'invalid-request');
  await assert.rejects(() => createGetRoute({})({ origin: null, destination: near, mode: 'walking' }), error => error.code === 'invalid-request');
  assert.equal(isValidCoordinates(null), false);
  assert.equal(isValidCoordinates({ latitude: NaN, longitude: 0 }), false);

  const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
  const points = decodePolyline(encoded);
  assert.deepEqual(points[0], { latitude: 38.5, longitude: -120.2 });
  assert.deepEqual(points.at(-1), { latitude: 43.252, longitude: -126.453 });
  assert.throws(() => decodePolyline('_'), error => error.code === 'no-route');
  let calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if (url.includes('places.googleapis.com')) return Response.json({ places: [
      { id: 'id-near', displayName: { text: 'Orange Analakely' }, location: near.coordinates, formattedAddress: 'Analakely', businessStatus: 'OPERATIONAL' },
      { id: 'other', displayName: { text: 'Autre commerce' }, location: far.coordinates },
      { id: 'closed', displayName: { text: 'Orange ferme' }, location: far.coordinates, businessStatus: 'CLOSED_PERMANENTLY' },
    ] });
    return Response.json({ routes: [{ distanceMeters: 1200, duration: '360s', polyline: { encodedPolyline: encoded },
      legs: [{ steps: [{ navigationInstruction: { instructions: 'Tournez a droite' }, distanceMeters: 1200 }] }], warnings: [] }] });
  };
  const google = createGoogleMapData('server-key-not-public', fakeFetch);
  assert.equal((await google.search({ position, area: '' })).length, 1);
  assert.equal(calls[0].init.headers['X-Goog-Api-Key'], 'server-key-not-public');
  assert.equal(calls[0].body.locationBias.circle.center.latitude, position.latitude);
  await google.search({ position, area: 'Antsirabe' });
  assert.equal(calls[1].body.locationBias, undefined);
  assert.ok(calls[1].body.textQuery.includes('Antsirabe'));
  const route = await createGetRoute(google)({ origin: position, destination: near, mode: 'walking' });
  assert.equal(route.coordinates.length, 3);
  assert.equal(route.durationSeconds, 360);
  assert.equal(route.steps[0].instruction, 'Tournez a droite');
  assert.equal(calls.at(-1).body.travelMode, 'WALK');
  assert.equal(calls.at(-1).body.destination.placeId, 'id-near');
  const empty = createGoogleMapData('key', async () => Response.json({ routes: [] }));
  await assert.rejects(() => empty.route({ origin: position, destination: near, mode: 'driving' }), error => error.code === 'no-route');
  let unconfiguredCalls = 0;
  const missing = createGoogleMapData(undefined, async () => { unconfiguredCalls++; });
  await assert.rejects(() => missing.search({ position, area: '' }), error => error.code === 'configuration');
  assert.equal(unconfiguredCalls, 0);
  await assert.rejects(() => createHttpMapGateway(null).search({ position, area: '' }), error => error.code === 'configuration');

  const handlers = createMapApiHandlers(() => 'server-key-not-public', fakeFetch);
  const request = body => new Request('http://localhost/api/maps/search', { method: 'POST', body: JSON.stringify(body) });
  const response = await handlers.search(request({ position, area: '' }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const json = await response.json();
  assert.equal(json.places.length, 1);
  assert.ok(!JSON.stringify(json).includes('server-key-not-public'));
  assert.equal((await handlers.search(request({ position: null, area: '' }))).status, 400);
  const unavailable = await createMapApiHandlers(() => undefined).search(request({ position, area: '' }));
  assert.equal(unavailable.status, 503);
  const client = createHttpMapGateway('', async () => Response.json({ error: 'no-route' }, { status: 502 }));
  await assert.rejects(() => client.route({ origin: position, destination: near, mode: 'driving' }), error => error.code === 'no-route');
  console.log('Embedded maps: nearby sorting, polyline, Places/Routes requests, failures, API validation, key isolation — OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
