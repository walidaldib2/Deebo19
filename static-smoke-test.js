const fs = require('fs');
const path = require('path');
const root = __dirname;
const required = ['index.html','app.js','db.js','style.css','sw.js','manifest.json','icon.svg','qrcode.js','capacitor.config.json','package.json','biometric.bundle.js','prepare-android.js','configure-android-share.js','prepare-android-icons.js'];
const missing = required.filter(f => !fs.existsSync(path.join(root,f)));
if (missing.length) throw new Error('Missing required files: '+missing.join(', '));
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const f of ['qrcode.js','db.js','biometric.bundle.js','app.js']) if (!html.includes(`src="${f}"`)) throw new Error('index.html does not load '+f);
const sw = fs.readFileSync(path.join(root,'sw.js'),'utf8');
for (const f of ['index.html','style.css','app.js','db.js','qrcode.js','manifest.json','icon.svg']) if (!sw.includes(`./${f}`)) throw new Error('Service worker core cache missing '+f);
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const cap = JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));
if (!pkg.dependencies?.['@capacitor/android'] || !pkg.dependencies?.['@capacitor/core']) throw new Error('Capacitor dependencies missing');
if (!pkg.dependencies['@capacitor/android'].startsWith('^8.') || !pkg.dependencies['@capacitor/core'].startsWith('^8.') || !pkg.devDependencies?.['@capacitor/cli']?.startsWith('^8.')) throw new Error('Google Play API 36 build requires Capacitor 8');
if (!pkg.dependencies?.['@aparajita/capacitor-biometric-auth']?.startsWith('^10.')) throw new Error('Capacitor 8 biometric plugin compatibility is required');
if (!pkg.devDependencies?.sharp || !pkg.scripts?.['prepare:android:icons']) throw new Error('DEEB launcher icon generation dependency/script is missing');
const androidSetup = fs.readFileSync(path.join(root,'configure-android-share.js'),'utf8');
const printHandlerStart=androidSetup.indexOf('@PluginMethod public void printHtml');
const printHandlerEnd=androidSetup.indexOf('\n  }\n}',printHandlerStart);
const printHandler=printHandlerStart>=0&&printHandlerEnd>printHandlerStart?androidSetup.slice(printHandlerStart,printHandlerEnd):'';
if (!printHandler.includes('setJavaScriptEnabled(true)') || !printHandler.includes('createPrintDocumentAdapter(jobName)')) throw new Error('Android print WebView must execute the conditional page-number hook and use the native print adapter');
const imageExportStart=androidSetup.indexOf('@PluginMethod public void saveHtmlAsImages');
const imageExportEnd=androidSetup.indexOf('@PluginMethod public void printHtml',imageExportStart);
const imageExport=imageExportStart>=0&&imageExportEnd>imageExportStart?androidSetup.slice(imageExportStart,imageExportEnd):'';
for (const required of ['collectPrintRules','data-deeb-print-rules','document.fonts.ready','window.__deebFontsReady','handler.postDelayed(measureTask[0],100)','pageCssHeight','height=pageCssHeight*2','v.setLayoutParams(new FrameLayout.LayoutParams(webWidth,webPageHeight))','v.measure(View.MeasureSpec.makeMeasureSpec(webWidth,View.MeasureSpec.EXACTLY)','canvas.scale(2f/density,2f/density)','v.scrollTo(0,(int)Math.round(top*density))','v.draw(canvas)','صفحة التقرير رقم','bitmap.compress(Bitmap.CompressFormat.PNG,100,imageOut)','Environment.DIRECTORY_PICTURES+"/DEEB"']) if (!imageExport.includes(required)) throw new Error('Image export must apply print CSS and render each A4-sized page independently: '+required);
if (imageExport.includes('createPrintDocumentAdapter(baseName)') || imageExport.includes('LayoutResultCallback') || imageExport.includes('WriteResultCallback') || imageExport.includes('new android.graphics.pdf.PdfDocument()') || imageExport.includes('PdfRenderer')) throw new Error('Image export must not instantiate inaccessible print callbacks or depend on a PDF round trip');
if (imageExport.includes("querySelectorAll(selectors)") || imageExport.includes('new JSONArray(json)') || imageExport.includes('canvas.translate(0,-top)')) throw new Error('Image export must not use arbitrary DOM slicing or translate a full-height WebView canvas');
for (const required of ["document.querySelectorAll('.written-page,.bike-sheet-section,.branch-sheet-section')","getBoundingClientRect()","window.pageYOffset","JSON.stringify({contentHeight:contentHeight,pages:pages})","new JSONTokener(raw).nextValue()","measurement.getJSONArray(\"pages\")","pageTops.add(segmentTop+offset)","final int top=pageTops.get(currentPage)","v.setLayoutParams(new FrameLayout.LayoutParams(webWidth,webPageHeight))","v.scrollTo(0,(int)Math.round(top*density))","v.draw(canvas)","pages.push({top:0,height:contentHeight})"]) if (!imageExport.includes(required)) throw new Error('Image export must align A4 images to explicit report page sections and preserve a safe full-document fallback: '+required);
if (!imageExport.includes("v.postDelayed(()->{") || !imageExport.includes("v.invalidate();") || !imageExport.includes("handler.post(capturePage[0])") || !imageExport.includes("final int[] pageIndex={0}") || !imageExport.includes("final int[] saved={0}")) throw new Error("Image export must wait for each WebView page to paint before capturing it asynchronously");
if (!androidSetup.includes('["android:allowBackup", "false"]') || !androidSetup.includes('["android:usesCleartextTraffic", "false"]')) throw new Error('Android backup/network hardening is missing');
const iconBuilder = fs.readFileSync(path.join(root,'prepare-android-icons.js'),'utf8');
if (!iconBuilder.includes('ic_launcher_foreground.png') || !iconBuilder.includes('icon-512.png')) throw new Error('DEEB Play Store and adaptive launcher icon generation is missing');
if (cap.appName !== 'DEEB') throw new Error('Android display name must be DEEB');
if (pkg.name !== 'deeb-field-operations') throw new Error('Project package name must be deebo-field-operations');
if (cap.webDir !== 'www') throw new Error('Capacitor webDir must be the staged www directory');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
if (!app.includes('const rowHeight=(row,ri)=>') || !app.includes('Math.min(409.5') || !app.includes('rowHeight(row,ri)')) throw new Error('Excel rows must expand to fit wrapped multi-line report content instead of clipping at a fixed height');
if (!app.includes('$(\"#enableBiometric\").onclick=async()=>') || !app.includes('$(\"#disableBiometric\").onclick=()=>')) throw new Error('Biometric settings handlers are missing');
if (!app.includes('localStorage.removeItem(BIOMETRIC_KEY)') || !app.includes('سيفتح التطبيق مباشرة دون PIN أو بصمة')) throw new Error('Direct unlock / biometric reset flow is missing');
if (!app.includes('يمكنك الدخول باستخدام PIN')) throw new Error('Biometric PIN fallback message is missing');
if (!app.includes('function lockApplication()') || !app.includes('document.visibilityState==="hidden"') || !app.includes('window.addEventListener("pagehide",lockApplication)')) throw new Error('Automatic PIN lock hooks are missing');
if (!sw.includes('deebo-local-v10-17')) throw new Error('Service worker cache version was not bumped');
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
  ['$("#excelReport").onclick=async()=>', 'Excel-report button is not wired'],
  ['$("#csvReport").onclick=()=>', 'CSV-report button is not wired'],
  ['$("#saveReportImage").onclick=async()=>', 'Save-report-image button is not wired']
];
for (const [needle,message] of buttonBindingChecks) if (!app.includes(needle)) throw new Error(message);
if (/\bwolf\b|ذئب/i.test(app)) throw new Error('Printed DEEB reports must not contain a wolf icon or wolf branding');
if (app.split('DEEB</div>').length - 1 < 2) throw new Error('Both printed report templates must retain DEEB branding');


