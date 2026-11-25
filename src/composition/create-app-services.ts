import { observeNotificationResponses, registerAppointmentPush, scheduleBookingReminder } from '../infrastructure/notifications/booking-notifications';
import { createBookAppointment } from "../application/booking/book-appointment";
import { createExportTicket } from "../application/booking/export-ticket";
import { createLocateUser } from "../application/location/locate-user";
import { createSearchShops } from "../application/location/map-use-cases";
import { upcomingDays } from "../domain/booking/rules";
import { demoCatalog } from "../infrastructure/catalog/demo-catalog";
import { expoLocationGateway } from "../infrastructure/location/expo-location-gateway";
import { estimateDrivingTime } from '../infrastructure/location/geoapify-travel';
import { guidePreferences } from "../infrastructure/onboarding/async-storage-guide-preferences";
import { ticketExporter } from "../infrastructure/pdf/ticket-exporter";
import { demoReferences, systemClock } from "../infrastructure/system/runtime";
import { AsyncStorageTicketRepository } from "../infrastructure/tickets/async-storage-ticket-repository";
import { profileStore } from '../infrastructure/profile/profile-store';
import { createAppointmentsApi } from '../infrastructure/appointments/appointments-api';
import { remoteAppointmentToTicket, remoteShopToShop } from '../application/booking/remote-booking-mapping';
import type { Shop } from '../domain/booking/entities';

/** One container per mounted application, never shared between SSR requests. */
export function createAppServices() {
  const tickets = new AsyncStorageTicketRepository();
  const clock = systemClock;
  const references = demoReferences;
  const appointmentsApi = createAppointmentsApi(process.env.EXPO_PUBLIC_ROBIA_API_URL);
  let remoteShops: Shop[] = [];
  // Shops only known through the customer's own bookings (e.g. suspended since).
  // They stay after the bookable ones so ticket screens can still name them,
  // and the bookable list keeps the same indexes.
  let ticketShops: Shop[] = [];
  const catalog = {
    getServices: () => demoCatalog.getServices(),
    getShops: () => appointmentsApi.configured
      ? [...remoteShops, ...ticketShops.filter(shop => !remoteShops.some(open => open.id === shop.id))]
      : demoCatalog.getShops(),
  };
  const localBook = createBookAppointment({ tickets, clock, references, catalog });
  const listTickets = async () => {
    if (!appointmentsApi.configured) return tickets.getAll();
    const bookings = await appointmentsApi.list();
    for (const booking of bookings) {
      const location = booking.slot?.location;
      if (location && !ticketShops.some(shop => shop.id === location.id)) ticketShops = [...ticketShops, { ...remoteShopToShop({ ...location, city: null, latitude: null, longitude: null }), bookable: false }];
    }
    return bookings.map(remoteAppointmentToTicket).filter((ticket): ticket is NonNullable<typeof ticket> => ticket !== null);
  };
  return {
    getCatalog: () => ({
      services: catalog.getServices(),
      shops: catalog.getShops(),
    }),
    refreshCatalog: async () => { if (appointmentsApi.configured) remoteShops = (await appointmentsApi.shops()).map(remoteShopToShop); return { services: catalog.getServices(), shops: catalog.getShops() }; },
    getUpcomingDays: () => upcomingDays(clock.now()),
    bookAppointment: localBook,
    listTickets,
    exportTicket: createExportTicket({
      tickets,
      catalog: demoCatalog,
      exporter: ticketExporter,
    }),
    exportBookingDocument: ticketExporter.export,
    locateUser: createLocateUser(expoLocationGateway),
    openLocationSettings: () => expoLocationGateway.openSettings(),
    maps: {
      search: createSearchShops(catalog),
      estimateDrivingTime,
    },
    guidePreferences,
    profileStore,
    appointmentsApi,
    registerAppointmentPush: (askPermission = false) => appointmentsApi.configured ? registerAppointmentPush(appointmentsApi.registerPushToken, askPermission) : Promise.resolve(false),
    scheduleBookingReminder,
    observeNotificationResponses,
  };
}
export type AppServices = ReturnType<typeof createAppServices>;
