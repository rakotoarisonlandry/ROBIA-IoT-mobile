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
  // OpenStreetMap node 4322859589, près de l’hôtel Mini Croq. Position à confirmer sur place.
  { id: 'fianarantsoa-antarandolo', name: 'Orange Fianarantsoa', address: 'RN7, Antarandolo, près de l’hôtel Mini Croq, Fianarantsoa', agent: 'À confirmer', queuePrefix: 'F', isDemo: true, coordinates: { latitude: -21.4434845, longitude: 47.090666 } },
  // Points OpenStreetMap identifiés comme commerces de téléphonie Orange ; disponibilité à confirmer.
  { id: 'orange-tana-rabezavana', name: 'Orange Analakely – Rabezavana', address: 'Làlana Rabezavana, Analakely, Antananarivo', agent: 'À confirmer', queuePrefix: 'T1', isDemo: true, coordinates: { latitude: -18.9070823, longitude: 47.52681 } }, // OSM 620900961
  { id: 'orange-tana-ambohijatovo', name: 'Orange Ambohijatovo', address: 'Làlana Ramelina, Ambohijatovo, Antananarivo', agent: 'À confirmer', queuePrefix: 'T2', isDemo: true, coordinates: { latitude: -18.9115376, longitude: 47.5280082 } }, // OSM 622576209
  { id: 'orange-mahajanga-gallieni', name: 'Orange Mahajanga – Gallieni', address: 'Avenue Gallieni, Mahajanga', agent: 'À confirmer', queuePrefix: 'M1', isDemo: true, coordinates: { latitude: -15.7216951, longitude: 46.3137378 } }, // OSM 2510494045
  { id: 'orange-mahajanga-mahabibo', name: 'Orange Mahajanga – Mahabibo', address: 'Avenue de l’Église, Mahabibo, Mahajanga', agent: 'À confirmer', queuePrefix: 'M2', isDemo: true, coordinates: { latitude: -15.7172181, longitude: 46.3195523 } }, // OSM 2510176874
  { id: 'orange-mahajanga-liberation', name: 'Orange Mahajanga – Libération', address: 'Avenue de la Libération, Mangarivotra, Mahajanga', agent: 'À confirmer', queuePrefix: 'M3', isDemo: true, coordinates: { latitude: -15.7185077, longitude: 46.3139061 } }, // OSM 5740853017
  { id: 'orange-mahajanga-octobre', name: 'Orange Mahajanga – 14 Octobre', address: 'Avenue du 14 Octobre 1960, Mahajanga', agent: 'À confirmer', queuePrefix: 'M4', isDemo: true, coordinates: { latitude: -15.719969, longitude: 46.3177827 } }, // OSM 1807657454
  { id: 'orange-mahajanga-amborovy', name: 'Orange Mahajanga – Amborovy', address: 'Avenue d’Amborovy, Antanambao Ambalavato, Mahajanga', agent: 'À confirmer', queuePrefix: 'M5', isDemo: true, coordinates: { latitude: -15.7078957, longitude: 46.3209295 } }, // OSM 4485714458
  { id: 'orange-toliara-marche', name: 'Orange Toliara – Marché', address: 'Rue du Marché, Toliara', agent: 'À confirmer', queuePrefix: 'U1', isDemo: true, coordinates: { latitude: -23.3550292, longitude: 43.6687926 } }, // OSM 9519434439
];
export const demoCatalog: CatalogRepository = {
  getServices: () => services.map(service => ({ ...service })),
  getShops: () => shops.map(shop => ({ ...shop })),
};
