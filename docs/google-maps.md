# Carte Geoapify dans Robia

La carte interactive utilise les tuiles Geoapify, les données OpenStreetMap et Leaflet dans une WebView native ou une iframe sur le web. La recherche des boutiques reste locale et la réservation utilise le catalogue Robia existant. Les boutiques sans coordonnées ne reçoivent pas de repère inventé. Le catalogue actuel est une démonstration.

La boutique « Orange Fianarantsoa » utilise le point OpenStreetMap [4322859589](https://www.openstreetmap.org/node/4322859589), identifié par Geoapify sur la RN7 à Antarandolo, près de l’hôtel Mini Croq. Cette position est un repère cartographique à confirmer sur place ; les rendez-vous restent fictifs et ne sont pas transmis à Orange.

Des commerces de téléphonie Orange issus d’OpenStreetMap ont également été ajoutés pour Antananarivo, Mahajanga et Toliara. Leurs identifiants OSM figurent dans le catalogue. Ils n’ont pas été confirmés par Orange, leur activité et leur adresse peuvent changer, et la liste ne couvre pas toutes les boutiques de Madagascar. Ne pas considérer ces points comme des disponibilités de rendez-vous réelles.

## Configuration

Créer `.env.local` à la racine avec `EXPO_PUBLIC_GEOAPIFY_API_KEY=...`. Ne pas commiter la clé. Expo incorpore les variables `EXPO_PUBLIC_` dans l’application : elles sont visibles dans l’APK et ne constituent pas des secrets. Utiliser une clé dédiée, des restrictions compatibles avec le contexte WebView et surveiller les quotas. Pour protéger les appels sensibles, prévoir un serveur intermédiaire.

Pour les builds EAS, configurer aussi `EXPO_PUBLIC_GEOAPIFY_API_KEY` dans l’environnement EAS du profil concerné : `.env.local` est ignoré par Git et ne doit pas être supposé disponible sur le serveur. Reconstruire l’APK après modification de la variable.

## Fonctionnement et limites

- La localisation est demandée à l’utilisateur ; une position ou une boutique est affichée uniquement si ses coordonnées sont valides.
- Le bouton d’itinéraire apparaît lorsqu’une position GPS et une boutique géolocalisée sont disponibles. Le trajet automobile et son estimation viennent de Geoapify et requièrent internet.
- Le ticket permet de rouvrir la carte pour sa boutique. Une fois la localisation autorisée, le trajet est recalculé et ses étapes s’affichent si Geoapify les fournit ; aucune position de boutique manquante n’est inventée.
- La carte télécharge Leaflet depuis unpkg et les tuiles depuis Geoapify. Une erreur de réseau ou de clé s’affiche dans la carte. L’attribution Geoapify et OpenStreetMap doit rester visible.
- L’offre et les quotas Geoapify sont à vérifier avant diffusion. Le navigateur, la WebView et les restrictions de clé peuvent se comporter différemment : tester sur Android, iOS et web.
