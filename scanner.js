(() => {
"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let sourceImage=null,rotation=0,filter="color",crop={left:0,top:0,right:0,bottom:0},pages=[];
const $=s=>document.querySelector(s);
function status(message,error=false){const el=$("#scannerStatus");if(el){el.textContent=message;el.classList.toggle("scanner-error",error);}}
function scannerMarkup(){
 const area=$("#contentArea");
 if(!area)return;
 area.innerHTML='<div class="page-head"><h1>ماسح المستندات</h1><button class="secondary" id="scannerBack">رجوع</button></div>'+
 '<div class="card scanner-card"><p class="muted">صوّر المستند أو اختر صورة من جهازك، ثم اضبط القص والتحسين واحفظ عدة صفحات في ملف PDF واحد.</p>'+
 '<div class="actions"><label class="primary scanner-file-label" for="scannerCamera">📷 تصوير مستند</label><input id="scannerCamera" class="hidden" type="file" accept="image/*" capture="environment"><label class="secondary scanner-file-label" for="scannerGallery">اختيار صورة</label><input id="scannerGallery" class="hidden" type="file" accept="image/*"></div>'+
 '<div id="scannerEditor" class="hidden"><div class="scanner-preview"><canvas id="scannerCanvas"></canvas></div>'+
 '<div class="form scanner-controls"><div class="field"><label for="cropLeft">قص من اليسار</label><input id="cropLeft" type="range" min="0" max="35" value="0"></div><div class="field"><label for="cropTop">قص من الأعلى</label><input id="cropTop" type="range" min="0" max="35" value="0"></div><div class="field"><label for="cropRight">قص من اليمين</label><input id="cropRight" type="range" min="0" max="35" value="0"></div><div class="field"><label for="cropBottom">قص من الأسفل</label><input id="cropBottom" type="range" min="0" max="35" value="0"></div></div>'+
 '<div class="actions scanner-filters"><button class="secondary" data-filter="color">ألوان</button><button class="secondary" data-filter="gray">رمادي</button><button class="secondary" data-filter="bw">أبيض وأسود</button><button class="secondary" data-filter="enhance">تحسين</button><button class="secondary" id="scannerRotate">تدوير 90°</button></div>'+
 '<div class="actions"><button class="primary" id="scannerAddPage">إضافة الصفحة</button><button class="secondary" id="scannerResetCrop">إعادة ضبط القص</button></div></div>'+
 '<div class="card"><h3>صفحات المستند <span id="scannerPageCount" class="pill">0</span></h3><div id="scannerPages" class="scanner-pages"><p class="muted">لم تتم إضافة صفحات بعد.</p></div>'+
 '<div class="actions"><button class="primary" id="scannerSavePdf" disabled>حفظ كل الصفحات PDF</button><button class="secondary" id="scannerSaveImages" disabled>حفظ الصور منفصلة</button><button class="danger" id="scannerClear" disabled>مسح المستند</button></div></div>'+
 '<p id="scannerStatus" class="notice" aria-live="polite">ابدأ بتصوير المستند أو اختيار صورة.</p>'+
 '<p class="muted scanner-note">ملاحظة: القص اليدوي وتحسين الصورة وإدارة الصفحات متاحة في هذه المرحلة. كشف الحواف التلقائي والتصحيح المنظوري وOCR العربي والإنجليزي مراحل تطوير لاحقة.</p></div>';
 $("#scannerBack").onclick=()=>{if(typeof window.DEebRender==="function")window.DEebRender("home");else document.querySelector('[data-page="home"]')?.click();};
 $("#scannerCamera").onchange=loadFile;$("#scannerGallery").onchange=loadFile;
 ["cropLeft","cropTop","cropRight","cropBottom"].forEach(id=>$("#"+id).addEventListener("input",()=>{crop[id.replace("crop","").toLowerCase()]=Number($("#"+id).value);drawPreview();}));
 $$filterButtons().forEach(b=>b.onclick=()=>{filter=b.dataset.filter;$$filterButtons().forEach(x=>x.classList.toggle("active",x===b));drawPreview();});
 $("#scannerRotate").onclick=()=>{rotation=(rotation+90)%360;drawPreview();};
 $("#scannerResetCrop").onclick=()=>{crop={left:0,top:0,right:0,bottom:0};["cropLeft","cropTop","cropRight","cropBottom"].forEach(id=>$("#"+id).value=0);drawPreview();};
 $("#scannerAddPage").onclick=addPage;$("#scannerSavePdf").onclick=savePdf;$("#scannerSaveImages").onclick=saveImages;$("#scannerClear").onclick=clearPages;
 renderPages();
}
function $$filterButtons(){return [...document.querySelectorAll("[data-filter]")];}
function loadFile(event){
 const file=event.target.files?.[0];event.target.value="";
 if(!file)return;
 if(!file.type.startsWith("image/")){status("الملف المحدد ليس صورة.",true);return;}
 if(file.size>25*1024*1024){status("حجم الصورة أكبر من 25 ميجابايت.",true);return;}
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{if(sourceImage?.url)URL.revokeObjectURL(sourceImage.url);sourceImage={img,url,name:file.name};rotation=0;crop={left:0,top:0,right:0,bottom:0};["cropLeft","cropTop","cropRight","cropBottom"].forEach(id=>$("#"+id).value=0);$("#scannerEditor").classList.remove("hidden");drawPreview();status("تم تحميل الصورة. اضبط حدود القص والتحسين ثم أضف الصفحة.");};
 img.onerror=()=>{URL.revokeObjectURL(url);status("تعذر فتح الصورة المحددة.",true);};img.src=url;
}
function makeCanvas(){
 if(!sourceImage)return null;
 const img=sourceImage.img,turn=rotation%180!==0,base=document.createElement("canvas");
 base.width=turn?img.naturalHeight:img.naturalWidth;base.height=turn?img.naturalWidth:img.naturalHeight;
 const b=base.getContext("2d");
 if(rotation===90){b.translate(base.width,0);b.rotate(Math.PI/2);}else if(rotation===180){b.translate(base.width,base.height);b.rotate(Math.PI);}else if(rotation===270){b.translate(0,base.height);b.rotate(-Math.PI/2);}
 b.drawImage(img,0,0);const l=Math.round(base.width*crop.left/100),t=Math.round(base.height*crop.top/100);
 const w=Math.max(80,base.width-l-Math.round(base.width*crop.right/100)),h=Math.max(80,base.height-t-Math.round(base.height*crop.bottom/100));
 const out=document.createElement("canvas");out.width=Math.min(w,3000);out.height=Math.min(h,4000);
 const ctx=out.getContext("2d");ctx.filter=filter==="gray"?"grayscale(1)":filter==="bw"?"grayscale(1) contrast(2.1)":"none";
 if(filter==="enhance")ctx.filter="contrast(1.18) brightness(1.06) saturate(1.12)";
 ctx.drawImage(base,l,t,w,h,0,0,out.width,out.height);ctx.filter="none";
 if(filter==="bw"){const data=ctx.getImageData(0,0,out.width,out.height),d=data.data;for(let i=0;i<d.length;i+=4){const v=(d[i]*.299+d[i+1]*.587+d[i+2]*.114)>168?255:0;d[i]=d[i+1]=d[i+2]=v;}ctx.putImageData(data,0,0);}
 return out;
}
function drawPreview(){const canvas=$("#scannerCanvas");if(!canvas||!sourceImage)return;const out=makeCanvas();canvas.width=out.width;canvas.height=out.height;canvas.getContext("2d").drawImage(out,0,0);canvas.style.aspectRatio=out.width+"/"+out.height;}
function addPage(){if(!sourceImage){status("صوّر صفحة أو اختر صورة أولًا.",true);return;}const canvas=makeCanvas();if(!canvas)return;pages.push({data:canvas.toDataURL("image/jpeg",.92),name:"صفحة "+(pages.length+1),width:canvas.width,height:canvas.height});renderPages();status("تمت إضافة الصفحة. يمكنك تصوير الصفحة التالية أو حفظ المستند.");}
function renderPages(){
 const host=$("#scannerPages");if(!host)return;$("#scannerPageCount").textContent=String(pages.length);
 $("#scannerSavePdf").disabled=!pages.length;$("#scannerSaveImages").disabled=!pages.length;$("#scannerClear").disabled=!pages.length;
 host.innerHTML=pages.length?pages.map((p,i)=>'<div class="scanner-page"><img src="'+p.data+'" alt="صفحة '+(i+1)+'"><b>صفحة '+(i+1)+'</b><button class="tiny danger" data-remove-page="'+i+'">حذف</button></div>').join(""):'<p class="muted">لم تتم إضافة صفحات بعد.</p>';
 host.querySelectorAll("[data-remove-page]").forEach(b=>b.onclick=()=>{pages.splice(Number(b.dataset.removePage),1);renderPages();});
}
async function savePdf(){
 if(!pages.length)return;const native=window.DEEBNativePlugins?.FileExport;
 if(!native?.saveScannedPdf){status("حفظ PDF متعدد الصفحات يحتاج نسخة أندرويد من DEEB.",true);return;}
 const button=$("#scannerSavePdf");button.disabled=true;status("جارٍ تجهيز ملف PDF...");
 try{const result=await native.saveScannedPdf({name:"DEEB-Scan-"+new Date().toISOString().slice(0,10)+".pdf",pages:pages.map(p=>p.data.split(",")[1])});if(!result?.saved)throw new Error("لم يؤكد النظام حفظ الملف.");status("تم حفظ "+result.pages+" صفحة في Downloads/DEEB باسم "+result.name);}
 catch(error){status(error.message||"تعذر حفظ ملف PDF.",true);}finally{button.disabled=false;}
}
async function saveImages(){
 if(!pages.length)return;const native=window.DEEBNativePlugins?.FileExport;
 if(!native?.saveFile){status("حفظ الصور يحتاج نسخة أندرويد من DEEB.",true);return;}
 const button=$("#scannerSaveImages");button.disabled=true;let saved=0;
 try{for(let i=0;i<pages.length;i++){const result=await native.saveFile({name:"DEEB-Scan-"+String(i+1).padStart(2,"0")+".jpg",mimeType:"image/jpeg",base64:pages[i].data.split(",")[1]});if(!result?.saved)throw new Error("تعذر حفظ الصورة رقم "+(i+1));saved++;}status("تم حفظ "+saved+" صورة داخل Downloads/DEEB.");}
 catch(error){status("تم حفظ "+saved+" صورة فقط. "+(error.message||""),true);}finally{button.disabled=false;}
}
function clearPages(){if(!confirm("هل تريد مسح جميع صفحات المستند؟"))return;pages=[];renderPages();status("تم مسح صفحات المستند.");}
window.DEebScanner={render:scannerMarkup};
})();