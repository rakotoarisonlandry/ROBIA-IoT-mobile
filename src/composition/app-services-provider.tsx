import { createContext, useContext, useState, type ReactNode } from 'react';
import { createAppServices, type AppServices } from './create-app-services';

const ServicesContext = createContext<AppServices | null>(null);
export function AppServicesProvider({ children, services: providedServices }: { children: ReactNode; services?: AppServices }) {
  const [services] = useState(() => providedServices ?? createAppServices());
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}
export function useAppServices(): AppServices {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('AppServicesProvider is required');
  return services;
}