for (const required of ["node.style.setProperty('margin-top','0','important')","node.style.setProperty('min-height',pageCssHeight+'px','important')","pageSpan=Math.max(1,Math.ceil(height/pageCssHeight))","node.style.setProperty('margin-bottom',Math.max(0,pageSpan*pageCssHeight-height)+'px','important')"]) if (!imageExport.includes(required)) throw new Error('Image export must align each report section to complete A4 image boundaries: '+required);
if (!app.includes('const pageSize=8,reportPages=') || !app.includes('branch-sheet-section') || !app.includes('groups.slice(i*pageSize,(i+1)*pageSize)') || !app.includes('const pageFooter=""') || !app.includes("pageNumbering(269)")) throw new Error('Branch follow-up reports must split into complete sheets, repeat headers, label continuation pages, and number only multi-page reports');
if (!app.includes('const branchGroupsFor=d=>') || !app.includes('supervisor:[["employees","name"],["managers","name"],["patrol_people","name"]]')) throw new Error('Branch report supervisor grouping / saved suggestions are missing');
if (!app.includes('Math.max(0,Math.ceil(r.times.length/5)-1)')) throw new Error('Motorcycle screen preview and spreadsheet export must preserve all recorded visits');
if (!app.includes('Math.max(0,Math.ceil(r.times.length/5)-1)')) throw new Error('Motorcycle screen preview and spreadsheet export must preserve all recorded visits');
if (!app.includes("const timeMinutes=value=>") || !app.includes("const compareVisitTime=(a,b)=>") || !app.includes("dayOf(a).localeCompare(dayOf(b))||compareVisitTime(a,b)") || !app.includes("g.visits.map(v=>") || !app.includes("const maxRowsPerPage=9,pageCount=Math.max(1,Math.ceil(entries.length/maxRowsPerPage)),pageSize=Math.ceil(entries.length/pageCount)") || !app.includes('const pageTitle=continuation?"باقي "+sectionTitle:sectionTitle;') || !app.includes("<th>الاسم</th><th>توقيت المرور</th><th>الإحداثيات</th><th>ملاحظات</th>") || app.includes("<th>اليوم والتاريخ</th>") || app.includes('class="bike-date"') || !app.includes('class="bike-coordinates"') || !app.includes('class="bike-notes"') || !app.includes(".bike-table thead{display:table-header-group}") || !app.includes(".bike-sheet-section:last-child{break-after:auto!important;page-break-after:auto!important}") || !app.includes("pageIndex===pages.length-1") || !app.includes('notes:String(p.notes||"").trim()')) throw new Error("Motorcycle report must show date only in the page header, keep the four approved table columns, paginate visits, repeat headers, and place approval on the final page");
if (!app.includes('filter(([k])=>k!=="bikes")')) throw new Error('Bike patrol reports must remain selectable while generic bikes categories stay hidden');
if (!app.includes('locationUrl=String(p.location_url??"").trim()') || !app.includes('lat?"خط العرض: "+lat:""') || !app.includes('lng?"خط الطول: "+lng:""') || !app.includes('replace(/\\n/g,"<br>")')) throw new Error('Bike report must print the exact latitude, longitude and location URL entered in the app without converting or replacing them');
if (!app.includes('const displayRows=visible.flatMap') || !app.includes('continuation:i>0,visits:g.visits.slice(i*5,(i+1)*5)') || !app.includes('g.branch+(g.continuation?" — استكمال":"")')) throw new Error('Branch patrol continuation rows beyond five visits are missing from the screen or reports');
if (!app.includes('تقرير متابعة الفروع') || !app.includes('data:') && !app.includes('branchGroupsFor(d)')) throw new Error('Branch report matrix is missing');
const branchPrintStart=app.indexOf('const groups=branchGroupsFor(d),slots=5,title=',app.indexOf('const printHtml='));
const branchPrintEnd=app.indexOf('if($("#reportType").value==="bike_patrols")',branchPrintStart);
const branchPrint=branchPrintStart>=0&&branchPrintEnd>branchPrintStart?app.slice(branchPrintStart,branchPrintEnd):"";
if (!branchPrint.includes('<th>الفرع</th><th>المشرف</th>') || !branchPrint.includes("<th>متابعة ") || branchPrint.includes('<th>اليوم والتاريخ</th>')) throw new Error('Branch reports must show branch, supervisor and five follow-ups without a duplicate date column');
if (!app.includes('["الفرع","المشرف"') || !app.includes('g.supervisor,...Array.from({length:slots}')) throw new Error('Branch Excel/CSV export must match the seven-column branch follow-up layout without a duplicate date column');
if (!app.includes('.branch-table-wrap,.branch-table,.branch-table tbody,main.sheet{break-inside:auto!important;page-break-inside:auto!important;overflow:visible!important}') || !app.includes('.branch-table tr{break-inside:avoid!important;page-break-inside:avoid!important}')) throw new Error('Branch report tables must paginate between rows and repeat their header instead of forcing the whole table onto one page');
if (!db.includes('const patrolDate=String(row.payload?.patrol_date||"").trim()')) throw new Error('Motorcycle backup restore must validate patrol_date rather than patrol_time');
if (!db.includes(String.raw`const day=/^\d{4}-\d{2}-\d{2}$/.test(patrolDate)?patrolDate:stamp.slice(0,10);`)) throw new Error('Motorcycle backup restore must correctly recognize YYYY-MM-DD patrol dates');


