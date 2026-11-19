const fs = require('fs');
const path = require('path');
const root = __dirname;
const required = ['index.html','app.js','db.js','style.css','sw.js','manifest.json','icon.svg','qrcode.js','capacitor.config.json','package.json','biometric.bundle.js','prepare-android.js','configure-android-share.js'];
const missing = required.filter(f => !fs.existsSync(path.join(root,f)));
if (missing.length) throw new Error('Missing required files: '+missing.join(', '));
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const f of ['qrcode.js','db.js','biometric.bundle.js','app.js']) if (!html.includes(`src="${f}"`)) throw new Error('index.html does not load '+f);
const sw = fs.readFileSync(path.join(root,'sw.js'),'utf8');
for (const f of ['index.html','style.css','app.js','db.js','qrcode.js','manifest.json','icon.svg']) if (!sw.includes(`./${f}`)) throw new Error('Service worker core cache missing '+f);
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const cap = JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));
if (!pkg.dependencies?.['@capacitor/android'] || !pkg.dependencies?.['@capacitor/core']) throw new Error('Capacitor dependencies missing');
if (cap.appName !== 'DEEBO') throw new Error('Android display name must be DEEBO');
if (pkg.name !== 'deebo-field-operations') throw new Error('Project package name must be deebo-field-operations');
if (cap.webDir !== 'www') throw new Error('Capacitor webDir must be the staged www directory');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
if (!app.includes('$(\"#enableBiometric\").onclick=async()=>') || !app.includes('$(\"#disableBiometric\").onclick=()=>')) throw new Error('Biometric settings handlers are missing');
if (!app.includes('localStorage.removeItem(BIOMETRIC_KEY)') || !app.includes('سيفتح التطبيق مباشرة دون PIN أو بصمة')) throw new Error('Direct unlock / biometric reset flow is missing');
if (!app.includes('يمكنك الدخول باستخدام PIN')) throw new Error('Biometric PIN fallback message is missing');
if (!app.includes('function lockApplication()') || !app.includes('document.visibilityState==="hidden"') || !app.includes('window.addEventListener("pagehide",lockApplication)')) throw new Error('Automatic PIN lock hooks are missing');
if (!sw.includes('deebo-local-v10-8')) throw new Error('Service worker cache version was not bumped');
const db = fs.readFileSync(path.join(root,'db.js'),'utf8');
for (const marker of ['if(!used.has(bike)&&used.size>=5)','const bikesByDay=new Map()','bikesByDay.get(day).size>5']) if (!db.includes(marker)) throw new Error('Motorcycle-patrol rule missing: '+marker);
if (db.includes('patrolKeys.has(key)')) throw new Error('Repeated motorcycle passes are still blocked in backup restore');
if (!pkg.scripts?.test) throw new Error('npm test script missing');
if (!pkg.scripts?.['build:biometric']?.includes('--outfile=www/biometric.bundle.js')) throw new Error('Biometric bundle output path does not match Android web assets');
if (!pkg.scripts?.['prepare:android']) throw new Error('Android web asset preparation script missing');
if (!html.includes('src=\"biometric.bundle.js\"')) throw new Error('index.html does not load the biometric bundle');
if (html.includes('data-page=\"data\"')) throw new Error('Data management must not appear as a primary home tile');
if (!app.includes('function dataManagementPage()') || !app.includes('openDataManagement')) throw new Error('Settings data-management entry is missing');
if (!app.includes('showArchive') || !app.includes('DebooDB.unarchive')) throw new Error('Reports archive / restore controls are missing');
const prep = fs.readFileSync(path.join(root,'prepare-android.js'),'utf8');
for (const f of ['index.html','app.js','db.js','biometric.bundle.js','style.css','preferences.css','preferences.js','sw.js','manifest.json','icon.svg']) if (!prep.includes('\"'+f+'\"')) throw new Error('Android asset preparation omits '+f);
if (!app.includes('absences:[[') || !app.includes('غياب المسؤولين')) throw new Error('Absence tracking section is missing');
if (!app.includes('function bindAutocomplete()') || !app.includes('suggest-')) throw new Error('Automatic name / branch suggestions are missing');
if (!app.includes('id="saveRecord" type="submit"') || !app.includes('id="cancelEdit" type="button"') || !app.includes('$("#recordForm")?.addEventListener("submit"') || !app.includes('event.preventDefault()')) throw new Error('Record form must submit through its form handler with explicit button types');
if (app.includes('</form><div class="actions"><button class="primary" id="saveRecord"')) throw new Error('Record save button must remain inside the form on Android');
if (!app.includes('d.map(x=>')) throw new Error('Report output must include all matching records');
console.log('PASS: required files, navigation hierarchy, reports archive/restore, script references, refreshed service-worker cache, package.json, Capacitor config, automatic-lock wiring, and repeated motorcycle passes allowed with five distinct bikes/day limit.');

