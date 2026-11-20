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
if (cap.appName !== 'DEEB') throw new Error('Android display name must be DEEB');
if (pkg.name !== 'deeb-field-operations') throw new Error('Project package name must be deebo-field-operations');
if (cap.webDir !== 'www') throw new Error('Capacitor webDir must be the staged www directory');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
if (!app.includes('$(\"#enableBiometric\").onclick=async()=>') || !app.includes('$(\"#disableBiometric\").onclick=()=>')) throw new Error('Biometric settings handlers are missing');
if (!app.includes('localStorage.removeItem(BIOMETRIC_KEY)') || !app.includes('سيفتح التطبيق مباشرة دون PIN أو بصمة')) throw new Error('Direct unlock / biometric reset flow is missing');
if (!app.includes('يمكنك الدخول باستخدام PIN')) throw new Error('Biometric PIN fallback message is missing');
if (!app.includes('function lockApplication()') || !app.includes('document.visibilityState==="hidden"') || !app.includes('window.addEventListener("pagehide",lockApplication)')) throw new Error('Automatic PIN lock hooks are missing');
if (!sw.includes('deebo-local-v10-14')) throw new Error('Service worker cache version was not bumped');
const db = fs.readFileSync(path.join(root,'db.js'),'utf8');
if (!db.includes('return {app:"DEEB",format:2') || !db.includes('["DEEB","DEEBO","DEBOO16"].includes(obj.app)') || !db.includes('title:"تقرير DEEB"')) throw new Error('DEEB backup / approved report branding or legacy backup compatibility is missing');
for (const marker of [
  'document.addEventListener("click",e=>{if(e.target.closest("[data-back-home]"))',
  '$$("[data-page]").forEach',
  '$("[data-branch-slot]").forEach',
  'moveBranchOrder(button.dataset.moveBranch,Number(button.dataset.direction)||0)',
  "$$(\'[data-edit]\').forEach",
  "$$(\'[data-archive]\').forEach",
  'host.querySelectorAll("[data-restore-record]")',
  'box.querySelectorAll("[data-handover-version]")',
  'document.querySelectorAll("[data-report-type]")'
]) if (!app.includes(marker)) throw new Error('Interactive button action binding is missing: '+marker);

const buttonBindingChecks = [
  ['$("#recordForm")?.addEventListener("submit"', 'Save-record form submission is not wired'],
  ['$("#cancelEdit")?.addEventListener("click"', 'Cancel-edit button is not wired'],
  ['function bindLocationCapture(type)', 'Current-location capture binder is missing'],
  ['button.onclick=async()=>{', 'Current-location capture action is missing'],
  ['$("#clearSignature")?.addEventListener("click"', 'Clear-signature button is not wired'],
  ['qrDownload.onclick=async()=>', 'QR download button is not wired'],
  ['$("#employeeListBack")?.addEventListener("click"', 'Employee-list back button is not wired'],
  ['installBtn.onclick=async()=>', 'Install-app button is not wired'],
  ['$("#printReport").onclick=async()=>', 'Print-report button is not wired'],
  ['$("#pdfReport").onclick=()=>', 'PDF-report button is not wired'],
  ['$("#excelReport").onclick=()=>', 'Excel-report button is not wired'],
  ['$("#csvReport").onclick=()=>', 'CSV-report button is not wired'],
  ['$("#saveReportImage").onclick=async()=>', 'Save-report-image button is not wired']
];
for (const [needle,message] of buttonBindingChecks) if (!app.includes(needle)) throw new Error(message);
if (/\bwolf\b|ذئب/i.test(app)) throw new Error('Printed DEEB reports must not contain a wolf icon or wolf branding');
if (app.split('DEEB</div>').length - 1 < 2) throw new Error('Both printed report templates must retain DEEB branding');


