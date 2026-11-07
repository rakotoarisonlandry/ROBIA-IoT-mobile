# Carte OpenStreetMap minimale dans Robia

La carte est affichée dans Robia via la page d’intégration officielle OpenStreetMap :
`https://www.openstreetmap.org/export/embed.html`.
Sur Android et iOS, cette page est intégrée dans `react-native-webview`.
Le web utilise une iframe. Aucun compte Google, clé API, carte bancaire, serveur
Places/Routes ou compte de facturation n’est nécessaire.

## Fonctionnalités

- Position GPS fournie par Expo Location, uniquement sur demande de l’utilisateur.
- Carte centrée sur cette position ou sur la boutique sélectionnée.
- Un repère pour le point sélectionné ; sélectionner une autre boutique dans la liste
  recentre la carte sur ses coordonnées. Sans coordonnées validées, aucun repère
  de boutique n’est inventé.
- Déplacement et zoom dans la carte, attribution OpenStreetMap visible.
- Catalogue local, filtre par nom/adresse et réservation.
- Distances à vol d’oiseau calculées localement lorsque les coordonnées sont connues.

Il n’y a ni recherche mondiale de boutiques, ni calcul d’itinéraire, ni navigation,
ni téléchargement hors ligne des cartes. Le fond de carte nécessite internet.
Sans GPS ou sans réseau, le catalogue et les réservations de démonstration restent
disponibles. Le composant natif affiche une erreur et permet de réessayer si la page
de carte échoue à charger.

## Données du catalogue

Les trois boutiques de `src/infrastructure/catalog/demo-catalog.ts` sont des données
de démonstration, sans coordonnées validées. Elles sont identifiées comme telles
dans la liste. Pour une vraie boutique, renseigner son champ
`coordinates: { latitude, longitude }` après vérification et conserver son identifiant
de réservation. Aucune distance fictive n’est affichée.

## Configuration et build

Les variables Google Maps, clés SDK et adresses de serveur de cartes ne sont plus
utilisées. Le module `react-native-maps` a été retiré. Le nouveau module WebView
nécessite de reconstruire l’APK ; l’ancien APK ne reçoit pas cette modification.

L’application utilise la page OSM officielle plutôt qu’un téléchargement direct ou
massif de tuiles. La WebView utilise le cache HTTP normal et ajoute l’identification
Robia à son User-Agent. L’iframe conserve un Referer normal. L’attribution reste
visible et les pages OSM consultées depuis la carte restent dans la WebView native
avec un bouton pour revenir à la carte.

Les serveurs publics OpenStreetMap sont un service à disponibilité non garantie,
adapté à des essais légers respectant leurs règles. Avant diffusion à grande
échelle, choisir un hébergement cartographique adapté à la charge ; la gratuité
des données OSM n’est pas une promesse d’hébergement illimité.

## Tests

`npm test` couvre le catalogue local, le tri par distance, les coordonnées invalides,
l’absence d’appels Google et la génération des vues OSM (GPS, sélection, absence de
repère fictif et limites de coordonnées).
La carte native doit être vérifiée dans le nouvel APK, avec GPS autorisé/refusé et
réseau disponible/indisponible.

Sources :
- https://www.openstreetmap.org
- https://operations.osmfoundation.org/policies/tiles/
- https://docs.expo.dev/versions/v58.0.0/sdk/webview/
