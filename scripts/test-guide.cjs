const assert = require('node:assert/strict');
require('./test-support/register-typescript.cjs');
const { GUIDE_STEPS, matchesGuideStep } = require('../src/presentation/onboarding/guide-plan.ts');
const { openStreetMapUrl } = require('../src/presentation/location/models/openstreetmap.ts');

assert.equal(new Set(GUIDE_STEPS.map(step => step.name)).size, GUIDE_STEPS.length);
assert.deepEqual([...new Set(GUIDE_STEPS.map(step => step.tab))], ['Accueil', 'Les boutiques', 'Mes rendez-vous', 'Mes tickets']);
assert.deepEqual(GUIDE_STEPS.filter(step => step.bookingStep != null).map(step => step.bookingStep), [0, 1, 2]);
assert.ok(GUIDE_STEPS.some(step => step.help));
for (const step of GUIDE_STEPS) {
  const screen = { tab: step.tab, modal: step.bookingStep != null, step: step.bookingStep ?? 0, help: !!step.help };
  assert.ok(matchesGuideStep(step, screen));
  assert.equal(matchesGuideStep(step, { ...screen, tab: 'Autre écran' }), false);
  assert.equal(matchesGuideStep(step, { ...screen, modal: !screen.modal }), false);
  assert.equal(matchesGuideStep(step, { ...screen, help: !screen.help }), false);
  if (step.bookingStep != null) assert.equal(matchesGuideStep(step, { ...screen, step: 3 }), false);
}
const origin = { latitude: -18.8792, longitude: 47.5079 };
const destination = { latitude: -18.9, longitude: 47.55 };
const url = new URL(openStreetMapUrl(origin));
assert.equal(url.origin, 'https://www.openstreetmap.org');
assert.equal(url.pathname, '/export/embed.html');
assert.equal(url.searchParams.get('marker'), '-18.8792,47.5079');
assert.equal(new URL(openStreetMapUrl(origin, destination)).searchParams.get('marker'), '-18.9,47.55');
assert.equal(new URL(openStreetMapUrl(null)).searchParams.has('marker'), false, 'No fabricated shop marker');
for (const point of [{ latitude: 90, longitude: 180 }, { latitude: -90, longitude: -180 }, origin]) {
  const box = new URL(openStreetMapUrl(point)).searchParams.get('bbox').split(',').map(Number);
  assert.ok(box.every(Number.isFinite));
  assert.ok(box[0] < box[2] && box[1] < box[3]);
}
console.log('Guide: all tabs, safe booking previews, screen readiness; OSM: GPS and validated markers, no API key — OK');
