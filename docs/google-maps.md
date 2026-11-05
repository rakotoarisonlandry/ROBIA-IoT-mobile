# Carte Google Maps dans Robia

La carte, les résultats et l’aperçu du trajet restent dans l’application.
Aucun bouton de recherche ou d’itinéraire n’ouvre Google Maps à l’extérieur.
Cela nécessite une connexion internet et une configuration Google Maps active.

## Configuration nécessaire

Les fichiers `.env*` sont exclus des archives EAS. Utiliser `.env.local` en
développement, les variables de l’environnement EAS pour les APK et celles du
serveur d’hébergement pour l’API. `.env.example` décrit les variables sans valeurs.

| Variable | Utilisation |
| --- | --- |
| `GOOGLE_MAPS_ANDROID_API_KEY` | SDK Maps for Android, limité au package `com.robia.mobile` et au SHA-1 de signature EAS |
| `GOOGLE_MAPS_IOS_API_KEY` | SDK Maps for iOS, limité à l’identifiant iOS |
| `EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY` | Maps Embed API, limité aux domaines du site web |
| `GOOGLE_MAPS_SERVER_API_KEY` | Places API (New) et Routes API, uniquement sur le serveur, restrictions adaptées au serveur |
| `EXPO_PUBLIC_MAPS_API_URL` | Origine HTTPS du serveur API pour un APK, par exemple `https://api.example.com` |

Les clés SDK et Embed sont embarquées ou visibles par conception : appliquer
leurs restrictions. La clé serveur ne doit jamais utiliser le préfixe
`EXPO_PUBLIC_`. Elle n’est pas transmise dans la configuration de l’application.
Activer les API correspondantes et la facturation sur le projet Google Cloud.

## Essais locaux

1. Renseigner les clés concernées dans `.env.local`.
2. Lancer `npx.cmd expo start` : Expo sert aussi les routes API de développement.
3. Sur le téléphone, utiliser la même connexion réseau que le serveur Expo.
   En développement, l’origine est déduite de `hostUri`. Il est aussi possible
   de définir `EXPO_PUBLIC_MAPS_API_URL=http://ADRESSE_IP_DU_PC:8081`.
4. Recréer le build natif après ajout des modules ou modification de la clé SDK.
   L’ancien APK n’inclut pas les modules et la configuration de cette version.

Le web utilise `/api/maps` sur sa propre origine. Un APK release utilise
l’origine HTTPS configurée ; les routes API doivent donc être déployées sur un
serveur compatible Expo Router. L’APK n’embarque pas ce serveur.

## Parcours

- « Me localiser » demande uniquement la permission au premier plan.
- « Chercher dans cette zone » recherche explicitement une ville ou un quartier.
- Les boutiques renvoyées par Google sont affichées sur la carte et dans la liste.
  Le tri GPS indique une distance **à vol d’oiseau**, distincte de la distance routière.
- Toucher un repère ou un résultat sélectionne une boutique et affiche sa fiche.
- « Afficher l’itinéraire » calcule un trajet voiture ou piéton depuis le GPS.
- La ligne orange, la distance, la durée estimée et les indications restent visibles
  dans Robia. Il s’agit d’un aperçu, sans navigation vocale ni suivi en arrière-plan.
- En cas de refus GPS, la recherche par ville reste utilisable ; un départ GPS
  valide est nécessaire pour le calcul du trajet.
- La réservation reste une démonstration, disponible uniquement pour une boutique
  reconnue dans le catalogue Robia. Une adresse Google ne garantit pas un créneau.

## API et architecture

`POST /api/maps/search` reçoit `{ position, area }`.
`POST /api/maps/route` reçoit `{ origin, destination, mode }`.
Les contrôleurs de routes restent légers et délèguent aux cas d’usage injectés.
Le serveur appelle Google avec des masques de champs limités. Les réponses ne
contiennent pas la clé et utilisent `Cache-Control: no-store`.

Les requêtes remplacées sont annulées ; les erreurs, résultats vides et délais
dépassés sont affichés sans inventer de trajet ni de coordonnées. Les recherches
sont lancées par une action utilisateur, pas à chaque caractère saisi.

Une limitation de fréquence en mémoire protège les essais sur une instance.
Avant un déploiement public, ajouter une authentification et une limitation
distribuée, ainsi que des quotas Google adaptés au projet.

## Guide utilisateur

La carte des trois étapes est remplacée par React Native Copilot. Le guide
surligne les commandes de l’accueil et des boutiques avec des textes français.
Il est facultatif, peut être passé et relancé avec « Découvrir cet écran ».
AsyncStorage conserve uniquement l’état « déjà proposé » du guide.

L’adaptateur de mesure utilise les références hôtes RN 0.88 et le défilement DOM
sur web ; il évite le chemin `findNodeHandle` historique de la bibliothèque.

## Vérifications sur appareil

- Carte et point GPS avec une clé valide, refus GPS et GPS désactivé.
- Recherche par ville, aucun résultat, réseau indisponible.
- Sélection par marqueur et par liste, calcul voiture puis marche.
- Ligne orange et durée cohérentes avec la réponse Google ; aucun appel externe.
- Guide : première proposition, passer, suivant, retour, relancer, changement d’onglet.
- Petit écran : défilement vers les cibles et tooltip visible au-dessus du clavier fermé.

Sources : [Maps Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/),
[Places API](https://developers.google.com/maps/documentation/places/web-service/text-search),
[Routes API](https://developers.google.com/maps/documentation/routes/compute_route_directions),
[Embed API](https://developers.google.com/maps/documentation/embed/embedding-map),
[React Native Copilot](https://github.com/mohebifar/react-native-copilot).
