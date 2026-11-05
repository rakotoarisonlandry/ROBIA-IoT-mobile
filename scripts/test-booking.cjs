const assert = require('node:assert/strict');
require('./test-support/register-typescript.cjs');
const { createBookAppointment } = require('../src/application/booking/book-appointment.ts');
const { createExportTicket } = require('../src/application/booking/export-ticket.ts');
const { createLocateUser } = require('../src/application/location/locate-user.ts');
const { InMemoryTicketRepository } = require('../src/infrastructure/tickets/in-memory-ticket-repository.ts');
const { demoCatalog } = require('../src/infrastructure/catalog/demo-catalog.ts');
const { APPOINTMENT_TIMES } = require('../src/domain/booking/rules.ts');
const { createTicketPdf } = require('../src/infrastructure/pdf/ticket-pdf.ts');
const { PDFDocument } = require('pdf-lib');

(async () => {
  const tickets = new InMemoryTicketRepository();
  let sequence = 0;
  const book = createBookAppointment({
    tickets, catalog: demoCatalog,
    clock: { now: () => new Date(2026, 10, 5, 7) },
    references: { generate: () => `reference-${++sequence}` },
  });
  const input = {
    customer: { name: '  Andr\u00e9 Rakoto  ', cin: '123456789012', phone: '' },
    shopId: 'analakely', serviceIds: ['orange-money'],
    day: new Date(2026, 10, 6), time: '08:00',
  };
  const first = await book(input);
  assert.equal(first.id, 'A01');
  assert.equal(first.customerName, 'Andr\u00e9 Rakoto');
  assert.equal(new Date(first.appointmentAt).getHours(), 8);
  assert.ok(!('cin' in first) && !('phone' in first));

  const [second, third] = await Promise.all([book(input), book(input)]);
  assert.deepEqual([second.id, third.id], ['A02', 'A03']);
  assert.equal((await book({ ...input, shopId: 'ankorondrano' })).id, 'B01');
  const lastSlot = await book({ ...input, time: '16:00' });
  assert.equal(new Date(lastSlot.appointmentAt).getHours(), 16);
  assert.equal(new Date(lastSlot.appointmentAt).getMinutes(), 0);
  assert.equal(APPOINTMENT_TIMES.length, 17);
  assert.equal(APPOINTMENT_TIMES.at(-1), '16:00');

  for (const [change, code] of [
    [{ customer: { ...input.customer, cin: '123' } }, 'invalid-customer'],
    [{ customer: { ...input.customer, phone: 'abc' } }, 'invalid-phone'],
    [{ shopId: 'missing' }, 'invalid-shop'],
    [{ serviceIds: [] }, 'invalid-services'],
    [{ serviceIds: ['missing'] }, 'invalid-services'],
    [{ time: '07:30' }, 'invalid-time'],
    [{ time: '16:30' }, 'invalid-time'],
    [{ time: '10:15' }, 'invalid-time'],
    [{ day: new Date('invalid') }, 'invalid-date'],
    [{ day: new Date(2026, 10, 4) }, 'past-appointment'],
  ]) await assert.rejects(() => book({ ...input, ...change }), error => error.code === code);

  const clone = await tickets.getAll();
  clone[0].serviceIds.push('purchase');
  assert.equal((await tickets.getAll())[0].serviceIds.length, 1);
  assert.equal((await new InMemoryTicketRepository().getAll()).length, 0);

  let document;
  const exportTicket = createExportTicket({ tickets, catalog: demoCatalog,
    exporter: { async export(value) { document = value; } } });
  await exportTicket(first.reference);
  assert.equal(document.shopName, 'Orange Analakely');
  assert.deepEqual(document.services, ['Orange Money']);
  assert.equal(document.time, '08:00');
  await assert.rejects(() => exportTicket('missing'), error => error.code === 'ticket-not-found');
  const bytes = await createTicketPdf(document);
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), '%PDF-');
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);

  const locate = result => createLocateUser({ locate: async () => result, openSettings: async () => {} });
  assert.deepEqual(await locate({ status: 'denied', canAskAgain: false })(), { status: 'denied', canAskAgain: false });
  assert.deepEqual(await locate({ status: 'disabled' })(), { status: 'disabled' });
  assert.deepEqual(await locate({ status: 'ready', location: { coords: { latitude: NaN, longitude: 0 } } })(), { status: 'error' });
  assert.deepEqual(await createLocateUser({ locate: async () => { throw Error('GPS'); } })(), { status: 'error' });
  console.log('Booking, queue allocation, validation, repository isolation, PDF and GPS failures — OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