if (!app.includes('const branchGroupsFor=d=>') || !app.includes('supervisor:[["employees","name"],["managers","name"],["patrol_people","name"]]')) throw new Error('Branch report supervisor grouping / saved suggestions are missing');
if (!app.includes('Math.max(0,Math.ceil(r.times.length/5)-1)')) throw new Error('Motorcycle screen preview and spreadsheet export must preserve all recorded visits');
if (!app.includes('Math.max(0,Math.ceil(r.times.length/5)-1)')) throw new Error('Motorcycle screen preview and spreadsheet export must preserve all recorded visits');
if (!app.includes('<section class="bike-sheet-section"><div class="brand">') || !app.includes('@page{size:A4 portrait;margin:8mm}') || !app.includes('break-after:page!important;page-break-after:always!important') || !app.includes('.bike-sheet-section:last-child{break-after:auto!important;page-break-after:auto!important}') || !app.includes('.bike-table thead{display:table-header-group}') || !app.includes('.bike-table tr{break-inside:avoid;page-break-inside:avoid}') || !app.includes('g.sites.flatMap(r=>r.entries.map') || !app.includes('<th>الاسم</th><th>توقيت المرور</th><th>الإحداثيات</th><th>ملاحظات</th>') || !app.includes('coordinates') || !app.includes('class="bike-coordinates"') || !app.includes('class="bike-notes"') || !app.includes('height:165mm') || !app.includes('notes:String(p.notes||"").trim()') || app.includes('function fitBikePages()')) throw new Error('Motorcycle reports must use branch-style portrait layout, patrol time, coordinates and app-entered notes, with independent page breaks and natural pagination');
if (!app.includes('const displayRows=visible.flatMap') || !app.includes('continuation:i>0,visits:g.visits.slice(i*5,(i+1)*5)') || !app.includes('g.branch+(g.continuation?" — استكمال":"")')) throw new Error('Branch patrol continuation rows beyond five visits are missing from the screen or reports');
if (!app.includes('تقرير متابعة الفروع') || !app.includes('data:') && !app.includes('branchGroupsFor(d)')) throw new Error('Branch report matrix is missing');
if (!db.includes('const patrolDate=String(row.payload?.patrol_date||"").trim()')) throw new Error('Motorcycle backup restore must validate patrol_date rather than patrol_time');
if (!db.includes(String.raw`const day=/^\d{4}-\d{2}-\d{2}$/.test(patrolDate)?patrolDate:stamp.slice(0,10);`)) throw new Error('Motorcycle backup restore must correctly recognize YYYY-MM-DD patrol dates');


if (!app.includes('$("#recordForm")?.elements.namedItem("supervisor")?.focus()')) throw new Error("Quick branch patrol entry must open the form and focus the required supervisor field");
if (!app.includes("bindGlobalSearchSuggestions()") || !app.includes('input.setAttribute("list","globalSearchSuggestions")')) throw new Error("Global search autocomplete suggestions are missing");

console.log('PASS: required files, navigation hierarchy, reports archive/restore, script references, refreshed service-worker cache, package.json, Capacitor config, automatic-lock wiring, and four-column motorcycle print reports with notes, with existing screen preview and spreadsheet export preserved.');

if (!app.includes('id="pdfReport"') || !app.includes('$("#pdfReport").onclick=()=>') || !app.includes('اختر حفظ كملف PDF')) throw new Error('PDF export action is missing');
if (!app.includes('patrol_sites:[') || !app.includes('المخازن والمعارض ومراكز الخدمة')) throw new Error('Fixed patrol locations registry is missing');
if (!app.includes('function mapPage()') || !html.includes('data-page="map"') || !app.includes('فتح خط السير على خرائط Google')) throw new Error('Motorcycle route map page is missing');
if (!app.includes('extractSharedCoordinates(raw+" "+locationUrl)') || !app.includes('form.elements.namedItem("lat").value=coords.lat.toFixed(6)') || !app.includes('form.elements.namedItem("lng").value=coords.lng.toFixed(6)')) throw new Error('Shared motorcycle location coordinates are not persisted into patrol records');
if (!db.includes('try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}') || !db.includes('updated:!!sameDay')) throw new Error('Daily automatic backup must refresh after record changes');

if (!app.includes('id="monthlyReport"') || !app.includes('تقرير شهري')) throw new Error('Monthly report preset is missing');
if (!app.includes('صور ومستندات البلاغ') || !app.includes('["documents","incidents"].includes(type)')) throw new Error('Incident attachment upload flow is missing');
const dbSource = fs.readFileSync(path.join(root,'db.js'),'utf8');
if (!dbSource.includes('const DB_VERSION = 3') || !dbSource.includes('createAutoBackup') || !dbSource.includes('automatic_backups')) throw new Error('Daily local automatic backup store is missing');

if (!app.includes('patrol_date') || !app.includes('location_url') || !app.includes('extractSharedCoordinates')) throw new Error('WhatsApp fixed-location patrol flow is incomplete');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
if (manifest.name !== 'DEEB' || manifest.short_name !== 'DEEB') throw new Error('PWA display name must be DEEB');
if (!html.includes('<title>DEEB |') || !html.includes('class="wordmark">DEEB</div>') || html.includes('wolf-mark') || html.includes('شعار الذئب')) throw new Error('Visible DEEB wordmark-only branding is missing or a wolf icon remains');
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