if (!app.includes('$("#recordForm")?.elements.namedItem("supervisor")?.focus()')) throw new Error("Quick branch patrol entry must open the form and focus the required supervisor field");
if (!app.includes("bindGlobalSearchSuggestions()") || !app.includes('input.setAttribute("list","globalSearchSuggestions")')) throw new Error("Global search autocomplete suggestions are missing");

console.log('PASS: required files, navigation hierarchy, reports archive/restore, script references, refreshed service-worker cache, package.json, Capacitor config, automatic-lock wiring, and chronological five-column motorcycle print reports with weekday/date, notes, and continuation pages, with existing screen preview and spreadsheet export preserved.');

if (!app.includes('id="pdfReport"') || !app.includes('$("#pdfReport").onclick=()=>') || !app.includes('اختر حفظ كملف PDF')) throw new Error('PDF export action is missing');

if (!app.includes('const createXlsx=rows=>') || !app.includes('[Content_Types].xml') || !app.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || !app.includes('DEEB-report.xlsx')) throw new Error('Excel export must create a valid XLSX workbook for Android Microsoft Excel');
if (!app.includes('<sheetFormatPr defaultRowHeight="22"/><cols>\'+columnWidths+\'</cols><sheetData>')) throw new Error('XLSX worksheet XML elements must follow the Excel schema order');
if (!app.includes('"مرور","الإحداثيات / رابط الموقع","ملاحظات"]') || app.includes('"مرور 1"') || app.includes('"مرور 2"') || app.includes('"مرور 3"') || !app.includes('g.visits.forEach(v=>') || !app.includes('dayOf(v)') || !app.includes('xl/styles.xml') || !app.includes('rightToLeft="1"') || !app.includes('<autoFilter ref=')) throw new Error('Bike Excel export must keep one مرور column, preserve each visit date, coordinates and notes, and use a styled RTL workbook with filters');
if (!app.includes('const sectionTitle="تقرير مرور دراجة "+(originalIndex+1)') || !app.includes('const pageTitle=continuation?"باقي "+sectionTitle:sectionTitle') || !app.includes('<h1>\'+pageTitle+\'</h1>') || !app.includes('groups=allGroups.filter(g=>selectedBikeReport==="all"||g.bike===selectedBikeReport)') || !app.includes('id="bikeReportSelect"') || !app.includes('id="bikeQuickReports"')) throw new Error('Each motorcycle report must have its own dynamic selector and print only the selected bike');
if (!app.includes('dateObj=/^\\d{4}-\\d{2}-\\d{2}$/.test(date)') || !app.includes('weekday:"long"')) throw new Error('Bike patrol report must recognize ISO dates and print the weekday name');
if (!app.includes('key=normalize(number);') || !app.includes('registry=data.filter(x=>x.entity_type===\"bikes\"&&!x.is_archived)') || !app.includes('bikeGroupsFor(data)') || !app.includes('data-bike-number=') || !app.includes('id="bikeQuickReports"') || app.includes('data-bike-index=') || app.includes('data-report-type="bike_patrols"') || !app.includes('showDate=type!=="bike_patrols"')) throw new Error('Motorcycle reports must have dynamically generated individual report actions for every registered bike, with no duplicate date column');
if (app.includes('["patrol_date","تاريخ الوصول","date",1]')) throw new Error('Motorcycle form must not show a duplicate date input');
if (!app.includes('payload.patrol_date=oldDate||')) throw new Error('Motorcycle patrol date must still be stored automatically');
const bikeDateCheckStart=app.indexOf("const pageTitle=continuation?"); const bikeDateCheckEnd=app.indexOf("const rows=rowsFor(d)",bikeDateCheckStart); const bikeDateCheckSource=app.slice(bikeDateCheckStart,bikeDateCheckEnd); if (app.includes('<span>تاريخ المرور</span><b>\"+esc(g.date)+\"</b>') || (bikeDateCheckSource.match(/تاريخ الإصدار/g)||[]).length!==1) throw new Error("Bike report must show its date once globally, not once above each bike");
if (app.includes('saveFile("DEEB-report.xls"') || app.includes('application/vnd.ms-excel;charset=utf-8')) throw new Error('Legacy XML Spreadsheet export must not be mislabeled as XLS');

