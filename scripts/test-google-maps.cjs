const assert = require('node:assert/strict');
require('./test-support/register-typescript.cjs');
const { nearbyShopsUrl, directionsUrl, placeUrl } = require('../src/infrastructure/maps/google-maps-urls.ts');
const { isValidCoordinates } = require('../src/domain/location/entities.ts');

const gps = { latitude: -18.8792, longitude: 47.5079 };
const shop = { name: 'Orange Analakely', address: 'Antananarivo, Madagascar', placeId: 'google-place-123' };

let url = new URL(nearbyShopsUrl(gps));
assert.equal(url.origin, 'https://www.google.com');
assert.equal(url.searchParams.get('api'), '1');
assert.ok(url.searchParams.get('query').includes('-18.8792,47.5079'));
assert.ok(url.searchParams.get('query').includes('Orange'));

// A manually chosen city must override an unrelated GPS position.
url = new URL(nearbyShopsUrl(gps, ' Antsirabe & centre '));
assert.equal(url.searchParams.get('query'), 'boutique Orange près de Antsirabe & centre');
assert.equal(url.searchParams.size, 2);
assert.ok(new URL(nearbyShopsUrl(null)).searchParams.get('query').endsWith('moi'));

url = new URL(directionsUrl(shop, 'walking', gps));
assert.equal(url.pathname, '/maps/dir/');
assert.equal(url.searchParams.get('origin'), '-18.8792,47.5079');
assert.equal(url.searchParams.get('destination_place_id'), shop.placeId);
assert.equal(url.searchParams.get('travelmode'), 'walking');

// No fabricated departure point when GPS is denied or unavailable.
url = new URL(directionsUrl(shop, 'driving', null));
assert.equal(url.searchParams.has('origin'), false);
assert.equal(url.searchParams.get('travelmode'), 'driving');
assert.ok(url.searchParams.get('destination').includes(shop.address));

url = new URL(directionsUrl({ ...shop, coordinates: gps }, 'driving', null));
assert.equal(url.searchParams.get('destination'), '-18.8792,47.5079');
assert.equal(new URL(placeUrl(shop)).searchParams.get('query_place_id'), shop.placeId);

assert.ok(isValidCoordinates({ latitude: 0, longitude: 0 }));
assert.ok(!isValidCoordinates({ latitude: NaN, longitude: 47 }));
assert.ok(!isValidCoordinates({ latitude: -91, longitude: 47 }));
assert.throws(() => nearbyShopsUrl({ latitude: 0, longitude: Infinity }));
console.log('Google Maps: GPS, search area, directions, place IDs, unavailable/invalid location — OK');
