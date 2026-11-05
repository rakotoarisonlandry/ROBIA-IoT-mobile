import type { CatalogRepository } from '../../application/booking/ports';
import type { Service, Shop } from '../../domain/booking/entities';

const services: readonly Service[] = [
  { id: 'orange-money', name: 'Orange Money', description: 'Récupération de compte' },
  { id: 'orange-number', name: 'Numéro Orange', description: 'Récupération de numéro' },
  { id: 'subscription', name: 'Abonnements', description: 'Wi-Fi, internet & forfaits' },
  { id: 'purchase', name: 'Achats', description: 'Téléphones & accessoires' },
];
const shops: readonly Shop[] = [
  { id: 'analakely', name: 'Orange Analakely', address: 'Avenue de l’Indépendance, Analakely', agent: 'M. Rakoto', queuePrefix: 'A', isDemo: true },
  { id: 'ankorondrano', name: 'Orange Ankorondrano', address: 'Zone Zital, Ankorondrano', agent: 'Mme Ravo', queuePrefix: 'B', isDemo: true },
  { id: 'tanjombato', name: 'Orange Tanjombato', address: 'Centre commercial Smart, Tanjombato', agent: 'Mme Lala', queuePrefix: 'C', isDemo: true },
];
export const demoCatalog: CatalogRepository = {
  getServices: () => services.map(service => ({ ...service })),
  getShops: () => shops.map(shop => ({ ...shop })),
};
