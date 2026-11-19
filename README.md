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

The workflow installs Node dependencies, runs the project's static checks, builds the biometric web bundle, stages the web assets, generates and syncs the Capacitor Android project, builds the debug APK, and uploads it as an artifact.

A debug APK is for installation/testing. A Play Store release requires a separately configured signing key and a release build. The workflow does not create or store signing credentials.

## Data storage note

Application records are stored locally in the browser/device IndexedDB. Keep regular backups when changing devices or clearing app/browser data. This workflow builds the Android package; it does not provide cloud synchronization.

## Validation note

`npm test` and the syntax checks are static/source checks. A successful GitHub Actions build confirms APK packaging, but interactive testing on a physical Android device is still required.
