# Guide automatique de Robia

Le guide démarre à la première ouverture de l’application, une fois l’accueil
affiché, sans question « Me guider ». Il utilise React Native Copilot.

## Parcours unique

1. Réserver depuis l’accueil.
2. Choisir un service.
3. Consulter les boutiques.
4. Informations client : nom, CIN et téléphone facultatif.
5. Services et choix de boutique.
6. Date, horaires de 08 h à 16 h et confirmation.
7. Localisation.
8. Filtre local des boutiques.
9. Carte OpenStreetMap.
10. Mes rendez-vous.
11. Mes tickets, QR code et PDF.
12. Aide.

Les écrans et formulaires s’ouvrent automatiquement avec « Suivant ».
« Retour » traverse les mêmes pages en sens inverse.
Le guide est un aperçu : il ne saisit pas de données, ne demande pas la permission
GPS et ne confirme aucune réservation. La confirmation est désactivée pendant le guide.
Le formulaire et l’onglet initiaux sont restaurés à la fin ou avec « Passer ».

## Démarrage et préférences

Le choix n’est enregistré qu’à « Terminer » ou « Passer » :
`@robia/guide/tour/v2=seen`. Les anciens indicateurs par écran ne suppriment pas
ce nouveau parcours complet. Un échec de lecture du stockage ne bloque pas le
premier lancement ; un échec de mesure ne marque pas le guide comme terminé.
Le lien « Revoir le guide » reste disponible sur chaque onglet.

## Mesures et transitions

Les cibles sont enregistrées après leur montage et leur layout.
Le contrôleur attend l’onglet, le formulaire et la cible attendus avant d’appeler
Copilot, puis utilise son instance courante pour éviter les fermetures sur une
ancienne liste d’étapes. Chaque dialogue possède sa propre référence de défilement.
Le contrôleur ne passe pas de ScrollView à Copilot : la mesure utilise les
références hôtes RN 0.88 ou le défilement DOM sur web, sans findNodeHandle.
Les transitions attendent la fermeture de la surcouche avant d’ouvrir l’écran suivant.

## Validation

Les tests unitaires vérifient la couverture des onglets, les trois aperçus de
réservation et la correspondance entre cible et écran.
Vérifier aussi le parcours sur petit écran : lancement automatique, Suivant, Retour
aux frontières des dialogues, Passer, fin, relancement et absence de réservation
créée pendant la visite. Un test web ne remplace pas la vérification du nouvel APK.
