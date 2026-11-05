# Boutiques et itinéraires Google Maps

## Fonctionnement sans clé

L’onglet « Les boutiques » propose une localisation à la demande avec
`expo-location` et une recherche de boutiques Orange dans Google Maps, autour
de la position obtenue ou dans une ville saisie. La position reste en mémoire
pendant l’affichage de cet écran. Aucun suivi en arrière-plan n’est activé.

Google Maps s’ouvre via les URLs officielles, dans l’application Google Maps
si disponible, sinon dans le navigateur. Les résultats et horaires réels sont
affichés par Google. Les boutons « Itinéraire » utilisent le point GPS comme
départ, s’il est disponible, avec un trajet en voiture ou à pied.

La liste des trois boutiques de réservation de Robia reste une démonstration.
Elle ne constitue pas un annuaire réel des boutiques proches et n’affiche pas de
distances inventées. Les itinéraires de ces exemples sont résolus par nom et
adresse dans Google Maps : vérifier la destination avant le déplacement.

## Activer la carte intégrée Android

1. Créer un projet Google Maps Platform, configurer sa facturation et activer
   **Maps SDK for Android** selon les instructions Google.
2. Créer une clé limitée à cette API et à l’application Android
   `com.robia.mobile`, avec le certificat SHA-1 de la clé de signature EAS.
   Le SHA-1 est consultable dans le projet Expo, Configure → Credentials.
3. Renseigner `GOOGLE_MAPS_ANDROID_API_KEY` dans `.env.local` pour les essais
   locaux et dans l’environnement EAS `preview` pour la construction cloud.
   Les fichiers `.env*` sont exclus de l’archive EAS : utiliser les variables EAS.
4. Reconstruire l’APK :

   ```powershell
   npx.cmd eas-cli@latest build --platform android --profile preview
   ```

`app.config.ts` transmet la clé au plugin `react-native-maps` et ajoute un
indicateur d’activation dans `extra.googleMaps`. Une clé de SDK mobile est
embarquée dans l’application : ses restrictions d’API, de package et de
certificat sont nécessaires. Sans clé, le composant natif de
Google Maps n’est pas monté pour éviter une erreur dans l’APK.

Avec la carte activée, la position GPS est visible et la carte peut être
déplacée et zoomée. Toucher un point d’intérêt nommé Orange permet d’ouvrir sa
fiche Google Maps et de calculer son itinéraire par identifiant de lieu.
La recherche de proximité reste effectuée dans Google Maps ; aucune API Places
payante n’est appelée depuis le mobile. Les résultats de cette recherche ne sont
pas importés dans la liste Robia.

Pour iOS, activer **Maps SDK for iOS**, utiliser une clé limitée à
l’identifiant iOS de l’application et renseigner `GOOGLE_MAPS_IOS_API_KEY`.
La version web ouvre Google Maps dans un onglet du navigateur.

## Tests manuels sur appareil

- Autoriser la position : coordonnées et précision réelles, recherche proche.
- Refuser la position ou désactiver le GPS : message, nouvelle tentative et
  recherche par ville toujours accessibles.
- Vérifier l’ouverture d’un itinéraire en voiture puis à pied avec et sans GPS.
- Vérifier le repli navigateur sur un téléphone sans l’application Google Maps.
- Avec une clé valide : fond de carte Google, point GPS, sélection d’un POI Orange.
- L’ancien APK n’inclut pas les nouveaux modules : installer un nouvel APK.

Documentation : [Expo Maps SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/),
[Expo Location SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/location/),
[URLs Google Maps](https://developers.google.com/maps/documentation/urls/get-started).