if (!app.includes('$(".tile").forEach') || !app.includes('$("[data-page]").forEach')) throw new Error('Navigation must iterate NodeLists, not querySelector single elements');
if (/(?<!\$)\$\([^)]*\)\.forEach/.test(app)) throw new Error('A single-element querySelector is being used as a NodeList');

if (!app.includes('const normalize=v=>String(v||"").trim().toLocaleLowerCase("ar")') || !app.includes('normalize(row.name).includes(normalize(searchTerm))')) throw new Error('Global Arabic search normalization for branch patrol grid is missing');
if (!app.includes('function render(p){currentPage=p;currentType=null;')) throw new Error('Navigation must clear stale entity context before rendering another page');
if (!app.includes('id="saveStatus"') || !app.includes('const persisted=await DebooDB.getRecord(saved.id)') || !app.includes('type==="branches"&&!payload.name')) throw new Error('Branch save validation, visible feedback, or primary-key persistence verification is missing');
if (!app.includes("$('[data-download-attachment]').forEach") || !app.includes('await DebooDB.downloadBlob(new Blob([JSON.stringify(b,null,2)],{type:"application/json"})') || !app.includes('await DebooDB.downloadBlob(new Blob([bytes],{type:"image/png"})')) throw new Error('Android attachment, backup, or QR download action is not wired');
const employeeChecks = [
  ['employees:"سجل الموظفين"', 'Employee registry label is missing'],
  ['employees:[["name","اسم الموظف","text",1]', 'Employee name field is missing'],
  ['["sap_no","رقم ساب","text"]', 'Employee SAP number field is missing'],
  ['["phone","رقم الهاتف","tel"]', 'Employee phone field is missing'],
  ['["branch","الفرع","text"]', 'Employee branch field is missing'],
  ['مدير إدارة|مدير قسم|مشرف|مسؤول أمن', 'Employee role options are incomplete'],
  ['data-employee-detail', 'Employee name list does not open details'],
  ['data-employee-edit', 'Employee detail edit action is missing'],
  ['employeeListBack', 'Employee detail return action is missing']
];
for (const [needle,message] of employeeChecks) if (!app.includes(needle)) throw new Error(message);
const employeeCss = fs.readFileSync(path.join(root,'style.css'),'utf8');
if (!employeeCss.includes('.employee-list{') || !employeeCss.includes('.employee-fields{')) throw new Error('Employee registry styles are missing');

const nativeShare = fs.readFileSync(path.join(root,'configure-android-share.js'),'utf8');
if (!nativeShare.includes('CurrentLocationPlugin.java') || !nativeShare.includes('ACCESS_FINE_LOCATION') || !nativeShare.includes('requestPermissionForAlias("location"')) throw new Error('Native Android location permission / GPS plugin is missing');
if (!nativeShare.includes('ShareIntentPlugin.java') || !nativeShare.includes('android.intent.action.SEND') || !nativeShare.includes('Intent.EXTRA_TEXT')) throw new Error('Native Android text-share receiver configuration is incomplete');
if (!nativeShare.includes('saveHtmlAsImages') || !nativeShare.includes('MediaStore.Images.Media.RELATIVE_PATH') || !nativeShare.includes('DIRECTORY_PICTURES+"/DEEB"')) throw new Error('Native report image export is missing');
if (!db.includes('async function downloadBlob') || !db.includes('native.saveFile({name,mimeType:blob.type||"application/octet-stream",base64:btoa(binary)})')) throw new Error('Android native file export is not wired for backups and attachments');
if (!app.includes('deboo-share-intent') || !app.includes('consumeNativeShare()') || !app.includes('getInitialShare')) throw new Error('App does not consume native Android shared text/location payloads');
if (!app.includes('function currentCoordinates()') || !app.includes('window.Capacitor?.Plugins?.CurrentLocation') || !app.includes('"bike_patrols"].includes(type)')) throw new Error('Current-location button is not wired for native Android and motorcycle patrol forms');


if (!pkg.scripts?.['configure:android:share']) throw new Error('Native Android share configuration script is missing');
const nativeShareStep = workflow.indexOf('npm run configure:android:share');
const syncStep = workflow.indexOf('npx cap sync android');
const apkStep = workflow.indexOf('./gradlew assembleDebug');
if (syncStep < 0 || nativeShareStep < syncStep || apkStep < nativeShareStep) throw new Error('Native share receiver must be configured after Capacitor sync and before APK build');