if (!app.includes('patrol_sites:[') || !app.includes('المخازن والمعارض ومراكز الخدمة')) throw new Error('Fixed patrol locations registry is missing');
if (!app.includes('function mapPage()') || !html.includes('data-page="map"') || !app.includes('فتح خط السير على خرائط Google')) throw new Error('Motorcycle route map page is missing');
if (!app.includes('function patrolTimeMinutes(value)') || !app.includes('comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time)')) throw new Error('Map and branch patrol lists must sort 24-hour, Arabic AM/PM, and Arabic-digit times chronologically');
const timeParserSource=app.match(/function patrolTimeMinutes\(value\)\{[\s\S]*?\n\}/)?.[0];
if(!timeParserSource)throw new Error("Patrol time parser could not be extracted for behavior tests");
const parsePatrolTime=new Function(timeParserSource+";return patrolTimeMinutes;")();
for(const [input,expected] of [["01:00 PM",780],["12:00 AM",0],["١:٠٥ م",785],["۲۳:۴۵",1425],["00:15",15]])if(parsePatrolTime(input)!==expected)throw new Error("Patrol time parser returned an incorrect chronological value for "+input);
if(parsePatrolTime("25:99")!==null||parsePatrolTime("not a time")!==null)throw new Error("Patrol time parser must reject invalid values");
if(!app.includes('sort((a,b)=>comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time))')||!app.includes('g.visits.sort((a,b)=>comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time))'))throw new Error("Map and branch report must both use the validated chronological parser");
if (!app.includes('extractSharedCoordinates(raw+" "+locationUrl)') || !app.includes('form.elements.namedItem("lat").value=coords.lat.toFixed(6)') || !app.includes('form.elements.namedItem("lng").value=coords.lng.toFixed(6)')) throw new Error('Shared motorcycle location coordinates are not persisted into patrol records');
if (!db.includes('try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}') || !db.includes('updated:!!sameDay')) throw new Error('Daily automatic backup must refresh after record changes');

