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
const activityTemplateStart=androidSetup.indexOf('const activity = `');
const activityTemplateEnd=androidSetup.indexOf('`;\nfs.writeFileSync(path.join(javaDir, "MainActivity.java")',activityTemplateStart);
const activityTemplate=activityTemplateStart>=0&&activityTemplateEnd>activityTemplateStart?androidSetup.slice(activityTemplateStart,activityTemplateEnd):'';
const earlyDrawInit=activityTemplate.indexOf('WebView.enableSlowWholeDocumentDraw()');
const bridgeInit=activityTemplate.indexOf('super.onCreate(savedInstanceState)');
if (!activityTemplate.includes('import android.webkit.WebView;') || earlyDrawInit<0 || bridgeInit<0 || earlyDrawInit>bridgeInit) throw new Error('Whole-document WebView drawing must be enabled before BridgeActivity creates the primary WebView');
const printHandlerStart=androidSetup.indexOf('@PluginMethod public void printHtml');
const printHandlerEnd=androidSetup.indexOf('\n  }\n}',printHandlerStart);
const printHandler=printHandlerStart>=0&&printHandlerEnd>printHandlerStart?androidSetup.slice(printHandlerStart,printHandlerEnd):'';
if (!printHandler.includes('setJavaScriptEnabled(true)') || !printHandler.includes('createPrintDocumentAdapter(jobName)')) throw new Error('Android print WebView must use the native print adapter');
if (!printHandler.includes('int height=webPageHeight;') || !printHandler.includes('int width=webWidth;') || printHandler.includes('contentCssHeight=Math.max(cssPageHeight,v.getContentHeight())')) throw new Error('Native report printing must keep a fixed A4 WebView viewport and let Android paginate the complete document');
const imageExportStart=androidSetup.indexOf('@PluginMethod public void saveHtmlAsImages');
const imageExportEnd=androidSetup.indexOf('@PluginMethod public void printHtml',imageExportStart);
const imageExport=imageExportStart>=0&&imageExportEnd>imageExportStart?androidSetup.slice(imageExportStart,imageExportEnd):'';
for (const required of ['writeWebViewToPdf(v)','WebView.enableSlowWholeDocumentDraw()','android.graphics.pdf.PdfDocument','v.getContentHeight()*v.getScale()','document.startPage(info)','document.writeTo(output)','new Thread(()->renderPdfPages()','PdfRenderer','page.render(bitmap,new android.graphics.Rect(0,0,width,height),null,android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT)','final int width=1588,height=2246','bitmap.compress(Bitmap.CompressFormat.PNG,100,out)','Environment.DIRECTORY_PICTURES+"/DEEB"','removePartialImages.run()','tempPdf.delete()','nonWhite==0']) if (!imageExport.includes(required)) throw new Error('Image export must render validated A4 PDF pages, convert them to PNG, and clean partial files: '+required);
if (!androidSetup.includes('private void waitForReportResources(WebView view, Handler handler') || !androidSetup.includes('window.__DEEB_REPORT_READY') || !androidSetup.includes("handler.postDelayed(poll[0], 100)") || !androidSetup.includes("window.__DEEB_REPORT_READY='resource-error'") || (androidSetup.match(/waitForReportResources\(v, handler, 30000/g)||[]).length!==2 || !printHandler.includes('waitForReportResources(v, handler, 30000')) throw new Error('Report image export and print must asynchronously wait for WebView images/fonts and poll readiness before rendering');
if (!androidSetup.includes('document.fonts.ready') || !androidSetup.includes('document.images') || !androidSetup.includes('requestAnimationFrame')) throw new Error('WebView resource readiness must wait for document images, fonts, and layout frames');
// Image export uses fixed A4 WebView slices in PdfDocument; print-to-printer remains on Android's PrintDocumentAdapter.
if (imageExport.includes('createPrintDocumentAdapter("DEEB-image-export")') || imageExport.includes('nativeAdapter.onLayout') || imageExport.includes('nativeAdapter.onWrite')) throw new Error('Image export must not invoke Android framework print callbacks directly');
for (const required of ['setMediaSize(PrintAttributes.MediaSize.ISO_A4.asPortrait())','setResolution(new PrintAttributes.Resolution("DEEB","DEEB",300,300))','setMinMargins(PrintAttributes.Margins.NO_MARGINS)','createPrintDocumentAdapter(jobName)','setJavaScriptEnabled(true)']) if (!printHandler.includes(required)) throw new Error('Android printing must use fixed A4 print attributes and the native print adapter: '+required);
const appSource = fs.readFileSync(path.join(root,'app.js'),'utf8');
const bikeReportDateTemplateStart=appSource.indexOf('if($("#reportType").value==="bike_patrols"){',appSource.indexOf('const printHtml'));
const bikeReportDateTemplateEnd=appSource.indexOf('\n  }\n  const rows=rowsFor(d),counts={};',bikeReportDateTemplateStart);
const bikeReportDateTemplate=bikeReportDateTemplateStart>=0&&bikeReportDateTemplateEnd>bikeReportDateTemplateStart?appSource.slice(bikeReportDateTemplateStart,bikeReportDateTemplateEnd):'';
if (!bikeReportDateTemplate.includes('class="bike-meta-date"') || !bikeReportDateTemplate.includes('<th>الموقع</th><th>توقيت المرور</th><th>الإحداثيات</th>') || bikeReportDateTemplate.includes('<th>التاريخ</th>') || !bikeReportDateTemplate.includes('عدد مرات المرور') || !bikeReportDateTemplate.includes('نوع الدراجة') || !bikeReportDateTemplate.includes('رقم الدراجة') || !bikeReportDateTemplate.includes('كود الدراجة') || !bikeReportDateTemplate.includes('class="bike-coordinates"') || bikeReportDateTemplate.includes('class="bike-notes"')) throw new Error('Bike patrol report metadata must contain one date field and the table must contain site, time and coordinates only');
const scannerBridgeSource = fs.readFileSync(path.join(root,'native-plugins-entry.js'),'utf8');
const androidAssetsSource = fs.readFileSync(path.join(root,'prepare-android.js'),'utf8');
const serviceWorkerSource = fs.readFileSync(path.join(root,'sw.js'),'utf8');
const androidWorkflowSource = fs.readFileSync(path.join(root,'.github/workflows/android-apk.yml'),'utf8');
if (scannerBridgeSource.includes('DocumentScanner') || androidAssetsSource.includes('"scanner.js"') || serviceWorkerSource.includes('./scanner.js') || androidWorkflowSource.includes('scanner.js') || androidSetup.includes('const documentScannerPlugin =') || androidSetup.includes('@CapacitorPlugin(name = "DocumentScanner")') || androidSetup.includes('implementation "com.google.android.gms:play-services-mlkit-document-scanner')) throw new Error('Document scanning must be fully excluded from the app bundle, Android plugins, dependencies, and service-worker cache');
if (androidSetup.includes('saveScannedPdf') || androidSetup.includes('scannedPdfStoragePermissionCallback')) throw new Error('Unused scanner PDF export code must not remain in the native file plugin');
const appScannerSource = fs.readFileSync(path.join(root,'app.js'),'utf8');
if (html.includes('src="scanner.js"') || html.includes('data-page="scanner"') || appScannerSource.includes('DEEBNativePlugins?.DocumentScanner') || appScannerSource.includes('window.DEebScanner')) throw new Error('Document scanner must remain removed from the user interface and navigation');
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
if (!sw.includes('deebo-local-v10-20')) throw new Error('Service worker cache version was not bumped');
const db = fs.readFileSync(path.join(root,'db.js'),'utf8');
if (!db.includes('function localDateISO(date=new Date())') || !db.includes('function recordWorkDate(row)') || !db.includes('function shiftIdentity(payload={})') || !db.includes('is_archived:!!old?.is_archived') || !db.includes('shift_key')) throw new Error('Date/shift identity and archived-record edit preservation are required');
if (!db.includes(String.raw`/^\d{4}-\d{2}-\d{2}$/`) || db.includes(String.raw`/^\\d{4}-\\d{2}-\\d{2}$/`)) throw new Error('Work-date validation must match real ISO calendar dates, not literal backslash characters');
if (!db.includes('if(operationalTypes.has(type))') || !db.includes('"written_reports","absences","handovers","emergencies","tasks"')) throw new Error('Shift/date metadata must be limited to operational records, leaving master registries unchanged');
if (!db.includes('"emergencies","tasks"') || !db.includes('const date=recordWorkDate(row)')) throw new Error('Automatic archival must use the actual work date for every operational record');
for (const type of ['branch_patrols','bike_patrols','manager_rounds','incidents','tasks','handovers','emergencies']) {
  const marker = 'if(!fields[type].some(f=>f[0]==="shift"))fields[type].push(["shift","الشفت","select","صباحي|مسائي|ليلي",1])';
  if (!app.includes(marker)) throw new Error('Operational forms must require a separate shift selector');
}
if (!app.includes('fields.handovers.unshift(["handover_date","تاريخ الشفت","date",1])') || !app.includes('fields.emergencies.unshift(["emergency_date","تاريخ الحالة","date",1])') || !app.includes('fields.tasks.unshift(["work_date","تاريخ العمل","date",1])') || !app.includes('اختر الشفت')) throw new Error('Every shift record must have an explicit date and shift selection');
if (!app.includes('اختر الدراجة المسجلة') || !app.includes('اختر فرد المرور المسجل') || !app.includes('cache.filter(x=>x.entity_type==="bikes"&&!x.is_archived).length') || !app.includes('cache.filter(x=>x.entity_type==="patrol_people"&&!x.is_archived).length')) throw new Error('Daily bike patrol entries must select from the permanent bike and patrol-person registries');
if (!app.includes('daily_rosters:"تشكيل الشفت اليومي"') || !app.includes('follow:["daily_rosters"') || !app.includes('name="patrol_people_ids" value="') || !app.includes('name="bike_ids" value="') || !app.includes('payload.patrol_people_ids=[...form.querySelectorAll(\'input[name="patrol_people_ids"]:checked\')]') || !app.includes('payload.bike_ids=[...form.querySelectorAll(\'input[name="bike_ids"]:checked\')]') || !app.includes('start_time') || !app.includes('end_time')) throw new Error('Daily shift roster must support multiple people and bikes independently by date and shift');
if (!db.includes('"daily_rosters","branch_patrols"') || !db.includes('const operationalTypes=new Set(["daily_rosters"')) throw new Error('Daily roster must be archived with its own shift without changing master data');
if (!app.includes('id="archiveDateFilter"') || !app.includes('id="archiveShiftFilter"') || !app.includes('archiveDateSelection') || !app.includes('archiveShiftSelection')) throw new Error('Archived operational records must be filterable independently by date and shift');
if (!app.includes('data-edit-archived') || !app.includes('تعديل السجل المؤرشف لن يلغي أرشفته أو يغيّر تاريخه')) throw new Error('Archived records must be reviewable and editable without being moved into current operations');
if (!app.includes('type==="daily_rosters"') || !app.includes('تشكيل شفتات محفوظ')) throw new Error('Daily roster screen must show saved shift formations separately');
if (!db.includes('created_at:old?.created_at||now()') || !db.includes('archived_at:old.archived_at')) throw new Error('Editing an archived record must preserve its original date and archive status');
if (!db.includes('return {app:"DEEB",format:2') || !db.includes('["DEEB","DEEBO","DEBOO16"].includes(obj.app)') || !db.includes('title:"تقرير DEEB"')) throw new Error('DEEB backup / approved report branding or legacy backup compatibility is missing');
for (const marker of [
  'document.addEventListener("click",e=>{if(e.target.closest("[data-back-home]"))',
  'document.addEventListener("click",event=>{const button=event.target.closest("#mainTiles [data-page], .stories [data-page]")',
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
const imageSaveStart=app.indexOf('$("#saveReportImage").onclick=async()=>');
const imageSaveEnd=app.indexOf('$("#pdfReport").onclick=',imageSaveStart);
const imageSaveHandler=imageSaveStart>=0&&imageSaveEnd>imageSaveStart?app.slice(imageSaveStart,imageSaveEnd):"";
if (!imageSaveHandler.includes('native.saveHtmlAsImages({html:readableReportHtml(printHtml(d)),name:"DEEB-report"})') || !imageSaveHandler.includes("result?.saved!==true") || !imageSaveHandler.includes("Number.isInteger(result.count)") || !imageSaveHandler.includes("result.count<1") || !imageSaveHandler.includes("finally{button.disabled=false;button.textContent=\"حفظ التقرير صورة\";")) throw new Error("Report image export must confirm at least one saved image and always restore the button state");

const readableStart=app.indexOf("const readableReportHtml="),readableEnd=app.indexOf('$("#saveReportImage").onclick=',readableStart),readableCss=readableStart>=0&&readableEnd>readableStart?app.slice(readableStart,readableEnd):"";
if(!readableCss.includes(".meta b,.overview-item span,.metric span,.bike-meta span{font-size:16px!important")||!readableCss.includes(".meta span,.overview-item b,.metric b,.bike-meta b{font-size:20px!important")||readableCss.includes("\\n .meta"))throw new Error("Shared report typography must apply metadata font sizes without escaped CSS selector separators");
if (/\bwolf\b|ذئب/i.test(app)) throw new Error('Printed DEEB reports must not contain a wolf icon or wolf branding');
if (app.split('DEEB</div>').length - 1 < 2) throw new Error('Both printed report templates must retain DEEB branding');


if (!imageExport.includes("writeWebViewToPdf(v)") || !imageExport.includes('WebView.enableSlowWholeDocumentDraw()') || !imageExport.includes('v.createPrintDocumentAdapter(baseName)') || !imageExport.includes('adapter.onLayout(null,attributes') || !imageExport.includes('adapter.onWrite(new android.print.PageRange[]{android.print.PageRange.ALL_PAGES}') || !imageExport.includes("renderer.openPage(index)") || !imageExport.includes("page.close()") || !imageExport.includes('replace("@media print","@media all")')) throw new Error("Image export must use Android native print pagination, render every PDF page independently, and close native page resources");
if (!app.includes('const pageSize=10,reportPages=') || !app.includes('branch-sheet-section') || !app.includes('groups.slice(i*pageSize,(i+1)*pageSize)') || !app.includes('class="branch-empty-row"') || !app.includes('length:Math.max(0,pageSize-page.length)') || !app.includes('const pageFooter=""') || app.includes("pageNumbering(269)")) throw new Error('Branch reports must use ten rows per page, leave unused rows blank, stretch the table, and omit bottom numbering');
if (!app.includes('const branchGroupsFor=d=>') || !app.includes('supervisor:[["employees","name"],["managers","name"],["patrol_people","name"]]')) throw new Error('Branch report supervisor grouping / saved suggestions are missing');
if (!app.includes('Math.max(0,Math.ceil(r.times.length/5)-1)')) throw new Error('Motorcycle screen preview and spreadsheet export must preserve all recorded visits');
if (!app.includes('Math.max(0,Math.ceil(r.times.length/5)-1)')) throw new Error('Motorcycle screen preview and spreadsheet export must preserve all recorded visits');
if (!app.includes("const timeMinutes=value=>") || !app.includes("const compareVisitTime=(a,b)=>") || !app.includes("dayOf(a).localeCompare(dayOf(b))||compareVisitTime(a,b)") || !app.includes("g.visits.map(v=>") || !app.includes("const maxRowsPerPage=18,pageCount=Math.max(1,Math.ceil(entries.length/maxRowsPerPage));") || !app.includes("entries.slice(page*maxRowsPerPage,(page+1)*maxRowsPerPage)") || !app.includes('const pageTitle=continuation?"باقي "+sectionTitle:sectionTitle;') || !app.includes("<th>الموقع</th><th>توقيت المرور</th><th>الإحداثيات</th>") || !app.includes('class="bike-meta-date"') || !app.includes('class="bike-coordinates"') || app.includes('class="bike-notes"') || !app.includes(".bike-table thead{display:table-header-group}") || !app.includes(".bike-sheet-section:last-child{break-after:auto!important;page-break-after:auto!important}") || !app.includes("pageIndex===pages.length-1")) throw new Error("Motorcycle report must show date in the header, use three table columns, paginate visits, repeat headers, and place approval on the final page");
if (!app.includes('filter(([k])=>k!=="bikes")')) throw new Error('Bike patrol reports must remain selectable while generic bikes categories stay hidden');
for(const rule of ['width:208mm!important','min-height:0!important','height:auto!important','padding:4mm!important','.bike-table th{font-size:14px!important','.bike-table td{font-size:12px!important','.bike-sheet-section:last-child{break-after:auto!important']) if(!app.includes(rule)) throw new Error('Motorcycle A4 print layout must use physical A4 width, preserve original text sizes, and fit the full report page: '+rule);
for(const rule of ['html{display:block!important;width:100%!important','body{display:block!important;width:208mm!important','margin:0 auto!important']) if(!app.includes(rule)) throw new Error('Motorcycle report must center its fixed-width body inside the full A4 page: '+rule);
if (!app.includes('locationUrl=String(p.location_url??"").trim()') || !app.includes('lat?"خط العرض: "+lat:""') || !app.includes('lng?"خط الطول: "+lng:""') || !app.includes('replace(/\\n/g,"<br>")')) throw new Error('Bike report must print the exact latitude, longitude and location URL entered in the app without converting or replacing them');
if (!app.includes('const displayRows=visible.flatMap') || !app.includes('continuation:i>0,visits:g.visits.slice(i*5,(i+1)*5)') || !app.includes('g.branch+(g.continuation?" — استكمال":"")')) throw new Error('Branch patrol continuation rows beyond five visits are missing from the screen or reports');
if (!app.includes('تقرير متابعة الفروع') || !app.includes('data:') && !app.includes('branchGroupsFor(d)')) throw new Error('Branch report matrix is missing');
const branchPrintStart=app.indexOf('const groups=branchGroupsFor(d),slots=5,title=',app.indexOf('const printHtml='));
const branchPrintEnd=app.indexOf('if($("#reportType").value==="bike_patrols")',branchPrintStart);
const branchPrint=branchPrintStart>=0&&branchPrintEnd>branchPrintStart?app.slice(branchPrintStart,branchPrintEnd):"";
if (!branchPrint.includes('<th>الموقع</th><th>المشرف</th>') || !branchPrint.includes("<th>متابعة ") || branchPrint.includes('<th>اليوم والتاريخ</th>')) throw new Error('Branch reports must show location, supervisor and five follow-ups without a duplicate date column');
if (!app.includes('["الموقع","المشرف"') || !app.includes('g.supervisor,...Array.from({length:slots}')) throw new Error('Branch Excel/CSV export must match the seven-column branch follow-up layout without a duplicate date column');
if (!app.includes('.branch-sheet-section{display:flex!important;flex-direction:column!important;box-sizing:border-box!important;width:209mm!important;height:285mm!important') || !app.includes('.branch-table tbody tr{height:19mm!important;min-height:19mm!important') || !app.includes('.branch-empty-row td{color:transparent!important}') || !app.includes('.branch-sheet-section .foot{flex:0 0 auto!important')) throw new Error('Branch report must reserve fixed space for ten complete rows without clipping');
if (!db.includes('const patrolDate=String(row.payload?.patrol_date||"").trim()')) throw new Error('Motorcycle backup restore must validate patrol_date rather than patrol_time');
if (!db.includes("function isValidISODate(value)") || !db.includes("parsed.toISOString().slice(0,10)===day") || !db.includes("const day=patrolDate||stamp.slice(0,10);") || !db.includes("if(!bike||!isValidISODate(day))")) throw new Error("Motorcycle backup restore must validate real calendar dates and reject impossible dates");


if (!app.includes('$("#recordForm")?.elements.namedItem("supervisor")?.focus()')) throw new Error("Quick branch patrol entry must open the form and focus the required supervisor field");
if (!app.includes("bindGlobalSearchSuggestions()") || !app.includes('input.setAttribute("list","globalSearchSuggestions")')) throw new Error("Global search autocomplete suggestions are missing");

console.log('PASS: required files, navigation hierarchy, reports archive/restore, script references, refreshed service-worker cache, package.json, Capacitor config, automatic-lock wiring, and chronological three-column motorcycle print reports (site, patrol time, coordinates) with report date in the header and continuation pages, with existing screen preview and spreadsheet export preserved.');

if (!app.includes('id="pdfReport"') || !app.includes('$("#pdfReport").onclick=()=>') || !app.includes('اختر حفظ كملف PDF')) throw new Error('PDF export action is missing');

if (!app.includes('data-report-type="written_reports">التقرير اليومي</button>') || app.includes('id="createWrittenReport"') || !app.includes('type==="written_reports"?"+ إضافة تقرير يومي":"+ إضافة سجل"') || !app.includes('<h1>التقرير اليومي</h1>')) throw new Error('Daily report creation must stay in Follow-up while Reports only filters and prints saved reports');

if (!app.includes('const createXlsx=rows=>') || !app.includes('[Content_Types].xml') || !app.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || !app.includes('DEEB-report.xlsx')) throw new Error('Excel export must create a valid XLSX workbook for Android Microsoft Excel');
if (!app.includes('<sheetFormatPr defaultRowHeight="22"/><cols>\'+columnWidths+\'</cols><sheetData>')) throw new Error('XLSX worksheet XML elements must follow the Excel schema order');
const bikeExcelStart=app.indexOf('const rowsForExport=d=>');
const bikeExcelEnd=app.indexOf('const saveFile=async(',bikeExcelStart);
const bikeExcel= bikeExcelStart>=0&&bikeExcelEnd>bikeExcelStart?app.slice(bikeExcelStart,bikeExcelEnd):"";
const bikeExcelStartAt=bikeExcel.indexOf('if($("#reportType").value==="bike_patrols"){');
const bikeExcelEndAt=bikeExcel.indexOf('return out;',bikeExcelStartAt);
const bikeExcelBlock=bikeExcelStartAt>=0&&bikeExcelEndAt>bikeExcelStartAt?bikeExcel.slice(bikeExcelStartAt,bikeExcelEndAt):"";
if (!bikeExcelBlock.includes('"مرور","الإحداثيات / رابط الموقع"') || bikeExcelBlock.includes('"ملاحظات"') || bikeExcelBlock.includes('p.notes') || !bikeExcelBlock.includes('g.visits.forEach(v=>') || !bikeExcelBlock.includes('dayOf(v)') || !app.includes('xl/styles.xml') || !app.includes('rightToLeft="1"') || !app.includes('<autoFilter ref=')) throw new Error("Bike Excel export must include date, bike metadata, site, visit time and coordinates only, with no notes column, in a styled RTL workbook with filters");

if (!app.includes('const sectionTitle="تقرير مرور دراجة "+(originalIndex+1)') || !app.includes('const pageTitle=continuation?"باقي "+sectionTitle:sectionTitle') || !app.includes('<h1 class="report-print-title">\'+pageTitle+\'</h1>') || !app.includes('groups=allGroups.filter(g=>selectedBikeReport==="all"||g.bike===selectedBikeReport)') || !app.includes('id="bikeReportSelect"') || !app.includes('id="bikeQuickReports"')) throw new Error('Each motorcycle report must have its own dynamic selector and print only the selected bike');
if (!app.includes('reportDate=new Date().toLocaleDateString("ar-EG")') || !app.includes('weekday:"long"')) throw new Error('Bike patrol report must display the report date in its header and retain localized weekday date formatting where applicable');
if (!app.includes('key=normalize(number);') || !app.includes('registry=data.filter(x=>x.entity_type===\"bikes\"&&!x.is_archived)') || !app.includes('bikeGroupsFor(data)') || !app.includes('data-bike-number=') || !app.includes('id="bikeQuickReports"') || app.includes('data-bike-index=') || app.includes('data-report-type="bike_patrols"') || !app.includes('showDate=type!=="bike_patrols"')) throw new Error('Motorcycle reports must have dynamically generated individual report actions for every registered bike, with no duplicate date column');
if (!app.includes('["patrol_date","تاريخ المرور","date",1]') || !app.includes('["bike_patrols","branch_patrols","manager_rounds"].includes(type)&&!isEditing&&f[0]==="patrol_date"')) throw new Error('Motorcycle follow-up form must include a required patrol date defaulting to today');
if (!app.includes('esc(g.date?new Date(g.date+"T00:00:00").toLocaleDateString("ar-EG"):reportDate)')) throw new Error('Motorcycle report must show the patrol date in its header, outside the table');
if (!app.includes('payload.patrol_date=oldDate||')) throw new Error('Motorcycle patrol date must still be stored automatically');

if (app.includes('saveFile("DEEB-report.xls"') || app.includes('application/vnd.ms-excel;charset=utf-8')) throw new Error('Legacy XML Spreadsheet export must not be mislabeled as XLS');

if (!app.includes('patrol_sites:[') || !app.includes('المخازن والمعارض ومراكز الخدمة')) throw new Error('Fixed patrol locations registry is missing');
if (!app.includes('function mapPage()') || !app.includes('function bikeMapsPage()') || !app.includes('function bikeMapReportsPage()') || !app.includes('فتح خط السير على خرائط Google') || !app.includes('else if(p==="bikeMaps")bikeMapsPage()')) throw new Error('Motorcycle route map pages are missing from the field-operations section');
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

if (!app.includes('document.addEventListener("click",event=>{const button=event.target.closest("#mainTiles [data-page], .stories [data-page]")')) throw new Error('Navigation must delegate clicks from the main tiles and story cards');
if (/(?<!\$)\$\([^)]*\)\.forEach/.test(app)) throw new Error('A single-element querySelector is being used as a NodeList');

if (!app.includes('const normalize=v=>String(v||"").trim().toLocaleLowerCase("ar")') || !app.includes('normalize(row.name).includes(normalize(searchTerm))')) throw new Error('Global Arabic search normalization for branch patrol grid is missing');
if (!app.includes('function render(p){\n currentPage=p;currentType=null;')) throw new Error('Navigation must clear stale entity context before rendering another page');
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
if (!nativeShare.includes('Build.VERSION.SDK_INT >= 29') || !nativeShare.includes('Build.VERSION.SDK_INT < 29') ||
    !nativeShare.includes('Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)') ||
    !nativeShare.includes('requestPermissionForAlias("legacyStorage"') ||
    !nativeShare.includes('android:maxSdkVersion="28"') ||
    !nativeShare.includes('delete(insertedUri,null,null)')) {
  throw new Error('File export must use scoped Downloads on Android 10+, legacy Downloads with API-limited permission on Android 9 and earlier, and clean up partial files');
}
if (!nativeShare.includes('saveHtmlAsImages') || !nativeShare.includes('registerPlugin(FileExportPlugin.class)') || !nativeShare.includes('MediaStore.Images.Media.RELATIVE_PATH') || !nativeShare.includes('DIRECTORY_PICTURES+"/DEEB"')) throw new Error('Native report image export is missing');
if (!nativeShare.includes('view.loadDataWithBaseURL("https://localhost/",imageHtml,"text/html","UTF-8",null)') || !nativeShare.includes('writeWebViewToPdf(v)') || !nativeShare.includes('WebView.enableSlowWholeDocumentDraw()') || !nativeShare.includes('v.createPrintDocumentAdapter(baseName)') || !nativeShare.includes('adapter.onLayout(null,attributes') || !nativeShare.includes('adapter.onWrite(new android.print.PageRange[]{android.print.PageRange.ALL_PAGES}') || !nativeShare.includes('new Thread(()->renderPdfPages()') || !nativeShare.includes('renderer.openPage(index)') || !nativeShare.includes('page.render(bitmap,new android.graphics.Rect(0,0,width,height),null,android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT)') || !nativeShare.includes('nonWhite==0') || !nativeShare.includes('bitmap.compress(Bitmap.CompressFormat.PNG,100,out)') || !nativeShare.includes('PdfRenderer')) throw new Error('Native report image export must use Android PrintDocumentAdapter pagination, convert each PDF page to PNG, and reject blank pages');
if (imageExport.includes('canvas.drawText("صفحة "+(index+1)+" من "+pageCount') || nativeShare.includes('canvas.drawText("صفحة "+(index+1)+" من "+pageCount')) throw new Error('No report image or print output may overlay page numbers');
if (!nativeShare.includes('.replace("@media print","@media all")+"<style>.report-page-number{display:none!important}</style>"')) throw new Error("PNG capture must hide legacy HTML page-number labels; DEEB reports do not use page numbering");
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
if (!app.includes('written_reports:"التقرير اليومي"') || !app.includes('"written_reports"]') || app.includes('id="createWrittenReport"') || !app.includes('data-report-type="written_reports"') || !app.includes('type==="written_reports"?"+ إضافة تقرير يومي":"+ إضافة سجل"')) throw new Error('Daily report creation must be available from Follow-up and not duplicated in Reports');
if (!app.includes('if(type==="written_reports"){const list=rows(type)') || !app.includes('data-edit="') || !app.includes('data-archive="')) throw new Error('Written report list must show saved reports with edit and archive actions');
if (!branchPrint.includes('.branch-sheet-section{display:flex!important;flex-direction:column!important;box-sizing:border-box!important;width:209mm!important;height:285mm!important') || !branchPrint.includes('margin:0!important;padding:2mm 1mm 2mm 0!important')) throw new Error("Branch report table must use the full printable page width and leave safe print clearance");
if (branchPrint.includes('class="branch-page-number"') || branchPrint.includes("pageNumbering(269)")) throw new Error("Branch PDF must not show numbering at the bottom of any page");
if (!app.includes('const pageNumber=""')) throw new Error("Bike patrol reports must omit page numbering entirely");
const bikePrintStart=app.indexOf('if($("#reportType").value==="bike_patrols"){ '.trim(),app.indexOf("const printHtml="));
const bikePrintEnd=app.indexOf('\n  }\n  const rows=rowsFor(d)',bikePrintStart);
const bikePrint=app.slice(bikePrintStart,bikePrintEnd);
if (!bikePrint.includes('<th>الموقع</th><th>توقيت المرور</th><th>الإحداثيات</th>') || bikePrint.includes('<th>التاريخ</th>') || !bikePrint.includes('class="bike-meta-date"><span>التاريخ</span><b>') || !bikePrint.includes('class="bike-meta-total"')) throw new Error('Bike report must show the report date once in the header and keep the table to three columns');
if (bikePrint.includes('<th>ملاحظات</th>') || bikePrint.includes('<td class="bike-notes">')) throw new Error('Bike patrol report must not render the removed notes column or cells');
if (bikePrint.includes("pageNumbering(281)") || bikePrint.includes("صفحة '+currentPageNumber")) throw new Error("Bike patrol PDF must not show page numbers on any page");
if (!bikePrint.includes('.bike-table th:first-child,.bike-table td:first-child{width:34%!important}') || !bikePrint.includes('.bike-table th:nth-child(3),.bike-table td:nth-child(3){width:48%!important}') || !bikePrint.includes('.bike-table td,.bike-table td.bike-coordinates,.bike-table td.bike-patrol-times{font-size:13px!important') || !bikePrint.includes('.brand-name{display:block!important;font-family:Georgia,serif!important;font-size:38px!important')) throw new Error('Bike report print must preserve the DEEB wordmark, the three requested columns, and readable text size');

if (!bikePrint.includes('.bike-sheet-section{display:flex!important;flex-direction:column!important;width:100%!important;margin-left:0!important;margin-right:0!important;height:281mm!important') || bikePrint.includes('.bike-sheet-section{height:auto!important') || !bikePrint.includes('.report-page-number{display:none!important}') || !app.includes('.report-page-note{font-size:10px!important')) throw new Error("Bike patrol table must stretch down the full printable page, retain continuation notes, and hide only page numbers");
if (!bikePrint.includes('.bike-sheet-section{display:flex!important;flex-direction:column!important;width:100%!important;margin-left:0!important;margin-right:0!important;height:281mm!important')) throw new Error("Bike patrol table must retain its original full printable width and height");
if (!app.includes('.report-body{flex:1 0 auto;border:1.5px solid #c99a32') || !app.includes('"Noto Naskh Arabic","Noto Sans Arabic",Tahoma,Arial,sans-serif') || !app.includes('.report-body{color:#000!important;font-size:20px!important;font-weight:800!important;line-height:1.85!important')) throw new Error("Daily written report must use the approved Arabic font and 20px bold black readable typography");
if (!app.includes('class=\\\"report-preview-title\\\">تقرير مرور دراجة ') || !app.includes('class=\\\"report-preview-title\\\">تقرير متابعة الفروع</') || !app.includes('.report-print-title{display:block!important;width:100%!important')) throw new Error("Bike and branch report headings must be explicit, prominent, and readable in preview and print");
if (!app.includes('@page{size:A4 portrait;margin:8mm 1mm}') || !app.includes('@page{size:A4 portrait;margin:5mm 1mm}') || !app.includes('width:208mm!important') || !app.includes('.written-page{width:208mm;')) throw new Error('All report formats must use 1mm left/right print margins and the full printable width');
if (!bikePrint.includes('يتبع في الصفحة التالية') || bikePrint.includes("pageNumbering(281)") || !bikePrint.includes('اعتماد المسؤول: __________________')) throw new Error("Motorcycle reports must retain continuation text and final approval without page numbering");
if (bikePrint.includes("'+pageNumber+'<span>اعتماد المسؤول: __________________</span></div>") || !app.includes('.report-page-note{display:flex;justify-content:space-between')) throw new Error('Motorcycle report footer must not include page numbering');
if (bikePrint.includes('تاريخ إصدار التقرير:') && bikePrint.indexOf('تاريخ إصدار التقرير:') < bikePrint.indexOf('const sections=')) throw new Error('Bike report must not create an orphan date-only page before the report sections');
if (!bikePrint.includes('height:auto!important;max-height:none!important') || bikePrint.includes('height:280mm!important')) throw new Error('Bike report print pages must not stretch table rows to fill a fixed-height sheet');
if (!bikePrint.includes('.bike-table th:first-child,.bike-table td:first-child{width:34%!important}') || !bikePrint.includes('.bike-table th:nth-child(2),.bike-table td:nth-child(2){width:18%!important}') || !bikePrint.includes('.bike-table th:nth-child(3),.bike-table td:nth-child(3){width:48%!important}') || !bikePrint.includes('font-size:13px!important;line-height:1.4!important') || !bikePrint.includes('.bike-table thead{display:table-header-group}') || !bikePrint.includes('.bike-table tr{break-inside:avoid;page-break-inside:avoid}') || !bikePrint.includes('white-space:normal!important') || !bikePrint.includes('.brand-name{display:block!important;font-family:Georgia,serif!important;font-size:38px!important')) throw new Error('Motorcycle report print must preserve DEEB logo, the three correct column widths, readable font size, repeated headers and unbroken rows');
const genericPrintStart=app.indexOf('const reportTitle=$("#reportType").selectedOptions[0].textContent;',app.indexOf('const printHtml='));
const genericPrintEnd=app.indexOf(' $("#saveReportImage").onclick=',genericPrintStart);
const genericPrint=genericPrintStart>=0&&genericPrintEnd>genericPrintStart?app.slice(genericPrintStart,genericPrintEnd):"";
if (!genericPrint.includes('<div class="overview-item"><span>الفترة</span>') || !genericPrint.includes('<span>تاريخ ووقت الإصدار</span>') || !genericPrint.includes('<th>م</th><th>القسم</th><th>الوقت</th><th>تفاصيل السجل</th>') || genericPrint.includes('<th>التاريخ</th>') || !genericPrint.includes('esc(x.time||"—")')) throw new Error('All printed reports must show date/period in the page header and never add a date column to report tables');
if (!bikePrint.includes('class="brand-left"') || !bikePrint.includes('class="official-tag">تقارير رسمي</div>') || !bikePrint.includes('font-size:34px;line-height:1.15')) throw new Error('Motorcycle report masthead must match the approved DEEB reference: logo and official label on the left, operating system on the right');
if (!bikePrint.includes('class="bike-report-heading"') || bikePrint.includes('class="bike-report-kicker">تقرير رسمي • متابعة ميدانية</span>') || !bikePrint.includes('<th>الموقع</th><th>توقيت المرور</th><th>الإحداثيات</th>')) throw new Error('Motorcycle report must omit the redundant field-work label and retain exactly the three requested columns');
if (!bikePrint.includes('const maxRowsPerPage=18') || !bikePrint.includes('length:Math.max(0,18-pageRows.length)') || !bikePrint.includes('calc((100% - 10mm)/18)')) throw new Error('Each motorcycle report page must contain exactly 18 patrol rows and use the available printable height');
if (!bikePrint.includes('background:#073b28;color:#fff') || !bikePrint.includes('border:1px solid #c99a32') || !bikePrint.includes('background:#fbf4e6')) throw new Error('Bike report PDF and image exports must preserve DEEB green, gold, and beige visual identity');
if (!app.includes('if($("#reportType").value==="written_reports")') || !app.includes('class="report-body"') || !app.includes('class="written-page"') || !app.includes('esc(p.report_text||"")')) throw new Error('Written reports must print each saved narrative as a standalone report');
const writtenPrintStart=app.indexOf('if($("#reportType").value==="written_reports"){',app.indexOf('const printHtml='));
const writtenPrintEnd=app.indexOf('if($("#reportType").value==="branch_patrols")',writtenPrintStart);
const writtenPrint=app.slice(writtenPrintStart,writtenPrintEnd);
if (!writtenPrint.includes('background:#073b28') || !writtenPrint.includes('background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)') || !writtenPrint.includes('border:1.5px solid #c99a32')) throw new Error('Written report print must use DEEB green, burgundy, and gold identity');
if (writtenPrint.includes('min-height:275mm') || writtenPrint.includes('min-height:135mm')) throw new Error('Written report must not force oversized blank page areas');
if (!writtenPrint.includes('.written-inner{display:flex;flex-direction:column;width:100%;min-height:279mm;padding:4mm 5mm;transform:none}') || !writtenPrint.includes('.report-body{flex:1 0 auto;min-height:185mm;') || !writtenPrint.includes('margin-top:auto;padding-bottom:2mm')) throw new Error("Daily written report must expand to use the A4 page while retaining readable content and footer");
if (!writtenPrint.includes('orphans:2;widows:2') || !writtenPrint.includes('break-inside:avoid;page-break-inside:avoid')) throw new Error('Written report pagination safeguards are missing');
if (writtenPrint.includes('height:277mm') || writtenPrint.includes('overflow:hidden') || writtenPrint.includes('function fitWrittenPages()') || writtenPrint.includes('inner.style.transform="scale("+scale+")"')) throw new Error('Written reports must continue onto additional pages without shrinking or clipping content');
if (writtenPrint.includes('counter(page)') || (writtenPrint.match(/@bottom-center/g)||[]).length) throw new Error('Written reports must not display page numbers on any page');
if (app.includes('const pageNumbering=') || app.includes('counter(page)') || app.includes('@bottom-center') || app.includes('pageNumbering(')) throw new Error('All printed report templates must omit page numbering entirely');
if (!app.includes('height:auto;max-width:none;margin:0;padding:0;overflow:visible;break-after:page')) throw new Error('Written report pages must grow naturally and preserve the original font size');
const sharedIdentity='repeating-linear-gradient(180deg,#f7df91 0 4px,#b88622 5px 8px,#f7df91 9px 11px)';
if ((app.split('/* DEEB shared reference identity */').length-1)!==4) throw new Error('All four report templates must embed the same approved DEEB visual identity');
for (const rule of ['.brand-name{font-family:Georgia','h1:before,h1:after{content:""!important','background:#073b28!important','background:#fbf4e6!important','border:1.5px solid #c99a32!important','background:#f6ead2!important']) if ((app.split(rule).length-1)<4) throw new Error('A report template is missing shared DEEB identity rule: '+rule);
if (!app.includes(sharedIdentity) || !app.includes('h1{position:relative!important;isolation:isolate!important')) throw new Error('Report titles must use the gold winged burgundy banner from the approved reference');

 // Automatic-backup status must be visible to the user, including the attachment-size skip.
if (!app.includes('تم تحديث النسخة التلقائية لهذا اليوم بنجاح') || !app.includes('تجاوز 30 ميجابايت') || !app.includes('DebooDB.createAutoBackup()')) throw new Error('Automatic backup status and attachment-size warning must be visible in settings');

const androidAssets = fs.readFileSync(path.join(root,'prepare-android.js'),'utf8');
if (androidAssets.includes('"scanner.js"') || html.includes('src="scanner.js"') || sw.includes('./scanner.js')) throw new Error('Document scanner assets must not be staged or cached');

const readableRules = [
  'const readableReportHtml=html=>html.replace("</style>"',
  '.report-body{color:#000!important;font-size:20px!important;font-weight:800!important',
  '.report-table td,.branch-table td,.bike-table td{color:#000!important',
  '.report-table td,.branch-table td,.bike-table td{color:#000!important;-webkit-text-fill-color:#000!important;font-size:19px!important;font-weight:800!important',
  '.bike-table td.bike-coordinates,.bike-table td.bike-patrol-times{font-size:16px!important;font-weight:800!important',
  'html:readableReportHtml(printHtml(d))',
  'const html=readableReportHtml(printHtml(d));'
];
for (const rule of readableRules) if (!app.includes(rule)) throw new Error('All report outputs must apply high-contrast black, larger, bold data text: '+rule);

if (!app.includes('.meta span,.overview-item b,.metric b,.bike-meta b{font-size:20px!important;font-weight:800!important')) throw new Error('Report metadata values must use 20px bold typography');
if (!app.includes('.bike-table td.bike-coordinates,.bike-table td.bike-patrol-times{font-size:16px!important;font-weight:800!important')) throw new Error('Bike patrol time and coordinate data must use 16px bold typography');

if (!app.includes('.report-table th,.branch-table th,.bike-table th{font-size:16px!important;font-weight:900!important')) throw new Error('Report table headings must remain smaller than data text');
