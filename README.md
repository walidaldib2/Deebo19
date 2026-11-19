# DEBOO16 v10

Arabic RTL field-operations PWA using local IndexedDB storage.

## Checks
Run `node static-smoke-test.js` for static wiring checks. Also run `node --check app.js`, `node --check db.js`, `node --check qrcode.js`, and `node --check sw.js`.

## Android packaging
Capacitor configuration and dependencies are declared. The native `android/` project has not been generated in this environment: installing npm packages timed out, and Android SDK / Gradle are not available here. On a machine with network access, Java and Android Studio installed, run `npm install`, `npx cap add android`, `npx cap sync android`, then open the project in Android Studio and build a signed APK.


### فحص المصدر
بعد تثبيت اعتماديات المشروع، شغّل `npm test` لفحص سلامة الملفات وإعدادات التشغيل وبعض قواعد التحقق الساكنة. هذا الفحص لا يُعد اختبارًا تفاعليًا على هاتف Android.
