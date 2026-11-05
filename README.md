# Robia

Application Expo / React Native pour préparer un rendez-vous en boutique Orange,
obtenir un ticket QR/PDF et ouvrir une recherche ou un itinéraire Google Maps.

Le code suit une Clean Architecture : `domain`, `application`, `infrastructure`,
`presentation` et `composition`. Les routes restent dans `src/app`.
Voir [la documentation d’architecture](docs/architecture.md),
[la configuration Google Maps](docs/google-maps.md) et
[la génération de l’APK](docs/android-apk.md).

Validation : `npm test`, `npm run lint`, `npm run typecheck`.
Le catalogue et le stockage des réservations sont actuellement en démonstration.

## Demarrage

```bash
npm ci
npx expo start
```

## Verification

```bash
npm test
npm run lint
npm run typecheck
```

Les tests couvrent les regles de reservation, les interfaces de stockage et
les frontieres entre les couches, sans lancer le runtime Expo.

## Android

Le profil EAS `preview` produit un APK autonome. Voir [le guide APK](docs/android-apk.md).

La carte, la recherche de boutiques et les itineraires restent dans Robia.
Leur activation requiert les cles Google Maps et le serveur de recherche configure.
Voir [le guide Google Maps](docs/google-maps.md).