if (!app.includes('id="monthlyReport"') || !app.includes('تقرير شهري')) throw new Error('Monthly report preset is missing');
if (!app.includes('hasBikeReport=$("#reportType").value==="bike_patrols"&&cache.some(x=>x.entity_type==="bikes"&&!x.is_archived)')) throw new Error("Registered bikes with no visits must still be printable as empty reports");
if (!app.includes('صور ومستندات البلاغ') || !app.includes('["documents","incidents"].includes(type)')) throw new Error('Incident attachment upload flow is missing');
const dbSource = fs.readFileSync(path.join(root,'db.js'),'utf8');
if (!dbSource.includes('const DB_VERSION = 3') || !dbSource.includes('createAutoBackup') || !dbSource.includes('automatic_backups')) throw new Error('Daily local automatic backup store is missing');

if (!app.includes('patrol_date') || !app.includes('location_url') || !app.includes('extractSharedCoordinates')) throw new Error('WhatsApp fixed-location patrol flow is incomplete');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
if (manifest.name !== 'DEEB' || manifest.short_name !== 'DEEB') throw new Error('PWA display name must be DEEB');
if (!html.includes('<title>DEEB |') || !html.includes('class="wordmark">DEEB</div>') || html.includes('wolf-mark') || html.includes('شعار الذئب')) throw new Error('Visible DEEB wordmark-only branding is missing or a wolf icon remains');
if (!manifest.share_target || manifest.share_target.action !== './?share=location') throw new Error('PWA WhatsApp share target is missing');
if (!fs.existsSync(path.join(root,"native-plugins.bundle.js")) || !html.includes('<script src="native-plugins.bundle.js"></script>')) throw new Error("Browser fallback for optional native plugins is missing");
const swSource = fs.readFileSync(path.join(root,"sw.js"),"utf8");
const prepareSource = fs.readFileSync(path.join(root,"prepare-android.js"),"utf8");
if (!swSource.includes('"./native-plugins.bundle.js"') || !prepareSource.includes('"native-plugins.bundle.js"')) throw new Error("Native plugin fallback must be cached offline and copied into Android assets");
if (!app.includes('consumeSharedLocation()')) throw new Error('Shared location intake handler is missing');
if (!app.includes("function bindPatrolLocationInput") || !app.includes("bindPatrolLocationInput(type)")) throw new Error("Manual WhatsApp location-link parsing is missing");

