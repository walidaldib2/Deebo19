const fs = require('fs');
const path = require('path');
const root = __dirname;
const required = ['index.html','app.js','db.js','team-sync.js','style.css','sw.js','manifest.json','icon.svg','qrcode.js','capacitor.config.json','package.json','biometric.bundle.js','prepare-android.js','configure-android-share.js','prepare-android-icons.js','document-tools.js','powerpoint-editor.js','scanner.js'];
const missing = required.filter(f => !fs.existsSync(path.join(root,f)));
if (missing.length) throw new Error('Missing required files: '+missing.join(', '));
const androidPrepareSource = fs.readFileSync(path.join(root,'prepare-android.js'),'utf8');
for (const asset of ['document-tools.js','powerpoint-editor.js','scanner.js']) {
  if (!androidPrepareSource.includes('"'+asset+'"')) throw new Error('Android www preparation must copy '+asset);
}
const documentToolsSource = fs.readFileSync(path.join(root,'document-tools.js'),'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if (packageJson.dependencies['tesseract.js'] !== '7.0.0') throw new Error('Local OCR engine version must remain pinned to 7.0.0.');
const androidPrepareForOcr = fs.readFileSync(path.join(root,'prepare-android.js'),'utf8');
for (const token of ['worker.min.js','tesseract.min.js','language + ".traineddata"','tesseract-core-simd-lstm.wasm.js','tesseract-core-relaxedsimd-lstm.wasm.js','tesseract-core-relaxedsimd-lstm.wasm','tessdata_fast']) {
  if (!androidPrepareForOcr.includes(token)) throw new Error('Android OCR preparation is missing: '+token);
}
for (const token of ['deebOcr','deebOcrText','deebOcrCopy','createWorker(["ara","eng"]','workerPath:"./ocr/worker.min.js"','langPath:"./ocr/lang"','corePath:"./ocr/core"','لم يتم حفظه في أي سجل']) {
  if (!documentToolsSource.includes(token)) throw new Error('Local OCR review workflow is missing: '+token);
}
if (["cdn.jsdelivr.net","tessdata.projectnaptha.com","unpkg.com"].some(host => documentToolsSource.includes(host))) throw new Error('Runtime OCR code must not call external network services.');

if (!documentToolsSource.includes('workerPath:"./ocr/worker.min.js"') || !documentToolsSource.includes('langPath:"./ocr/lang"') || !documentToolsSource.includes('corePath:"./ocr/core"')) throw new Error("OCR worker-relative paths must resolve language and core assets beside ./ocr/worker.min.js, not under a duplicated ./ocr/ocr directory.");
if (!documentToolsSource.includes('createWorker(["ara","eng"],1,') || !documentToolsSource.includes("gzip:false")) throw new Error("OCR must initialize Arabic/English LSTM recognition with gzip disabled for the downloaded uncompressed traineddata models.");
if (!androidPrepareForOcr.includes('language + ".traineddata"') || !androidPrepareForOcr.includes('tesseract-core-relaxedsimd-lstm.wasm.js')) throw new Error("Android OCR preparation must include dynamically named language data and the Tesseract core loader.");

const powerpointEditorSource = fs.readFileSync(path.join(root,'powerpoint-editor.js'),'utf8');
if (!powerpointEditorSource.includes('addEventListener("focus",snap)') || !powerpointEditorSource.includes("function queueSave()") || !powerpointEditorSource.includes("draw();queueSave()") || !powerpointEditorSource.includes("n.onpointerup=function(){n.onpointermove=null;save()}")) throw new Error("PowerPoint editor must snapshot control edits, debounce autosave, and save completed drag operations.");

for (const feature of ['pptAddSlide','pptText','pptImage','pptExport','localStorage','exportPptx','pptUndo','pptRedo','pptDuplicate','pptTable','pptChart','function createEditableTable()','function createEditableChart()','function addMany(items)','accent1="D6A743"']) if (!powerpointEditorSource.includes(feature)) throw new Error('PowerPoint editor missing capability: '+feature);

if (!documentToolsSource.includes('rotated image') && (!documentToolsSource.includes('angle===90') || !documentToolsSource.includes('angle===180') || !documentToolsSource.includes('angle===270') || !documentToolsSource.includes('p.rot=0'))) throw new Error('Rotating a scanned page must normalize image orientation and transform crop coordinates for 90/180/270 degrees.');
if (!documentToolsSource.includes('data-crop-handle') && !documentToolsSource.includes('dataset.cropHandle')) throw new Error('Scanner must provide direct touch crop handles on the document preview.');
if (!documentToolsSource.includes('deebPptDensity') || !documentToolsSource.includes('deebPptFont') || !documentToolsSource.includes('deebPptTheme') || !documentToolsSource.includes('deebPptCover') || !documentToolsSource.includes('pptOptions.density') || !documentToolsSource.includes('brightness') || !documentToolsSource.includes('contrast') || !documentToolsSource.includes('نسخ الصفحة') || !documentToolsSource.includes('إلغاء القص')) throw new Error('PowerPoint export settings and scanner page enhancement controls are required');
if (documentToolsSource.includes('value="dark"') || documentToolsSource.includes('value="blue"') || documentToolsSource.includes('7B2338') || documentToolsSource.includes('174C3C')) throw new Error('Document tools must not offer alternate visual identities outside DEEB19.');
if (!documentToolsSource.includes("w=c.width>c.height?842:595,h=c.width>c.height?595:842") || !documentToolsSource.includes('/MediaBox [0 0 "+w+" "+h+"]')) throw new Error("Scanned PDF must use A4 portrait or landscape according to each page image orientation.");
if (!documentToolsSource.includes('p.crop') ||
    !documentToolsSource.includes('قص من اليسار') ||
    !documentToolsSource.includes('قص من الأعلى') ||
    !documentToolsSource.includes('type="screen16x9"')) {
  throw new Error('Scanner must provide manual crop controls and PowerPoint must use widescreen 16:9 slides.');
}
if (!powerpointEditorSource.includes('type:"shape"') || !powerpointEditorSource.includes('type:"text"')) throw new Error('PowerPoint tables and charts must use editable native slide elements.');
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const androidAssetsMatch = androidPrepareSource.match(/const assets = \[([\s\S]*?)\];/);
if (!androidAssetsMatch) throw new Error('Android asset manifest could not be parsed');
const androidAssetNames = new Set(Array.from(androidAssetsMatch[1].matchAll(/["']([^"']+)["']/g), match => match[1]));
const localScripts = Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi), match => match[1]);
const localStyles = Array.from(html.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+)["']/gi), match => match[1]);
for (const asset of [...localScripts, ...localStyles]) {
  if (/^(?:https?:)?\/\//i.test(asset) || asset.startsWith('data:')) continue;
  if (asset.startsWith('ocr/')) {
    if (!androidPrepareSource.includes('const ocrRoot = path.join(output, "ocr")') ||
        !androidPrepareSource.includes('path.join(ocrRoot, "tesseract.min.js")') ||
        !androidPrepareSource.includes('path.join(ocrRoot, "worker.min.js")')) {
      throw new Error('Android OCR runtime assets must be copied into www/ocr by the dedicated OCR packaging step.');
    }
    continue;
  }
  if (!androidAssetNames.has(asset)) throw new Error('Android packaging manifest is missing a locally loaded application asset: '+asset);
}

for (const asset of ['document-tools.js','powerpoint-editor.js']) {
  if (!html.includes('<script src="'+asset+'"></script>')) throw new Error('Application entry point must load '+asset);
}
const offlineAssetCacheSource = fs.readFileSync(path.join(root,'sw.js'),'utf8');
for (const asset of ['ocr/tesseract.min.js','ocr/worker.min.js','ocr/core/tesseract-core-simd-lstm.wasm.js','ocr/core/tesseract-core-relaxedsimd-lstm.wasm.js','ocr/lang/ara.traineddata','ocr/lang/eng.traineddata']) {
  if (!offlineAssetCacheSource.includes('"./'+asset+'"')) throw new Error('Offline cache must include local OCR asset '+asset);
}
for (const asset of ['document-tools.js','powerpoint-editor.js']) {
  if (!offlineAssetCacheSource.includes('"./'+asset+'"')) throw new Error('Offline cache must include '+asset);
}
const db = fs.readFileSync(path.join(root,'db.js'),'utf8');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
if (!app.includes('<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>') || !app.includes('<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>')) throw new Error('Excel exports must freeze the first header row while preserving right-to-left navigation.');
const vm = require('node:vm');
new vm.Script(powerpointEditorSource,{filename:'powerpoint-editor.js'});
for (const file of ['app.js','db.js','team-sync.js','preferences.js','sw.js','qrcode.js','biometric.bundle.js','native-plugins.bundle.js','document-tools.js','scanner.js']) {
  const source = fs.readFileSync(path.join(root,file),'utf8');
  new vm.Script(source,{filename:file});
}
for (const f of ['qrcode.js','db.js','team-sync.js','biometric.bundle.js','app.js']) if (!html.includes(`src="${f}"`)) throw new Error('index.html does not load '+f);
// Reuse the database source loaded at the top of this smoke test.
// Reuse the app source loaded at the top of this smoke test.
if (!html.includes('src="powerpoint-editor.js"') || !fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('./powerpoint-editor.js')) throw new Error('PowerPoint editor must load and remain available offline');
if (!html.includes('src="document-tools.js"') || !fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('./document-tools.js')) throw new Error('PowerPoint and document tools must load and remain available offline');
if (!html.includes('src="scanner.js"') || !fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('./scanner.js')) throw new Error('CamScanner module must load and remain available offline on Android.');
if (!app.includes('window.DEebScanner.render()') || !app.includes('window.DEEBPowerPointEditor.open()') || !html.includes('data-page="officeTools"')) throw new Error('Office tools navigation must expose scanner and PowerPoint sections.');
const toolsSource=fs.readFileSync(path.join(root,'document-tools.js'),'utf8');
for (const feature of ['exportPowerPoint','exportScannedPdf','capture="environment"','أبيض وأسود','image/jpeg','application/pdf','application/vnd.openxmlformats-officedocument.presentationml.presentation','saveAttachment(id,file)','deebAttachTarget','deebAttachPdf','brand:"D6A743",title:"F0D58D",body:"F5F3EF"','DEEB19 الثابتة','background:#D6A743;color:#0A1729']) if (!toolsSource.includes(feature)) throw new Error('Document tools missing required capability: '+feature);
if (!db.includes('DB_VERSION = 5') || !db.includes('"report_archives"') || !db.includes('async function archiveReport') || !db.includes('async function reportArchives')) throw new Error('Persistent report archive storage and API are required');
for (const marker of ['archiveCurrentReport','archiveBikeMapReport','أرشيف خرائط الدراجات','archiveReportFilter','saveBikeMapArchive','data-pdf-report-archive','data-image-report-archive','data-pdf-approved','data-image-approved','saveArchivedPdf','saveArchivedImage']) if (!app.includes(marker)) throw new Error('Report archive UI is missing '+marker);
const detailLayoutStart=app.indexOf('const detailPoints=visits.map');
const detailLayoutEnd=app.indexOf('const mapMarkup=',detailLayoutStart);
const detailLayout=detailLayoutStart>=0&&detailLayoutEnd>detailLayoutStart?app.slice(detailLayoutStart,detailLayoutEnd):'';
if(!detailLayout.includes('Math.ceil(detailPoints.length/3)') ||
   !detailLayout.includes('Math.floor(index/detailRowCount)+1') ||
   !detailLayout.includes('index%detailRowCount+1') ||
   !detailLayout.includes("grid-template-rows:repeat('+detailRowCount+',auto)") ||
   !app.includes('grid-template-columns:repeat(3,minmax(0,1fr))') ||
   !app.includes('.deeb-report-map{height:120mm;width:100%') ||
   !app.includes('grid-auto-rows:min-content;grid-auto-flow:row;align-content:start') ||
   app.includes('height:125mm;grid-template-rows:repeat(') ||
   !app.includes('height:289mm') ||
   !app.includes('break-before:auto;page-break-before:auto') ||
   !app.includes('list-style:none')) {
  throw new Error('Bike map report must fit its map and all visit details on one A4 page in three ordered columns without duplicate list markers.');
}
if (!app.includes('bikes:[["number","رقم الدراجة","text",1],["code","كود الدراجة","text"],["type","نوع الدراجة","text"],["description","الوصف","text"],["status","الحالة","select","جاهزة|بالمرور|صيانة|متوقفة"]]')) throw new Error("Bike registry must store bike details without a fixed responsible person");
if (!app.includes('bike_patrols:[["shift","الشفت","select","صباحي|مسائي|ليلي",1],["bike","الدراجة","text",1],["person","اسم الفرد القائم بالمرور","text",1]')) throw new Error("Each daily bike patrol entry must record its shift, bike, and responsible patrol person");
if (!app.includes('bike_shift_assignments:[["work_date","تاريخ الشفت","date",1],["shift","الشفت","select","صباحي|مسائي|ليلي",1],["assignments","توزيع الأفراد على الدراجات","custom"]]') || !app.includes('["bikeShiftAssignments","توزيع شفت مرور الدراجات"]') || !app.includes('data-bike-assignment=') || !app.includes('اختَر الفرد الراكب لكل دراجة مسجلة قبل الحفظ')) throw new Error("Daily bike shift assignment screen must map each registered bike to a patrol rider and save by date and shift");
if (!app.includes('const registry=data.filter(x=>x.entity_type==="bikes"&&!x.is_archived).slice().sort((a,b)=>String(a.created_at||"").localeCompare(String(b.created_at||"")))') || !app.includes('cache.filter(x=>x.entity_type==="bikes"&&!x.is_archived).slice().sort((a,b)=>String(a.created_at||"").localeCompare(String(b.created_at||"")))')) throw new Error("Bike report numbering and shift assignment must follow original data-entry order, oldest registered bike first");
if (!app.includes('const persons=[...new Set(g.visits.map(v=>String(v.payload?.person||v.payload?.responsible||"").trim()).filter(Boolean))]') || !app.includes('const splitPersons=persons.length?persons:["—"]') || !app.includes('key:normalize(g.bike)+"::"+normalize(person)') || !app.includes('personVisits.filter') && !app.includes('personVisits=person==="—"?g.visits.filter') || !app.includes('person,code:bp.code')) throw new Error("Bike reports must be split into separate rider-specific reports using only each rider’s own visits");
if (!app.includes('if(!$("#archiveReportFilter"))host.insertAdjacentHTML("afterbegin"') || !app.includes('لا توجد خرائط دراجات محفوظة حتى الآن')) throw new Error('Archive must always expose the bike-map category, including when no map reports have been saved yet');
if (!app.includes('"bike_map","bike_patrols"') || !app.includes("window.DEebOpenArchive=showArchive;") || !app.includes("await window.DEebOpenArchive();") || !app.includes('openArchivePage().catch(error=>')) throw new Error("General archive navigation must await the shared archive renderer, expose bike patrol follow-up, and report async failures in the UI");
if (!app.includes('all:"التقرير الشامل"') || !app.includes('archived_records:"السجلات المؤرشفة"') || !app.includes('"all","archived_records","bike_map","bike_patrols"') || !app.includes('type!=="bikes"')) throw new Error("The comprehensive report and archived operational records must have selectable archive categories.");
if (!app.includes("const selected=archived.filter(x=>selectedArchiveIds.includes(x.id))")) throw new Error("Selected archived follow-ups must be used when building an archive report, not the active-record list.");
if (!app.includes("const autoArchiveCurrentReport=async()=>") || !app.includes("queueAutomaticReportArchive();") || !app.includes("dedupe_key:dedupeKey") || !db.includes("const duplicate=existing.find(item=>item.dedupe_key===dedupeKey)")) throw new Error("Every generated non-empty report must be auto-archived idempotently without requiring manual export.");
if (!app.includes("const autoArchiveMap=") || !app.includes("archiveBikeMapReport().catch(error=>toast(") || !app.includes('dedupe_key:dedupeKey,meta:{bike,person,data:reportVisits')) throw new Error("Generated bike map reports must also be automatically saved to the general archive without duplicates.");
if (!app.includes("meta:{record_count:d.length,data:d,selected_bike_report:selectedBikeReport}") || !app.includes("const buildArchivedReportHtml=item=>") || !app.includes("readableReportHtml(printHtml(source))") || !app.includes("const html=buildArchivedReportHtml(item)")) throw new Error("Archived reports must be rebuilt from saved report data using the exact current print template for print, PDF and image export.");
if (!app.includes('id="archiveReportFilterSlot"') || !app.includes("archiveFilterSlot.replaceChildren(archiveFilter)")) throw new Error("Report archive category selector must be located in the archive header, not inside the archive records list");
const nativeEntry = fs.readFileSync(path.join(root,"native-plugins-entry.js"),"utf8");
if (!JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8")).scripts?.["build:native-plugins"] || !nativeEntry.includes("registerPlugin('FileExport')")) throw new Error("Android native print/export plugin bridge must be built and registered");
if (!app.includes('d.map(x=>x.id+":"+x.updated_at).join("|")') || !app.includes('archivedReportPromise=null;}throw error;') || !app.includes('bikeMapArchivePromise=null;}throw error;')) throw new Error('Report archive snapshots must detect changed records and allow retry after a failed local save');
const sw = fs.readFileSync(path.join(root,'sw.js'),'utf8');
for (const f of ['index.html','style.css','app.js','db.js','team-sync.js','qrcode.js','manifest.json','icon.svg']) if (!sw.includes(`./${f}`)) throw new Error('Service worker core cache missing '+f);
const pkg = JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const cap = JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));
if (cap.appId !== 'com.deebo19.fieldops.dev' || cap.appName !== 'DEEB19') throw new Error('DEEB19 development build must use its own package ID while preserving DEEB19 branding');
const androidPrep = fs.readFileSync(path.join(root,'prepare-android.js'),'utf8');
if (!androidPrep.includes('"team-sync.js"')) throw new Error('Android preparation must package the DEEB19 team sync engine');
if (!html.includes('<title>DEEB19') || !html.includes('class="wordmark">DEEB19')) throw new Error('DEEB19 app shell branding is missing');
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
const pdfExportStart=androidSetup.indexOf('@PluginMethod public void saveHtmlAsPdf');
const pdfExportEnd=androidSetup.indexOf('@PluginMethod public void printHtml',pdfExportStart);
const pdfExport=pdfExportStart>=0&&pdfExportEnd>pdfExportStart?androidSetup.slice(pdfExportStart,pdfExportEnd):'';
for(const required of ['application/pdf','MediaStore.Downloads.EXTERNAL_CONTENT_URI','Environment.DIRECTORY_DOWNLOADS+"/DEEB"','document.writeTo(out)','PageInfo.Builder(595,842,i+1)','page.getCanvas().scale(595f/width,842f/height)','waitForReportResources(v,handler,30000']) if(!pdfExport.includes(required)) throw new Error('Direct PDF export must save a complete validated PDF in Downloads/DEEB: '+required);
if(!app.includes('native.saveHtmlAsPdf({html,name:"DEEB-report"})') || !app.includes('native.saveHtmlAsPdf({html,name:"DEEB-archive-"+item.id})') || !app.includes('native.saveHtmlAsPdf({html:reportHtml,name:"DEEB-bike-map-"')) throw new Error('Current, archived and bike map reports must offer direct PDF file export');
const printHandlerStart=androidSetup.indexOf('@PluginMethod public void printHtml');
const printHandlerEnd=androidSetup.indexOf('\n  }\n}',printHandlerStart);
const printHandler=printHandlerStart>=0&&printHandlerEnd>printHandlerStart?androidSetup.slice(printHandlerStart,printHandlerEnd):'';
if (!printHandler.includes('setJavaScriptEnabled(true)') || !printHandler.includes('createPrintDocumentAdapter(jobName)')) throw new Error('Android print WebView must use the native print adapter');
if (!printHandler.includes('int height=webPageHeight;') || !printHandler.includes('int width=webWidth;') || printHandler.includes('contentCssHeight=Math.max(cssPageHeight,v.getContentHeight())')) throw new Error('Native report printing must keep a fixed A4 WebView viewport and let Android paginate the complete document');
const imageExportStart=androidSetup.indexOf('@PluginMethod public void saveHtmlAsImages');
const imageExportEnd=androidSetup.indexOf('@PluginMethod public void printHtml',imageExportStart);
const imageExport=imageExportStart>=0&&imageExportEnd>imageExportStart?androidSetup.slice(imageExportStart,imageExportEnd):'';
for (const required of ['writeWebViewToPdf(v)','WebView.enableSlowWholeDocumentDraw()','new android.graphics.pdf.PdfDocument()','new android.graphics.pdf.PdfDocument.PageInfo.Builder(width,height,index+1).create()','v.scrollTo(0,scrollY)','v.draw(canvas)','document.writeTo(output)','PdfRenderer','page.render(bitmap,new android.graphics.Rect(0,0,width,height),null,android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT)','final int width=1588,height=2246','bitmap.compress(Bitmap.CompressFormat.PNG,100,out)','Environment.DIRECTORY_PICTURES+"/DEEB"','removePartialImages.run()','tempPdf.delete()','nonWhite==0']) if (!imageExport.includes(required)) throw new Error('Image export must use Android native A4 pagination, render validated PNG pages, and clean partial files: '+required);
const compactReadyCalls=(androidSetup.match(/waitForReportResources\(v,handler,30000/g)||[]).length;
const spacedReadyCalls=(androidSetup.match(/waitForReportResources\(v, handler, 30000/g)||[]).length;
if (!androidSetup.includes('private void waitForReportResources(WebView view, Handler handler') || !androidSetup.includes('window.__DEEB_REPORT_READY') || !androidSetup.includes("handler.postDelayed(poll[0], 100)") || !androidSetup.includes("window.__DEEB_REPORT_READY='resource-error'") || compactReadyCalls!==1 || spacedReadyCalls!==2 || !printHandler.includes('waitForReportResources(v, handler, 30000')) throw new Error('Report image export and print must asynchronously wait for WebView images/fonts and poll readiness before rendering');
if (!androidSetup.includes('document.fonts.ready') || !androidSetup.includes('document.images') || !androidSetup.includes('requestAnimationFrame')) throw new Error('WebView resource readiness must wait for document images, fonts, and layout frames');
if (!imageExport.includes('writeWebViewToPdf(v)') || !imageExport.includes('WebView.enableSlowWholeDocumentDraw()') || !imageExport.includes('new android.graphics.pdf.PdfDocument()') || !imageExport.includes('v.scrollTo(0,scrollY)') || !imageExport.includes('v.draw(canvas)') || !imageExport.includes('document.writeTo(output)') || !imageExport.includes('PdfRenderer') || !imageExport.includes('page.render(bitmap') || !imageExport.includes('final int width=1588,height=2246')) throw new Error('A4 image export must draw the complete WebView report into paginated PDF pages and render fixed-size portrait PNGs');
if (!imageExport.includes('pdfCaptureStarted.compareAndSet(false,true)') || !imageExport.includes('if(finished.get()||!pdfCaptureStarted.compareAndSet(false,true))return;')) throw new Error('Android image export must ignore duplicate WebView page-finished callbacks and start a single PDF/PNG capture per request');
if (imageExport.includes('createPrintDocumentAdapter("DEEB-image-export")') || imageExport.includes('nativeAdapter.onLayout') || imageExport.includes('nativeAdapter.onWrite')) throw new Error('Image export must not invoke Android framework print callbacks directly');
for (const required of ['setMediaSize(PrintAttributes.MediaSize.ISO_A4.asPortrait())','setResolution(new PrintAttributes.Resolution("DEEB","DEEB",300,300))','setMinMargins(PrintAttributes.Margins.NO_MARGINS)','createPrintDocumentAdapter(jobName)','setJavaScriptEnabled(true)']) if (!printHandler.includes(required)) throw new Error('Android printing must use fixed A4 print attributes and the native print adapter: '+required);
const durableSyncSql = fs.readFileSync(path.join(root,'supabase/migrations/202611250009_durable_pending_sync_pages.sql'),'utf8');
for (const required of [
  'add column if not exists pending_page jsonb',
  'return v_cursor.pending_page',
  'pending_page=v_response',
  'pending_page=null',
  'deeb_pull_auxiliary',
  'deeb_advance_aux_cursor'
]) if (!durableSyncSql.includes(required)) throw new Error('Crash-safe sync page replay is missing: '+required);
const syncClient = fs.readFileSync(path.join(root,'team-sync.js'),'utf8');
const adminAuditSql = fs.readFileSync(path.join(root,'supabase/migrations/202611250010_audited_user_admin_actions.sql'),'utf8');
if (!adminAuditSql.includes('deeb_admin_apply_user_action') || !adminAuditSql.includes("'user_role_changed'") ||
    !adminAuditSql.includes("'user_deactivated'") || !adminAuditSql.includes("'user_reactivated'") ||
    !adminAuditSql.includes('to service_role')) throw new Error('User administration must be atomic and audited on the server');
const userAdminEdge = fs.readFileSync(path.join(root,'supabase/functions/deebo-user-admin/index.ts'),'utf8');
const inviteEdge = fs.readFileSync(path.join(root,'supabase/functions/deebo-invite/index.ts'),'utf8');
if (!userAdminEdge.includes('deeb_admin_apply_user_action') || !inviteEdge.includes('"user_invited"') ||
    !inviteEdge.includes('invitation_audit_failed_invitation_rolled_back')) throw new Error('Staff invitations and account changes must be audit logged');
for (const required of ['syncQueueForPush(500)','rebasePendingRecordMutations','blocked_dependency','waiting_retry']) {
  if (!syncClient.includes(required)) throw new Error('Ordered DEEB19 mutation delivery is missing: '+required);
}
const appSource = fs.readFileSync(path.join(root,'app.js'),'utf8');
const bikePreviewSource=appSource.slice(appSource.indexOf("bike-report-preview")-80,appSource.indexOf("bike-report-preview")+500); if (!bikePreviewSource.includes("esc(g.bike)") || bikePreviewSource.includes("(gi+1)")) throw new Error("Bike report preview title must use the registered bike number, not its display order.");

const memoPrintStart=appSource.indexOf('const printHtml=d=>');
const memoPrintEnd=appSource.indexOf('if($("#reportType").value==="branch_patrols")',memoPrintStart);
const memoPrintSource=memoPrintStart>=0&&memoPrintEnd>memoPrintStart?appSource.slice(memoPrintStart,memoPrintEnd):'';
if (!appSource.includes('fields.memos=fields.written_reports.map(field=>field.slice());') ||
    !appSource.includes('(["written_reports","memos"].includes(type)&&f[0]==="report_title")') ||
    !memoPrintSource.includes('if(["written_reports","memos"].includes($("#reportType").value))') ||
    !memoPrintSource.includes('const documentTitle=$("#reportType").value==="memos"?"مذكرة":"التقرير اليومي";') ||
    !memoPrintSource.includes('<section class="written-page">') ||
    !memoPrintSource.includes('<div class="meta">') ||
    !memoPrintSource.includes('<div class="report-body">') ||
    memoPrintSource.includes('<table') || memoPrintSource.includes('<tr>') || memoPrintSource.includes('<th>') || memoPrintSource.includes('<td>')) {
  throw new Error('Memo must reuse the daily report form and exact document layout, changing only its title without adding tables, columns, or rows.');
}
const memoTitleUses=(memoPrintSource.match(/documentTitle/g)||[]).length;
const memoTemplateBranches=(memoPrintSource.match(/\?\s*["']مذكرة["']/g)||[]).length;
if (memoTitleUses!==3 || memoTemplateBranches!==1 ||
    !memoPrintSource.includes('dateLabel(p.report_date||dayOf(record))') ||
    !memoPrintSource.includes('esc(p.shift||"—")') ||
    !memoPrintSource.includes('esc(p.prepared_by||"—")') ||
    !memoPrintSource.includes('esc(p.report_text||"")') ||
    !memoPrintSource.includes('width:208mm') ||
    !memoPrintSource.includes('min-height:279mm') ||
    !memoPrintSource.includes('font-size:18px')) {
  throw new Error('Memo and daily report must share one A4 template; only the document title may vary, with date, shift, preparer, body, dimensions, and typography preserved.');
}
const attachmentSaveStart=appSource.indexOf('const files=[...($("#documentFiles")?.files||[])];');
const attachmentSaveEnd=appSource.indexOf('const persisted=await DebooDB.getRecord(saved.id);',attachmentSaveStart);
const attachmentSaveSource=attachmentSaveStart>=0&&attachmentSaveEnd>attachmentSaveStart?appSource.slice(attachmentSaveStart,attachmentSaveEnd):'';
if (!attachmentSaveSource.includes('file.size>15*1024*1024') ||
    !attachmentSaveSource.includes('let savedRecord=null;') ||
    !attachmentSaveSource.includes('const saved=savedRecord=await DebooDB.save(type,payload,editId);') ||
    !appSource.includes('currentEdit=await DebooDB.getRecord(savedRecord.id)||savedRecord;') ||
    !appSource.includes('أضف الملفات المتبقية فقط')) {
  throw new Error('Document save must validate attachment sizes before creating a record and resume partial attachment uploads without creating duplicate records.');
}

const navigationStart = html.indexOf('<section class="tiles" id="mainTiles">');
const navigationEnd = html.indexOf('</section>', navigationStart);
const navigationHtml = navigationStart >= 0 && navigationEnd > navigationStart ? html.slice(navigationStart, navigationEnd) : '';
for (const page of ['home','operations','security','data','reportsGroup','archive','settings']) {
  if (!navigationHtml.includes('data-page="'+page+'"')) throw new Error('Main navigation tile is missing: '+page);
}
for (const label of ['لوحة التحكم','التشغيل الميداني','إدارة الأمن','البيانات الأساسية','التقارير والإحصائيات','الأرشيف العام','الإعدادات']) {
  if (!navigationHtml.includes(label)) throw new Error('Main navigation label was lost: '+label);
}
for (const required of ['class="tile-icon"','viewBox="0 0 24 24"']) if (!navigationHtml.includes(required)) throw new Error('Premium vector navigation icon system is missing: '+required);
if ((navigationHtml.match(/data-page=/g)||[]).length !== 8 || !navigationHtml.includes('data-page="officeTools"') || navigationHtml.includes('data-page="backup"')) throw new Error('Home must contain the eight primary navigation tiles, including Office Tools, with backup and restore nested under Settings.');
if (navigationHtml.includes('data-page="system"')) throw new Error('Legacy combined data/settings section must not remain in main navigation.');
const menuStart=appSource.indexOf('const sectionMenus=');
const menuEnd=appSource.indexOf(';',menuStart);
const menuSource=menuStart>=0&&menuEnd>menuStart?appSource.slice(menuStart,menuEnd+1):'';
if (!menuSource.includes('["tasks","المهام والتكليفات"]') || !menuSource.includes('["handovers","تسليم واستلام الشفت"]')) throw new Error('Tasks and handovers must remain available under field operations.');
if (menuSource.includes('tasksGroup:')) throw new Error('Tasks group must not remain as a duplicate top-level section.');
const groupsStart=appSource.indexOf('const pageGroups=');
const groupsEnd=appSource.indexOf(';',groupsStart);
const groupsSource=groupsStart>=0&&groupsEnd>groupsStart?appSource.slice(groupsStart,groupsEnd+1):'';
const dataGroupMatch=groupsSource.match(/data:\[([^\]]*)\]/);
const dataGroupSource=dataGroupMatch?.[1]||"";
if (!dataGroupSource.startsWith('"branches","patrol_people","bikes"') || dataGroupSource.includes('"employees"') || dataGroupSource.includes('"emergency_people"')) throw new Error('Employee and emergency-person registries must not be duplicated in general master data.');
if (!groupsSource.includes('emergency:["emergencies","emergency_people"]')) throw new Error('Emergency personnel must remain available inside the emergency section.');
if (!appSource.includes('else if(p==="tasksGroup"){render("operations");return;}')) throw new Error('Legacy tasks-group route must safely redirect to field operations.');

for (const required of ['function landing(){','function home(){','async function weather(city){','async function weatherCoords(']) if (!appSource.includes(required)) throw new Error('Core dashboard/weather feature was lost: '+required);
for (const required of ['id="weatherTemp"','id="weatherDesc"','id="weatherExtra"','id="weatherGo"','id="weatherGPS"']) if (!appSource.includes(required)) throw new Error('Landing weather control is missing: '+required);
for (const route of ['follow','emergency','map','bikeMaps','bikeMapReports','bikepatrol','reports','employees','managerRounds','handovers','data','attendance','incidents','tasks','stats','archive','backup','settings']) {
  if (!appSource.includes('p==="'+route+'"') && !appSource.includes('p === "'+route+'"')) throw new Error('Existing application route was lost: '+route);
}
const premiumCss = fs.readFileSync(path.join(root,'style.css'),'utf8');
for (const required of ['--gold-metal','linear-gradient','drop-shadow','weather-compact','prefers-reduced-motion']) if (!premiumCss.includes(required)) throw new Error('Premium visual/accessible UI styling is missing: '+required);

if (!androidSetup.includes('@PluginMethod\n    public void resolveSharedLocation') || !androidSetup.includes('setInstanceFollowRedirects(true)') || !androidSetup.includes('isGoogleMapsHost(finalUri.getHost())') || !androidSetup.includes('connection.setConnectTimeout(12000)')) throw new Error('Android ShareIntent must safely expand Google Maps short links and follow redirects');
if (!appSource.includes('async function resolveBikePatrolLocation') || !appSource.includes('input.addEventListener("blur"') || !appSource.includes('setTimeout(resolve,700)') || !appSource.includes('resolved?.content')) throw new Error('Bike patrol must resolve pasted and shared Google Maps links into saved coordinates');
if (!appSource.includes('// Exact dropped pin coordinates take precedence over the map\'s approximate camera center.')) throw new Error('Exact Google Maps pin coordinates must take precedence over approximate map-center coordinates');
const bikeReportDateTemplateStart=appSource.indexOf('if($("#reportType").value==="bike_patrols"){',appSource.indexOf('const printHtml'));
const bikeReportDateTemplateEnd=appSource.indexOf('\n  }\n  const rows=rowsFor(d),counts={};',bikeReportDateTemplateStart);
const bikeReportDateTemplate=bikeReportDateTemplateStart>=0&&bikeReportDateTemplateEnd>bikeReportDateTemplateStart?appSource.slice(bikeReportDateTemplateStart,bikeReportDateTemplateEnd):'';
if (!bikeReportDateTemplate.includes('class="bike-meta-date"') || !bikeReportDateTemplate.includes('<th>الموقع</th><th>توقيت المرور</th><th>الإحداثيات</th>') || bikeReportDateTemplate.includes('<th>التاريخ</th>') || !bikeReportDateTemplate.includes('عدد مرات المرور') || !bikeReportDateTemplate.includes('نوع الدراجة') || !bikeReportDateTemplate.includes('رقم الدراجة') || !bikeReportDateTemplate.includes('كود الدراجة') || !bikeReportDateTemplate.includes('class="bike-coordinates"') || bikeReportDateTemplate.includes('class="bike-notes"')) throw new Error('Bike patrol report metadata must contain one date field and the table must contain site, time and coordinates only');
const scannerBridgeSource = fs.readFileSync(path.join(root,'native-plugins-entry.js'),'utf8');
const androidAssetsSource = fs.readFileSync(path.join(root,'prepare-android.js'),'utf8');
const serviceWorkerSourceForScannerExclusion = fs.readFileSync(path.join(root,'sw.js'),'utf8');
const androidWorkflowSource = fs.readFileSync(path.join(root,'.github/workflows/android-apk.yml'),'utf8');
if (!androidAssetsSource.includes('"scanner.js"') || !serviceWorkerSourceForScannerExclusion.includes('./scanner.js') || !html.includes('src="scanner.js"') || !app.includes('window.DEebScanner.render()')) throw new Error('CamScanner page must be bundled, cached, and reachable from app navigation');
const scannerSource=fs.readFileSync(path.join(root,'scanner.js'),'utf8');
for (const token of ['scannerAutoDetect','scannerPickCorners','scannerSavePdf','recognizePages','createReportFromOcr','DebooDB.save("written_reports"','workerPath:"./ocr/worker.min.js"']) if (!scannerSource.includes(token)) throw new Error('CamScanner workflow is missing '+token);
if (!androidSetup.includes('["android:allowBackup", "false"]') || !androidSetup.includes('["android:usesCleartextTraffic", "false"]')) throw new Error('Android backup/network hardening is missing');
const iconBuilder = fs.readFileSync(path.join(root,'prepare-android-icons.js'),'utf8');
if (!iconBuilder.includes('ic_launcher_foreground.png') || !iconBuilder.includes('icon-512.png')) throw new Error('DEEB Play Store and adaptive launcher icon generation is missing');
if (cap.appName !== 'DEEB19') throw new Error('Android display name must be DEEB19');
if (pkg.name !== 'deeb-field-operations') throw new Error('Project package name must be deebo-field-operations');
if (cap.webDir !== 'www') throw new Error('Capacitor webDir must be the staged www directory');
if (!app.includes('const rowHeight=(row,ri)=>') || !app.includes('Math.min(409.5') || !app.includes('rowHeight(row,ri)')) throw new Error('Excel rows must expand to fit wrapped multi-line report content instead of clipping at a fixed height');
if (!app.includes('$(\"#enableBiometric\").onclick=async()=>') || !app.includes('$(\"#disableBiometric\").onclick=()=>')) throw new Error('Biometric settings handlers are missing');
if (!app.includes('localStorage.removeItem(BIOMETRIC_KEY)') || !app.includes('سيفتح التطبيق مباشرة دون PIN أو بصمة')) throw new Error('Direct unlock / biometric reset flow is missing');
if (!app.includes('يمكنك الدخول باستخدام PIN')) throw new Error('Biometric PIN fallback message is missing');
if (!app.includes('function lockApplication()') || !app.includes('document.visibilityState==="hidden"') || !app.includes('window.addEventListener("pagehide",lockApplication)')) throw new Error('Automatic PIN lock hooks are missing');
if (!sw.includes('deebo-local-v10-30') || sw.includes('deebo-local-v10-29')) throw new Error('Service worker cache version must advance to v10-30 so devices download the latest fixes');
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
  ['$("#pdfReport").onclick=async()=>', 'PDF-report button is not wired'],
  ['$("#excelReport").onclick=async()=>', 'Excel-report button is not wired'],
  ['$("#csvReport").onclick=async()=>', 'CSV-report button is not wired'],
  ['$("#saveReportImage").onclick=async()=>', 'Save-report-image button is not wired']
];
for (const [needle,message] of buttonBindingChecks) if (!app.includes(needle)) throw new Error(message);
const imageSaveStart=app.indexOf('$("#saveReportImage").onclick=async()=>');
const imageSaveEnd=app.indexOf('$("#pdfReport").onclick=',imageSaveStart);
const imageSaveHandler=imageSaveStart>=0&&imageSaveEnd>imageSaveStart?app.slice(imageSaveStart,imageSaveEnd):"";
if (!imageSaveHandler.includes('native.saveHtmlAsImages({html:reportCoordinatesOnly(readableReportHtml(printHtml(d)),d),name:"DEEB-report"})') || !imageSaveHandler.includes("result?.saved!==true") || !imageSaveHandler.includes("Number.isInteger(result.count)") || !imageSaveHandler.includes("result.count<1") || !imageSaveHandler.includes("finally{button.disabled=false;button.textContent=\"حفظ التقرير صورة\";")) throw new Error("Report image export must confirm at least one saved image and always restore the button state");

const readableStart=app.indexOf("const readableReportHtml="),readableEnd=app.indexOf('$("#saveReportImage").onclick=',readableStart),readableCss=readableStart>=0&&readableEnd>readableStart?app.slice(readableStart,readableEnd):"";
if(!readableCss.includes(".meta b,.overview-item span,.metric span,.bike-meta span{font-size:16px!important")||!readableCss.includes(".meta span,.overview-item b,.metric b,.bike-meta b{font-size:20px!important")||readableCss.includes("\\n .meta"))throw new Error("Shared report typography must apply metadata font sizes without escaped CSS selector separators");
if (/\bwolf\b|ذئب/i.test(app)) throw new Error('Printed DEEB reports must not contain a wolf icon or wolf branding');
if (app.split('DEEB</div>').length - 1 < 2) throw new Error('Both printed report templates must retain DEEB branding');
if (!app.includes('const coordinates=validCoordinatePair(lat,lng)?("خط العرض: "+lat+" | خط الطول: "+lng):(locationUrl||"—");') || !app.includes('const coordinates=validCoordinatePair(p.lat,p.lng)?("خط العرض: "+String(p.lat).trim()+" | خط الطول: "+String(p.lng).trim()):String(p.location_url||"").trim();')) throw new Error("Bike report and spreadsheet exports must prefer valid coordinates and fall back to map URL only when coordinates are invalid");


if (!imageExport.includes("writeWebViewToPdf(v)") || !imageExport.includes('WebView.enableSlowWholeDocumentDraw()') || !imageExport.includes('new android.graphics.pdf.PdfDocument()') || !imageExport.includes("renderer.openPage(index)") || !imageExport.includes("page.close()") || !imageExport.includes('replace("@media print","@media all")')) throw new Error("Image export must apply report styling, draw the full WebView document into paginated PDF pages, render each page independently, and close native page resources");
if (!app.includes('const pageSize=10,reportPages=') || !app.includes('branch-sheet-section') || !app.includes('groups.slice(i*pageSize,(i+1)*pageSize)') || !app.includes('class="branch-empty-row"') || !app.includes('length:Math.max(0,pageSize-page.length)') || !app.includes('const pageFooter=""') || app.includes("pageNumbering(269)")) throw new Error('Branch reports must use ten rows per page, leave unused rows blank, stretch the table, and omit bottom numbering');
if (!app.includes('const branchGroupsFor=d=>') || !app.includes('supervisor:[["employees","name"],["managers","name"],["patrol_people","name"]]')) throw new Error('Branch report supervisor grouping / saved suggestions are missing');
if (!app.includes('Math.max(0,Math.ceil(r.times.length/5)-1)')) throw new Error('Motorcycle screen preview and spreadsheet export must preserve all recorded visits');
if (!app.includes('Math.max(0,Math.ceil(r.times.length/5)-1)')) throw new Error('Motorcycle screen preview and spreadsheet export must preserve all recorded visits');
if (!app.includes('length:Math.max(0,20-pageRows.length)') || !app.includes('calc((100% - 10mm)/20)')) throw new Error('Motorcycle report must render 20 data rows per page and distribute the table height across all rows');
if (!app.includes('.bike-sheet-section .bike-meta>div{display:flex!important') || !app.includes('.bike-sheet-section .bike-meta span{display:inline!important') || !app.includes('.bike-sheet-section .bike-meta b{display:inline!important')) throw new Error('Motorcycle report metadata labels and values must be displayed side by side');
if (!app.includes("const timeMinutes=value=>") || !app.includes("const compareVisitTime=(a,b)=>") || !app.includes("dayOf(a).localeCompare(dayOf(b))||compareVisitTime(a,b)") || !app.includes("g.visits.map(v=>") || !app.includes("const maxRowsPerPage=20,pageCount=Math.max(1,Math.ceil(entries.length/maxRowsPerPage));") || !app.includes("entries.slice(page*maxRowsPerPage,(page+1)*maxRowsPerPage)") || !app.includes('const pageTitle=continuation?"باقي "+sectionTitle:sectionTitle;') || !app.includes("<th>الموقع</th><th>توقيت المرور</th><th>الإحداثيات</th>") || !app.includes('class="bike-meta-date"') || !app.includes('class="bike-coordinates"') || app.includes('class="bike-notes"') || !app.includes(".bike-table thead{display:table-header-group}") || !app.includes(".bike-sheet-section:last-child{break-after:auto!important;page-break-after:auto!important}") || !app.includes("pageIndex===pages.length-1")) throw new Error("Motorcycle report must show date in the header, use three table columns, paginate visits, repeat headers, and place approval on the final page");
if (!app.includes('filter(([k])=>k!=="bikes")')) throw new Error('Bike patrol reports must remain selectable while generic bikes categories stay hidden');
for(const rule of ['width:208mm!important','min-height:0!important','height:auto!important','padding:4mm!important','.bike-table th{font-size:14px!important','.bike-table td{font-size:12px!important','.bike-sheet-section:last-child{break-after:auto!important']) if(!app.includes(rule)) throw new Error('Motorcycle A4 print layout must use physical A4 width, preserve original text sizes, and fit the full report page: '+rule);
for(const rule of ['html{display:block!important;width:100%!important','body{display:block!important;width:208mm!important','margin:0 auto!important']) if(!app.includes(rule)) throw new Error('Motorcycle report must center its fixed-width body inside the full A4 page: '+rule);
if (!app.includes('locationUrl=String(p.location_url??"").trim()') || !app.includes('validCoordinatePair(lat,lng)?("خط العرض: "+lat+" | خط الطول: "+lng):(locationUrl||"—")') || !app.includes('validCoordinatePair(p.lat,p.lng)?("خط العرض: "+String(p.lat).trim()+" | خط الطول: "+String(p.lng).trim()):String(p.location_url||"").trim()')) throw new Error("Bike report must prefer valid coordinates and display the map URL only when coordinates are missing or invalid");
if (!app.includes('const displayRows=visible.flatMap') || !app.includes('continuation:i>0,visits:g.visits.slice(i*5,(i+1)*5)') || !app.includes('g.branch+(g.continuation?" — استكمال":"")')) throw new Error('Branch patrol continuation rows beyond five visits are missing from the screen or reports');
if (!app.includes('تقرير متابعة الفروع') || !app.includes('data:') && !app.includes('branchGroupsFor(d)')) throw new Error('Branch report matrix is missing');
const branchPrintStart=app.indexOf('const groups=branchGroupsFor(d),slots=5,title=',app.indexOf('const printHtml='));
const branchPrintEnd=app.indexOf('\n  }',branchPrintStart);
const branchPrint=branchPrintStart>=0&&branchPrintEnd>branchPrintStart?app.slice(branchPrintStart,branchPrintEnd):'';
if (!branchPrint.includes('const pageSize=10') || !branchPrint.includes('height:19mm!important') || !branchPrint.includes('break-inside:avoid!important;page-break-inside:avoid!important')) throw new Error('Branch follow-up PDF must use ten rows per page, preserve 19mm row height, and avoid row splits');
if (!branchPrint.includes('<th>الموقع</th><th>المشرف</th>') || !branchPrint.includes("<th>متابعة ") || branchPrint.includes('<th>اليوم والتاريخ</th>')) throw new Error('Branch reports must show location, supervisor and five follow-ups without a duplicate date column');
if (!app.includes('["الموقع","المشرف"') || !app.includes('g.supervisor,...Array.from({length:slots}')) throw new Error('Branch Excel/CSV export must match the seven-column branch follow-up layout without a duplicate date column');
if (!app.includes('.branch-sheet-section{display:flex!important;flex-direction:column!important;box-sizing:border-box!important;width:209mm!important;height:285mm!important') || !app.includes('.branch-sheet-section .branch-table tbody tr{height:17mm!important;min-height:17mm!important') || !app.includes('.branch-empty-row td{color:transparent!important}') || !app.includes('.branch-sheet-section .foot{flex:0 0 auto!important')) throw new Error('Branch report must reserve fixed space for eight complete rows without clipping');
if (!db.includes('const patrolDate=String(row.payload?.patrol_date||"").trim()')) throw new Error('Motorcycle backup restore must validate patrol_date rather than patrol_time');
if (!db.includes(String.raw`const day=/^\d{4}-\d{2}-\d{2}$/.test(patrolDate)?patrolDate:stamp.slice(0,10);`)) throw new Error('Motorcycle backup restore must correctly recognize YYYY-MM-DD patrol dates');


if (!app.includes('$("#recordForm")?.elements.namedItem("supervisor")?.focus()')) throw new Error("Quick branch patrol entry must open the form and focus the required supervisor field");
if (!app.includes("bindGlobalSearchSuggestions()") || !app.includes('input.setAttribute("list","globalSearchSuggestions")')) throw new Error("Global search autocomplete suggestions are missing");

console.log('PASS: required files, navigation hierarchy, reports archive/restore, script references, refreshed service-worker cache, package.json, Capacitor config, automatic-lock wiring, and chronological three-column motorcycle print reports (site, patrol time, coordinates) with report date in the header and continuation pages, with existing screen preview and spreadsheet export preserved.');

if (!app.includes('id="pdfReport"') || !app.includes('$("#pdfReport").onclick=async()=>') || !app.includes('native.saveHtmlAsPdf({html,name:"DEEB-report"})')) throw new Error('Direct PDF export action is missing');

if (!app.includes('data-report-type="written_reports">التقرير اليومي</button>') || app.includes('id="createWrittenReport"') || !app.includes('type==="written_reports"?"+ إضافة تقرير يومي":type==="memos"?"+ إضافة مذكرة":type==="bike_shift_assignments"?"+ إضافة توزيع":"+ إضافة سجل"') || !app.includes("documentTitle+'</h1>")) throw new Error('Daily report creation must stay in Follow-up while Reports only filters and prints saved reports');

if (!app.includes('const createXlsx=rows=>') || !app.includes('[Content_Types].xml') || !app.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') || !app.includes('DEEB-report.xlsx')) throw new Error('Excel export must create a valid XLSX workbook for Android Microsoft Excel');
if (!app.includes('<sheetFormatPr defaultRowHeight="22"/><cols>\'+columnWidths+\'</cols><sheetData>')) throw new Error('XLSX worksheet XML elements must follow the Excel schema order');
const bikeExcelStart=app.indexOf('const rowsForExport=d=>');
const bikeExcelEnd=app.indexOf('const saveFile=async(',bikeExcelStart);
const bikeExcel= bikeExcelStart>=0&&bikeExcelEnd>bikeExcelStart?app.slice(bikeExcelStart,bikeExcelEnd):"";
const bikeExcelStartAt=bikeExcel.indexOf('if($("#reportType").value==="bike_patrols"){');
const bikeExcelEndAt=bikeExcel.indexOf('return out;',bikeExcelStartAt);
const bikeExcelBlock=bikeExcelStartAt>=0&&bikeExcelEndAt>bikeExcelStartAt?bikeExcel.slice(bikeExcelStartAt,bikeExcelEndAt):"";
if (!bikeExcelBlock.includes('"مرور","الإحداثيات / رابط الموقع"') || bikeExcelBlock.includes('"ملاحظات"') || bikeExcelBlock.includes('p.notes') || !bikeExcelBlock.includes('g.visits.forEach(v=>') || !bikeExcelBlock.includes('dayOf(v)') || !app.includes('xl/styles.xml') || !app.includes('rightToLeft="1"') || !app.includes('<autoFilter ref=')) throw new Error("Bike Excel export must include date, bike metadata, site, visit time and coordinates only, with no notes column, in a styled RTL workbook with filters");

if (!app.includes('const sectionTitle="تقرير مرور دراجة "+g.reportNumber+" — "+g.person') || !app.includes('const pageTitle=continuation?"باقي "+sectionTitle:sectionTitle') || !app.includes('<h1 class="report-print-title">\'+pageTitle+\'</h1>') || !app.includes('groups=allGroups.filter(g=>selectedBikeReport==="all"||g.key===selectedBikeReport)') || !app.includes('id="bikeReportSelect"') || !app.includes('id="bikeQuickReports"')) throw new Error('Each motorcycle report must have its own dynamic selector and print only the selected bike');
if (!app.includes('reportDate=new Date().toLocaleDateString("ar-EG")') || !app.includes('weekday:"long"')) throw new Error('Bike patrol report must display the report date in its header and retain localized weekday date formatting where applicable');
if (!app.includes('const registrationOrder=new Map(registry.map((row,index)=>[normalize(row.payload?.number),index+1]))') || !app.includes('reportNumber:registrationOrder.get(normalize(g.bike))||index+1')) throw new Error('Bike report numbering must follow the saved registration order, independently of bike codes or lexical sorting');
if (!app.includes('const splitPersons=persons.length?persons:["—"]') || !app.includes('personVisits=person==="—"?g.visits.filter(v=>!String(v.payload?.person||v.payload?.responsible||"").trim()):g.visits.filter(v=>String(v.payload?.person||v.payload?.responsible||"").trim()===person)') || !app.includes('const sectionTitle="تقرير مرور دراجة "+g.reportNumber+" — "+g.person')) throw new Error('Bike patrol reports must split visits into a separate named report for each rider');
if (!app.includes('id="bikeMapReportPerson"') || !app.includes('const selectedPerson=personSelect.value') || !app.includes('meta:{bike,person,data:reportVisits.map') || !app.includes('(!person||String(p.person||p.responsible||"").trim()===person)')) throw new Error('Bike map reports and archived map snapshots must be filtered by the selected rider');
if (!app.includes('selectedBikeReport==="all"||g.key===selectedBikeReport') || !app.includes(String.raw`data-bike-number="'+esc(g.key)+'"`)) throw new Error('Bike report selector and export must target the bike-and-rider report key');
if (!app.includes('key=normalize(number);') || !app.includes('registry=data.filter(x=>x.entity_type===\"bikes\"&&!x.is_archived)') || !app.includes('bikeGroupsFor(data)') || !app.includes('data-bike-number=') || !app.includes('id="bikeQuickReports"') || app.includes('data-bike-index=') || app.includes('data-report-type="bike_patrols"') || !app.includes('showDate=type!=="bike_patrols"')) throw new Error('Motorcycle reports must have dynamically generated individual report actions for every registered bike, with no duplicate date column');
if (!app.includes('["patrol_date","تاريخ المرور","date",1]') || !app.includes('["bike_patrols","branch_patrols","manager_rounds"].includes(type)&&!isEditing&&f[0]==="patrol_date"')) throw new Error('Motorcycle follow-up form must include a required patrol date defaulting to today');
if (!app.includes('esc(g.date?new Date(g.date+"T00:00:00").toLocaleDateString("ar-EG"):reportDate)')) throw new Error('Motorcycle report must show the patrol date in its header, outside the table');
if (!app.includes('payload.patrol_date=oldDate||')) throw new Error('Motorcycle patrol date must still be stored automatically');

if (app.includes('saveFile("DEEB-report.xls"') || app.includes('application/vnd.ms-excel;charset=utf-8')) throw new Error('Legacy XML Spreadsheet export must not be mislabeled as XLS');

if (!app.includes('patrol_sites:[') || !app.includes('المخازن والمعارض ومراكز الخدمة')) throw new Error('Fixed patrol locations registry is missing');
if (!app.includes('function mapPage()') || !app.includes('function bikeMapsPage()') || !app.includes('function bikeMapReportsPage()') || !app.includes('فتح خط السير على خرائط Google') || !app.includes('else if(p==="bikeMaps")bikeMapsPage()')) throw new Error('Motorcycle route map pages are missing from the field-operations section');
if (!app.includes('function patrolTimeMinutes(value)') || !app.includes('comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time)')) throw new Error('Map and branch patrol lists must sort 24-hour, Arabic AM/PM, and Arabic-digit times chronologically');
if (!app.includes('js.addEventListener("load",draw,{once:true})') || !app.includes('js.addEventListener("error",()=>{const current=document.getElementById(targetId)')) throw new Error("Bike map loader must handle both first load and an already-loading Leaflet script");
if (!app.includes('raw.match(/^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})/)') || !app.includes('raw.match(/^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{4})/)')) throw new Error("Bike map date parser must recognize ISO and day-first dates");
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
if (!dbSource.includes('const DB_VERSION = 5') || !dbSource.includes('createAutoBackup') || !dbSource.includes('automatic_backups')) throw new Error('Daily local automatic backup store is missing');

if (!app.includes('patrol_date') || !app.includes('location_url') || !app.includes('extractSharedCoordinates')) throw new Error('WhatsApp fixed-location patrol flow is incomplete');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
if (manifest.name !== 'DEEB19' || manifest.short_name !== 'DEEB19') throw new Error('PWA display name must be DEEB19');
if (!html.includes('<title>DEEB19 |') || !html.includes('class="wordmark">DEEB19</div>') || html.includes('wolf-mark') || html.includes('شعار الذئب')) throw new Error('Visible DEEB19 wordmark-only branding is missing or a wolf icon remains');
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
if (!nativeShare.includes('saveHtmlAsImages') || !nativeShare.includes('saveHtmlAsPdf') || !nativeShare.includes('registerPlugin(FileExportPlugin.class)') || !nativeShare.includes('MediaStore.Images.Media.RELATIVE_PATH') || !nativeShare.includes('DIRECTORY_PICTURES+"/DEEB"')) throw new Error('Native report image export is missing');
if (!nativeShare.includes('view.loadDataWithBaseURL("https://localhost/",imageHtml,"text/html","UTF-8",null)') || !nativeShare.includes('writeWebViewToPdf(v)') || !nativeShare.includes('WebView.enableSlowWholeDocumentDraw()') || !nativeShare.includes('new android.graphics.pdf.PdfDocument()') || !nativeShare.includes('document.writeTo(output)') || !nativeShare.includes('renderer.openPage(index)') || !nativeShare.includes('page.render(bitmap,new android.graphics.Rect(0,0,width,height),null,android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_PRINT)') || !nativeShare.includes('nonWhite==0') || !nativeShare.includes('bitmap.compress(Bitmap.CompressFormat.PNG,100,out)') || !nativeShare.includes('PdfRenderer')) throw new Error('Native report image export must use Android native pagination, convert each PDF page to PNG, and reject blank pages');
if (imageExport.includes('canvas.drawText("صفحة "+(index+1)+" من "+pageCount') || nativeShare.includes('canvas.drawText("صفحة "+(index+1)+" من "+pageCount')) throw new Error('No report image or print output may overlay page numbers');
if (!nativeShare.includes('.replace("@media print","@media all")+"<style>.report-page-number{display:none!important}</style>"')) throw new Error("PNG capture must hide HTML page numbers because the native renderer adds the single page footer");
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
if (!bikeReportSource.includes('person:persons.join("، ")||"—"') || bikeReportSource.includes("person:String(bp.person")) throw new Error("Bike report must show rider names from daily patrol records, not fixed bike master data.");
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
if (!app.includes('written_reports:"التقرير اليومي"') || !app.includes('"written_reports","memos"]') || app.includes('id="createWrittenReport"') || !app.includes('data-report-type="written_reports"') || !app.includes('type==="written_reports"?"+ إضافة تقرير يومي":type==="memos"?"+ إضافة مذكرة":type==="bike_shift_assignments"?"+ إضافة توزيع":"+ إضافة سجل"')) throw new Error('Daily report creation must be available from Follow-up and not duplicated in Reports');
if (!app.includes('if(type==="written_reports"||type==="memos"){const list=rows(type)') || !app.includes('data-edit="') || !app.includes('data-archive="')) throw new Error('Written report list must show saved reports with edit and archive actions');
if (!app.includes('memos:"مذكرة"') || !app.includes('fields.memos=fields.written_reports.map') || !app.includes('data-report-type="memos">المذكرة</button>') || !db.includes('"tasks","memos"')) throw new Error('Memo section must clone daily report fields and remain a separate dated record type');
if (!app.includes('@page branch-followup{size:A4 portrait;margin:2mm 3mm 1mm 3mm!important}') || !app.includes('.branch-pdf-mode .branch-sheet-section{page:branch-followup!important;box-sizing:border-box!important;width:204mm!important') || !app.includes('.branch-pdf-mode .branch-sheet-section .branch-table tbody tr{height:19mm!important;min-height:19mm!important') || !app.includes('outputHtml.replace("<body>","<body class=\\"branch-pdf-mode\\">")') || !app.includes('saveHtmlAsImages({html:reportCoordinatesOnly(readableReportHtml(printHtml(d)),d),name:"DEEB-report"}')) throw new Error("Branch PDF must use equal A4 side margins and ten 19mm rows without changing image export styling");
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
if (!app.includes('class=\\\"report-preview-title\\\">') || !app.includes('"تقرير مرور دراجة "+g.reportNumber') || !app.includes('class=\\\"report-preview-title\\\">تقرير متابعة الفروع</') || !app.includes('.report-print-title{display:block!important;width:100%!important')) throw new Error("Bike and branch report headings must be explicit, prominent, and readable in preview and print");
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
if (!bikePrint.includes('const maxRowsPerPage=20') || !bikePrint.includes('length:Math.max(0,20-pageRows.length)') || !bikePrint.includes('calc((100% - 10mm)/20)') || !bikePrint.includes('height:calc((100% - 10mm)/20)!important;')) throw new Error('Each motorcycle report page must contain exactly 20 patrol rows and use the available printable height');
if (!app.includes('.bike-sheet-section .bike-meta>div{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:7px!important;min-width:0!important}') || !app.includes('.bike-sheet-section .bike-meta span{display:inline!important;flex:0 0 auto!important;white-space:nowrap!important}') || !app.includes('.bike-sheet-section .bike-meta b{display:inline!important;min-width:0!important;margin:0!important;overflow-wrap:anywhere!important}')) throw new Error('Motorcycle metadata labels and values must be displayed side by side to free vertical space');
if (!bikePrint.includes('background:#073b28;color:#fff') || !bikePrint.includes('border:1px solid #c99a32') || !bikePrint.includes('background:#fbf4e6')) throw new Error('Bike report PDF and image exports must preserve DEEB green, gold, and beige visual identity');
if (!app.includes('if(["written_reports","memos"].includes($("#reportType").value))') || !app.includes('class="report-body"') || !app.includes('class="written-page"') || !app.includes('esc(p.report_text||"")')) throw new Error('Written reports must print each saved narrative as a standalone report');
const writtenPrintStart=app.indexOf('if(["written_reports","memos"].includes($("#reportType").value))',app.indexOf('const printHtml='));
const writtenPrintEnd=app.indexOf('if($("#reportType").value==="branch_patrols")',writtenPrintStart);
const writtenPrint=app.slice(writtenPrintStart,writtenPrintEnd);
if (!writtenPrint.includes('background:#073b28') || !writtenPrint.includes('background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)') || !writtenPrint.includes('border:1.5px solid #c99a32')) throw new Error('Written report print must use DEEB green, burgundy, and gold identity');
if (writtenPrint.includes('min-height:275mm') || writtenPrint.includes('min-height:135mm')) throw new Error('Written report must not force oversized blank page areas');
if (!writtenPrint.includes('.written-inner{display:flex;flex-direction:column;width:100%;min-height:279mm;padding:4mm 5mm;transform:none}') || !writtenPrint.includes('.report-body{flex:1 0 auto;min-height:185mm;') || !writtenPrint.includes('margin-top:auto;padding-bottom:2mm')) throw new Error("Daily written report must expand to use the A4 page while retaining readable content and footer");
if (!writtenPrint.includes('orphans:2;widows:2') || !writtenPrint.includes('break-inside:avoid;page-break-inside:avoid')) throw new Error('Written report pagination safeguards are missing');
if (writtenPrint.includes('height:277mm') || writtenPrint.includes('overflow:hidden') || writtenPrint.includes('function fitWrittenPages()') || writtenPrint.includes('inner.style.transform="scale("+scale+")"')) throw new Error('Written reports must continue onto additional pages without shrinking or clipping content');
if (writtenPrint.includes('counter(page)') || (writtenPrint.match(/@bottom-center/g)||[]).length) throw new Error('Single-page written report must not have an unconditional page number; numbering is enabled only by the multi-page print hook');
if (app.includes('const pageNumbering=') || app.includes('counter(page)') || app.includes('@bottom-center') || app.includes('pageNumbering(')) throw new Error('All printed report templates must omit page numbering entirely');
if (!app.includes('height:auto;max-width:none;margin:0;padding:0;overflow:visible;break-after:page')) throw new Error('Written report pages must grow naturally and preserve the original font size');
const sharedIdentity='repeating-linear-gradient(180deg,#f7df91 0 4px,#b88622 5px 8px,#f7df91 9px 11px)';
if ((app.split('/* DEEB shared reference identity */').length-1)!==4) throw new Error('All four report templates must embed the same approved DEEB visual identity');
for (const rule of ['.brand-name{font-family:Georgia','h1:before,h1:after{content:""!important','background:#073b28!important','background:#fbf4e6!important','border:1.5px solid #c99a32!important','background:#f6ead2!important']) if ((app.split(rule).length-1)<4) throw new Error('A report template is missing shared DEEB identity rule: '+rule);
if (!app.includes(sharedIdentity) || !app.includes('h1{position:relative!important;isolation:isolate!important')) throw new Error('Report titles must use the gold winged burgundy banner from the approved reference');

 // Automatic-backup status must be visible in the dedicated backup/restore page, not in Settings.
const backupPageStart=app.indexOf('async function openBackupPage(){');
const backupPageEnd=app.indexOf('function render(p)',backupPageStart);
const backupPageSource=backupPageStart>=0&&backupPageEnd>backupPageStart?app.slice(backupPageStart,backupPageEnd):'';
if (!backupPageSource.includes('تم تحديث النسخة التلقائية لهذا اليوم') || !backupPageSource.includes('تجاوز 30 ميجابايت') || !backupPageSource.includes('DebooDB.createAutoBackup()')) throw new Error('Automatic backup status and attachment-size warning must be visible in the dedicated backup page');

const androidAssets = fs.readFileSync(path.join(root,'prepare-android.js'),'utf8');
if (!androidAssets.includes('"scanner.js"') || !html.includes('src="scanner.js"') || !sw.includes('./scanner.js')) throw new Error('Document scanner assets must be staged and cached.');

const readableRules = [
  'const readableReportHtml=html=>html.replace("</style>"',
  '.report-body{color:#000!important;font-size:20px!important;font-weight:800!important',
  '.report-table td,.branch-table td,.bike-table td{color:#000!important',
  '.report-table td,.branch-table td,.bike-table td{color:#000!important;-webkit-text-fill-color:#000!important;font-size:19px!important;font-weight:800!important',
  '.bike-table td.bike-coordinates,.bike-table td.bike-patrol-times{font-size:16px!important;font-weight:800!important',
  'reportCoordinatesOnly(readableReportHtml(printHtml(d)),d)',
  'const html=readableReportHtml(printHtml(d));'
];
for (const rule of readableRules) if (!app.includes(rule)) throw new Error('All report outputs must apply high-contrast black, larger, bold data text: '+rule);

if (!app.includes('.meta span,.overview-item b,.metric b,.bike-meta b{font-size:20px!important;font-weight:800!important')) throw new Error('Report metadata values must use 20px bold typography');
if (!app.includes('.bike-table td.bike-coordinates,.bike-table td.bike-patrol-times{font-size:16px!important;font-weight:800!important')) throw new Error('Bike patrol time and coordinate data must use 16px bold typography');

if (!app.includes('.report-table th,.branch-table th,.bike-table th{font-size:16px!important;font-weight:900!important')) throw new Error('Report table headings must remain smaller than data text');

if (!app.includes('fields.memos=fields.written_reports.map(field=>field.slice());')) throw new Error('Memo fields must be an exact clone of the daily written-report fields');
if (!app.includes('deeb-map-details') || !app.includes('deebRouteStatus') || !app.includes('router.project-osrm.org/route/v1/driving/')) throw new Error('Bike map report must include detailed route points, road routing, and route status');
if (app.includes('الخريطة مرسومة من إحداثيات نقاط المرور المحفوظة') || app.includes('فتح المسار على خرائط Google</a></p>') || !app.includes('.deeb-map-details li b,.deeb-map-details li span,.deeb-map-details li small{display:block;font-size:9px;line-height:1.25;overflow-wrap:anywhere}') || !app.includes('.deeb-map-details h3{margin:0 0 4px;color:#073b28;font-size:11px}')) throw new Error('Printed bike map must omit the two white-area lines and use the reclaimed space for larger, clearer point details');
if (!app.includes('const detailPoints=visits.map((x,i)=>') || !app.includes('detailPoints.map((p,index)=>') || !app.includes('Math.floor(index/detailRowCount)+1') || !app.includes('index%detailRowCount+1') || !app.includes('الإحداثيات غير مسجلة') || !app.includes('const detailRowCount=Math.max(1,Math.ceil(detailPoints.length/3))') || !app.includes('.deeb-report-map{height:120mm;width:100%') || !app.includes('grid-auto-rows:min-content;grid-auto-flow:row;align-content:start') || app.includes('height:125mm;grid-template-rows:repeat(') || !app.includes('grid-template-columns:repeat(3,minmax(0,1fr))') || !app.includes('grid-auto-flow:row') || !app.includes('list-style:none') || !app.includes('height:289mm')) throw new Error('Bike map exports must fit every patrol visit, including visits without coordinates, with the map and all details on one A4 page in three ordered columns without duplicate list markers.');
if (!app.includes('meta:{bike,data:reportVisits.map(x=>({id:x.id,created_at:x.created_at,payload:x.payload||{}}))}') || !app.includes('if(type==="bike_map"){') || !app.includes('var pts=\\[[\\s\\S]*?\\];function safe') || !app.includes('detailList=points.map')) throw new Error('Archived bike maps must rebuild their route and printed point details from the selected date\'s saved patrol coordinates');
if (app.includes('reportVisits=visits;const located=visits.filter') || !app.includes('  reportVisits=visits;\n  const located=visits.filter')) throw new Error('Bike map visits must be scoped to the report builder and must not break the live bike maps page');
if (!app.includes('reportArchives.forEach(item=>') || !app.includes('const bike=String(meta.bike||"").trim()') || !app.includes('records=[...data,...archived]')) throw new Error('Legacy archived bike maps must recover patrol coordinates from active and archived records for the selected date');
if (!app.includes('data-deeb-route-ready') || !app.includes('saveHtmlAsImages')) throw new Error('Bike map image export must preserve map and route readiness markers');
const exporter = fs.readFileSync(path.join(root,'configure-android-share.js'),'utf8');
if (!exporter.includes('var mapWait=new Promise') || !exporter.includes('data-deeb-map-tiles') || !exporter.includes('data-deeb-route-ready')) throw new Error('Android image export must wait for map tiles and route completion before capturing the report');


// Export regression checks: validate the XLSX package structure, RTL worksheet,
// CSV quoting/BOM, and Android A4 print/image rendering safeguards.
const xlsxStart = appSource.indexOf('const createXlsx=rows=>');
const xlsxEnd = appSource.indexOf('const reportCoordinatesOnly=', xlsxStart);
const xlsxSource = xlsxStart >= 0 && xlsxEnd > xlsxStart ? appSource.slice(xlsxStart, xlsxEnd) : '';
if (!xlsxSource.includes('t="inlineStr"') || !xlsxSource.includes('sheetView rightToLeft="1"') ||
    !xlsxSource.includes('replace(/&/g,"&amp;")') || !xlsxSource.includes('[0x50,0x4b,0x03,0x04') ||
    !xlsxSource.includes('[0x50,0x4b,0x01,0x02') || !xlsxSource.includes('[0x50,0x4b,0x05,0x06')) {
  throw new Error('Excel export must produce a valid UTF-8 ZIP/XLSX package with escaped Arabic-compatible inline strings and RTL layout.');
}
if (!appSource.includes('replace(/"/g,\'""\')') || !appSource.includes('"\\ufeff"+csv')) {
  throw new Error('CSV export must escape embedded quotes and include a UTF-8 BOM for Arabic spreadsheet compatibility.');
}
if (!exporter.includes('PrintAttributes.MediaSize.ISO_A4.asPortrait()') ||
    !exporter.includes('new PrintAttributes.Resolution("DEEB","DEEB",300,300)') ||
    !exporter.includes('waitForReportResources(v, handler, 30000')) {
  throw new Error('Android print export must wait for report resources and use portrait A4 at 300 dpi.');
}
if (!exporter.includes('PdfRenderer.Page.RENDER_MODE_FOR_PRINT') ||
    !exporter.includes('صفحة التقرير رقم ') ||
    !exporter.includes('removePartialImages.run()')) {
  throw new Error('Report image export must render print-quality pages, reject blank pages, and remove partial images on failure.');
}

if (!exporter.includes('final int width=1588,height=2246') ||
    !exporter.includes('Environment.DIRECTORY_PICTURES+"/DEEB"') ||
    !exporter.includes('baseName+"-"+String.format(java.util.Locale.US,"%02d",index+1)+".png"') ||
    !exporter.includes('MediaStore.Images.Media.IS_PENDING,1') ||
    !exporter.includes('MediaStore.Images.Media.IS_PENDING,0')) {
  throw new Error('Report image export must save numbered A4 portrait PNG pages into Pictures/DEEB without exposing incomplete files.');
}
if (!exporter.includes('if(pageCount<1||pageCount>100)') ||
    !exporter.includes('handler.postDelayed(()->{if(!finished.get())fail.reject("انتهت مهلة تجهيز صور التقرير بعد 120 ثانية.') ||
    !exporter.includes('if(tempPdf.exists())tempPdf.delete()') ||
    !exporter.includes('getContentResolver().delete(uri,null,null)')) {
  throw new Error('Report image export must cap page count, enforce a timeout, clean temporary PDFs, and delete incomplete image files.');
}

// Navigation regression checks: every section-menu entry must resolve to one route.
const menuEntries = [...menuSource.matchAll(/\["([^"]+)","[^"]+"\]/g)].map(match => match[1]);
if (new Set(menuEntries).size !== menuEntries.length) {
  const duplicates = menuEntries.filter((page, index) => menuEntries.indexOf(page) !== index);
  throw new Error('A navigation destination appears more than once: ' + [...new Set(duplicates)].join(', '));
}
const renderStart = appSource.indexOf('function render(p){');
const renderEnd = appSource.indexOf('window.DEebRender=render;', renderStart);
const renderSource = renderStart >= 0 && renderEnd > renderStart ? appSource.slice(renderStart, renderEnd) : '';
if (!renderSource) throw new Error('Main render dispatcher could not be located.');
for (const page of menuEntries) {
  if (!renderSource.includes('p==="' + page + '"')) {
    throw new Error('Section-menu destination has no render route: ' + page);
  }
}
const dataPageStart = appSource.indexOf('function dataManagementPage()');
const dataPageEnd = appSource.indexOf('\nfunction emergencyPage()', dataPageStart);
const dataPageSource = dataPageStart >= 0 && dataPageEnd > dataPageStart ? appSource.slice(dataPageStart, dataPageEnd) : '';
if (!dataPageSource.includes('pageHead("البيانات الأساسية"') || !/id=\\?"backSystem\\?"/.test(dataPageSource) || !dataPageSource.includes('رجوع للقائمة الرئيسية') || !dataPageSource.includes('render("landing")')) {
  throw new Error('Master-data page title or return-to-main-menu navigation is missing.');
}
if (new Set([...pageGroupsDataTypes()]).size !== pageGroupsDataTypes().length) {
  throw new Error('A master-data record type is duplicated in the data navigation.');
}
const dataTypes = pageGroupsDataTypes();
if (dataTypes.includes('employees') || dataTypes.includes('emergency_people')) {
  throw new Error('Employee registry and emergency responders must not be duplicated in master-data navigation.');
}
if (!menuSource.includes('["employees","سجل الموظفين"]') || !groupsSource.includes('emergency:["emergencies","emergency_people"]')) {
  throw new Error('Employee registry must remain under Security and emergency responders must remain under Emergency.');
}
const allGroupedTypes = [...groupsSource.matchAll(/(?:follow|data|emergency):\[([^\]]*)\]/g)]
  .flatMap(match => [...match[1].matchAll(/"([^"]+)"/g)].map(item => item[1]));
if (new Set(allGroupedTypes).size !== allGroupedTypes.length) {
  throw new Error('A record type appears in more than one grouped data page.');
}
function pageGroupsDataTypes() {
  const match = groupsSource.match(/data:\[([^\]]*)\]/);
  return match ? [...match[1].matchAll(/"([^"]+)"/g)].map(item => item[1]) : [];
}


// PowerPoint presentation library must support create/open/search/duplicate/rename/delete without losing saved decks.
const pptSource = fs.readFileSync(path.join(root,"powerpoint-editor.js"),"utf8");
for (const token of ["pptManager","pptNew","pptSearch","renderManager","openDeck","إعادة تسمية","نسخة","حذف العرض"]) { if (!pptSource.includes(token)) throw new Error("PowerPoint presentation management is missing: "+token); }
if (!pptSource.includes("launch.onclick=showManager") || !pptSource.includes('el("pptExit").onclick=function(){save();showManager()}')) throw new Error("PowerPoint must return to the presentation library after editing.");

for (const token of ["pptTemplateType","pptCreateTemplate","function makeTemplate(kind)","تقرير إداري","اجتماع العمل","عنوان البرنامج التدريبي","خطة العمل","localStorage.setItem(KEY,JSON.stringify(all))","bg:\"#0A1729\"","color:\"#F0D58D\"","var gold=\"#D6A743\"","DEEB19  •  "]) { if (!pptSource.includes(token)) throw new Error("PowerPoint built-in template capability is missing: "+token); }

// General Archive must be an independent main-navigation destination with searchable archived content.
if (!html.includes('data-page="archive"') || !app.includes('p==="archive"') || !app.includes('async function openArchivePage(){') || !app.includes('const open=$("#showArchive");') || !app.includes('back.textContent="القائمة الرئيسية"')) {
  throw new Error('General Archive must open independently from the main navigation.');
}
if (!app.includes('id="archiveSearchInput"') || !app.includes('matchesArchiveSearch(x)') || !app.includes('data-print-report-archive')) {
  throw new Error('General Archive must support searching saved reports and retain report print actions.');
}


const settingsStart=appSource.indexOf('function settings(){');
const backupStart=appSource.indexOf('async function openBackupPage(){');
const settingsSource=settingsStart>=0&&backupStart>settingsStart?appSource.slice(settingsStart,backupStart):'';
if (!settingsSource.includes('settingsHome') || !settingsSource.includes('id="settingsBackup"') || /backupBtn|restoreFile|createAutoBackup|automaticBackups/.test(settingsSource) || !appSource.includes('$("#settingsBackup").onclick=()=>render("backup")') || !appSource.includes('$("#backupHome").onclick=()=>render("settings")')) throw new Error('Backup and restore must appear once as a Settings child branch, without duplicating its controls.');
if (!appSource.includes('async function openBackupPage()') || !appSource.includes('else if(p==="backup")openBackupPage();')) throw new Error('Backup and restore must have their own page and route.');
if (!appSource.includes('else if(p==="data")dataManagementPage();')) throw new Error('Basic data must have its own independent route.');
if (appSource.includes('<button class="secondary" id="showArchive">الأرشيف العام</button>')) throw new Error('General Archive must be opened from its independent main navigation tile.');

// Bike patrol records must consume the saved daily bike/rider shift assignment.
for (const token of [
  'function findBikeShiftAssignment(workDate,shift,bikeNumber)',
  'payload.assignment_id=linked.record.id',
  'payload.assigned_bike_id=linked.bike.id',
  'payload.assigned_person_id=linked.person.id',
  'payload.assignment_status=',
  'showBikeAssignment?"<th>ربط الشفت</th>":""',
  'سجل قديم / غير مرتبط بتوزيع محفوظ',
  'person.dataset.autoAssignment',
  'status.id="bikeAssignmentStatus"',
  '["shift","الشفت","select","صباحي|مسائي|ليلي",1]'
]) {
  if (!appSource.includes(token)) throw new Error('Bike patrol shift-assignment integration is missing: '+token);
}
if (!appSource.includes('id="openBikeShiftAssignments"') ||
    !appSource.includes('$("#openBikeShiftAssignments").onclick=()=>render("bikeShiftAssignments")') ||
    !appSource.includes('$("#openBikeMaps").onclick=()=>render("bikeMaps")')) {
  throw new Error('Bike patrol page must provide direct navigation to shift assignment and route maps.');
}
if (!appSource.includes('String(x.payload?.work_date||"").slice(0,10)===String(workDate).slice(0,10)') ||
    !appSource.includes('String(x.payload?.shift||"")===String(shift)') ||
    !appSource.includes('String(a.bike_id||"")===String(bike.id)')) {
  throw new Error('Bike patrol assignment lookup must match the exact date, shift, and registered bike.');
}

