const assert = require('node:assert/strict');
require('./test-support/register-typescript.cjs');
const { remoteShopToShop, remoteAppointmentToTicket, findRemoteSlot, groupSlotsByDay, nextOpenSlot } = require('../src/application/booking/remote-booking-mapping.ts');
const shop = remoteShopToShop({ id: 'server-1', name: 'Analakely', address: null, city: 'Tana', latitude: -18.9, longitude: 47.5 });
assert.equal(shop.id, 'server-1');
assert.deepEqual(shop.coordinates, { latitude: -18.9, longitude: 47.5 });
assert.equal(remoteShopToShop({ id: 'x', name: 'X', address: null, city: null, latitude: 900, longitude: 0 }).coordinates, undefined);
const slot = { id: 'slot-1', startsAt: '2026-12-01T06:00:00.000Z', available: 2 };
assert.equal(findRemoteSlot([slot], new Date(2026, 11, 1), '09:00'), slot);
assert.equal(findRemoteSlot([slot], new Date(2026, 11, 1), '06:00'), undefined);
const ticket = remoteAppointmentToTicket({ id: 'rdv-1', slotId: 'slot-1', customerName: 'A', serviceIds: ['purchase'], status: 'pending', slot: { startsAt: slot.startsAt, location: { id: 'server-1', name: 'Analakely', address: null } } });
assert.equal(ticket.shopId, 'server-1');
assert.equal(ticket.status, 'pending');
assert.equal(remoteAppointmentToTicket({ id: 'x', serviceIds: [], customerName: '', status: 'pending' }), null);
assert.equal(remoteShopToShop({ id: 'p', name: 'P', address: null, city: 'Tana', phone: ' 034 00 000 00 ', latitude: null, longitude: null }).phone, '034 00 000 00');

// Days and times offered come only from real slots, in Madagascar time.
const now = new Date('2026-12-01T05:30:00.000Z'); // 08:30 in Madagascar
const slots = [
  { id: 'past', startsAt: '2026-12-01T05:00:00.000Z', available: 3 }, // 08:00, already gone
  { id: 'b', startsAt: '2026-12-01T06:15:00.000Z', available: 0 }, // 09:15, full
  { id: 'a', startsAt: '2026-12-01T06:00:00.000Z', available: 1 }, // 09:00
  { id: 'c', startsAt: '2026-12-02T21:30:00.000Z', available: 2 }, // 3 Dec 00:30 local
];
const days = groupSlotsByDay(slots, now);
assert.deepEqual(days.map(day => day.key), ['2026-12-01', '2026-12-03']);
assert.deepEqual(days[0].slots.map(item => item.time), ['09:00', '09:15']);
assert.equal(findRemoteSlot(slots, days[0].date, '09:15').id, 'b');
assert.equal(nextOpenSlot(slots, now).id, 'a');
assert.equal(nextOpenSlot([slots[1]], now), null);
console.log('Remote bookings: authoritative shop IDs, valid coordinates, Madagascar time, status and real slot days — OK');