if (!app.includes('patrol_sites:[') || !app.includes('المخازن والمعارض ومراكز الخدمة')) throw new Error('Fixed patrol locations registry is missing');
if (!app.includes('patrol_date') || !app.includes('location_url') || !app.includes('extractSharedCoordinates')) throw new Error('WhatsApp fixed-location patrol flow is incomplete');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
if (manifest.name !== 'DEEBO' || manifest.short_name !== 'DEEBO') throw new Error('PWA display name must be DEEBO');
if (!html.includes('<title>DEEBO |') || !html.includes('class="wordmark">DEEBO</div>')) throw new Error('Visible application branding must be DEEBO');
if (!manifest.share_target || manifest.share_target.action !== './?share=location') throw new Error('PWA WhatsApp share target is missing');
if (!app.includes('consumeSharedLocation()')) throw new Error('Shared location intake handler is missing');
if (!app.includes("function bindPatrolLocationInput") || !app.includes("bindPatrolLocationInput(type)")) throw new Error("Manual WhatsApp location-link parsing is missing");

const workflow = fs.readFileSync(path.join(root,'.github/workflows/android-apk.yml'),'utf8');
const prepareAt = workflow.indexOf('npm run prepare:android');
const biometricAt = workflow.indexOf('npm run build:biometric');
if (prepareAt < 0 || biometricAt < 0 || prepareAt > biometricAt) throw new Error('Android build must prepare www before generating the native biometric bundle; otherwise the bundle is deleted.');
if (!workflow.includes('grep -q "BiometricAuth" www/biometric.bundle.js')) throw new Error('Android build must verify that the native biometric bundle is present.');

const index = fs.readFileSync(path.join(root,'index.html'),'utf8');
if (!index.includes('function startupFailure(message)') || !index.includes('unhandledrejection') || !index.includes('startupRetry')) throw new Error('Android startup diagnostics and recovery panel are missing');

if (!app.includes('$$(".tile").forEach') || !app.includes('$$("[data-page]").forEach')) throw new Error('Navigation must iterate NodeLists, not querySelector single elements');

const nativeShare = fs.readFileSync(path.join(root,'configure-android-share.js'),'utf8');
if (!nativeShare.includes('CurrentLocationPlugin.java') || !nativeShare.includes('ACCESS_FINE_LOCATION') || !nativeShare.includes('requestPermissionForAlias("location"')) throw new Error('Native Android location permission / GPS plugin is missing');
if (!nativeShare.includes('ShareIntentPlugin.java') || !nativeShare.includes('android.intent.action.SEND') || !nativeShare.includes('Intent.EXTRA_TEXT')) throw new Error('Native Android text-share receiver configuration is incomplete');
if (!app.includes('deboo-share-intent') || !app.includes('consumeNativeShare()') || !app.includes('getInitialShare')) throw new Error('App does not consume native Android shared text/location payloads');
if (!app.includes('function currentCoordinates()') || !app.includes('window.Capacitor?.Plugins?.CurrentLocation') || !app.includes('"bike_patrols"].includes(type)')) throw new Error('Current-location button is not wired for native Android and motorcycle patrol forms');


if (!pkg.scripts?.['configure:android:share']) throw new Error('Native Android share configuration script is missing');
const nativeShareStep = workflow.indexOf('npm run configure:android:share');
const syncStep = workflow.indexOf('npx cap sync android');
const apkStep = workflow.indexOf('./gradlew assembleDebug');
if (syncStep < 0 || nativeShareStep < syncStep || apkStep < nativeShareStep) throw new Error('Native share receiver must be configured after Capacitor sync and before APK build');