const nativeBridge = fs.readFileSync(path.join(root,'native-plugins-entry.js'),'utf8');
if (!nativeBridge.includes("registerPlugin('FileExport')") || !nativeBridge.includes('isNativePlatform') || !nativeBridge.includes('window.DEEBNativePlugins')) throw new Error('Native Capacitor plugin JavaScript bridge is missing');
const workflow = fs.readFileSync(path.join(root,'.github/workflows/android-apk.yml'),'utf8');
const prepareAt = workflow.indexOf('npm run prepare:android');
const biometricAt = workflow.indexOf('npm run build:biometric');
if (prepareAt < 0 || biometricAt < 0 || prepareAt > biometricAt) throw new Error('Android build must prepare www before generating the native biometric bundle; otherwise the bundle is deleted.');
if (!workflow.includes('npm run build:native-plugins') || !workflow.includes('test -s www/native-plugins.bundle.js')) throw new Error('Android build must bundle and verify the native plugin bridge');
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
if (!nativeShare.includes('Build.VERSION.SDK_INT >= 29') || !nativeShare.includes('legacyStoragePermissionCallback') || !nativeShare.includes('WRITE_EXTERNAL_STORAGE') || !nativeShare.includes('MediaStore.Files.getContentUri')) {
  // Older Android devices use the public Downloads directory with the API-appropriate runtime permission.
  if (!nativeShare.includes('Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)') || !nativeShare.includes('requestPermissionForAlias("legacyStorage"')) throw new Error('File export must support Android 9 and earlier without referencing MediaStore.Downloads on those releases');
}
if (!nativeShare.includes('saveFileInternal') || !nativeShare.includes('delete(insertedUri,null,null)')) throw new Error('File export must clean up partial MediaStore files after write failures');
if (!nativeShare.includes('saveHtmlAsImages') || !nativeShare.includes('registerPlugin(FileExportPlugin.class)') || !nativeShare.includes('MediaStore.Images.Media.RELATIVE_PATH') || !nativeShare.includes('DIRECTORY_PICTURES+"/DEEB"')) throw new Error('Native report image export is missing');
if (!nativeShare.includes('view.loadDataWithBaseURL("https://localhost/",imageHtml,"text/html","UTF-8",null)') || !nativeShare.includes('pageCssHeight') || !nativeShare.includes('canvas.scale(2f/density,2f/density)') || !nativeShare.includes('v.scrollTo(0,(int)Math.round(top*density))') || !nativeShare.includes('v.draw(canvas)') || !nativeShare.includes('pageCount>1') || !nativeShare.includes('pageNumberView.setText("صفحة "+(currentPage+1)+" من "+pageCount)') || !nativeShare.includes('.report-page-number,.branch-page-number{display:none!important}') || !nativeShare.includes('setUseWideViewPort(true)') || !nativeShare.includes('width=794,initial-scale=1') || !nativeShare.includes('nonWhite==0') || !nativeShare.includes('bitmap.compress(Bitmap.CompressFormat.PNG,100,imageOut)') || nativeShare.includes('LayoutResultCallback') || nativeShare.includes('WriteResultCallback') || nativeShare.includes('PdfRenderer')) throw new Error('Native report image export must render separate A4 page bitmaps, reject blank pages, and avoid inaccessible print callbacks');
const blankCheckAt=nativeShare.indexOf('if(nonWhite==0)'); const nativeFooterAt=nativeShare.indexOf('if(pageCount>1)',blankCheckAt); if(blankCheckAt<0||nativeFooterAt<0||blankCheckAt>nativeFooterAt||!nativeShare.includes('canvas.drawLine(0,pageCssHeight-30,794,pageCssHeight-30,footerLine)')) throw new Error('PNG export must reject blank report content before drawing page numbers and align the footer line to the A4 CSS page');
if (!nativeShare.includes('@PluginMethod public void printHtml(PluginCall call)') || !nativeShare.includes('root.addView(view,new FrameLayout.LayoutParams') || !nativeShare.includes('v.measure(View.MeasureSpec.makeMeasureSpec') || !nativeShare.includes('PrintJob job=pm.print(jobName,v.createPrintDocumentAdapter(jobName),attributes)') || !nativeShare.includes('PrintAttributes.MediaSize.ISO_A4.asPortrait()') || !nativeShare.includes('view.setAlpha(1f);') || nativeShare.includes('view.setAlpha(0f);') || !nativeShare.includes('import android.os.Handler;') || !app.includes('native.printHtml({html})')) throw new Error('Native A4 portrait print pipeline must attach and lay out the WebView before invoking Android PrintManager');
if (!db.includes('async function downloadBlob') || !db.includes('native.saveFile({name,mimeType:blob.type||"application/octet-stream",base64:btoa(binary)})')) throw new Error('Android native file export is not wired for backups and attachments');
if (!app.includes("for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)))") || app.includes("for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i])")) throw new Error("Native CSV export must encode large files in bounded chunks");
if (!app.includes('deboo-share-intent') || !app.includes('consumeNativeShare()') || !app.includes('getInitialShare')) throw new Error('App does not consume native Android shared text/location payloads');
if (!app.includes('function currentCoordinates()') || !app.includes('window.DEEBNativePlugins?.CurrentLocation') || !app.includes('"bike_patrols"].includes(type)')) throw new Error('Current-location button is not wired for native Android and motorcycle patrol forms');


if (!pkg.scripts?.['configure:android:share']) throw new Error('Native Android share configuration script is missing');
const nativeShareStep = workflow.indexOf('npm run configure:android:share');
const syncStep = workflow.indexOf('npx cap sync android');
const apkStep = workflow.indexOf('./gradlew assembleDebug');
if (syncStep < 0 || nativeShareStep < syncStep || apkStep < nativeShareStep) throw new Error('Native share receiver must be configured after Capacitor sync and before APK build');
const bikeReportStart=app.indexOf('const bikeGroupsFor=d=>');
const bikeReportEnd=app.indexOf('const branchGroupsFor=d=>',bikeReportStart);
const bikeReportSource=app.slice(bikeReportStart,bikeReportEnd);
if (bikeReportSource.includes('people:new Set()') || bikeReportSource.includes('group.people.add(') || bikeReportSource.includes('[...g.people]')) throw new Error('Bike report must not combine every patrol visitor into the assigned rider name');
if (!bikeReportSource.includes('person:String(bp.person||\"\").trim()||\"—\"')) throw new Error('Bike report must show only the single assigned person on the registered bike record');
if (!bikeReportSource.includes("replace(/[٠-٩]/g") || !bikeReportSource.includes("replace(/[۰-۹]/g") || !bikeReportSource.includes('suffix==="م"||suffix==="pm"') || !bikeReportSource.includes("compareVisitTime(a,b)")) throw new Error("Bike report must sort visits by real clock time, including Arabic digits and AM/PM formats");
const bikeSectionStart=app.indexOf('const bikeGroupsFor=d=>');
const bikeSectionEnd=app.indexOf('const branchGroupsFor=d=>',bikeSectionStart);
const bikeSection=app.slice(bikeSectionStart,bikeSectionEnd);
if (!bikeSection.includes('registry=data.filter(x=>x.entity_type==="bikes"&&!x.is_archived)') || bikeSection.includes('while(result.length<3)')) throw new Error('Bike report count must be based only on registered bikes, without a hardcoded third bike');
if (!app.includes('filter(([k])=>k!=="bikes")') || !app.includes('host.onclick=e=>{const btn=e.target.closest("[data-bike-number]")')) throw new Error('Bike report type option and delegated individual report selection are missing');

