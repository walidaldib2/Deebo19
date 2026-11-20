# DEEB v10

Arabic RTL field-operations PWA using local IndexedDB storage.

## Checks

Run `npm install`, then `npm test` and the syntax checks:

```sh
node --check app.js
node --check db.js
node --check qrcode.js
node --check sw.js
node --check prepare-android.js
```

## Android APK build

The repository includes a GitHub Actions workflow at `.github/workflows/android-apk.yml`.

1. Open the **Actions** tab in this repository.
2. Select **Build DEEB Android APK**.
3. Select **Run workflow** and choose `feature/deboo-pro-upgrade` (or push a commit to that branch).
4. When the run succeeds, open the run and download the `DEEB-Android-APK` artifact. It contains `app-debug.apk`.

The workflow installs Node dependencies, runs source and IndexedDB integration checks, builds the biometric/native bridges, generates DEEB launcher icons from `icon.svg`, generates the 512×512 Play listing icon, stages web assets, and creates the Capacitor Android project. It verifies `compileSdkVersion` and `targetSdkVersion` are both at least 36, then builds a debug APK and a release Android App Bundle (AAB).

The AAB currently builds unsigned. Google Play requires an upload-key-signed AAB and Play App Signing enrollment for new apps. Configure a private upload keystore in GitHub Actions secrets before treating the AAB as upload-ready. Never commit the keystore or passwords to the repository. The debug APK is for installation/testing only.

## Data storage note

Application records are stored locally in the browser/device IndexedDB. Keep regular backups when changing devices or clearing app/browser data. This workflow builds the Android package; it does not provide cloud synchronization.

## Validation note

`npm test` and the syntax checks are static/source checks. A successful GitHub Actions build confirms APK packaging, but interactive testing on a physical Android device is still required.

## Google Play readiness

- Android packaging uses Capacitor 8 and verifies Android 16 / API 36 or higher.
- Android automatic cloud backup is disabled; users must export their own JSON backups to protect data when changing or losing a device.
- The app has no account system or cloud synchronization. Work records are stored locally in IndexedDB. The local PIN is an interface lock and does not encrypt the database.
- Before Play submission, complete the upload-key signing setup, publish a privacy policy with a real support contact, complete the Play Console Data safety form, and provide store screenshots and the feature graphic.
- A successful CI build is not a substitute for testing on supported physical Android devices, including location permission, biometric/PIN fallback, printing, Excel export, file saving, and share-intent flows.
