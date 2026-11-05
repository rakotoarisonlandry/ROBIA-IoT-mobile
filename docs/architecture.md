# Architecture de Robia

Le code est séparé selon la direction des dépendances : le métier ne connaît
ni React Native, ni Expo, ni les fournisseurs de services.

```text
src/
  app/                 Routes Expo Router et composition du layout
  domain/              Entités et règles métier sans dépendance externe
    booking/           Client, services, boutiques, tickets et créneaux
    location/          Coordonnées et résultats de localisation
  application/         Cas d’usage et interfaces des dépendances
    booking/           Réserver et exporter un ticket
    location/          Obtenir une position validée
  infrastructure/      Implémentations techniques des interfaces
    catalog/           Catalogue de démonstration
    tickets/           Stockage en mémoire de la session
    location/          Permissions et lecture GPS avec Expo Location
    maps/              URLs et ouverture de Google Maps
    pdf/               Génération PDF et export natif/web
    config/            Lecture de la configuration Expo
    system/            Horloge et références de démonstration
  presentation/        Composants React Native, hooks et modèles d’affichage
    booking/           Écran, formulaires, ticket et styles
    location/          Localisation et carte native/web
    shared/            Éléments de présentation réutilisables
    legacy/            Écran Explore conservé du projet initial
  composition/         Création et injection des adaptateurs
```

## Dépendances

- `domain` n’importe que `domain`.
- `application` utilise le domaine et définit les ports.
- `infrastructure` implémente les ports et peut utiliser Expo ou des bibliothèques.
- `presentation` utilise les cas d’usage injectés ; elle n’importe pas les adaptateurs.
- `composition` assemble les implémentations et expose un contexte aux hooks.
- `app` conserve des routes légères vers les écrans de présentation.

Le contexte React est l’accès de la présentation aux services. Son fournisseur
accepte un conteneur personnalisé pour les essais. Le stockage est créé par
instance d’application, sans singleton partagé entre requêtes SSR.

## Réservation

`createBookAppointment` vérifie les informations client, la boutique, les
services et l’horaire, puis demande au dépôt de créer le ticket. Le cœur utilise
des identifiants stables de boutique et de service ; seuls les modèles de
présentation utilisent les indices des sélecteurs.

Les horaires vont de 08:00 à 16:00, par créneaux de 30 minutes. La validation
métier est appliquée même si le formulaire est contourné. Le dépôt alloue les
numéros par boutique. Une référence distincte identifie chaque ticket.

Le stockage est temporaire et les références sont destinées à la démonstration.
Pour une utilisation réelle, remplacer `TicketRepository` par un dépôt serveur
qui alloue les identifiants dans une transaction et confirme les disponibilités.
Les données CIN et téléphone ne sont pas copiées dans les tickets.

## Changer un fournisseur

- Catalogue réel : implémenter `CatalogRepository` puis le brancher dans
  `create-app-services.ts`.
- Réservations persistantes : implémenter `TicketRepository`.
- Export : implémenter `TicketExporter`. Metro sélectionne actuellement les
  adaptateurs `.ts` natif et `.web.ts` navigateur.
- Position : implémenter `LocationGateway`. Permissions, délais et SDK restent
  dans l’adaptateur ; le hook ne gère que l’état d’affichage.
- Carte externe : implémenter `MapGateway`. La construction des URLs est isolée.

Les composants cartographiques natifs et web restent dans la présentation :
ils rendent l’interface, sans porter de règles métier. Voir
[google-maps.md](google-maps.md) pour les limites sans clé Google Maps.

## Vérification

```powershell
npm.cmd test
npx.cmd expo lint
npx.cmd tsc --noEmit
```

Les tests vérifient les cas d’usage avec une horloge et des références injectées,
les limites horaires, les erreurs de validation, les numéros de file, l’isolation
du dépôt, le PDF et les échecs GPS. Le contrôle d’architecture parcourt les imports
statiques et dynamiques pour interdire les dépendances vers les couches externes.
Le lint interdit également les imports de frameworks dans le cœur métier.
