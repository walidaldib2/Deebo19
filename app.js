(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const area=$("#contentArea");
const labels={branches:"الفروع",patrol_people:"أفراد الدوريات",emergency_people:"أفراد الطوارئ",bikes:"الدراجات",managers:"مديرو الأقسام",branch_patrols:"متابعة الفروع",bike_patrols:"مرور الدراجات",manager_rounds:"مرور مديري الأقسام",incidents:"البلاغات والحوادث",tasks:"المهام اليومية",handovers:"تسليم واستلام الشفت",absences:"غياب المسؤولين",emergencies:"حالات الطوارئ",documents:"خزنة المستندات",patrol_sites:"المخازن والمعارض ومراكز الخدمة"};
const fields={
branches:[["name","اسم الفرع","text",1],["code","كود الفرع","text"],["address","العنوان","text"],["manager","المسؤول","text"],["phone","رقم التواصل","tel"],["lat","خط العرض","number"],["lng","خط الطول","number"],["status","الحالة","select","نشط|متوقف"]],
patrol_people:[["name","اسم فرد الدورية","text",1],["employee_no","الرقم الوظيفي","text"],["phone","رقم الهاتف","tel"],["branch","الفرع","text"],["job","الوظيفة","text"],["status","الحالة","select","متاح|إجازة|موقوف"]],
emergency_people:[["name","اسم فرد الطوارئ","text",1],["specialty","التخصص","text"],["phone","رقم الهاتف","tel"],["branch","الفرع","text"],["availability","التوفر","select","متاح|مشغول|إجازة"]],
bikes:[["number","رقم الدراجة","text",1],["description","الوصف","text"],["person","الفرد المسؤول","text"],["status","الحالة","select","جاهزة|بالمرور|صيانة|متوقفة"]],
patrol_sites:[["name","اسم المكان","text",1],["site_type","نوع المكان","select","مخزن|معرض|مركز خدمة",1],["address","العنوان / الوصف","text"],["lat","خط العرض","number"],["lng","خط الطول","number"],["notes","ملاحظات","textarea"]],
managers:[["name","اسم المدير","text",1],["department","القسم","text"],["phone","رقم التواصل","tel"],["branches","الفروع التابعة","text"]],
branch_patrols:[["branch","الفرع","text",1],["responsible","المسؤول","text"],["patrol_date","تاريخ المرور","date",1],["patrol_time","ساعة المرور","time",1],["condition","حالة الفرع","select","جيد|ملاحظات|مخالفة|مغلق"],["notes","الملاحظات","textarea"]],
bike_patrols:[["bike","الدراجة","text",1],["site","المخزن / المعرض / مركز الخدمة","text"],["patrol_date","تاريخ الوصول","date",1],["patrol_time","توقيت الوصول","time",1],["location_url","رابط موقع واتساب","url"],["lat","خط العرض","number"],["lng","خط الطول","number"],["notes","ملاحظات","textarea"]],
manager_rounds:[["manager","مدير القسم","text",1],["department","القسم","text"],["branches","الفروع التي تمت زيارتها","text"],["result","نتيجة المرور","textarea"]],
incidents:[["incident_type","نوع البلاغ","select","أمني|تشغيلي|فني|إداري|حادث|أخرى",1],["branch","الفرع / الموقع","text"],["responsible","المسؤول","text"],["priority","الأولوية","select","عاجل|مرتفع|متوسط|منخفض"],["status","الحالة","select","جديد|قيد المعالجة|بانتظار إجراء|مغلق"],["description","وصف البلاغ","textarea",1],["lat","خط العرض","number"],["lng","خط الطول","number"],["action_taken","الإجراءات المتخذة","textarea"]],
tasks:[["title","عنوان المهمة","text",1],["responsible","المسؤول","text"],["branch","الفرع","text"],["start_date","تاريخ البداية","date"],["due_date","تاريخ النهاية","date"],["priority","الأولوية","select","عاجل|مرتفع|متوسط|منخفض"],["status","الحالة","select","جديدة|جارية|مكتملة|متأخرة"],["progress","نسبة الإنجاز %","number"],["notes","ملاحظات","textarea"]],
handovers:[["sender","اسم المسلم","text",1],["receiver","اسم المستلم","text",1],["open_tasks","المهام المفتوحة","textarea"],["open_incidents","البلاغات القائمة","textarea"],["notes","ملاحظات التسليم","textarea"],["acknowledged","إقرار الطرفين","select","تم الإقرار|بانتظار الإقرار"]],
absences:[["person","اسم المسؤول الغائب","text",1],["role","الوظيفة","select","مسؤول أمن|مسؤول مرور|مسؤول طوارئ|مدير قسم|أخرى",1],["branch","الفرع / الموقع","text"],["shift","الشفت","select","صباحي|مسائي|ليلي"],["absence_date","تاريخ الغياب","date",1],["reason","سبب الغياب","textarea"],["replacement","البديل / المكلف","text"],["action_taken","الإجراء المتخذ","textarea"]],
emergencies:[["case_type","تصنيف الحالة","text",1],["location","الموقع","text",1],["lat","خط العرض","number"],["lng","خط الطول","number"],["severity","درجة الخطورة","select","حرجة|مرتفعة|متوسطة|منخفضة"],["responsible","المسؤول","text"],["team","أفراد الاستجابة","text"],["status","الحالة","select","مفتوحة|قيد التعامل|منتهية"],["actions","الإجراءات","textarea"]],
documents:[["title","اسم المستند","text",1],["category","التصنيف","text"],["reference","رقم / مرجع المستند","text"],["notes","ملاحظات","textarea"]]
};
const pageGroups={follow:["branch_patrols","bike_patrols","manager_rounds","incidents","tasks","handovers","absences"],data:["branches","patrol_people","emergency_people","bikes","patrol_sites","managers","documents"],emergency:["emergencies","emergency_people"]};
let cache=[],currentPage="home",currentType=null,currentEdit=null,weatherTimer=null,searchTerm="",deferredInstallPrompt=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function dateText(){const d=new Date();$("#todayDate").textContent=d.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"})}
function configured(){return true}

const BIOMETRIC_KEY = "deboo16_biometric_enabled_v1";

async function checkBiometricAvailability(){
  if(!window.DebooBiometric){
    throw new Error("ميزة البصمة غير جاهزة. أعد بناء نسخة التطبيق.");
  }
  const result = await window.DebooBiometric.check();
  if(!result || !result.isAvailable){
    throw new Error(result?.reason || "البصمة غير متاحة على هذا الجهاز.");
  }
  return result;
}

function setupBiometricLogin(){
  const loginBtn = document.querySelector("#loginBtn");
  if(!loginBtn) return;

  let biometricBtn = document.querySelector("#biometricLoginBtn");
  if(!biometricBtn){
    biometricBtn = document.createElement("button");
    biometricBtn.id = "biometricLoginBtn";
    biometricBtn.className = "secondary";
    biometricBtn.textContent = "فتح بالبصمة";
    loginBtn.insertAdjacentElement("afterend", biometricBtn);
  }

  biometricBtn.hidden = localStorage.getItem(BIOMETRIC_KEY) !== "1";

  biometricBtn.onclick = async () => {
    try{
      await checkBiometricAvailability();
      await window.DebooBiometric.authenticate();
      await openApplication();
    }catch(e){
      const message = e?.message || "تعذر التحقق بالبصمة.";
      document.querySelector("#authMessage").textContent =
        message + " يمكنك الدخول باستخدام PIN.";
    }
  };
}
async function authState(){
 try{
  await DebooDB.all();
  const pin=localStorage.getItem("deboo16_pin_v1");
  if(pin){
   $("#authPanel").classList.remove("hidden");
   $("#appRoot").classList.add("hidden");
   $("#authMessage").textContent="التطبيق محمي برمز PIN، ويمكنك استخدام البصمة إذا كانت مفعّلة.";
   setupBiometricLogin();
   return;
  }
  localStorage.removeItem(BIOMETRIC_KEY);
  await openApplication();
 }catch(e){
  $("#authPanel").classList.remove("hidden");
  $("#appRoot").classList.add("hidden");
  $("#authMessage").textContent="تعذر بدء قاعدة البيانات المحلية: "+e.message;
 }
}
async function openApplication(){$("#authPanel").classList.add("hidden");$("#appRoot").classList.remove("hidden");await refresh();render("home");consumeSharedLocation();consumeNativeShare()}
function extractSharedCoordinates(value){
 const s=String(value||"");
 const patterns=[
  /geo:([-+]?\d{1,2}\.\d+)\s*[,;]\s*([-+]?\d{1,3}\.\d+)/i,
  /@([-+]?\d{1,2}\.\d+),\s*([-+]?\d{1,3}\.\d+)/,
  /[?&](?:q|query|ll|center)=([-+]?\d{1,2}\.\d+)(?:%2C|,|%252C)([-+]?\d{1,3}\.\d+)/i
 ];
 for(const re of patterns){const m=s.match(re);if(m){const lat=Number(m[1]),lng=Number(m[2]);if(lat>=-90&&lat<=90&&lng>=-180&&lng<=180)return {lat,lng};}}
 return null;
}
function nearestPatrolSite(coords){
 if(!coords)return null;
 const rad=x=>x*Math.PI/180;
 const distance=(a,b)=>{const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng),v=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));};
 return cache.filter(x=>x.entity_type==="patrol_sites"&&!x.is_archived&&Number.isFinite(Number(x.payload?.lat))&&Number.isFinite(Number(x.payload?.lng))).map(x=>({row:x,meters:distance(coords,{lat:Number(x.payload.lat),lng:Number(x.payload.lng)})})).filter(x=>x.meters<=500).sort((x,y)=>x.meters-y.meters)[0]?.row||null;
}
let lastSharedLocationPayload="";
function consumeSharedLocation(sharedText=""){
 const params=new URLSearchParams(location.search);
 const queryShare=params.get("share")==="location";
 const sharedUrlParam=params.get("url")||"";
 const sharedTextParam=params.get("text")||"";
 const raw=String(sharedText||[sharedTextParam,sharedUrlParam].filter(Boolean).join(" ")).trim();
 if(!queryShare&&!raw)return;
 if(raw&&raw===lastSharedLocationPayload)return;
 if(raw)lastSharedLocationPayload=raw;
 if(queryShare)history.replaceState({},document.title,location.pathname+location.hash);
 const extracted=(raw.match(/https?:\/\/[^\s<>"']+/i)||[])[0]||"";
 const locationUrl=(sharedUrlParam||extracted||raw).trim().replace(/[),.;]+$/,"");
 render("follow");
 const tab=document.querySelector('.subnav [data-type="bike_patrols"]');if(tab)tab.click();
 $("#addRecord")?.click();
 const form=$("#recordForm");if(!form)return;
 const linkField=form.elements.namedItem("location_url");
 if(linkField)linkField.value=locationUrl;
 const coords=extractSharedCoordinates(raw+" "+locationUrl);
 if(coords){
  form.elements.namedItem("lat").value=coords.lat.toFixed(6);
  form.elements.namedItem("lng").value=coords.lng.toFixed(6);
  const site=nearestPatrolSite(coords);
  if(site&&form.elements.namedItem("site"))form.elements.namedItem("site").value=site.payload.name;
 }else{
  const match=cache.find(x=>x.entity_type==="patrol_sites"&&!x.is_archived&&raw.toLocaleLowerCase("ar").includes(String(x.payload?.name||"").toLocaleLowerCase("ar")));
  if(match&&form.elements.namedItem("site"))form.elements.namedItem("site").value=match.payload.name;
 }
 toast(coords?"تم استلام نقطة الموقع. اختر الدراجة وسجّل توقيت الوصول.":"تم استلام مشاركة واتساب. اختر الدراجة والمكان وسجّل توقيت الوصول.");
 form.elements.namedItem("patrol_time")?.focus();
}
async function consumeNativeShare(){
 const plugin=window.Capacitor?.Plugins?.ShareIntent;
 if(!plugin?.getInitialShare)return;
 try{const result=await plugin.getInitialShare();if(result?.text)consumeSharedLocation(result.text);}
 catch(error){console.warn("DEBOO16 share intake:",error);}
}
window.addEventListener("deboo-share-intent",event=>{consumeSharedLocation(event.detail?.text||"");const plugin=window.Capacitor?.Plugins?.ShareIntent;plugin?.getInitialShare?.().catch(()=>{});});

const toB64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const fromB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function derivePin(pin,salt){const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);return crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:210000,hash:"SHA-256"},material,256)}
async function storePin(pin){if(!crypto?.subtle)throw Error("التشفير الآمن غير متاح. افتح التطبيق عبر HTTPS.");if(!/^\d{4,8}$/.test(pin))throw Error("استخدم رمزًا من 4 إلى 8 أرقام.");const salt=crypto.getRandomValues(new Uint8Array(16));const hash=await derivePin(pin,salt);localStorage.setItem("deboo16_pin_v1",JSON.stringify({salt:toB64(salt),hash:toB64(hash),iterations:210000}));localStorage.removeItem("deboo16_pin_attempts")}
async function verifyPin(pin){const cfg=JSON.parse(localStorage.getItem("deboo16_pin_v1")||"null");if(!cfg)return true;const attempts=JSON.parse(localStorage.getItem("deboo16_pin_attempts")||"{\"count\":0,\"until\":0}");if(Date.now()<attempts.until)throw Error("تم إيقاف المحاولة مؤقتًا. حاول بعد قليل.");const hash=await derivePin(pin,fromB64(cfg.salt));const a=new Uint8Array(hash),b=fromB64(cfg.hash);let diff=a.length^b.length;for(let i=0;i<Math.min(a.length,b.length);i++)diff|=a[i]^b[i];if(diff){attempts.count++;if(attempts.count>=5){attempts.count=0;attempts.until=Date.now()+30000;}localStorage.setItem("deboo16_pin_attempts",JSON.stringify(attempts));return false;}localStorage.removeItem("deboo16_pin_attempts");return true}
$("#loginBtn").onclick=async()=>{try{const ok=await verifyPin($("#authPassword").value);if(!ok){$("#authMessage").textContent="رمز PIN غير صحيح.";$("#authPassword").value="";return;}$("#authPassword").value="";await openApplication()}catch(e){$("#authMessage").textContent=e.message}};
async function refresh(){try{cache=await DebooDB.all();$("#branchCount").textContent=cache.filter(x=>x.entity_type==="branches").length;$("#followCount").textContent=cache.filter(x=>["branch_patrols","bike_patrols","manager_rounds"].includes(x.entity_type)).length}catch(e){toast("تعذر تحميل البيانات: "+e.message)}}
function pageHead(title,actions=""){const back=currentPage!=="home"?`<button class="secondary" type="button" data-back-home>رجوع للرئيسية</button>`:"";return `<div class="page-head"><h1>${title}</h1><div class="actions no-print">${back}${actions}</div></div>`}
function stats(items){return `<div class="stats">${items.map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("")}</div>`}
function rows(type){return cache.filter(r=>r.entity_type===type&&!r.is_archived).filter(r=>!searchTerm||JSON.stringify(r.payload).toLowerCase().includes(searchTerm.toLowerCase()))}
function branchPatrolTable(){
 const records=rows("branch_patrols"),branches=rows("branches").map(r=>String(r.payload?.name||"").trim()).filter(Boolean);
 const today=(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");})();
 const names=[...new Set([...branches,...records.map(r=>String(r.payload?.branch||"").trim()).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,"ar"));
 const datesByBranch=new Map();
 names.forEach(name=>datesByBranch.set(name,new Set([today])));
 records.forEach(r=>{const name=String(r.payload?.branch||"").trim(),date=String(r.payload?.patrol_date||today);if(!datesByBranch.has(name))datesByBranch.set(name,new Set([today]));datesByBranch.get(name).add(date);});
 const visible=names.flatMap(name=>[...datesByBranch.get(name)].sort((a,b)=>b.localeCompare(a)).map(date=>({name,date,visits:records.filter(r=>String(r.payload?.branch||"").trim()===name&&String(r.payload?.patrol_date||today)===date).sort((a,b)=>String(a.payload?.patrol_time||"").localeCompare(String(b.payload?.patrol_time||"")))}))).filter(row=>!searchTerm||normalize(row.name).includes(normalize(searchTerm))||row.date.includes(searchTerm));
 if(!visible.length)return '<div class="empty">لا توجد فروع مسجلة. أضف الفروع من إدارة البيانات أولًا.</div>';
 return `<div class="table-wrap"><table class="branch-patrol-grid"><thead><tr><th>الفرع</th><th>تاريخ المرور</th>${[1,2,3,4,5].map(n=>`<th>متابعة ${n}</th>`).join("")}</tr></thead><tbody>${visible.map(row=>`<tr><td><b>${esc(row.name)}</b></td><td>${esc(row.date)}</td>${[0,1,2,3,4].map(slot=>{const visit=row.visits[slot];return `<td>${visit?`<button type="button" class="tiny" data-edit="${visit.id}" data-type="branch_patrols">${esc(visit.payload?.patrol_time||"تم المرور")}</button>`:`<button type="button" class="secondary tiny branch-slot" data-branch-slot="${slot}" data-branch-name="${esc(row.name)}" data-branch-date="${esc(row.date)}">＋ تسجيل</button>`}</td>`;}).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function table(type){if(type==="branch_patrols")return branchPatrolTable();const list=rows(type),fs=fields[type]||[];if(!list.length)return `<div class="empty">لا توجد سجلات حتى الآن</div>`;
 const cols=fs.slice(0,5);return `<div class="table-wrap"><table><thead><tr><th>م</th>${cols.map(f=>`<th>${f[1]}</th>`).join("")}<th>التاريخ</th><th class="no-print">إجراء</th></tr></thead><tbody>${list.map((r,i)=>`<tr><td>${i+1}</td>${cols.map(f=>`<td>${f[0]==="location_url"&&(String(r.payload?.[f[0]]||"").startsWith("https://")||String(r.payload?.[f[0]]||"").startsWith("http://"))?`<a target="_blank" rel="noopener" href="${esc(r.payload[f[0]])}">فتح الموقع</a>`:esc(r.payload?.[f[0]])}</td>`).join("")}<td>${new Date(["bike_patrols","branch_patrols"].includes(type)&&r.payload?.patrol_date?r.payload.patrol_date+"T"+(r.payload.patrol_time||"00:00"):r.created_at).toLocaleString("ar-EG")}</td><td class="no-print"><button class="tiny" data-edit="${r.id}" data-type="${type}">تعديل</button> <button class="tiny" data-archive="${r.id}">أرشفة</button> ${["branches","patrol_sites","bike_patrols","incidents","emergencies"].includes(type)&&Number.isFinite(Number(r.payload?.lat))&&Number.isFinite(Number(r.payload?.lng))&&Number(r.payload.lat)>=-90&&Number(r.payload.lat)<=90&&Number(r.payload.lng)>=-180&&Number(r.payload.lng)<=180?`<a class="tiny map-link" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(r.payload.lat)}&mlon=${encodeURIComponent(r.payload.lng)}#map=16/${encodeURIComponent(r.payload.lat)}/${encodeURIComponent(r.payload.lng)}">الخريطة</a>`:""}</td></tr>`).join("")}</tbody></table></div>`}
function formHTML(type,r=null){const isEditing=!!r?.id;const fs=fields[type]||[];const gpsButton=["branches","patrol_sites","incidents","emergencies","bike_patrols"].includes(type)?`<div class="field gps-field"><button type="button" class="secondary" id="captureCurrentLocation">📍 تحديد موقعي الحالي</button><small class="muted" id="gpsStatus">احصل على إحداثيات الموقع لإرفاقها بالسجل.</small></div>`:"";return `<div class="card" id="editor"><h3>${isEditing?"تعديل":"إضافة"} ${labels[type]}</h3><form id="recordForm" class="form">${gpsButton}${fs.map(f=>{let val=r?.payload?.[f[0]]??"";if(["bike_patrols","branch_patrols"].includes(type)&&!isEditing&&f[0]==="patrol_date"){const d=new Date();val=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}if(["bike_patrols","branch_patrols"].includes(type)&&!isEditing&&f[0]==="patrol_time"){const d=new Date();val=[String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join(":");}if(type==="bike_patrols"&&isEditing&&r?.payload){const legacy=String(r.payload.patrol_time||"");if(f[0]==="site"&&!val)val=r.payload.branch||"";if(f[0]==="patrol_date"&&!val)val=legacy.slice(0,10);if(f[0]==="patrol_time"&&legacy.includes("T"))val=legacy.slice(11,16);}let input=f[2]==="textarea"?`<textarea name="${f[0]}">${esc(val)}</textarea>`:f[2]==="select"?`<select name="${f[0]}">${f[3].split("|").map(v=>`<option ${v===val?"selected":""}>${v}</option>`).join("")}</select>`:`<input name="${f[0]}" type="${f[2]}" value="${esc(val)}" ${((f[2]==="select" ? f[4] : f[3])===1)?"required":""}>`;return `<div class="field"><label>${f[1]}</label>${input}</div>`}).join("")}${isEditing?`<div class="field"><label>سبب التعديل (مطلوب للتوثيق)</label><input name="edit_reason" required placeholder="اكتب سبب تعديل السجل"></div>`:""}${type==="documents"?`<div class="field"><label>إرفاق ملفات (حتى 15 ميجابايت للملف)</label><input id="documentFiles" type="file" multiple></div><div id="documentAttachments" class="muted">${r?"جارٍ تحميل المرفقات...":"يمكنك إرفاق الملفات بعد الحفظ."}</div>`:""}${type==="handovers"?`<div class="field signature-field"><label>توقيع المستلم (توقيع مرسوم محليًا)</label><canvas id="handoverSignature" width="900" height="240" aria-label="مساحة التوقيع"></canvas><input type="hidden" name="signature_data" value="${esc(r?.payload?.signature_data||"")}"><button type="button" class="secondary" id="clearSignature">مسح التوقيع</button><small class="muted">التوقيع صورة محفوظة ضمن سجل التسليم، وليس توقيعًا إلكترونيًا موثقًا.</small></div>`:""}</form><div class="actions"><button class="primary" id="saveRecord">حفظ السجل</button><button class="secondary" id="cancelEdit">إلغاء</button></div></div>`}
async function currentCoordinates(){
 let nativeError=null;
 const native=window.Capacitor?.Plugins?.CurrentLocation;
 if(native?.getCurrentLocation){
  try{
   const result=await native.getCurrentLocation();
   if(Number.isFinite(Number(result?.latitude))&&Number.isFinite(Number(result?.longitude)))return {latitude:Number(result.latitude),longitude:Number(result.longitude),accuracy:Number(result.accuracy||0)};
   nativeError=new Error("لم يرجع مكوّن أندرويد إحداثيات صحيحة.");
  }catch(error){nativeError=error;}
 }
 if(navigator.geolocation){
  try{
   return await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(
    p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy||0}),
    e=>reject(new Error(e.code===1?"لم تسمح للتطبيق باستخدام موقعك. افتح أذونات DEBOO16 واختر السماح أثناء استخدام التطبيق.":e.code===2?"تعذر تحديد الموقع؛ تأكد من تشغيل خدمة الموقع GPS.":"انتهت مهلة تحديد الموقع، حاول مرة أخرى.")),
    {enableHighAccuracy:false,timeout:25000,maximumAge:60000}
   ));
  }catch(error){
   if(nativeError)throw new Error((error.message||"تعذر تحديد الموقع.")+" (مكوّن أندرويد: "+(nativeError.message||"تعذر الوصول للموقع")+")");
   throw error;
  }
 }
 if(nativeError)throw new Error(nativeError.message||"تعذر الوصول إلى خدمة الموقع.");
 throw new Error("تحديد الموقع غير مدعوم على هذا الجهاز.");
}
function bindLocationCapture(type){
 const button=$("#captureCurrentLocation");if(!button)return;
 button.onclick=async()=>{
  const status=$("#gpsStatus");
  button.disabled=true;status.textContent="جارٍ تحديد موقعك الحالي...";
  try{
   const position=await currentCoordinates();
   const lat=position.latitude.toFixed(6),lng=position.longitude.toFixed(6);
   const form=$("#recordForm");
   if(form?.elements.namedItem("lat"))form.elements.namedItem("lat").value=lat;
   if(form?.elements.namedItem("lng"))form.elements.namedItem("lng").value=lng;
   status.textContent="تم تحديد موقعك: "+lat+", "+lng+" — دقة تقريبية "+Math.round(position.accuracy||0)+" متر. سيتم حفظ الإحداثيات مع السجل.";
  }catch(error){status.textContent=error.message||"تعذر تحديد موقعك الحالي.";}
  finally{button.disabled=false;}
 };
}
function bindHandoverSignature(){const canvas=$("#handoverSignature");if(!canvas)return;const ctx=canvas.getContext("2d"),hidden=$('input[name="signature_data"]');ctx.lineWidth=4;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#101a2c";let drawing=false;const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height}};canvas.addEventListener("pointerdown",e=>{drawing=true;canvas.setPointerCapture(e.pointerId);const p=point(e);ctx.beginPath();ctx.moveTo(p.x,p.y)});canvas.addEventListener("pointermove",e=>{if(!drawing)return;const p=point(e);ctx.lineTo(p.x,p.y);ctx.stroke();hidden.value=canvas.toDataURL("image/png")});const finish=()=>{if(drawing){drawing=false;hidden.value=canvas.toDataURL("image/png")}};canvas.addEventListener("pointerup",finish);canvas.addEventListener("pointercancel",finish);$("#clearSignature")?.addEventListener("click",()=>{ctx.clearRect(0,0,canvas.width,canvas.height);hidden.value=""});const saved=hidden.value;if(saved){const img=new Image();img.onload=()=>ctx.drawImage(img,0,0,canvas.width,canvas.height);img.src=saved}}
function bindPatrolLocationInput(type){
 if(type!=="bike_patrols")return;
 const input=document.querySelector('#recordForm [name="location_url"]');if(!input)return;
 input.addEventListener("input",()=>{
  const coords=extractSharedCoordinates(input.value);
  if(!coords)return;
  const form=$("#recordForm");
  form.elements.namedItem("lat").value=coords.lat.toFixed(6);
  form.elements.namedItem("lng").value=coords.lng.toFixed(6);
  const site=nearestPatrolSite(coords);
  if(site&&form.elements.namedItem("site"))form.elements.namedItem("site").value=site.payload.name;
 });
}
function bindAutocomplete(){
 const sourceKeys={
  branch:[["branches","name"],["patrol_sites","name"]],
  site:[["patrol_sites","name"]],
  person:[["patrol_people","name"],["emergency_people","name"]],
  responsible:[["managers","name"],["patrol_people","name"],["emergency_people","name"]],
  manager:[["managers","name"]],
  bike:[["bikes","number"]],
  sender:[["patrol_people","name"],["managers","name"]],
  receiver:[["patrol_people","name"],["managers","name"]],
  replacement:[["patrol_people","name"],["emergency_people","name"],["managers","name"]],
  employee:[["patrol_people","name"],["emergency_people","name"]],
  employee_name:[["patrol_people","name"],["emergency_people","name"]],
  patrol_person:[["patrol_people","name"]],
  emergency_person:[["emergency_people","name"]],
  branch_name:[["branches","name"]],
  site_name:[["patrol_sites","name"]],
  bike_number:[["bikes","number"]],
  department_manager:[["managers","name"]]
 };
 const normalize=v=>String(v||"").trim().toLocaleLowerCase("ar").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي");
 const styleId="deboo-autocomplete-style";
 if(!document.getElementById(styleId)){
  const style=document.createElement("style");style.id=styleId;
  style.textContent=".deboo-suggest{position:absolute;z-index:10050;top:calc(100% + 4px);right:0;left:0;max-height:220px;overflow:auto;background:var(--card,#fff);color:var(--text,#172033);border:1px solid var(--border,#d8dee8);border-radius:12px;box-shadow:0 8px 24px #0002;padding:5px;display:none}.deboo-suggest.open{display:block}.deboo-suggest button{display:block;width:100%;text-align:right;background:transparent;color:inherit;border:0;border-radius:8px;padding:11px 12px;font:inherit;min-height:42px}.deboo-suggest button:active,.deboo-suggest button:hover{background:var(--soft,#edf2f7)}.field.deboo-autocomplete-field{position:relative;overflow:visible}.deboo-suggest-empty{padding:10px 12px;color:var(--muted,#687386);font-size:13px}";
  document.head.appendChild(style);
 }
 Object.entries(sourceKeys).forEach(([field,sources])=>{
  const input=document.querySelector('#recordForm [name="'+field+'"]');
  if(!input||input.tagName==="TEXTAREA"||input.tagName==="SELECT"||input.type==="hidden")return;
  const wrapper=input.closest(".field")||input.parentElement;
  if(!wrapper)return;
  wrapper.classList.add("deboo-autocomplete-field");
  let list=wrapper.querySelector(".deboo-suggest");
  if(!list){list=document.createElement("div");list.className="deboo-suggest";list.setAttribute("role","listbox");wrapper.appendChild(list);}
  input.removeAttribute("list");
  const values=[...new Set(sources.flatMap(([type,key])=>cache.filter(row=>row.entity_type===type&&!row.is_archived).map(row=>String(row.payload?.[key]||"").trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,"ar"));
  const close=()=>{list.classList.remove("open");list.innerHTML="";};
  const show=()=>{
   const query=normalize(input.value);
   const matches=values.filter(v=>!query||normalize(v).includes(query)).slice(0,10);
   list.innerHTML="";
   if(!matches.length){close();return;}
   matches.forEach(value=>{
    const option=document.createElement("button");option.type="button";option.textContent=value;option.setAttribute("role","option");
    option.addEventListener("pointerdown",event=>{event.preventDefault();input.value=value;input.dispatchEvent(new Event("change",{bubbles:true}));close();});
    list.appendChild(option);
   });
   list.classList.add("open");
  };
  input.addEventListener("focus",show);
  input.addEventListener("input",show);
  input.addEventListener("keydown",event=>{if(event.key==="Escape")close();if(event.key==="ArrowDown"&&list.classList.contains("open")){event.preventDefault();list.querySelector("button")?.focus();}});
  input.addEventListener("blur",()=>setTimeout(close,180));
 });
}
function renderEntity(type){
 currentType=type;
 const editing=currentEdit;
 const host=$("#groupContent")||area;
 host.innerHTML=`${host===area?pageHead(labels[type],`<button class="primary" id="addRecord">+ إضافة سجل</button>`):`<div class="page-head"><h2>${labels[type]}</h2><button class="primary" id="addRecord">+ إضافة سجل</button></div>`}<div class="card"><div class="inline"><span class="pill">${rows(type).length} سجل</span><input id="localFilter" placeholder="تصفية النتائج..." value="${esc(searchTerm)}"></div></div>${editing?.id||editing?formHTML(type,editing):""}<div class="card">${table(type)}</div>`;
 bindAutocomplete();
 bindPatrolLocationInput(type);
 bindLocationCapture(type);
 if(type==="handovers"&&editing)bindHandoverSignature();
 if(type==="documents"&&editing?.id){
  DebooDB.attachments(editing.id).then(items=>{
   const box=$("#documentAttachments");if(!box)return;
   box.innerHTML=items.length?items.map(a=>`<div class="notice"><span>${esc(a.name)} (${Math.ceil(a.size/1024)} KB)</span> <button class="tiny" data-download-attachment="${a.id}">تنزيل</button></div>`).join(""):"لا توجد مرفقات محفوظة لهذا المستند.";
   $$('[data-download-attachment]').forEach(b=>b.onclick=async()=>{const item=await DebooDB.getAttachment(b.dataset.downloadAttachment);if(item)DebooDB.downloadBlob(item.blob,item.name);else toast("المرفق غير موجود");});
  }).catch(e=>toast(e.message));
 }
 if(type==="handovers"&&editing?.id){
  DebooDB.handoverHistory(editing.id).then(items=>{
   const editor=$("#editor");if(!editor)return;
   const box=document.createElement("div");box.className="card";
   box.innerHTML=`<h3>سجل إصدارات التسليم</h3>${items.map((v,i)=>`<div class="notice">الإصدار ${v.version} — ${new Date(v.created_at).toLocaleString("ar-EG")}<small>${esc(v.reason||"")}</small><button class="tiny" type="button" data-handover-version="${i}">عرض النسخة المحفوظة</button></div>`).join("")||"لا توجد إصدارات سابقة."}`;
   editor.after(box);
   box.querySelectorAll("[data-handover-version]").forEach(btn=>btn.addEventListener("click",()=>{
    const version=items[Number(btn.dataset.handoverVersion)];if(!version)return;
    const payload=version.snapshot?.payload||version.payload||{};
    const form=$("#recordForm");if(!form)return;
    Object.entries(payload).forEach(([key,value])=>{const field=form.elements.namedItem(key);if(field&&field.type!=="hidden")field.value=value??"";});
    const signature=form.elements.namedItem("signature_data");if(signature)signature.value=payload.signature_data||"";
    bindHandoverSignature();toast("تم عرض النسخة المحفوظة");
   }));
  }).catch(e=>toast(e.message));
 }
 $("#addRecord").onclick=()=>{currentEdit={id:null,payload:{}};renderEntity(type);};
 if(type==="branch_patrols"){
  $("[data-branch-slot]").forEach(button=>button.addEventListener("click",async()=>{
   if(button.disabled)return;
   const branch=button.dataset.branchName,date=button.dataset.branchDate;
   const d=new Date(),time=[String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join(":");
   button.disabled=true;button.textContent="جارٍ الحفظ...";
   try{await DebooDB.save("branch_patrols",{branch,patrol_date:date,patrol_time:time,responsible:"",condition:"",notes:""},null);await refresh();renderEntity("branch_patrols");toast("تم تسجيل المرور الساعة "+time);}
   catch(error){button.disabled=false;button.textContent="＋ تسجيل";toast("تعذر تسجيل المرور: "+error.message);}
  }));
  $("[data-branch-date]").forEach(input=>input.addEventListener("change",async()=>{
   const branch=input.dataset.branchDate,date=input.value;if(!date)return;
   const d=new Date(),time=[String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join(":");
   try{await DebooDB.save("branch_patrols",{branch,patrol_date:date,patrol_time:time,responsible:"",condition:"",notes:""},null);await refresh();renderEntity("branch_patrols");toast("تم تسجيل المرور بتاريخ "+date+" الساعة "+time);}
   catch(error){toast("تعذر تسجيل المرور: "+error.message);}
  }));
 }
 $("#cancelEdit")?.addEventListener("click",()=>{currentEdit=null;renderEntity(type);});
 $("#saveRecord")?.addEventListener("click",async()=>{
  const form=$("#recordForm");if(!form.reportValidity())return;
  const payload=Object.fromEntries(new FormData(form).entries());
  const files=[...($("#documentFiles")?.files||[])];
  const editId=currentEdit?.id||null;
  try{
   const saved=await DebooDB.save(type,payload,editId);
   if(type==="documents")for(const file of files)await DebooDB.saveAttachment(saved.id,file);
   currentEdit=null;await refresh();renderEntity(type);toast("تم حفظ السجل وتسجيل العملية");
  }catch(e){toast("فشل الحفظ: "+e.message);}
 });
 $("#localFilter")?.addEventListener("input",e=>{const value=e.target.value,caret=e.target.selectionStart;searchTerm=value;renderEntity(type);const next=$("#localFilter");if(next){next.focus();next.setSelectionRange(caret,caret);}});
 $$('[data-edit]').forEach(b=>b.onclick=()=>{const found=cache.find(x=>x.id===b.dataset.edit);if(found){currentEdit=found;renderEntity(type);$("#editor")?.scrollIntoView({behavior:"smooth"});}});
 $$('[data-archive]').forEach(b=>b.onclick=async()=>{if(!confirm("تأكيد أرشفة السجل؟ لن يتم حذفه نهائيًا."))return;try{await DebooDB.archive(b.dataset.archive);await refresh();renderEntity(type);toast("تمت الأرشفة");}catch(e){toast(e.message);}});
}
function home(){if(localStorage.getItem("deboo_weather_city")==="Shibin El Kom")localStorage.setItem("deboo_weather_city","Cairo");const count=t=>rows(t).length;const openInc=rows("incidents").filter(x=>x.payload.status!=="مغلق").length;const openTasks=rows("tasks").filter(x=>!["مكتملة"].includes(x.payload.status)).length;const late=rows("tasks").filter(x=>x.payload.due_date&&new Date(x.payload.due_date)<new Date()&&x.payload.status!=="مكتملة").length;
 area.innerHTML=`${pageHead("لوحة التحكم",`<button class="secondary" id="refreshBtn">تحديث البيانات</button> <button class="secondary" id="logoutBtn">تسجيل الخروج</button>`)}
 ${stats([["إجمالي الفروع",count("branches")],["أفراد الدوريات",count("patrol_people")],["أفراد الطوارئ",count("emergency_people")],["الدراجات",count("bikes")],["البلاغات المفتوحة",openInc],["المهام الجارية",openTasks],["المهام المتأخرة",late],["حالات الطوارئ",count("emergencies")]])}
 <div class="card"><div class="page-head"><h2>حالة الطقس</h2><span class="pill" id="weatherUpdated">لم يتم التحديث</span></div><div class="weather"><div><div class="weather-temp" id="weatherTemp">--°</div><b id="weatherDesc">بانتظار تحديد الموقع</b><p class="muted" id="weatherExtra">الطقس يحتاج اتصالًا بالإنترنت</p></div><div class="field"><label>المدينة أو الموقع</label><div class="inline"><input id="weatherCity" placeholder="مثال: شبين الكوم" value="${esc(localStorage.getItem("deboo_weather_city")||"Cairo")}"><button class="primary" id="weatherGo">تحديث الطقس</button><button class="secondary" id="weatherGPS">موقعي</button></div></div></div></div>
 <div class="card"><h2>آخر العمليات</h2>${cache.slice(0,8).map(x=>`<div class="notice"><b>${esc(labels[x.entity_type]||x.entity_type)}</b> — ${esc(Object.values(x.payload||{}).filter(Boolean).slice(0,2).join(" • "))}<small class="muted"> | ${new Date(x.created_at).toLocaleString("ar-EG")}</small></div>`).join("")||'<div class="empty">لا توجد عمليات مسجلة</div>'}</div>
 <div class="card"><h2>تنبيهات المتابعة</h2>${late?`<div class="notice danger-text">يوجد ${late} مهمة متأخرة تحتاج مراجعة.</div>`:"<div class='notice ok-text'>لا توجد مهام متأخرة مسجلة.</div>"}${openInc?`<div class="notice">يوجد ${openInc} بلاغ مفتوح أو قيد المعالجة.</div>`:""}</div>`;
 $("#refreshBtn").onclick=async()=>{await refresh();home();toast("تم تحديث البيانات")};$("#logoutBtn").onclick=()=>{if(!localStorage.getItem("deboo16_pin_v1")){toast("فعّل رمز PIN من الإعدادات أولًا.");return;}$("#appRoot").classList.add("hidden");$("#authPanel").classList.remove("hidden");$("#authPassword").value="";$("#authMessage").textContent="أدخل رمز PIN أو استخدم البصمة لفتح التطبيق.";setupBiometricLogin();};
 $("#weatherGo").onclick=()=>weather($("#weatherCity").value);$("#weatherGPS").onclick=async()=>{try{const p=await currentCoordinates();weatherCoords(p.latitude,p.longitude)}catch(e){toast(e.message||"تعذر تحديد موقعك الحالي")}};
 const savedCity=$("#weatherCity").value||"Cairo";
 if(navigator.onLine)weather(savedCity);else{$("#weatherDesc").textContent="في انتظار الاتصال بالإنترنت";$("#weatherExtra").textContent="سيتم عرض الطقس تلقائيًا عند عودة الاتصال."}
 if(window.__debooWeatherTimer)clearInterval(window.__debooWeatherTimer);
 window.__debooWeatherTimer=setInterval(()=>{if(currentPage==="home"&&navigator.onLine){const city=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(city)}},30*60*1000);
}
async function weather(city){if(!city)return;localStorage.setItem("deboo_weather_city",city);$("#weatherDesc").textContent="جارٍ جلب البيانات...";try{const g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ar&format=json`);const j=await g.json();if(!j.results?.length)throw Error("لم يتم العثور على الموقع");await weatherCoords(j.results[0].latitude,j.results[0].longitude,j.results[0].name)}catch(e){$("#weatherDesc").textContent="تعذر تحديث الطقس";$("#weatherExtra").textContent=e.message}}
async function weatherCoords(lat,lon,name="موقعك"){try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`);if(!r.ok)throw Error("خدمة الطقس غير متاحة");const j=await r.json(),c=j.current;const desc=({0:"سماء صافية",1:"غالبًا صافٍ",2:"غائم جزئيًا",3:"غائم",45:"ضباب",48:"ضباب متجمد",51:"رذاذ خفيف",61:"مطر خفيف",63:"مطر متوسط",65:"مطر غزير",71:"ثلوج خفيفة",80:"زخات مطر",95:"عواصف رعدية"})[c.weather_code]||"حالة جوية متغيرة";$("#weatherTemp").textContent=Math.round(c.temperature_2m)+"°";$("#weatherDesc").textContent=desc+" — "+name;$("#weatherExtra").textContent=`الرطوبة ${c.relative_humidity_2m}% • الرياح ${c.wind_speed_10m} كم/س • المحسوسة ${c.apparent_temperature}°`;$("#weatherUpdated").textContent="آخر تحديث: "+new Date().toLocaleTimeString("ar-EG")}catch(e){$("#weatherDesc").textContent="تعذر تحديث الطقس";$("#weatherExtra").textContent=e.message}}
function groupPage(p){const list=pageGroups[p]||[];area.innerHTML=`${pageHead(p==="follow"?"المتابعة":"البيانات")}<div class="subnav">${list.map((t,i)=>`<button data-type="${t}" class="${i===0?"active":""}">${labels[t]}</button>`).join("")}</div><div id="groupContent"></div>`;$$(".subnav button").forEach(b=>b.onclick=()=>{$$(".subnav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentEdit=null;renderEntity(b.dataset.type)});renderEntity(list[0]);}
function dataManagementPage(){
 area.innerHTML=`${pageHead("إدارة البيانات",`<button class="secondary" id="backSettings">العودة للإعدادات</button>`)}<p class="muted">إدارة بيانات الفروع والأفراد والدراجات والمديرين والمستندات من مكان واحد.</p><div class="subnav">${pageGroups.data.map((t,i)=>`<button data-type="${t}" class="${i===0?"active":""}">${labels[t]}</button>`).join("")}</div><div id="groupContent"></div>`;
 $("#backSettings").onclick=()=>render("settings");
 $$(".subnav button").forEach(b=>b.onclick=()=>{$$(".subnav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentEdit=null;renderEntity(b.dataset.type)});
 renderEntity(pageGroups.data[0]);
}
function emergencyPage(){area.innerHTML=`${pageHead("الطوارئ")}<div class="subnav"><button data-type="emergencies">حالات الطوارئ</button><button data-type="emergency_people">أفراد الطوارئ</button></div><div id="groupContent"></div>`;$$(".subnav button").forEach(b=>b.onclick=()=>{currentEdit=null;renderEntity(b.dataset.type)});renderEntity("emergencies")}
function reports(){const data=cache.filter(x=>!x.is_archived);area.innerHTML=`${pageHead("مركز التقارير",`<button class="secondary" id="showArchive">الأرشيف</button><button class="primary" id="printReport">طباعة / PDF</button><button class="secondary" id="csvReport">تصدير CSV</button><button class="secondary" id="excelReport">تصدير Excel</button><button class="secondary" id="approveReport">اعتماد نسخة التقرير</button>`)}<div class="card"><div class="form"><div class="field"><label>من تاريخ</label><input id="fromDate" type="date"></div><div class="field"><label>إلى تاريخ</label><input id="toDate" type="date"></div><div class="field"><label>نوع التقرير</label><select id="reportType"><option value="">الكل</option>${Object.entries(labels).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></div></div><div id="reportSummary">${reportHTML(data)}</div></div><div id="archivePanel" class="card hidden"><div class="page-head"><h3>أرشيف السجلات</h3><button class="secondary" id="closeArchive">العودة للتقارير</button></div><div id="archiveContent">جارٍ تحميل الأرشيف...</div></div>`;
 const showArchive=async()=>{
  $("#archivePanel").classList.remove("hidden");$("#reportSummary").parentElement.classList.add("hidden");
  const archived=await DebooDB.all({archived:true});
  const host=$("#archiveContent");
  host.innerHTML=archived.length?`<div class="table-wrap"><table><thead><tr><th>القسم</th><th>التاريخ</th><th>ملخص السجل</th><th>إجراء</th></tr></thead><tbody>${archived.map(x=>`<tr><td>${esc(labels[x.entity_type]||x.entity_type)}</td><td>${new Date(["bike_patrols","branch_patrols"].includes(x.entity_type)&&x.payload?.patrol_date?x.payload.patrol_date+"T"+(x.payload.patrol_time||"00:00"):x.created_at).toLocaleString("ar-EG")}</td><td>${esc(Object.values(x.payload||{}).filter(Boolean).slice(0,4).join(" • "))}</td><td><button class="tiny" data-restore-record="${x.id}">استعادة</button></td></tr>`).join("")}</tbody></table></div>`:"<div class='empty'>الأرشيف فارغ حاليًا.</div>";
  host.querySelectorAll("[data-restore-record]").forEach(btn=>btn.onclick=async()=>{if(!confirm("استعادة السجل إلى قائمة العمل؟"))return;try{await DebooDB.unarchive(btn.dataset.restoreRecord);await refresh();toast("تمت استعادة السجل");await showArchive()}catch(e){toast("تعذرت الاستعادة: "+e.message)}});
 };
 $("#showArchive").onclick=showArchive;
 $("#closeArchive").onclick=()=>{$("#archivePanel").classList.add("hidden");$("#reportSummary").parentElement.classList.remove("hidden")};
 const get=()=>{let a=$("#fromDate").value,b=$("#toDate").value,t=$("#reportType").value;const day=x=>["bike_patrols","branch_patrols"].includes(x.entity_type)?(x.payload?.patrol_date||x.created_at.slice(0,10)):x.created_at.slice(0,10);return data.filter(x=>(!t||x.entity_type===t)&&(!a||day(x)>=a)&&(!b||day(x)<=b))};
 ["fromDate","toDate","reportType"].forEach(id=>$("#"+id).onchange=()=>$("#reportSummary").innerHTML=reportHTML(get()));
 $("#printReport").onclick=()=>window.print();
 $("#csvReport").onclick=()=>{const d=get();const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';const csv=[["النوع","التاريخ","البيانات"].map(q).join(","),...d.map(x=>[labels[x.entity_type]||x.entity_type,["bike_patrols","branch_patrols"].includes(x.entity_type)?`${x.payload?.patrol_date||x.created_at.slice(0,10)} ${x.payload?.patrol_time||""}`:x.created_at,JSON.stringify(x.payload)].map(q).join(","))].join("\r\n");DebooDB.downloadBlob(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),"DEBOO16-report.csv")};
 $("#excelReport").onclick=()=>{const d=get();const xe=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");const rows=[["القسم","التاريخ","البيانات"],...d.map(x=>[labels[x.entity_type]||x.entity_type,new Date(["bike_patrols","branch_patrols"].includes(x.entity_type)&&x.payload?.patrol_date?x.payload.patrol_date+"T"+(x.payload.patrol_time||"00:00"):x.created_at).toLocaleString("ar-EG"),JSON.stringify(x.payload)])];const xml='<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="DEBOO16"><Table>'+rows.map(row=>'<Row>'+row.map(cell=>'<Cell><Data ss:Type="String">'+xe(cell)+'</Data></Cell>').join("")+'</Row>').join("")+'</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DisplayRightToLeft/></WorksheetOptions></Worksheet></Workbook>';DebooDB.downloadBlob(new Blob(["\ufeff"+xml],{type:"application/vnd.ms-excel;charset=utf-8"}),"DEBOO16-report.xls")};
 $("#approveReport").onclick=async()=>{try{const d=get(),snapshot={title:"تقرير معتمد",created_at:new Date().toISOString(),data:d};await DebooDB.approve(snapshot);toast("تم حفظ نسخة التقرير المعتمدة محليًا")}catch(e){toast("تعذر اعتماد التقرير: "+e.message)}};
}
function reportHTML(d){const by={};d.forEach(x=>by[x.entity_type]=(by[x.entity_type]||0)+1);return `<h3>تقرير DEBOO16</h3><p class="muted">تاريخ الإنشاء: ${new Date().toLocaleString("ar-EG")} • عدد السجلات: ${d.length}</p>${stats(Object.entries(by).map(([k,v])=>[labels[k]||k,v]))}<div class="table-wrap"><table><thead><tr><th>القسم</th><th>التاريخ</th><th>ملخص</th></tr></thead><tbody>${d.map(x=>`<tr><td>${labels[x.entity_type]||x.entity_type}</td><td>${new Date(x.created_at).toLocaleString("ar-EG")}</td><td>${esc(Object.values(x.payload||{}).filter(Boolean).slice(0,4).join(" • "))}</td></tr>`).join("")}</tbody></table></div><p class="muted">المُعد: المستخدم المسجل حاليًا • الاعتماد والتوقيع: __________________</p>`}
async function settings(){area.innerHTML=`${pageHead("الإعدادات")}<div class="card"><h3>وضع التشغيل المحلي</h3><div class="actions"><button class="primary" id="openDataManagement">إدارة البيانات</button></div><p class="muted">البيانات محفوظة داخل هذا المتصفح على هذا الجهاز فقط. لا توجد مزامنة سحابية أو حسابات فريق في هذه النسخة.</p><span class="pill">تخزين محلي IndexedDB</span><div class="actions"><button class="secondary" id="installAppBtn">تثبيت التطبيق على الجهاز</button><button class="secondary" id="storageCheckBtn">فحص مساحة التخزين</button><button class="secondary" id="storagePersistBtn">طلب حماية البيانات من الإزالة التلقائية</button></div><div id="deviceStatus" class="muted" aria-live="polite">جارٍ فحص حالة الجهاز...</div></div><div class="card"><h3>النسخ الاحتياطي والاستعادة</h3><p class="muted">النسخة الاحتياطية تشمل السجلات وسجل المراجعة والتقارير المعتمدة والمرفقات وإصدارات تسليم الشفت. احتفظ بنسخة خارج الهاتف بانتظام.</p><div class="actions"><button class="primary" id="backupBtn">تنزيل نسخة احتياطية JSON</button><label class="secondary">استعادة نسخة JSON <input id="restoreFile" type="file" accept="application/json" hidden></label></div></div><div class="card"><h3>إنشاء رمز QR دون إنترنت</h3><p class="muted">أنشئ رمزًا نصيًا أو لرابط أو رقم سجل، ثم احفظه كصورة PNG. لا تُدخل بيانات سرية في رمز يمكن لأي شخص مسحه.</p><div class="field"><label for="qrText">النص أو الرابط</label><textarea id="qrText" rows="3" placeholder="اكتب النص أو الرابط المراد تحويله إلى QR"></textarea></div><div class="actions"><button class="secondary" id="makeQR">إنشاء QR</button><button class="secondary" id="downloadQR" disabled>تنزيل صورة PNG</button></div><div id="qrOutput" class="qr-output hidden"><canvas id="qrCanvas" width="320" height="320" aria-label="رمز QR"></canvas><div class="muted" id="qrStatus"></div></div></div><div class="card"><h3>تنبيهات المهام والبلاغات</h3><p class="muted">يمكن إرسال تنبيه أثناء فتح التطبيق عند وجود مهام متأخرة أو بلاغات عاجلة. التنبيه الخلفي الدائم غير مضمون على كل الأجهزة.</p><div class="actions"><button class="secondary" id="enableNotifications">تفعيل التنبيهات</button><button class="secondary" id="checkNotifications">فحص الآن</button></div><div id="notificationStatus" class="muted"></div></div><div class="card"><h3>سجل الأحداث</h3><div id="auditArea">جارٍ التحميل...</div></div><div class="card"><h3>قفل التطبيق برمز PIN</h3><p class="muted">رمز محلي من 4 إلى 8 أرقام، يتم تخزين بصمته باستخدام PBKDF2. هذا القفل لا يشفر قاعدة البيانات ولا يغني عن حماية الجهاز.</p><div class="form"><div class="field"><label>رمز PIN جديد</label><input id="newPin" type="password" inputmode="numeric" maxlength="8" placeholder="4 إلى 8 أرقام"></div><div class="field"><label>تأكيد رمز PIN</label><input id="confirmPin" type="password" inputmode="numeric" maxlength="8" placeholder="أعد كتابة الرمز"></div></div><div class="actions"><button class="secondary" id="savePin">حفظ / تغيير PIN</button><button class="secondary" id="disablePin">إلغاء القفل</button></div><div id="pinStatus" class="muted"></div></div>
<div class="card">
<h3>فتح التطبيق بالبصمة</h3>
<p class="muted">فعّل البصمة لفتح التطبيق بسرعة، مع الاحتفاظ برمز PIN كطريقة بديلة.</p>
<div class="actions">
<button class="primary" id="enableBiometric">تفعيل البصمة</button>
<button class="secondary" id="disableBiometric">إلغاء البصمة</button>
</div>
<div id="biometricStatus" class="muted"></div>
</div>
<div class="card"><h3>ملاحظات</h3><p class="muted">الطقس يحتاج الإنترنت. النسخة المحلية لا توفر مزامنة بين الأجهزة أو حسابات مستخدمين متعددة. البصمة متاحة عند بناء نسخة Android المدعومة.</p></div>`;

 $("#openDataManagement").onclick=dataManagementPage;
 const deviceStatus=$("#deviceStatus"),installBtn=$("#installAppBtn");
 const showDeviceStatus=async()=>{const online=navigator.onLine;let usage="غير متاح";try{if(navigator.storage?.estimate){const e=await navigator.storage.estimate();usage=`${(e.usage||0)/1048576|0} ميجابايت مستخدمة من ${(e.quota||0)/1048576|0} ميجابايت تقريبًا`;}}catch{}const persisted=navigator.storage?.persisted?await navigator.storage.persisted():null;deviceStatus.textContent=`الاتصال: ${online?"متصل":"غير متصل"} • التخزين: ${usage} • حماية البيانات: ${persisted===null?"غير مدعومة":persisted?"مفعّلة":"غير مفعّلة"}`};
 installBtn.disabled=!deferredInstallPrompt;installBtn.textContent=deferredInstallPrompt?"تثبيت التطبيق الآن":(window.matchMedia("(display-mode: standalone)").matches?"التطبيق مثبت بالفعل":"التثبيت من قائمة المتصفح إذا كان متاحًا");
 installBtn.onclick=async()=>{if(!deferredInstallPrompt){deviceStatus.textContent="إذا لم يظهر طلب التثبيت، افتح قائمة المتصفح واختر إضافة إلى الشاشة الرئيسية / تثبيت التطبيق.";return;}deferredInstallPrompt.prompt();const choice=await deferredInstallPrompt.userChoice;deviceStatus.textContent=choice.outcome==="accepted"?"تم قبول طلب التثبيت.":"تم إلغاء طلب التثبيت.";deferredInstallPrompt=null;installBtn.disabled=true;};
 $("#storageCheckBtn").onclick=showDeviceStatus;
 $("#storagePersistBtn").onclick=async()=>{if(!navigator.storage?.persist){deviceStatus.textContent="المتصفح لا يدعم طلب حماية التخزين الدائم.";return;}try{const ok=await navigator.storage.persist();deviceStatus.textContent=ok?"وافق المتصفح على حماية التخزين من الإزالة التلقائية.":"لم يمنح المتصفح الحماية الدائمة؛ احتفظ بنسخة احتياطية خارج الجهاز.";await showDeviceStatus();}catch(e){deviceStatus.textContent="تعذر طلب الحماية: "+e.message;}};
 showDeviceStatus();
 const qrText=$("#qrText"),qrCanvas=$("#qrCanvas"),qrOut=$("#qrOutput"),qrDownload=$("#downloadQR"),qrStatus=$("#qrStatus");let qrReady=false;
 $("#makeQR").onclick=()=>{const value=qrText.value.trim();if(!value){qrStatus.textContent="اكتب نصًا أو رابطًا أولًا.";qrOut.classList.remove("hidden");return;}try{if(!window.DebooQRCode)throw Error("مكتبة QR غير محملة.");const qr=new DebooQRCode(0,DebooQRErrorCorrectLevel.M);qr.addData(value);qr.make();const count=qr.getModuleCount(),ctx=qrCanvas.getContext("2d"),quiet=4,scale=Math.floor(320/(count+quiet*2)),size=scale*(count+quiet*2),offset=Math.floor((320-size)/2);ctx.fillStyle="#ffffff";ctx.fillRect(0,0,320,320);ctx.fillStyle="#050c19";for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))ctx.fillRect(offset+(col+quiet)*scale,offset+(row+quiet)*scale,scale,scale);qrOut.classList.remove("hidden");qrDownload.disabled=false;qrReady=true;qrStatus.textContent=`تم إنشاء الرمز بنجاح (${count} × ${count}) — يعمل دون اتصال.`;}catch(e){qrReady=false;qrDownload.disabled=true;qrOut.classList.remove("hidden");qrStatus.textContent="تعذر إنشاء الرمز: "+e.message;}};
 qrDownload.onclick=()=>{if(!qrReady)return;const a=document.createElement("a");a.download="DEBOO16-QR.png";a.href=qrCanvas.toDataURL("image/png");a.click();};
 $("#backupBtn").onclick=async()=>{try{const b=await DebooDB.backup();DebooDB.downloadBlob(new Blob([JSON.stringify(b,null,2)],{type:"application/json"}),"DEBOO16-backup-"+new Date().toISOString().slice(0,10)+".json");toast("تم إنشاء النسخة الاحتياطية")}catch(e){toast(e.message)}};
 $("#restoreFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(!confirm("سيتم استبدال السجلات الحالية بالنسخة المختارة. تمهّل وتأكد أن لديك نسخة حديثة. هل تريد المتابعة؟"))return;await DebooDB.restore(obj);await refresh();toast("اكتملت الاستعادة")}catch(err){toast("فشلت الاستعادة: "+err.message)}};
 const pinStatus=$("#pinStatus");
 $("#savePin").onclick=async()=>{const a=$("#newPin").value,b=$("#confirmPin").value;if(a!==b){pinStatus.textContent="الرمزان غير متطابقين.";return;}try{await storePin(a);pinStatus.textContent="تم حفظ رمز PIN. سيُطلب عند فتح التطبيق لاحقًا.";$("#newPin").value=$("#confirmPin").value="";}catch(e){pinStatus.textContent=e.message;}};
 $("#disablePin").onclick=()=>{if(!confirm("هل تريد إلغاء قفل PIN المحلي؟ سيتم إلغاء البصمة أيضًا وسيُفتح التطبيق مباشرة."))return;localStorage.removeItem("deboo16_pin_v1");localStorage.removeItem("deboo16_pin_attempts");localStorage.removeItem(BIOMETRIC_KEY);pinStatus.textContent="تم إلغاء القفل؛ سيفتح التطبيق مباشرة دون PIN أو بصمة.";};
 const biometricStatus=$("#biometricStatus");
 $("#enableBiometric").onclick=async()=>{
  if(!localStorage.getItem("deboo16_pin_v1")){biometricStatus.textContent="احفظ رمز PIN أولًا؛ سيظل متاحًا كطريقة بديلة عند تعذر البصمة.";return;}
  try{await checkBiometricAvailability();localStorage.setItem(BIOMETRIC_KEY,"1");biometricStatus.textContent="تم تفعيل البصمة. ستظهر بجوار زر فتح PIN عند قفل التطبيق.";setupBiometricLogin();}
  catch(e){localStorage.removeItem(BIOMETRIC_KEY);biometricStatus.textContent=e.message||"تعذر تفعيل البصمة على هذا الجهاز.";setupBiometricLogin();}
 };
 $("#disableBiometric").onclick=()=>{localStorage.removeItem(BIOMETRIC_KEY);biometricStatus.textContent="تم إلغاء فتح التطبيق بالبصمة. يمكنك استخدام PIN.";setupBiometricLogin();};
 biometricStatus.textContent=localStorage.getItem(BIOMETRIC_KEY)==="1"?"البصمة مفعّلة؛ PIN يظل متاحًا كبديل.":"البصمة غير مفعّلة.";
 const status=$("#notificationStatus");
 const checkAlerts=notify=>{const nowDate=new Date(),today=[nowDate.getFullYear(),String(nowDate.getMonth()+1).padStart(2,"0"),String(nowDate.getDate()).padStart(2,"0")].join("-");const late=cache.filter(x=>x.entity_type==="tasks"&&!x.is_archived&&x.payload?.due_date&&x.payload.due_date<today&&x.payload.status!=="مكتملة");const urgent=cache.filter(x=>x.entity_type==="incidents"&&!x.is_archived&&["عاجل","مرتفع"].includes(x.payload?.priority)&&x.payload?.status!=="مغلق");const message=`مهام متأخرة: ${late.length} — بلاغات عاجلة/مرتفعة مفتوحة: ${urgent.length}`;status.textContent=message;if(notify&&"Notification" in window&&Notification.permission==="granted"&&(late.length||urgent.length))new Notification("تنبيهات DEBOO16",{body:message,icon:"./icon.svg"});};
 $("#enableNotifications").onclick=async()=>{if(!("Notification" in window)){status.textContent="هذا المتصفح لا يدعم إشعارات النظام.";return;}const permission=await Notification.requestPermission();status.textContent=permission==="granted"?"تم السماح بالإشعارات. اضغط فحص الآن لإرسال التنبيه عند وجود عناصر.":"لم يتم منح إذن الإشعارات.";};
 $("#checkNotifications").onclick=()=>checkAlerts(true);checkAlerts(false);
 try{const a=await DebooDB.audit();$("#auditArea").innerHTML=a.map(x=>`<div class="notice">${esc(x.action)} — ${esc(x.reason||"")} <small>${new Date(x.created_at).toLocaleString("ar-EG")}</small></div>`).join("")||"لا توجد أحداث"}catch(e){$("#auditArea").textContent=e.message}
}
function render(p){currentPage=p;document.querySelector(".app-shell")?.classList.toggle("page-open",p!=="home");$$(".tile").forEach(b=>b.classList.toggle("active",b.dataset.page===p));searchTerm=$("#globalSearch").value||"";if(p==="home")home();else if(p==="follow")groupPage(p);else if(p==="emergency")emergencyPage();else if(p==="reports")reports();else if(p==="settings")settings();window.scrollTo({top:$("#contentArea").offsetTop-12,behavior:"smooth"})}
$$("[data-page]").forEach(b=>b.onclick=()=>render(b.dataset.page));
document.addEventListener("click",e=>{if(e.target.closest("[data-back-home]"))render("home")});
$("#globalSearch").addEventListener("input",e=>{const value=e.target.value,caret=e.target.selectionStart;searchTerm=value;if(currentType){renderEntity(currentType);const next=$("#globalSearch");if(next){next.focus();next.setSelectionRange(caret,caret)}}});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;if(currentPage==="settings")settings();});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;toast("تم تثبيت DEBOO16 على الجهاز.");if(currentPage==="settings")settings();});
window.addEventListener("online",()=>{const el=$("#deviceStatus");if(el)el.textContent="عاد الاتصال بالإنترنت.";if(currentPage==="home"){const city=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(city);}});
window.addEventListener("offline",()=>{const el=$("#deviceStatus");if(el)el.textContent="أنت تعمل دون اتصال؛ البيانات المحلية تظل متاحة.";const desc=$("#weatherDesc"),extra=$("#weatherExtra");if(desc)desc.textContent="لا يوجد اتصال بالإنترنت";if(extra)extra.textContent="سيتم تحديث الطقس تلقائيًا عند عودة الاتصال.";});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&currentPage==="home"&&navigator.onLine){const city=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(city);}});
// Auto-lock the local interface whenever the app is backgrounded, but only when PIN protection is enabled.
function lockApplication(){if(!localStorage.getItem("deboo16_pin_v1"))return;const root=$("#appRoot"),auth=$("#authPanel");if(root&&!root.classList.contains("hidden")){root.classList.add("hidden");auth?.classList.remove("hidden");$("#authPassword").value="";$("#authMessage").textContent="تم قفل التطبيق تلقائيًا. أدخل رمز PIN للمتابعة.";}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")lockApplication();});
window.addEventListener("pagehide",lockApplication);
dateText();if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));authState().catch(e=>toast(e.message));
})();