if (!app.includes('f[0]==="lat"?\'step="any" min="-90" max="90" inputmode="decimal"\'') || !app.includes('f[0]==="lng"?\'step="any" min="-180" max="180" inputmode="decimal"\'')) throw new Error("Latitude and longitude inputs must accept decimal GPS coordinates within valid ranges");
if (!app.includes('const validCoordinatePair=(lat,lng)=>') || !app.includes('validCoordinatePair(x.payload?.lat,x.payload?.lng)') || !app.includes('validCoordinatePair(r.payload?.lat,r.payload?.lng)') || !app.includes('points.filter(x=>validCoordinatePair(x.p.lat,x.p.lng))')) throw new Error("Empty coordinate fields must not create false map pins or match a site at 0,0");
if (!app.includes('rows="14" style="width:100%;min-height:280px;line-height:1.9"') || !app.includes('placeholder="اكتب ملخص الشفت، ما تم إنجازه، الملاحظات، المعوقات، والإجراءات المطلوبة..."')) throw new Error("Written report editor must provide a large guided narrative field");
if (!app.includes('written_reports:[["report_title","عنوان التقرير","text",1]') || !app.includes('["report_date","تاريخ التقرير","date",1]') || !app.includes('["shift","الشفت","select","صباحي|مسائي|ليلي",1]') || !app.includes('["report_text","نص التقرير","textarea",1]')) throw new Error('Independent written end-of-shift report fields are missing');
if (!app.includes('written_reports:"التقرير اليومي"') || !app.includes('"written_reports"]') || !app.includes('id="createWrittenReport"') || !app.includes('data-report-type="written_reports"')) throw new Error('Written report navigation and report-center shortcuts are missing');
if (!app.includes('if(type==="written_reports"){const list=rows(type)') || !app.includes('data-edit="') || !app.includes('data-archive="')) throw new Error('Written report list must show saved reports with edit and archive actions');
if (branchPrint.includes('class="branch-page-number"') || !branchPrint.includes("pageNumbering(269)")) throw new Error("Branch PDF pagination must use one report-wide footer counter, including overflow pages");
if (!app.includes('const pageNumber=""') || !app.includes("pageNumbering(281)")) throw new Error("Bike PDF pagination must use the report-wide footer counter without duplicate per-bike numbering");
const bikePrintStart=app.indexOf('if($("#reportType").value==="bike_patrols"){ '.trim(),app.indexOf("const printHtml="));
const bikePrintEnd=app.indexOf('\n  }\n  const rows=rowsFor(d)',bikePrintStart);
const bikePrint=app.slice(bikePrintStart,bikePrintEnd);
if (!bikePrint.includes('class="bike-meta"><div class="bike-meta-date"><span>التاريخ</span>') || !bikePrint.includes('class="bike-meta-total"') || !bikePrint.includes('.bike-meta-total,.bike-meta-date{grid-column:span 1}') || bikePrint.includes('class="bike-date"') || bikePrint.includes('<th>التاريخ</th>')) throw new Error('Bike report must place the date in the first metadata cell, above the table and never as a table column');
if (!bikePrint.includes('const pageNumber=""') || !bikePrint.includes('يتبع في الصفحة التالية') || !bikePrint.includes("pageNumbering(281)")) throw new Error("Motorcycle reports must use the single report-wide PDF page counter and retain the continuation note and final approval");
if (!bikePrint.includes("'+pageNumber+'<span>اعتماد المسؤول: __________________</span></div>") || !app.includes('.report-page-note{display:flex;justify-content:space-between')) throw new Error('Motorcycle page numbers must sit in the page footer without moving final approval or continuation text');
if (bikePrint.includes('تاريخ إصدار التقرير:') && bikePrint.indexOf('تاريخ إصدار التقرير:') < bikePrint.indexOf('const sections=')) throw new Error('Bike report must not create an orphan date-only page before the report sections');
if (!bikePrint.includes('height:auto!important;max-height:none!important') || bikePrint.includes('height:280mm!important')) throw new Error('Bike report print pages must not stretch table rows to fill a fixed-height sheet');
if (!bikePrint.includes('font-size:12px;line-height:1.45;direction:rtl!important') || !bikePrint.includes('font-size:13px;font-weight:900;padding:8px 4px;line-height:1.45') || !bikePrint.includes('font-size:12px;padding:7px 4px;line-height:1.45') || !bikePrint.includes('font-size:11.5px;line-height:1.45;overflow-wrap:anywhere') || !bikePrint.includes('nth-child(4),.bike-table td:nth-child(4){width:26%!important}') || !bikePrint.includes('.bike-table thead{display:table-header-group}') || !bikePrint.includes('.bike-table tr{break-inside:avoid;page-break-inside:avoid}')) throw new Error('Motorcycle report print must keep readable text, four defined table columns, repeated headers, and unbroken rows');
const genericPrintStart=app.indexOf('const reportTitle=$("#reportType").selectedOptions[0].textContent;',app.indexOf('const printHtml='));
const genericPrintEnd=app.indexOf(' $("#saveReportImage").onclick=',genericPrintStart);
const genericPrint=genericPrintStart>=0&&genericPrintEnd>genericPrintStart?app.slice(genericPrintStart,genericPrintEnd):"";
if (!genericPrint.includes('<div class="overview-item"><span>الفترة</span>') || !genericPrint.includes('<span>تاريخ ووقت الإصدار</span>') || !genericPrint.includes('<th>م</th><th>القسم</th><th>الوقت</th><th>تفاصيل السجل</th>') || genericPrint.includes('<th>التاريخ</th>') || !genericPrint.includes('esc(x.time||"—")')) throw new Error('All printed reports must show date/period in the page header and never add a date column to report tables');
if (!bikePrint.includes('class="brand-left"') || !bikePrint.includes('class="official-tag">تقارير رسمي</div>') || !bikePrint.includes('font-size:34px;line-height:1.15')) throw new Error('Motorcycle report masthead must match the approved DEEB reference: logo and official label on the left, operating system on the right');
if (!bikePrint.includes('class="bike-report-heading"') || !bikePrint.includes('class="bike-report-kicker">تقرير رسمي • متابعة ميدانية</span>') || !bikePrint.includes('.bike-report-heading h1{width:100%') || !bikePrint.includes('.bike-report-heading{position:relative;display:flex')) throw new Error('Motorcycle report title must use a distinct formal DEEB header panel, not a standalone pill title');
if (!bikePrint.includes('background:#073b28;color:#fff') || !bikePrint.includes('border:1px solid #c99a32') || !bikePrint.includes('background:#fbf4e6')) throw new Error('Bike report PDF and image exports must preserve DEEB green, gold, and beige visual identity');
if (!app.includes('if($("#reportType").value==="written_reports")') || !app.includes('class="report-body"') || !app.includes('class="written-page"') || !app.includes('esc(p.report_text||"")')) throw new Error('Written reports must print each saved narrative as a standalone report');
const writtenPrintStart=app.indexOf('if($("#reportType").value==="written_reports"){',app.indexOf('const printHtml='));
const writtenPrintEnd=app.indexOf('if($("#reportType").value==="branch_patrols")',writtenPrintStart);
const writtenPrint=app.slice(writtenPrintStart,writtenPrintEnd);
if (!writtenPrint.includes('background:#073b28') || !writtenPrint.includes('background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)') || !writtenPrint.includes('border:1.5px solid #c99a32')) throw new Error('Written report print must use DEEB green, burgundy, and gold identity');
if (writtenPrint.includes('min-height:275mm') || writtenPrint.includes('min-height:135mm')) throw new Error('Written report must not force oversized blank page areas');
if (!writtenPrint.includes('orphans:2;widows:2') || !writtenPrint.includes('break-inside:avoid;page-break-inside:avoid')) throw new Error('Written report pagination safeguards are missing');
if (writtenPrint.includes('height:277mm') || writtenPrint.includes('overflow:hidden') || writtenPrint.includes('function fitWrittenPages()') || writtenPrint.includes('inner.style.transform="scale("+scale+")"')) throw new Error('Written reports must continue onto additional pages without shrinking or clipping content');
if (writtenPrint.includes('counter(page)') || (writtenPrint.match(/@bottom-center/g)||[]).length) throw new Error('Single-page written report must not have an unconditional page number; numbering is enabled only by the multi-page print hook');
if (!app.includes('const pageNumbering=heightMm=>') || !app.includes('media="print" disabled') || !app.includes('window.addEventListener("beforeprint",update)') || !app.includes('style.disabled=h<=limit+12') || !app.includes('pageNumbering(269)') || !app.includes('pageNumbering(281)') || !app.includes('content:"صفحة " counter(page)')) throw new Error('Printed reports must enable numbered footers only when content exceeds one page');
if (!app.includes('height:auto;max-width:none;margin:0;padding:0;overflow:visible;break-after:page')) throw new Error('Written report pages must grow naturally and preserve the original font size');
