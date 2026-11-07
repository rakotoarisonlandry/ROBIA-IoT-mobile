import { createBookAppointment } from "../application/booking/book-appointment";
import { createExportTicket } from "../application/booking/export-ticket";
import { createLocateUser } from "../application/location/locate-user";
import { createSearchShops } from "../application/location/map-use-cases";
import { upcomingDays } from "../domain/booking/rules";
import { demoCatalog } from "../infrastructure/catalog/demo-catalog";
import { expoLocationGateway } from "../infrastructure/location/expo-location-gateway";
import { guidePreferences } from "../infrastructure/onboarding/async-storage-guide-preferences";
import { ticketExporter } from "../infrastructure/pdf/ticket-exporter";
import { demoReferences, systemClock } from "../infrastructure/system/runtime";
import { InMemoryTicketRepository } from "../infrastructure/tickets/in-memory-ticket-repository";

/** One container per mounted application, never shared between SSR requests. */
export function createAppServices() {
  const tickets = new InMemoryTicketRepository();
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
    },
    guidePreferences,
  };
}
export type AppServices = ReturnType<typeof createAppServices>;
