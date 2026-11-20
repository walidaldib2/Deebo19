# Google Play release checklist

## 1. Create a private upload keystore

Create the upload key on a trusted computer. Keep the `.jks` file and passwords in a secure password manager and keep an offline backup.

Linux/macOS:

```sh
keytool -genkeypair -v -keystore deeb-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias deeb-upload
base64 -w 0 deeb-upload-key.jks
```

PowerShell:

```powershell
keytool -genkeypair -v -keystore deeb-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias deeb-upload
[Convert]::ToBase64String([IO.File]::ReadAllBytes("deeb-upload-key.jks"))
```

Do not commit the keystore, its Base64 value, or any password to Git.

## 2. Add GitHub Actions secrets

In the repository, open **Settings → Secrets and variables → Actions → New repository secret** and add:

- `DEEB_UPLOAD_KEYSTORE_BASE64`: the Base64 output of the `.jks` file (without line breaks).
- `DEEB_UPLOAD_STORE_PASSWORD`: the keystore password.
- `DEEB_UPLOAD_KEY_ALIAS`: `deeb-upload` (or the alias you chose).
- `DEEB_UPLOAD_KEY_PASSWORD`: the key password.

When all four secrets exist, the Android workflow signs `app-release.aab`, verifies its signature, and deletes the temporary keystore before uploading build artifacts. If the secrets are absent, the workflow intentionally produces an unsigned AAB for build validation only.

## 3. First Play Console release

1. Create the DEEB app entry in Play Console using the same application ID already set in Capacitor.
2. Enroll in Play App Signing and upload the AAB signed with the upload key.
3. Complete the store listing, including the app description, screenshots, feature graphic, and the generated 512×512 icon artifact.
4. Publish a public, globally accessible privacy-policy web page and link it both in Play Console and inside the app.
5. Complete the Data safety form accurately, including the optional weather/location and user-initiated map/share flows.
6. Complete the required testing track and app-content declarations before production rollout.

## Important application data notes

DEEB currently has no user accounts or cloud synchronization. Operational records and attachments are stored locally in the app's IndexedDB. The PIN is an interface lock, not database encryption. Android cloud backup is disabled, so users must export and keep an external JSON backup when changing or losing a device. The app's weather feature uses an external weather service; location/map features can open third-party map apps when the user chooses to do so. The privacy policy and Data safety declarations must reflect the actual final build.
