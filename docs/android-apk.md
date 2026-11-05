# Tester Robia sur Android

Le profil `preview` de `eas.json` produit un APK autonome signé, sans serveur Metro.
L’identifiant Android est `com.robia.mobile`.

Depuis la racine du projet, se connecter à son compte Expo puis lancer :

```powershell
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest build --platform android --profile preview
```

Au premier lancement, EAS peut demander de créer le projet Expo et de générer
une clé de signature Android. Conserver cette clé dans EAS pour les prochains APK.

À la fin, ouvrir le lien de téléchargement fourni par EAS sur le téléphone,
télécharger le fichier `.apk`, puis autoriser son installation si Android le demande.

Les boutiques et réservations sont des données de démonstration ; les réservations
restent en mémoire pendant la session.

Vérifications avant construction :

```powershell
npx.cmd expo lint
npx.cmd tsc --noEmit
npx.cmd expo export --platform android --output-dir dist-android --max-workers 2
```

La dernière commande valide le bundle Android ; elle ne produit pas un APK.
