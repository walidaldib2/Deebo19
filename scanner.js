(() => {
"use strict";
let sourceImage=null,rotation=0,filter="color",crop={left:0,top:0,right:0,bottom:0},pages=[],quad=[],pickCorners=false;
const $=s=>document.querySelector(s);
function status(message,error=false){const el=$("#scannerStatus");if(el){el.textContent=message;el.classList.toggle("scanner-error",error);}}
function scannerMarkup(){
 const area=$("#contentArea");if(!area)return;
 area.innerHTML='<style id="deebScannerStyles">.scanner-card{display:grid;gap:14px}.scanner-preview{background:#050c19;border:1px solid #334155;border-radius:12px;padding:8px;text-align:center;overflow:auto}.scanner-preview canvas{max-width:100%;max-height:65vh;object-fit:contain;border-radius:8px}.scanner-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}.scanner-pages{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}.scanner-page{background:#14243a;border:1px solid #334155;border-radius:10px;padding:8px;display:grid;gap:6px}.scanner-page img{width:100%;height:150px;object-fit:contain;background:#fff;border-radius:6px}.scanner-file-label{display:inline-flex;align-items:center;justify-content:center;cursor:pointer}.scanner-error{color:#ffb4b4}.scanner-note{line-height:1.8}#scannerOcrText{width:100%;min-height:180px;direction:auto;white-space:pre-wrap}</style><div class="page-head"><h1>ماسح المستندات</h1><button class="secondary" id="scannerBack">رجوع</button></div>'+
 '<div class="card scanner-card"><p class="muted">صوّر المستند أو اختر صورة، ثم اكشف حدود الورقة تلقائيًا أو حدد زواياها وصحح المنظور قبل الحفظ.</p>'+
 '<div class="actions"><label class="primary scanner-file-label" for="scannerCamera">📷 تصوير مستند</label><input id="scannerCamera" class="hidden" type="file" accept="image/*" capture="environment"><label class="secondary scanner-file-label" for="scannerGallery">اختيار صورة</label><input id="scannerGallery" class="hidden" type="file" accept="image/*"></div>'+
 '<div id="scannerEditor" class="hidden"><div class="scanner-preview"><canvas id="scannerCanvas" aria-label="معاينة المستند"></canvas></div>'+
 '<div class="actions"><button class="primary" id="scannerAutoDetect">كشف حدود الورقة تلقائيًا</button><button class="secondary" id="scannerPickCorners">تحديد الزوايا يدويًا</button><button class="secondary" id="scannerClearCorners">إلغاء تحديد الزوايا</button></div>'+
 '<p id="scannerCornerHelp" class="muted">الكشف التلقائي مبدئي؛ راجع العلامات الأربع وعدّلها بالنقر على الصورة عند الحاجة.</p>'+
 '<div class="form scanner-controls"><div class="field"><label for="cropLeft">قص من اليسار</label><input id="cropLeft" type="range" min="0" max="35" value="0"></div><div class="field"><label for="cropTop">قص من الأعلى</label><input id="cropTop" type="range" min="0" max="35" value="0"></div><div class="field"><label for="cropRight">قص من اليمين</label><input id="cropRight" type="range" min="0" max="35" value="0"></div><div class="field"><label for="cropBottom">قص من الأسفل</label><input id="cropBottom" type="range" min="0" max="35" value="0"></div></div>'+
 '<div class="actions scanner-filters"><button class="secondary" data-filter="color">ألوان</button><button class="secondary" data-filter="gray">رمادي</button><button class="secondary" data-filter="bw">أبيض وأسود</button><button class="secondary" data-filter="enhance">تحسين</button><button class="secondary" id="scannerRotate">تدوير 90°</button></div>'+
 '<div class="actions"><button class="primary" id="scannerAddPage">إضافة الصفحة المصححة</button><button class="secondary" id="scannerResetCrop">إعادة ضبط القص</button></div></div>'+
 '<div class="card"><h3>صفحات المستند <span id="scannerPageCount" class="pill">0</span></h3><div id="scannerPages" class="scanner-pages"><p class="muted">لم تتم إضافة صفحات بعد.</p></div>'+
 '<div class="actions"><button class="primary" id="scannerSavePdf" disabled>حفظ كل الصفحات PDF</button><button class="secondary" id="scannerSaveImages" disabled>حفظ الصور منفصلة</button><button class="danger" id="scannerClear" disabled>مسح المستند</button></div></div>'+
 '<p id="scannerStatus" class="notice" aria-live="polite">ابدأ بتصوير المستند أو اختيار صورة.</p>'+
 '<div class="card"><h3>قراءة النص من المستند (OCR)</h3><p class="muted">تعرّف ضوئي على النص العربي والإنجليزي. يحتاج اتصال إنترنت في أول تشغيل لتحميل محرك القراءة وملفات اللغة.</p><div class="actions"><button class="primary" id="scannerRunOcr" type="button">قراءة النص من الصفحات</button><button class="secondary" id="scannerCopyOcr" type="button">نسخ النص</button></div><textarea id="scannerOcrText" rows="8" placeholder="سيظهر النص المستخرج هنا للمراجعة والتصحيح..."></textarea><div class="form"><div class="field"><label for="scannerReportTitle">عنوان التقرير الجديد</label><input id="scannerReportTitle" value="تقرير مستخرج من مستند"></div><div class="field"><label for="scannerReportShift">الشفت</label><select id="scannerReportShift"><option value="ليلي">ليلي</option><option value="صباحي">صباحي</option><option value="مسائي">مسائي</option></select></div><div class="field"><label for="scannerPreparedBy">معد التقرير (اختياري)</label><input id="scannerPreparedBy" placeholder="اسم معد التقرير"></div></div><div class="actions"><button class="primary" id="scannerCreateReport" type="button">نقل النص إلى تقرير جديد داخل DEEB</button></div></div><p class="muted scanner-note">راجع النص المستخرج وصحح الأسماء والأرقام قبل حفظ التقرير؛ دقة OCR تتأثر بجودة الصورة والخط.</p></div>';
 $("#scannerBack").onclick=()=>{if(typeof window.DEebRender==="function")window.DEebRender("home");else document.querySelector('[data-page="home"]')?.click();};
 $("#scannerCamera").onchange=loadFile;$("#scannerGallery").onchange=loadFile;$("#scannerRunOcr").onclick=recognizePages;$("#scannerCopyOcr").onclick=copyOcrText;$("#scannerCreateReport").onclick=createReportFromOcr;
 ["cropLeft","cropTop","cropRight","cropBottom"].forEach(id=>$("#"+id).addEventListener("input",()=>{crop[id.replace("crop","").toLowerCase()]=Number($("#"+id).value);quad=[];drawPreview();}));
 document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));drawPreview();});
 $("#scannerRotate").onclick=()=>{rotation=(rotation+90)%360;quad=[];drawPreview();};
 $("#scannerResetCrop").onclick=()=>{crop={left:0,top:0,right:0,bottom:0};["cropLeft","cropTop","cropRight","cropBottom"].forEach(id=>$("#"+id).value=0);quad=[];drawPreview();};
 $("#scannerAutoDetect").onclick=autoDetect;$("#scannerPickCorners").onclick=()=>{pickCorners=true;quad=[];$("#scannerCornerHelp").textContent="انقر على زوايا الورقة بالترتيب: أعلى اليسار، أعلى اليمين، أسفل اليمين، أسفل اليسار.";drawPreview();};
 $("#scannerClearCorners").onclick=()=>{quad=[];pickCorners=false;drawPreview();status("تم إلغاء تحديد الزوايا.");};
 $("#scannerCanvas").onclick=canvasPick;
 $("#scannerAddPage").onclick=addPage;$("#scannerSavePdf").onclick=savePdf;$("#scannerSaveImages").onclick=saveImages;$("#scannerClear").onclick=clearPages;renderPages();
}
async function ensureOcrEngine(){
 if(window.Tesseract?.createWorker)return window.Tesseract;
 if(window.__deebOcrLoading)return window.__deebOcrLoading;
 window.__deebOcrLoading=new Promise((resolve,reject)=>{
  const script=document.createElement("script");script.src="./ocr/tesseract.min.js";script.async=true;
  script.onload=()=>window.Tesseract?.createWorker?resolve(window.Tesseract):reject(new Error("محرك OCR المحلي غير جاهز."));
  script.onerror=()=>reject(new Error("ملفات OCR المحلية غير موجودة. أعد تثبيت نسخة Android المجهزة بمحرك القراءة."));
  document.head.appendChild(script);
 }).finally(()=>{window.__deebOcrLoading=null});
 return window.__deebOcrLoading;
}
window.DEebLoadOcrEngine=ensureOcrEngine;
async function recognizePages(){
 const button=$("#scannerRunOcr"),output=$("#scannerOcrText");if(!pages.length){status("أضف صفحة واحدة على الأقل قبل قراءة النص.",true);return;}
 button.disabled=true;output.value="";let worker=null;
 try{
  status("جارٍ تحميل محرك قراءة النص العربي والإنجليزي...");
  const engine=await ensureOcrEngine();
  worker=await engine.createWorker(["ara","eng"],1,{workerPath:"./ocr/worker.min.js",langPath:"./lang",corePath:"./core",gzip:false,logger:e=>{if(e?.status)status("قراءة النص: "+e.status+(e.progress!=null?" "+Math.round(e.progress*100)+"%":""));}});
  const results=[];
  for(let i=0;i<pages.length;i++){
   status("قراءة الصفحة "+(i+1)+" من "+pages.length+"...");
   const img=new Image();img.src=pages[i].data;await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error("تعذر فتح الصفحة "+(i+1)))});
   const canvas=document.createElement("canvas");canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;canvas.getContext("2d").drawImage(img,0,0);
   const result=await worker.recognize(canvas);results.push("===== الصفحة "+(i+1)+" =====\n"+String(result?.data?.text||"").trim());
  }
  output.value=results.join("\n\n");status("اكتملت القراءة. راجع النص وصحح الأخطاء قبل نقله إلى التقرير.");
 }catch(error){status(error?.message||"تعذر استخراج النص.",true)}
 finally{if(worker)try{await worker.terminate()}catch(_){}button.disabled=false}
}
async function copyOcrText(){
 const value=$("#scannerOcrText")?.value||"";if(!value.trim()){status("لا يوجد نص لنسخه.",true);return;}
 try{await navigator.clipboard.writeText(value);status("تم نسخ النص المستخرج.");}
 catch(_){const area=$("#scannerOcrText");area.focus();area.select();status("حدد النص ثم اختر نسخ من الهاتف.");}
}
async function createReportFromOcr(){
 const text=$("#scannerOcrText")?.value?.trim()||"",title=$("#scannerReportTitle")?.value?.trim()||"",shift=$("#scannerReportShift")?.value||"";
 if(!text){status("اقرأ المستند أولًا أو اكتب النص في مربع المراجعة.",true);return;}
 if(!title){status("اكتب عنوان التقرير.",true);return;}
 if(!window.DebooDB?.save){status("قاعدة بيانات DEEB غير متاحة.",true);return;}
 const button=$("#scannerCreateReport");button.disabled=true;
 try{
  const now=new Date(),date=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
  const saved=await window.DebooDB.save("written_reports",{report_title:title,report_date:date,shift:shift,prepared_by:$("#scannerPreparedBy")?.value?.trim()||"",report_text:text},null);
  if(!saved?.id)throw new Error("لم يتم تأكيد حفظ التقرير.");
  status("تم حفظ النص في تقرير جديد داخل DEEB. افتح مركز التقارير لمراجعته.");
  if(typeof window.DEebRender==="function")window.DEebRender("reports");
 }catch(error){status(error?.message||"تعذر حفظ التقرير.",true)}
 finally{button.disabled=false}
}
function loadFile(event){
 const file=event.target.files?.[0];event.target.value="";if(!file)return;
 if(!file.type.startsWith("image/")){status("الملف المحدد ليس صورة.",true);return;}
 if(file.size>25*1024*1024){status("حجم الصورة أكبر من 25 ميجابايت.",true);return;}
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{if(sourceImage?.url)URL.revokeObjectURL(sourceImage.url);sourceImage={img,url,name:file.name};rotation=0;crop={left:0,top:0,right:0,bottom:0};quad=[];pickCorners=false;["cropLeft","cropTop","cropRight","cropBottom"].forEach(id=>$("#"+id).value=0);$("#scannerEditor").classList.remove("hidden");drawPreview();status("تم تحميل الصورة. استخدم الكشف التلقائي أو حدد الزوايا الأربع يدويًا.");};
 img.onerror=()=>{URL.revokeObjectURL(url);status("تعذر فتح الصورة المحددة.",true);};img.src=url;
}
function rotatedCanvas(){
 if(!sourceImage)return null;const img=sourceImage.img,turn=rotation%180!==0,base=document.createElement("canvas");
 base.width=turn?img.naturalHeight:img.naturalWidth;base.height=turn?img.naturalWidth:img.naturalHeight;
 const b=base.getContext("2d");if(rotation===90){b.translate(base.width,0);b.rotate(Math.PI/2);}else if(rotation===180){b.translate(base.width,base.height);b.rotate(Math.PI);}else if(rotation===270){b.translate(0,base.height);b.rotate(-Math.PI/2);}b.drawImage(img,0,0);return base;
}
function cropCanvas(base){
 const l=Math.round(base.width*crop.left/100),t=Math.round(base.height*crop.top/100),w=Math.max(80,base.width-l-Math.round(base.width*crop.right/100)),h=Math.max(80,base.height-t-Math.round(base.height*crop.bottom/100));
 const out=document.createElement("canvas");const scale=Math.min(1,2200/Math.max(w,h),4500000/(w*h));out.width=Math.max(1,Math.round(w*scale));out.height=Math.max(1,Math.round(h*scale));out.getContext("2d").drawImage(base,l,t,w,h,0,0,out.width,out.height);return out;
}
function solveLinear(a,b){
 const n=b.length;for(let i=0;i<n;i++){let max=i;for(let r=i+1;r<n;r++)if(Math.abs(a[r][i])>Math.abs(a[max][i]))max=r;if(Math.abs(a[max][i])<1e-9)throw new Error("تعذر حساب زوايا المنظور.");[a[i],a[max]]=[a[max],a[i]];[b[i],b[max]]=[b[max],b[i]];const div=a[i][i];for(let c=i;c<n;c++)a[i][c]/=div;b[i]/=div;for(let r=0;r<n;r++)if(r!==i){const f=a[r][i];for(let c=i;c<n;c++)a[r][c]-=f*a[i][c];b[r]-=f*b[i];}}return b;
}
function validateQuad(src,points){
 if(!src||!Array.isArray(points)||points.length!==4)throw new Error("حدد زوايا الورقة الأربع بالترتيب الصحيح.");
 const minSide=Math.max(12,Math.min(src.width,src.height)*.025),cross=[];
 for(let i=0;i<4;i++){
  const p=points[i],n=points[(i+1)%4],m=points[(i+2)%4];
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>=src.width||p.y>=src.height)throw new Error("إحدى زوايا الورقة خارج حدود الصورة.");
  if(Math.hypot(n.x-p.x,n.y-p.y)<minSide)throw new Error("بعض زوايا الورقة قريبة جدًا؛ أعد تحديد الزوايا.");
  cross.push((n.x-p.x)*(m.y-n.y)-(n.y-p.y)*(m.x-n.x));
 }
 if(cross.some(v=>Math.abs(v)<minSide*minSide*.08)||!(cross.every(v=>v>0)||cross.every(v=>v<0)))throw new Error("ترتيب الزوايا متقاطع أو غير صالح. ابدأ من أعلى اليسار ثم أعلى اليمين ثم أسفل اليمين ثم أسفل اليسار.");
 let area=0;for(let i=0;i<4;i++){const p=points[i],n=points[(i+1)%4];area+=p.x*n.y-n.x*p.y;}
 if(Math.abs(area)/2<src.width*src.height*.025)throw new Error("المساحة المحددة صغيرة جدًا لتصحيح المنظور.");
 return true;
}
function warpPerspective(src,points){
 validateQuad(src,points);const [p0,p1,p2,p3]=points;const width=Math.max(Math.hypot(p1.x-p0.x,p1.y-p0.y),Math.hypot(p2.x-p3.x,p2.y-p3.y));
 const height=Math.max(Math.hypot(p3.x-p0.x,p3.y-p0.y),Math.hypot(p2.x-p1.x,p2.y-p1.y));
 const scale=Math.min(1,2200/Math.max(width,height),4500000/(width*height)),w=Math.max(2,Math.round(width*scale)),h=Math.max(2,Math.round(height*scale));
 const dst=[{x:0,y:0},{x:w-1,y:0},{x:w-1,y:h-1},{x:0,y:h-1}],a=[],b=[];
 for(let i=0;i<4;i++){const X=dst[i].x,Y=dst[i].y,x=points[i].x,y=points[i].y;a.push([X,Y,1,0,0,0,-x*X,-x*Y]);b.push(x);a.push([0,0,0,X,Y,1,-y*X,-y*Y]);b.push(y);}
 const q=solveLinear(a,b),out=document.createElement("canvas");out.width=w;out.height=h;const ctx=out.getContext("2d"),srcCtx=src.getContext("2d"),input=srcCtx.getImageData(0,0,src.width,src.height),output=ctx.createImageData(w,h),s=input.data,d=output.data;
 for(let y=0;y<h;y++){for(let x=0;x<w;x++){const den=q[6]*x+q[7]*y+1,sx=(q[0]*x+q[1]*y+q[2])/den,sy=(q[3]*x+q[4]*y+q[5])/den;if(sx<0||sy<0||sx>=src.width||sy>=src.height)continue;const si=(Math.floor(sy)*src.width+Math.floor(sx))*4,di=(y*w+x)*4;d[di]=s[si];d[di+1]=s[si+1];d[di+2]=s[si+2];d[di+3]=255;}}
 ctx.putImageData(output,0,0);return out;
}
function applyFilter(canvas){
 const out=document.createElement("canvas");out.width=canvas.width;out.height=canvas.height;const ctx=out.getContext("2d");
 ctx.filter=filter==="gray"?"grayscale(1)":filter==="enhance"?"contrast(1.18) brightness(1.06) saturate(1.12)":"none";ctx.drawImage(canvas,0,0);ctx.filter="none";
 if(filter==="bw"){const im=ctx.getImageData(0,0,out.width,out.height),d=im.data;for(let i=0;i<d.length;i+=4){const v=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)>168?255:0;d[i]=d[i+1]=d[i+2]=v;}ctx.putImageData(im,0,0);}return out;
}
function makeCanvas(){const base=rotatedCanvas();if(!base)return null;let out;if(quad.length===4)out=warpPerspective(base,quad);else out=cropCanvas(base);return applyFilter(out);}
function drawPreview(){
 const canvas=$("#scannerCanvas");if(!canvas||!sourceImage)return;const base=rotatedCanvas(),view=pickCorners||quad.length===4?base:cropCanvas(base);
 canvas.width=view.width;canvas.height=view.height;const ctx=canvas.getContext("2d");ctx.drawImage(view,0,0);
 if((pickCorners||quad.length===4)&&quad.length){ctx.save();ctx.strokeStyle="#e2a72e";ctx.lineWidth=Math.max(3,view.width/300);ctx.fillStyle="#9b1730";ctx.beginPath();quad.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(quad.length===4)ctx.closePath();ctx.stroke();quad.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,Math.max(9,view.width/90),0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold "+Math.max(14,view.width/45)+"px sans-serif";ctx.fillText(String(i+1),p.x+10,p.y-10);ctx.fillStyle="#9b1730";});ctx.restore();}
 canvas.style.aspectRatio=view.width+"/"+view.height;
}
function canvasPick(event){
 if(!pickCorners||!sourceImage)return;const canvas=$("#scannerCanvas"),r=canvas.getBoundingClientRect(),base=rotatedCanvas();
 const x=(event.clientX-r.left)/r.width*canvas.width,y=(event.clientY-r.top)/r.height*canvas.height;
 quad.push({x:Math.max(0,Math.min(base.width-1,x)),y:Math.max(0,Math.min(base.height-1,y))});
 if(quad.length===4){pickCorners=false;$("#scannerCornerHelp").textContent="تم تحديد الزوايا الأربع. ستتم إزالة الميل والمنظور عند إضافة الصفحة." ;status("تم تحديد الزوايا؛ راجع الإطار الذهبي ثم أضف الصفحة.");}else $("#scannerCornerHelp").textContent="تم تحديد "+quad.length+" من 4 زوايا.";
 drawPreview();
}
function autoDetect(){
 const base=rotatedCanvas();if(!base)return;const scale=Math.min(1,700/Math.max(base.width,base.height)),w=Math.max(40,Math.round(base.width*scale)),h=Math.max(40,Math.round(base.height*scale)),small=document.createElement("canvas");small.width=w;small.height=h;small.getContext("2d").drawImage(base,0,0,w,h);
 const data=small.getContext("2d").getImageData(0,0,w,h).data,gray=new Uint8Array(w*h),gx=new Float32Array(w*h),gy=new Float32Array(w*h);
 for(let i=0;i<w*h;i++){const k=i*4;gray[i]=data[k]*.299+data[k+1]*.587+data[k+2]*.114;}
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;gx[i]=Math.abs(gray[i+1]-gray[i-1]);gy[i]=Math.abs(gray[i+w]-gray[i-w]);}
 const row=new Float32Array(h),col=new Float32Array(w);
 for(let y=1;y<h-1;y++)for(let x=Math.floor(w*.12);x<Math.floor(w*.88);x++)row[y]+=gy[y*w+x];
 for(let x=1;x<w-1;x++)for(let y=Math.floor(h*.12);y<Math.floor(h*.88);y++)col[x]+=gx[y*w+x];
 const peak=(arr,start,end)=>{let ix=-1,v=0;for(let i=start;i<end;i++)if(arr[i]>v){v=arr[i];ix=i;}return {ix,v};};
 const top=peak(row,Math.floor(h*.04),Math.floor(h*.42)),bottom=peak(row,Math.floor(h*.58),Math.floor(h*.96)),left=peak(col,Math.floor(w*.04),Math.floor(w*.42)),right=peak(col,Math.floor(w*.58),Math.floor(w*.96));
 if(top.ix<0||bottom.ix<0||left.ix<0||right.ix<0||top.v<180||bottom.v<180||left.v<180||right.v<180){status("لم أستطع تحديد حدود واضحة. جرّب إضاءة أقوى أو حدد الزوايا يدويًا.",true);return;}
 const sx=base.width/w,sy=base.height/h;quad=[{x:left.ix*sx,y:top.ix*sy},{x:right.ix*sx,y:top.ix*sy},{x:right.ix*sx,y:bottom.ix*sy},{x:left.ix*sx,y:bottom.ix*sy}];pickCorners=false;$("#scannerCornerHelp").textContent="تم العثور على إطار مستطيل مبدئي. صحح الزوايا يدويًا إذا كانت الورقة مائلة أو مصورة بزاوية.";drawPreview();status("تم الكشف المبدئي عن حدود المستند. راجع الإطار قبل إضافة الصفحة.");
}
function addPage(){
 if(!sourceImage){status("صوّر صفحة أو اختر صورة أولًا.",true);return;}if(quad.length!==0&&quad.length!==4){status("أكمل تحديد الزوايا الأربع أو ألغِ التحديد.",true);return;}
 try{const canvas=makeCanvas();if(!canvas)return;pages.push({data:canvas.toDataURL("image/jpeg",.92),name:"صفحة "+(pages.length+1),width:canvas.width,height:canvas.height});renderPages();status("تمت إضافة الصفحة بعد تطبيق القص وتصحيح المنظور.");}
 catch(error){status(error.message||"تعذر تصحيح منظور الصفحة.",true);}
}
function renderPages(){
 const host=$("#scannerPages");if(!host)return;$("#scannerPageCount").textContent=String(pages.length);$("#scannerSavePdf").disabled=!pages.length;$("#scannerSaveImages").disabled=!pages.length;$("#scannerClear").disabled=!pages.length;
 host.innerHTML=pages.length?pages.map((p,i)=>'<div class="scanner-page"><img src="'+p.data+'" alt="صفحة '+(i+1)+'"><b>صفحة '+(i+1)+'</b><button class="tiny danger" data-remove-page="'+i+'">حذف</button></div>').join(""):'<p class="muted">لم تتم إضافة صفحات بعد.</p>';
 host.querySelectorAll("[data-remove-page]").forEach(b=>b.onclick=()=>{pages.splice(Number(b.dataset.removePage),1);renderPages();});
}
async function savePdf(){
 if(!pages.length)return;
 const html='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEEB Scan</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#fff}.scan-page{width:210mm;height:297mm;display:flex;align-items:center;justify-content:center;page-break-after:always;break-after:page;padding:8mm}.scan-page:last-child{page-break-after:auto;break-after:auto}.scan-page img{max-width:100%;max-height:100%;object-fit:contain}</style></head><body>'+pages.map(p=>'<section class="scan-page"><img src="'+p.data+'" alt="صفحة مستند"></section>').join("")+'</body></html>';
 const native=window.DEEBNativePlugins?.FileExport;
 if(native?.printHtml){const result=await native.printHtml({html});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة.");status("اختر «حفظ بتنسيق PDF» من نافذة الطباعة لحفظ كل الصفحات.");return;}
 const win=window.open("","_blank");if(!win)throw new Error("اسمح بالنوافذ المنبثقة لفتح المستند.");win.document.open();win.document.write(html);win.document.close();setTimeout(()=>win.print(),500);status("اختر «حفظ بتنسيق PDF» من معاينة الطباعة.");
}
async function saveImages(){
 if(!pages.length)return;
 const button=$("#scannerSaveImages");button.disabled=true;let saved=0;
 try{for(let i=0;i<pages.length;i++){const a=document.createElement("a");a.href=pages[i].data;a.download="DEEB-Scan-"+String(i+1).padStart(2,"0")+".jpg";document.body.appendChild(a);a.click();a.remove();saved++;}status("تم إرسال "+saved+" صورة إلى التنزيلات.");}
 catch(error){status("تم حفظ "+saved+" صورة فقط. "+(error.message||""),true);}finally{button.disabled=false;}
}
function clearPages(){if(!confirm("هل تريد مسح جميع صفحات المستند؟"))return;pages=[];renderPages();status("تم مسح صفحات المستند.");}
window.DEebScanner={render:scannerMarkup};
})();