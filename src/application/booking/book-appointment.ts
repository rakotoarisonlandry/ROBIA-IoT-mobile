import { BookingError, type Customer, type ServiceId } from '../../domain/booking/entities';
import { appointmentDate, validateCustomer } from '../../domain/booking/rules';
import type { CatalogRepository, Clock, ReferenceGenerator, TicketRepository } from './ports';

export type BookAppointmentInput = {
  customer: Customer;
  shopId: string;
  serviceIds: ServiceId[];
  day: Date;
  time: string;
};
export type BookingDependencies = {
  catalog: CatalogRepository;
  tickets: TicketRepository;
  clock: Clock;
  references: ReferenceGenerator;
};

export function createBookAppointment(dependencies: BookingDependencies) {
  return async (input: BookAppointmentInput) => {
    validateCustomer(input.customer);
    const shop = dependencies.catalog.getShops().find(shop => shop.id === input.shopId);
    if (!shop) throw new BookingError('invalid-shop');
    const validServices = dependencies.catalog.getServices();
    if (!input.serviceIds.length || input.serviceIds.some(id => !validServices.some(service => service.id === id))) {
      throw new BookingError('invalid-services');
    }
    const appointment = appointmentDate(input.day, input.time, dependencies.clock.now());
    return dependencies.tickets.reserve({
      reference: dependencies.references.generate(),
      shopId: shop.id,
      serviceIds: [...new Set(input.serviceIds)],
      appointmentAt: appointment.toISOString(),
      customerName: input.customer.name.trim(),
    }, shop.queuePrefix);
  };
}
