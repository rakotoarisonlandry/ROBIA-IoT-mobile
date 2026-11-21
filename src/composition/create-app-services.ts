import { observeNotificationResponses, scheduleBookingReminder } from '../infrastructure/notifications/booking-notifications';
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

/** One container per mounted application, never shared between SSR requests. */
export function createAppServices() {
  const tickets = new AsyncStorageTicketRepository();
  const clock = systemClock;
  const references = demoReferences;
  return {
    getCatalog: () => ({
      services: demoCatalog.getServices(),
      shops: demoCatalog.getShops(),
    }),
    getUpcomingDays: () => upcomingDays(clock.now()),
    bookAppointment: createBookAppointment({
      tickets,
      clock,
      references,
      catalog: demoCatalog,
    }),
    listTickets: () => tickets.getAll(),
    exportTicket: createExportTicket({
      tickets,
      catalog: demoCatalog,
      exporter: ticketExporter,
    }),
    locateUser: createLocateUser(expoLocationGateway),
    openLocationSettings: () => expoLocationGateway.openSettings(),
    maps: {
      search: createSearchShops(demoCatalog),
      estimateDrivingTime,
    },
    guidePreferences,
    profileStore,
    appointmentsApi: createAppointmentsApi(process.env.EXPO_PUBLIC_ROBIA_API_URL),
    scheduleBookingReminder,
    observeNotificationResponses,
  };
}
export type AppServices = ReturnType<typeof createAppServices>;
