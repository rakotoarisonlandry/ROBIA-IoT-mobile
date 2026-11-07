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

## Vérifier le démarrage de l’APK sans câble

Installer l’APK `preview` sur un émulateur Android, puis ouvrir l’application
depuis son icône. Aucun serveur Metro n’est nécessaire.

```powershell
adb install --no-streaming -r chemin/Robia.apk
adb shell am start -W -n com.robia.mobile/.MainActivity
adb logcat -d -b crash
```

Le build Android 2 se fermait dans `androidx.startup.InitializationProvider`
avant le chargement de React Native : Room ne pouvait pas instancier
`androidx.work.impl.WorkDatabase`. L’inspection du DEX a confirmé que
`WorkDatabase_Impl` existait mais ne possédait plus de constructeur.

La règle ciblée `extraProguardRules` dans `app.json`, appliquée par
`expo-build-properties`, conserve son constructeur public sans désactiver R8.
Conserver cette règle tant que la dépendance Room concernée l’exige.
Après toute modification des dépendances natives, vérifier aussi le démarrage
du véritable APK release ; lint, TypeScript et l’export du bundle ne couvrent
pas les initialisations Android avant JavaScript.
