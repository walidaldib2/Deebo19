(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const area=$("#contentArea");
const labels={branches:"الفروع",patrol_people:"أفراد الدوريات",emergency_people:"أفراد الطوارئ",bikes:"الدراجات",managers:"مديرو الأقسام",branch_patrols:"متابعة الفروع",bike_patrols:"مرور الدراجات",manager_rounds:"مرور مديري الأقسام",incidents:"البلاغات والحوادث",tasks:"المهام اليومية",handovers:"تسليم واستلام الشفت",absences:"غياب المسؤولين",emergencies:"حالات الطوارئ",documents:"خزنة المستندات",patrol_sites:"المخازن والمعارض ومراكز الخدمة",employees:"سجل الموظفين",custom_data:"بيانات إضافية",written_reports:"التقرير اليومي",memos:"مذكرة",daily_rosters:"تشكيل الشفت اليومي",bike_shift_assignments:"توزيع شفت مرور الدراجات"};
const fields={
branches:[["name","اسم الفرع","text",1],["code","كود الفرع","text"],["address","العنوان","text"],["manager","المسؤول","text"],["phone","رقم التواصل","tel"],["lat","خط العرض","number"],["lng","خط الطول","number"],["status","الحالة","select","نشط|متوقف"]],
patrol_people:[["name","اسم فرد الدورية","text",1],["employee_no","الرقم الوظيفي","text"],["phone","رقم الهاتف","tel"],["branch","الفرع","text"],["job","الوظيفة","text"],["status","الحالة","select","متاح|إجازة|موقوف"]],
emergency_people:[["name","اسم فرد الطوارئ","text",1],["specialty","التخصص","text"],["phone","رقم الهاتف","tel"],["branch","الفرع","text"],["availability","التوفر","select","متاح|مشغول|إجازة"]],
bikes:[["number","رقم الدراجة","text",1],["code","كود الدراجة","text"],["type","نوع الدراجة","text"],["description","الوصف","text"],["status","الحالة","select","جاهزة|بالمرور|صيانة|متوقفة"]],
patrol_sites:[["name","اسم المكان","text",1],["site_type","نوع المكان","select","مخزن|معرض|مركز خدمة",1],["address","العنوان / الوصف","text"],["lat","خط العرض","number"],["lng","خط الطول","number"],["notes","ملاحظات","textarea"]],
managers:[["name","اسم المدير","text",1],["department","القسم","text"],["phone","رقم التواصل","tel"],["branches","الفروع التابعة","text"]],
branch_patrols:[["branch","الفرع","text",1],["supervisor","المشرف","text",1],["responsible","المسؤول","text"],["patrol_date","تاريخ المرور","date",1],["patrol_time","ساعة المرور","time",1],["condition","حالة الفرع","select","جيد|ملاحظات|مخالفة|مغلق"],["notes","الملاحظات","textarea"]],
bike_patrols:[["bike","الدراجة","text",1],["person","اسم الفرد القائم بالمرور","text",1],["patrol_date","تاريخ المرور","date",1],["site_type","نوع المكان","select","مخزن|معرض|مركز خدمة",1],["site","تفاصيل المكان","text",1],["patrol_time","توقيت الوصول","time",1],["location_url","رابط موقع واتساب","url"],["lat","خط العرض","number"],["lng","خط الطول","number"],["notes","ملاحظات","textarea"]],
manager_rounds:[["manager","مدير القسم","text",1],["department","القسم","text"],["branches","الفروع التي تمت زيارتها","text"],["patrol_date","تاريخ المرور","date",1],["patrol_time","توقيت المرور","time",1],["result","نتيجة المرور","textarea"]],
incidents:[["incident_type","نوع البلاغ","select","أمني|تشغيلي|فني|إداري|حادث|أخرى",1],["incident_date","تاريخ البلاغ","date",1],["incident_time","وقت البلاغ","time",1],["branch","الفرع / الموقع","text"],["responsible","المسؤول","text"],["priority","الأولوية","select","عاجل|مرتفع|متوسط|منخفض"],["status","الحالة","select","جديد|قيد المعالجة|بانتظار إجراء|مغلق"],["description","وصف البلاغ","textarea",1],["lat","خط العرض","number"],["lng","خط الطول","number"],["action_taken","الإجراءات المتخذة","textarea"]],
tasks:[["title","عنوان المهمة","text",1],["responsible","المسؤول","text"],["branch","الفرع","text"],["start_date","تاريخ البداية","date"],["due_date","تاريخ النهاية","date"],["priority","الأولوية","select","عاجل|مرتفع|متوسط|منخفض"],["status","الحالة","select","جديدة|جارية|مكتملة|متأخرة"],["progress","نسبة الإنجاز %","number"],["notes","ملاحظات","textarea"]],
handovers:[["sender","اسم المسلم","text",1],["receiver","اسم المستلم","text",1],["open_tasks","المهام المفتوحة","textarea"],["open_incidents","البلاغات القائمة","textarea"],["notes","ملاحظات التسليم","textarea"],["acknowledged","إقرار الطرفين","select","تم الإقرار|بانتظار الإقرار"]],
absences:[["person","اسم المسؤول الغائب","text",1],["role","الوظيفة","select","مسؤول أمن|مسؤول مرور|مسؤول طوارئ|مدير قسم|أخرى",1],["branch","الفرع / الموقع","text"],["shift","الشفت","select","صباحي|مسائي|ليلي"],["absence_date","تاريخ الغياب","date",1],["reason","سبب الغياب","textarea"],["replacement","البديل / المكلف","text"],["action_taken","الإجراء المتخذ","textarea"]],
emergencies:[["case_type","تصنيف الحالة","text",1],["location","الموقع","text",1],["lat","خط العرض","number"],["lng","خط الطول","number"],["severity","درجة الخطورة","select","حرجة|مرتفعة|متوسطة|منخفضة"],["responsible","المسؤول","text"],["team","أفراد الاستجابة","text"],["status","الحالة","select","مفتوحة|قيد التعامل|منتهية"],["actions","الإجراءات","textarea"]],
employees:[["name","اسم الموظف","text",1],["sap_no","رقم ساب","text"],["phone","رقم الهاتف","tel"],["branch","الفرع","text"],["job","الوظيفة","select","مدير إدارة|مدير قسم|مشرف|مسؤول أمن",1]],
written_reports:[["report_title","عنوان التقرير","text",1],["report_date","تاريخ التقرير","date",1],["shift","الشفت","select","صباحي|مسائي|ليلي",1],["prepared_by","القائم بالتقرير","text",1],["report_text","نص التقرير","textarea",1]],
daily_rosters:[["work_date","تاريخ الشفت","date",1],["shift","الشفت","select","صباحي|مسائي|ليلي",1],["start_time","وقت بداية الشفت","time"],["end_time","وقت نهاية الشفت","time"],["patrol_people_ids","أفراد المرور","multi"],["emergency_people_ids","أفراد الطوارئ","multi"],["bike_ids","دراجات الشفت","multi"]],
bike_shift_assignments:[["work_date","تاريخ الشفت","date",1],["shift","الشفت","select","صباحي|مسائي|ليلي",1],["assignments","توزيع الأفراد على الدراجات","custom"]],
documents:[["title","اسم المستند","text",1],["category","التصنيف","text"],["reference","رقم / مرجع المستند","text"],["notes","ملاحظات","textarea"]],
custom_data:[["category","تصنيف البيانات","text",1],["name","اسم البيان","text",1],["value","القيمة / الرقم","text"],["branch","الفرع المرتبط","text"],["details","تفاصيل إضافية","textarea"]]
};
fields.memos=fields.written_reports.map(field=>field.slice());
// ربط سجلات التشغيل بتاريخ وشفت محددين دون المساس ببيانات السجل الأساسي.
for(const type of ["branch_patrols","manager_rounds","incidents","tasks","handovers","emergencies"]){
 if(!fields[type].some(f=>f[0]==="shift"))fields[type].push(["shift","الشفت","select","صباحي|مسائي|ليلي",1]);
}
fields.handovers.unshift(["handover_date","تاريخ الشفت","date",1]);
fields.emergencies.unshift(["emergency_date","تاريخ الحالة","date",1]);
fields.tasks.unshift(["work_date","تاريخ العمل","date",1]);
fields.absences.find(f=>f[0]==="shift")[4]=1;
const pageGroups={follow:["daily_rosters","branch_patrols","written_reports","memos"],data:["branches","patrol_people","bikes","patrol_sites","managers","documents","custom_data"],emergency:["emergencies","emergency_people"]};
const sectionMenus={operations:{title:"التشغيل الميداني",items:[["follow","متابعة الفروع"],["map","خط سير المرور اليومي"],["bikeMaps","خرائط الدراجات"],["bikeShiftAssignments","توزيع شفت مرور الدراجات"],["managerRounds","مرور المديرين"],["tasks","المهام والتكليفات"],["handovers","تسليم واستلام الشفت"]]},security:{title:"إدارة الأمن",items:[["employees","سجل الموظفين"],["attendance","الغياب والاستئذان"],["incidents","الحوادث والبلاغات"],["emergency","الطوارئ"]]},reportsGroup:{title:"التقارير والإحصائيات",items:[["reports","مركز التقارير"],["stats","الإحصائيات"]]}};
let cache=[],currentPage="home",currentType=null,currentEdit=null,currentEmployeeDetailId=null,weatherTimer=null,archiveTimer=null,searchTerm="",deferredInstallPrompt=null;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalize=v=>String(v||"").trim().toLocaleLowerCase("ar").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي");
const validCoordinatePair=(lat,lng)=>{const a=String(lat??"").trim(),b=String(lng??"").trim();if(!a||!b)return false;const x=Number(a),y=Number(b);return Number.isFinite(x)&&Number.isFinite(y)&&x>=-90&&x<=90&&y>=-180&&y<=180;};
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2800)}
function dateText(){const d=new Date();$("#todayDate").textContent=d.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long"})}
function configured(){return true}

const BIOMETRIC_KEY = "deboo16_biometric_enabled_v1";
const PIN_LOCK_KEY = "deboo16_pin_lock_enabled_v1";
function pinLockEnabled(){return localStorage.getItem(PIN_LOCK_KEY)==="1" && !!localStorage.getItem("deboo16_pin_v1");}

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
  if(pin && pinLockEnabled()){
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
async function openApplication(){
 $("#authPanel").classList.add("hidden");$("#appRoot").classList.remove("hidden");
 try{const removed=await DebooDB.purgeExpiredDeleted();if(removed)console.info("DEEB permanently removed expired bike patrols:",removed);const result=await DebooDB.archivePastDays();if(result.archived)console.info("DEEB archived previous-day shift records:",result.archived);}catch(error){console.warn("DEEB automatic shift archive:",error);}
 await refresh();
 try{await DebooDB.createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
 if(archiveTimer)clearInterval(archiveTimer);
 archiveTimer=setInterval(async()=>{try{const removed=await DebooDB.purgeExpiredDeleted();const result=await DebooDB.archivePastDays();if(removed||result.archived){await refresh();if(removed)console.info("DEEB permanently removed expired bike patrols:",removed);if(result.archived)console.info("DEEB archived previous-day shift records:",result.archived);}}catch(error){console.warn("DEEB automatic shift archive:",error);}},60000);
 render("landing");consumeSharedLocation();consumeNativeShare();
}
function extractSharedCoordinates(value){
 const s=String(value||"").replace(/&amp;/gi,"&").replace(/\\u0026/gi,"&").replace(/\\u003d/gi,"=");
 const decoded=(()=>{try{return decodeURIComponent(s.replace(/\\+/g,"%2B"));}catch(_){return s;}})();
 const candidates=[s,decoded];
 const patterns=[
  // Exact dropped pin coordinates take precedence over the map's approximate camera center.
  /!3d([-+]?\d{1,2}\.\d+)!4d([-+]?\d{1,3}\.\d+)/i,
  /geo:([-+]?\d{1,2}\.\d+)\s*[,;]\s*([-+]?\d{1,3}\.\d+)/i,
  /[?&](?:q|query|ll|center|destination|origin)=([-+]?\d{1,2}\.\d+)(?:%2C|,|%252C)([-+]?\d{1,3}\.\d+)/i,
  /@([-+]?\d{1,2}\.\d+),\s*([-+]?\d{1,3}\.\d+)/
 ];
 for(const candidate of candidates)for(const re of patterns){const m=candidate.match(re);if(m){const lat=Number(m[1]),lng=Number(m[2]);if(lat>=-90&&lat<=90&&lng>=-180&&lng<=180)return {lat,lng};}}
 return null;
}
function nearestPatrolSite(coords){
 if(!coords)return null;
 const rad=x=>x*Math.PI/180;
 const distance=(a,b)=>{const dLat=rad(b.lat-a.lat),dLng=rad(b.lng-a.lng),v=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v));};
 return cache.filter(x=>x.entity_type==="patrol_sites"&&!x.is_archived&&validCoordinatePair(x.payload?.lat,x.payload?.lng)).map(x=>({row:x,meters:distance(coords,{lat:Number(x.payload.lat),lng:Number(x.payload.lng)})})).filter(x=>x.meters<=500).sort((x,y)=>x.meters-y.meters)[0]?.row||null;
}
async function resolveBikePatrolLocation(input, sourceText="", isCurrent=()=>true){
 const form=input?.form||$("#recordForm");
 if(!form||!input)return null;
 const original=String(input.value||"").trim();
 let coords=extractSharedCoordinates(String(sourceText||"")+" "+original);
 if(!coords&&/^https:\/\//i.test(original)){
  const resolver=window.DEEBNativePlugins?.ShareIntent;
  if(resolver?.resolveSharedLocation){
   try{
    const resolved=await resolver.resolveSharedLocation({url:original});
    if(!isCurrent()||String(input.value||"").trim()!==original)return null;
    coords=extractSharedCoordinates(String(resolved?.url||"")+" "+String(resolved?.content||""));
   }catch(error){console.warn("DEEB Google Maps short-link resolution:",error);}
  }
 }
 if(!coords||!isCurrent()||String(input.value||"").trim()!==original)return null;
 const latField=form.elements.namedItem("lat"),lngField=form.elements.namedItem("lng");
 if(latField)latField.value=coords.lat.toFixed(6);
 if(lngField)lngField.value=coords.lng.toFixed(6);
 const site=nearestPatrolSite(coords);
 if(site&&form.elements.namedItem("site"))form.elements.namedItem("site").value=site.payload.name;
 return coords;
}
let lastSharedLocationPayload="";
async function consumeSharedLocation(sharedText=""){
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
 render("bikepatrol");
 $("#addRecord")?.click();
 const form=$("#recordForm");if(!form)return;
 const linkField=form.elements.namedItem("location_url");
 if(linkField)linkField.value=locationUrl;
 let coords=linkField?await resolveBikePatrolLocation(linkField,raw):extractSharedCoordinates(raw+" "+locationUrl);
 if(!coords){
  const match=cache.find(x=>x.entity_type==="patrol_sites"&&!x.is_archived&&raw.toLocaleLowerCase("ar").includes(String(x.payload?.name||"").toLocaleLowerCase("ar")));
  if(match&&form.elements.namedItem("site"))form.elements.namedItem("site").value=match.payload.name;
 }
 toast(coords?"تم استلام رابط الموقع واستخراج الإحداثيات تلقائيًا. اختر الدراجة وسجّل توقيت الوصول.":"تم استلام الرابط، لكن لم تظهر إحداثيات مؤكدة. سيُحفظ الرابط ويمكنك استكمال بيانات المرور.");
 form.elements.namedItem("patrol_time")?.focus();
}
async function consumeNativeShare(){
 const plugin=window.DEEBNativePlugins?.ShareIntent;
 if(!plugin?.getInitialShare)return;
 try{const result=await plugin.getInitialShare();if(result?.text)consumeSharedLocation(result.text);}
 catch(error){console.warn("DEEB share intake:",error);}
}
window.addEventListener("deboo-share-intent",event=>{consumeSharedLocation(event.detail?.text||"");const plugin=window.DEEBNativePlugins?.ShareIntent;plugin?.getInitialShare?.().catch(()=>{});});

const toB64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const fromB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function derivePin(pin,salt){const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);return crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:210000,hash:"SHA-256"},material,256)}
async function storePin(pin){if(!crypto?.subtle)throw Error("التشفير الآمن غير متاح. افتح التطبيق عبر HTTPS.");if(!/^\d{4,8}$/.test(pin))throw Error("استخدم رمزًا من 4 إلى 8 أرقام.");const salt=crypto.getRandomValues(new Uint8Array(16));const hash=await derivePin(pin,salt);localStorage.setItem("deboo16_pin_v1",JSON.stringify({salt:toB64(salt),hash:toB64(hash),iterations:210000}));localStorage.removeItem("deboo16_pin_attempts")}
async function verifyPin(pin){const cfg=JSON.parse(localStorage.getItem("deboo16_pin_v1")||"null");if(!cfg)return true;const attempts=JSON.parse(localStorage.getItem("deboo16_pin_attempts")||"{\"count\":0,\"until\":0}");if(Date.now()<attempts.until)throw Error("تم إيقاف المحاولة مؤقتًا. حاول بعد قليل.");const hash=await derivePin(pin,fromB64(cfg.salt));const a=new Uint8Array(hash),b=fromB64(cfg.hash);let diff=a.length^b.length;for(let i=0;i<Math.min(a.length,b.length);i++)diff|=a[i]^b[i];if(diff){attempts.count++;if(attempts.count>=5){attempts.count=0;attempts.until=Date.now()+30000;}localStorage.setItem("deboo16_pin_attempts",JSON.stringify(attempts));return false;}localStorage.removeItem("deboo16_pin_attempts");return true}
$("#loginBtn").onclick=async()=>{try{const ok=await verifyPin($("#authPassword").value);if(!ok){$("#authMessage").textContent="رمز PIN غير صحيح.";$("#authPassword").value="";return;}$("#authPassword").value="";await openApplication()}catch(e){$("#authMessage").textContent=e.message}};
async function refresh(){try{cache=await DebooDB.all();$("#branchCount").textContent=cache.filter(x=>x.entity_type==="branches").length;$("#followCount").textContent=cache.filter(x=>["branch_patrols","manager_rounds"].includes(x.entity_type)).length}catch(e){toast("تعذر تحميل البيانات: "+e.message)}}
function pageHead(title,actions=""){const back=currentPage!=="landing"?`<button class="secondary" type="button" data-back-home>رجوع للقائمة الرئيسية</button>`:"";return `<div class="page-head"><h1>${title}</h1><div class="actions no-print">${back}${actions}</div></div>`}
function stats(items){return `<div class="stats">${items.map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("")}</div>`}
function rows(type){return cache.filter(r=>r.entity_type===type&&!r.is_archived).filter(r=>!searchTerm||JSON.stringify(r.payload).toLowerCase().includes(searchTerm.toLowerCase()))}
const BRANCH_ORDER_KEY="deboo16_branch_order_v1";
let selectedBranchPatrolDate="";
function orderedBranchNames(names){
 const unique=[...new Set(names.map(v=>String(v||"").trim()).filter(Boolean))];
 let saved=[];try{saved=JSON.parse(localStorage.getItem(BRANCH_ORDER_KEY)||"[]");if(!Array.isArray(saved))saved=[];}catch{saved=[];}
 return [...unique].sort((a,b)=>{const ai=saved.indexOf(a),bi=saved.indexOf(b);if(ai>=0||bi>=0)return (ai<0?999999:ai)-(bi<0?999999:bi);return a.localeCompare(b,"ar");});
}
function moveBranchOrder(name,direction){
 const all=orderedBranchNames([...rows("branches").map(r=>r.payload?.name),...rows("branch_patrols").map(r=>r.payload?.branch)]);
 const index=all.indexOf(name),next=index+direction;if(index<0||next<0||next>=all.length)return;
 [all[index],all[next]]=[all[next],all[index]];localStorage.setItem(BRANCH_ORDER_KEY,JSON.stringify(all));
 renderEntity(currentType||"branches");toast("تم تحديث ترتيب الفروع");
}
function branchPatrolTable(){
 const records=rows("branch_patrols"),branches=rows("branches").map(r=>String(r.payload?.name||"").trim()).filter(Boolean);
 const today=(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");})();
 const rawNames=orderedBranchNames([...branches,...records.map(r=>String(r.payload?.branch||"").trim()).filter(Boolean)]);
 const uniqueNames=new Map();
 rawNames.forEach(name=>{const key=normalize(name).replace(/\s+/g," ");if(key&&!uniqueNames.has(key))uniqueNames.set(key,name);});
 const names=[...uniqueNames.values()];
 const availableDates=[...new Set([today,...records.map(r=>String(r.payload?.patrol_date||today).slice(0,10)).filter(Boolean)])].sort((a,b)=>b.localeCompare(a));
 if(!availableDates.includes(selectedBranchPatrolDate))selectedBranchPatrolDate=today;
 const selectedDate=selectedBranchPatrolDate;
 const visible=names.map(name=>{
  const key=normalize(name).replace(/\s+/g," ");
  const visits=records.filter(r=>normalize(String(r.payload?.branch||"").trim()).replace(/\s+/g," ")===key&&String(r.payload?.patrol_date||today).slice(0,10)===selectedDate).sort((a,b)=>String(a.created_at||"").localeCompare(String(b.created_at||"")));
  return {name,date:selectedDate,visits};
 }).filter(row=>!searchTerm||normalize(row.name).includes(normalize(searchTerm))||row.date.includes(searchTerm));
 if(!visible.length)return '<div class="empty">لا توجد فروع مسجلة. أضف الفروع من إدارة البيانات أولًا.</div>';
 const slotCount=5;
 const displayRows=visible.flatMap(row=>{const assigned=row.visits.map((visit,index)=>({visit,slot:Math.max(1,Number(visit.payload?.followup_slot)||index+1)}));const maxSlot=Math.max(1,...assigned.map(x=>x.slot));const groupSize=Math.ceil(maxSlot/slotCount);return Array.from({length:groupSize},(_,i)=>({...row,continuation:i>0,groupSize,slotOffset:i*slotCount,visits:Array.from({length:slotCount},(_,slot)=>assigned.find(x=>x.slot===i*slotCount+slot+1)?.visit||null)}));});
 const dateOptions=availableDates.map(date=>'<option value="'+esc(date)+'" '+(date===selectedDate?'selected':'')+'>'+esc(date)+'</option>').join("");
 return '<div class="field branch-patrol-date-filter"><label for="branchPatrolDateFilter">تاريخ المتابعة</label><select id="branchPatrolDateFilter">'+dateOptions+'</select></div><div class="table-wrap"><table class="branch-patrol-grid"><thead><tr><th>الفرع</th><th>تاريخ المرور</th>'+Array.from({length:slotCount},(_,i)=>'<th>متابعة '+(i+1)+'</th>').join("")+'</tr></thead><tbody>'+displayRows.map(row=>'<tr>'+(row.continuation?'':'<td rowspan="'+row.groupSize+'"><div class="branch-order-cell"><b>'+esc(row.name)+'</b><span class="branch-order-actions no-print"><button type="button" class="tiny" data-move-branch="'+esc(row.name)+'" data-direction="-1" title="لأعلى">↑</button><button type="button" class="tiny" data-move-branch="'+esc(row.name)+'" data-direction="1" title="لأسفل">↓</button></span><button type="button" class="tiny no-print" data-change-branch-supervisor="'+esc(row.name)+'" data-branch-date="'+esc(row.date)+'" title="تغيير اسم المشرف">تغيير المشرف</button></div></td><td rowspan="'+row.groupSize+'">'+esc(row.date)+'</td>')+Array.from({length:slotCount},(_,slot)=>{const visit=row.visits[slot];return '<td>'+(visit?'<div class="branch-visit-value">'+esc(visit.payload?.patrol_time||"—")+'</div><button type="button" class="tiny" data-edit="'+visit.id+'" data-type="branch_patrols" title="تعديل بيانات المرور">تعديل</button>':'<button type="button" class="secondary tiny branch-slot" data-branch-slot="'+(row.slotOffset+slot)+'" data-branch-name="'+esc(row.name)+'" data-branch-date="'+esc(row.date)+'">＋ تسجيل</button>')+'</td>';}).join("")+'</tr>').join("")+'</tbody></table></div>';if(located.length)renderBikeLeafletMap("bikeMapReportLeafletMap",mapPoints);
}
function table(type){if(type==="bike_shift_assignments"){const list=rows(type).slice().sort((a,b)=>String(b.payload?.work_date||"").localeCompare(String(a.payload?.work_date||""))||String(a.payload?.shift||"").localeCompare(String(b.payload?.shift||"")));if(!list.length)return '<div class="empty">لا يوجد توزيع محفوظ لشفتات الدراجات. اضغط «إضافة توزيع» لتحديد راكب كل دراجة.</div>';return '<div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>الشفت</th><th>توزيع الدراجات والأفراد</th><th>إجراء</th></tr></thead><tbody>'+list.map(r=>{const p=r.payload||{},items=Array.isArray(p.assignments)?p.assignments:[];return '<tr><td>'+esc(p.work_date||"—")+'</td><td>'+esc(p.shift||"—")+'</td><td>'+items.map((a,i)=>{const bike=cache.find(x=>x.id===a.bike_id&&x.entity_type==="bikes"),person=cache.find(x=>x.id===a.person_id&&x.entity_type==="patrol_people");return '<div><b>دراجة '+(i+1)+'</b> — '+esc(bike?.payload?.number||"دراجة غير موجودة")+' : '+esc(person?.payload?.name||"لم يتم تحديد الراكب")+'</div>';}).join("")+'</td><td><button type="button" class="tiny" data-edit="'+esc(r.id)+'">تعديل التوزيع</button></td></tr>';}).join("")+'</tbody></table></div>';}if(type==="daily_rosters"){const list=rows(type).slice().sort((a,b)=>String(b.payload?.work_date||"").localeCompare(String(a.payload?.work_date||""))||String(a.payload?.shift||"").localeCompare(String(b.payload?.shift||"")));if(!list.length)return '<div class="empty">لا يوجد تشكيل شفتات محفوظ. أضف تشكيلًا جديدًا واختر التاريخ والشفت وأفراد المرور والطوارئ والدراجات.</div>';const names=(ids,entity,field)=>{return (Array.isArray(ids)?ids:[]).map(id=>{const row=cache.find(x=>x.id===id&&x.entity_type===entity);return row?(row.payload?.[field]||"غير معروف"):"سجل أساسي غير موجود";}).join("، ")||"لم يتم اختيار أي عناصر";};return '<div class="table-wrap"><table><thead><tr><th>التاريخ</th><th>الشفت</th><th>أفراد المرور</th><th>أفراد الطوارئ</th><th>الدراجات</th><th>الإجمالي</th><th class="no-print">إجراء</th></tr></thead><tbody>'+list.map(r=>{const p=r.payload||{},people=Array.isArray(p.patrol_people_ids)?p.patrol_people_ids:[],emergency=Array.isArray(p.emergency_people_ids)?p.emergency_people_ids:[],bikes=Array.isArray(p.bike_ids)?p.bike_ids:[];return '<tr><td>'+esc(p.work_date||"—")+'</td><td>'+esc(p.shift||"—")+'<small>'+esc([p.start_time,p.end_time].filter(Boolean).join(" — ")||"الوقت غير محدد")+'</small></td><td>'+esc(names(people,"patrol_people","name"))+'</td><td>'+esc(names(emergency,"emergency_people","name"))+'</td><td>'+esc(names(bikes,"bikes","number"))+'</td><td>'+people.length+' مرور / '+emergency.length+' طوارئ / '+bikes.length+' دراجات</td><td class="no-print"><button class="tiny" data-edit="'+r.id+'">تعديل التشكيل</button> <button class="tiny" data-archive="'+r.id+'">أرشفة</button></td></tr>';}).join("")+'</tbody></table></div>';}if(type==="written_reports"||type==="memos"){const list=rows(type).slice().sort((a,b)=>String(b.payload?.report_date||b.created_at||"").localeCompare(String(a.payload?.report_date||a.created_at||"")));if(!list.length)return '<div class="empty">لا توجد سجلات محفوظة. اضغط «إضافة '+(type==="memos"?"مذكرة":"تقرير يومي")+'» للكتابة.</div>';return '<div class="written-report-list">'+list.map((r,i)=>{const p=r.payload||{};return '<article class="written-report-card"><div class="written-report-card-head"><div><strong>'+(type==="memos"?"المذكرة":"التقرير اليومي")+' #'+(i+1)+'</strong><span>'+esc(p.report_date||"التاريخ غير محدد")+' · '+esc(p.shift||"الشفت غير محدد")+'</span></div><div class="written-report-actions no-print"><button type="button" class="primary tiny" data-edit="'+r.id+'" data-type="'+type+'">تعديل '+(type==="memos"?"المذكرة":"التقرير") +'</button><button type="button" class="secondary tiny" data-archive="'+r.id+'">أرشفة</button></div></div><div class="written-report-card-meta"><span><b>الفرع / الموقع:</b> '+esc(p.branch||"—")+'</span></div><p>'+esc(String(p.report_text||"").slice(0,240))+'</p></article>';}).join("")+'</div>';}if(type==="employees"){const employeeQuery=String(searchTerm||"").trim().toLocaleLowerCase("ar");const list=rows(type).filter(r=>!employeeQuery||String(r.payload?.name||"").toLocaleLowerCase("ar").includes(employeeQuery)||String(r.payload?.job||"").toLocaleLowerCase("ar").includes(employeeQuery)||String(r.payload?.sap_no||"").toLocaleLowerCase("ar").includes(employeeQuery));const selected=list.find(r=>r.id===currentEmployeeDetailId)||null;if(selected){const p=selected.payload||{};return `<div class="employee-detail"><div class="page-head"><h3>بيانات الموظف</h3><button class="secondary" type="button" id="employeeListBack">رجوع للقائمة</button></div><div class="employee-profile"><div class="employee-name">${esc(p.name)}</div><div class="employee-meta">${esc(p.job||"—")}</div></div><dl class="employee-fields">${[["رقم ساب",p.sap_no],["رقم الهاتف",p.phone],["الفرع",p.branch],["الوظيفة",p.job]].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v||"—")}</dd></div>`).join("")}</dl><div class="actions"><button class="primary" type="button" data-employee-edit="${selected.id}">تعديل البيانات</button><button class="secondary" type="button" data-archive="${selected.id}">أرشفة الموظف</button></div></div>`;}if(!list.length)return `<div class="empty">لا يوجد موظفون مسجلون. اضغط «إضافة سجل» لإضافة أول موظف.</div>`;return `<div class="employee-list">${list.map(r=>`<button type="button" class="employee-list-item" data-employee-detail="${r.id}"><span class="employee-list-name">${esc(r.payload?.name||"بدون اسم")}</span><span class="employee-list-job">${esc(r.payload?.job||"")}</span><span class="employee-list-arrow">‹</span></button>`).join("")}</div>`;}if(type==="branch_patrols")return branchPatrolTable();const list=type==="branches"?orderedBranchNames(rows(type).map(r=>r.payload?.name)).map(name=>rows(type).find(r=>String(r.payload?.name||"").trim()===name)).filter(Boolean):rows(type),fs=fields[type]||[];if(!list.length)return `<div class="empty">لا توجد سجلات حتى الآن</div>`;
 const cols=type==="bike_patrols"?fs.slice(0,6):fs.slice(0,5),showDate=type!=="bike_patrols";return `<div class="table-wrap"><table><thead><tr><th>م</th>${cols.map(f=>`<th>${f[1]}</th>`).join("")}${showDate?"<th>التاريخ</th>":""}<th class="no-print">إجراء</th></tr></thead><tbody>${list.map((r,i)=>`<tr><td>${i+1}</td>${cols.map(f=>`<td>${f[0]==="location_url"&&(String(r.payload?.[f[0]]||"").startsWith("https://")||String(r.payload?.[f[0]]||"").startsWith("http://"))?`<a target="_blank" rel="noopener" href="${esc(r.payload[f[0]])}">فتح الموقع</a>`:esc(r.payload?.[f[0]])}</td>`).join("")}${showDate?`<td>${new Date(["bike_patrols","branch_patrols"].includes(type)&&r.payload?.patrol_date?r.payload.patrol_date+"T"+(r.payload.patrol_time||"00:00"):r.created_at).toLocaleString("ar-EG")}</td>`:""}<td class="no-print"><button class="tiny" data-edit="${r.id}" data-type="${type}">${type==="bike_patrols"?"تعديل التوقيت":"تعديل"}</button> ${type==="branches"?`<button class="tiny" data-move-branch="${esc(r.payload?.name||"")}" data-direction="-1" title="تحريك لأعلى">↑</button><button class="tiny" data-move-branch="${esc(r.payload?.name||"")}" data-direction="1" title="تحريك لأسفل">↓</button>`:""} <button class="tiny" data-archive="${r.id}">أرشفة</button> ${type==="bike_patrols"?`<button class="tiny" data-soft-delete="${r.id}">حذف</button>`:""} ${["branches","patrol_sites","bike_patrols","incidents","emergencies"].includes(type)&&validCoordinatePair(r.payload?.lat,r.payload?.lng)?`<a class="tiny map-link" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(r.payload.lat)}&mlon=${encodeURIComponent(r.payload.lng)}#map=16/${encodeURIComponent(r.payload.lat)}/${encodeURIComponent(r.payload.lng)}">الخريطة</a>`:""}</td></tr>`).join("")}</tbody></table></div>`}
function formHTML(type,r=null){const isEditing=!!r?.id;const fs=fields[type]||[];const gpsButton=["branches","patrol_sites","incidents","emergencies","bike_patrols"].includes(type)?`<div class="field gps-field"><button type="button" class="secondary" id="captureCurrentLocation">📍 تحديد موقعي الحالي</button><small class="muted" id="gpsStatus">احصل على إحداثيات الموقع لإرفاقها بالسجل.</small></div>`:"";return `<div class="card" id="editor"><h3>${type==="branch_patrols"&&r?.payload?.branch_supervisor_edit?"تغيير اسم مشرف الفرع":type==="branch_patrols"&&r?.payload?.branch_repeat?"تسجيل وقت المتابعة":isEditing?"تعديل "+labels[type]:"إضافة "+labels[type]}</h3><form id="recordForm" class="form">${gpsButton}${fs.map(f=>{let val=r?.payload?.[f[0]]??"";if(type==="branch_patrols"&&r?.payload?.branch_supervisor_edit&&f[0]!=="supervisor")return `<input type="hidden" name="${f[0]}" value="${esc(val)}">`;if(type==="branch_patrols"&&r?.payload?.branch_repeat&&!r?.payload?.branch_supervisor_edit&&f[0]!=="patrol_time")return `<input type="hidden" name="${f[0]}" value="${esc(val)}">`;const shiftContext=patrolShiftContext();if(!isEditing&&type==="manager_rounds"){if(f[0]==="branch"&&!val)val=shiftContext.branch||"";if(f[0]==="supervisor"&&!val)val=shiftContext.supervisor||"";if(f[0]==="branches"&&!val)val=shiftContext.branch||"";}if((type==="written_reports"||type==="memos")&&f[0]==="report_title")val=type==="memos"?"مذكرة":"التقرير اليومي";if(["report_date","incident_date","patrol_date","handover_date","emergency_date","work_date"].includes(f[0])&&!isEditing&&!val){const d=new Date();val=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}if(type==="incidents"&&!isEditing&&f[0]==="incident_date"){const d=new Date();val=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}if(type==="incidents"&&!isEditing&&f[0]==="incident_time"){const d=new Date();val=[String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join(":");}if(type==="incidents"&&isEditing&&!val&&r?.created_at){val=r.created_at.slice(f[0]==="incident_date"?0:11,f[0]==="incident_date"?10:16);}if(type==="manager_rounds"&&isEditing&&!val&&r?.created_at&&(f[0]==="patrol_date"||f[0]==="patrol_time"))val=r.created_at.slice(f[0]==="patrol_date"?0:11,f[0]==="patrol_date"?10:16);if(["bike_patrols","branch_patrols","manager_rounds"].includes(type)&&!isEditing&&f[0]==="patrol_date"){const d=new Date();val=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}if(["bike_patrols","branch_patrols","manager_rounds"].includes(type)&&!isEditing&&f[0]==="patrol_time"){const d=new Date();val=[String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join(":");}if(type==="bike_patrols"&&isEditing&&r?.payload){const legacy=String(r.payload.patrol_time||"");if(f[0]==="site"&&!val)val=r.payload.branch||"";if(f[0]==="patrol_date"&&!val)val=legacy.slice(0,10);if(f[0]==="patrol_time"&&legacy.includes("T"))val=legacy.slice(11,16);}let input=(type==="bike_shift_assignments"&&f[0]==="assignments")?(()=>{const bikes=cache.filter(x=>x.entity_type==="bikes"&&!x.is_archived).slice().sort((a,b)=>String(a.created_at||"").localeCompare(String(b.created_at||""))),people=cache.filter(x=>x.entity_type==="patrol_people"&&!x.is_archived&&!["إجازة","موقوف"].includes(x.payload?.status)),saved=Array.isArray(val)?val:[];return '<div class="multi-options" style="border:1px solid var(--border);border-radius:10px;padding:10px;display:grid;gap:10px">'+bikes.map((bike,index)=>{const old=saved.find(a=>a.bike_id===bike.id);return '<div class="field"><label>دراجة '+(index+1)+' — '+esc(bike.payload?.number||"")+'</label><select data-bike-assignment="'+esc(bike.id)+'"><option value="">اختر الفرد الراكب</option>'+people.map(person=>'<option value="'+esc(person.id)+'" '+(old?.person_id===person.id?"selected":"")+' >'+esc(person.payload?.name||"")+(person.payload?.employee_no?" — "+esc(person.payload.employee_no):"")+'</option>').join("")+'</select></div>';}).join("")+(bikes.length?"":'<span class="muted">لا توجد دراجات مسجلة في البيانات الأساسية.</span>')+(people.length?"":'<span class="muted">لا يوجد أفراد مرور مسجلون في البيانات الأساسية.</span>')+'</div><small class="muted">ترتيب «دراجة 1، دراجة 2…» حسب ترتيب تسجيل الدراجات في البيانات الأساسية.</small>';})():(type==="daily_rosters"&&f[2]==="multi"&&f[0]==="patrol_people_ids")?`<div class="multi-options" style="max-height:210px;overflow:auto;border:1px solid var(--border);border-radius:10px;padding:8px">${cache.filter(x=>x.entity_type==="patrol_people"&&!x.is_archived).map(x=>{const id=String(x.id),selected=Array.isArray(val)&&val.includes(id);return `<label style="display:flex;align-items:center;gap:9px;padding:7px"><input type="checkbox" name="patrol_people_ids" value="${esc(id)}" ${selected?"checked":""}><span>${esc(x.payload?.name||"")}${x.payload?.employee_no?" — "+esc(x.payload.employee_no):""}</span></label>`;}).join("")||'<span class="muted">لا يوجد أفراد مرور مسجلون بعد.</span>'}</div><small class="muted">يمكن اختيار أكثر من فرد. البيانات الأساسية لا تتغير.</small>`:(type==="daily_rosters"&&f[2]==="multi"&&f[0]==="emergency_people_ids")?`<div class="multi-options" style="max-height:210px;overflow:auto;border:1px solid var(--border);border-radius:10px;padding:8px">${cache.filter(x=>x.entity_type==="emergency_people"&&!x.is_archived).map(x=>{const id=String(x.id),selected=Array.isArray(val)&&val.includes(id);return `<label style="display:flex;align-items:center;gap:9px;padding:7px"><input type="checkbox" name="emergency_people_ids" value="${esc(id)}" ${selected?"checked":""}><span>${esc(x.payload?.name||"")}${x.payload?.specialty?" — "+esc(x.payload.specialty):""}</span></label>`;}).join("")||'<span class="muted">لا يوجد أفراد طوارئ مسجلون بعد.</span>'}</div><small class="muted">يمكن اختيار أكثر من فرد طوارئ للشفت.</small>`:(type==="daily_rosters"&&f[2]==="multi"&&f[0]==="bike_ids")?`<div class="multi-options" style="max-height:210px;overflow:auto;border:1px solid var(--border);border-radius:10px;padding:8px">${cache.filter(x=>x.entity_type==="bikes"&&!x.is_archived).map(x=>{const id=String(x.id),selected=Array.isArray(val)&&val.includes(id);return `<label style="display:flex;align-items:center;gap:9px;padding:7px"><input type="checkbox" name="bike_ids" value="${esc(id)}" ${selected?"checked":""}><span>${esc(x.payload?.number||"")}${x.payload?.type?" — "+esc(x.payload.type):""}</span></label>`;}).join("")||'<span class="muted">لا توجد دراجات مسجلة بعد.</span>'}</div><small class="muted">يمكن اختيار أكثر من دراجة. اختيار اليوم مستقل عن بقية الأيام.</small>`:(type==="bike_patrols"&&f[0]==="bike"&&cache.filter(x=>x.entity_type==="bikes"&&!x.is_archived).length)?`<select name="bike" required><option value="" disabled ${!val?"selected":""}>اختر الدراجة المسجلة</option>${cache.filter(x=>x.entity_type==="bikes"&&!x.is_archived).map(x=>{const v=String(x.payload?.number||"");return `<option value="${esc(v)}" ${v===String(val)?"selected":""}>${esc(v)} — ${esc(x.payload?.type||"")}</option>`;}).join("")}</select>`:(type==="bike_patrols"&&f[0]==="person"&&cache.filter(x=>x.entity_type==="patrol_people"&&!x.is_archived).length)?`<select name="person" required><option value="" disabled ${!val?"selected":""}>اختر فرد المرور المسجل</option>${cache.filter(x=>x.entity_type==="patrol_people"&&!x.is_archived).map(x=>{const v=String(x.payload?.name||"");return `<option value="${esc(v)}" ${v===String(val)?"selected":""}>${esc(v)} — ${esc(x.payload?.job||"")}</option>`;}).join("")}</select>`:(type==="bike_patrols"&&f[0]==="branch")?(()=>{const branches=cache.filter(x=>x.entity_type==="branches"&&!x.is_archived).map(x=>String(x.payload?.name||"").trim()).filter(Boolean);const hasCurrent=branches.some(v=>v===String(val));return `<select name="branch" required><option value="" disabled ${!val?"selected":""}>${branches.length?"اختر الفرع":"لا توجد فروع مسجلة — أضف الفروع من البيانات الأساسية"}</option>${val&&!hasCurrent?`<option value="${esc(val)}" selected>${esc(val)} (فرع محفوظ سابقًا)</option>`:""}${branches.map(v=>`<option value="${esc(v)}" ${v===String(val)?"selected":""}>${esc(v)}</option>`).join("")}</select>`;})():(f[2]==="hidden"||((type==="written_reports"||type==="memos")&&f[0]==="report_title"))?`<input name="${f[0]}" type="hidden" value="${esc(val)}">`:f[2]==="textarea"?`<textarea name="${f[0]}" ${(type==="written_reports"||type==="memos")&&f[0]==="report_text"?'rows="14" style="width:100%;min-height:280px;line-height:1.9" placeholder="اكتب ملخص الشفت، ما تم إنجازه، الملاحظات، المعوقات، والإجراءات المطلوبة..." ':""}>${esc(val)}</textarea>`:f[2]==="select"?`<select name="${f[0]}" ${f[4]===1?"required":""}>${f[0]==="shift"?`<option value="" disabled ${!val?"selected":""}>اختر الشفت</option>`:""}${f[3].split("|").map(v=>`<option ${v===val?"selected":""}>${v}</option>`).join("")}</select>`:`<input name="${f[0]}" type="${f[2]}" value="${esc(val)}" ${f[2]==="number"?(f[0]==="lat"?'step="any" min="-90" max="90" inputmode="decimal"':f[0]==="lng"?'step="any" min="-180" max="180" inputmode="decimal"':f[0]==="progress"?'step="1" min="0" max="100"':'step="any"'):""} ${((f[2]==="select" ? f[4] : f[3])===1)?"required":""}>`;return (f[2]==="hidden"||(["written_reports","memos"].includes(type)&&f[0]==="report_title"))?input:`<div class="field"><label>${f[1]}</label>${input}</div>`}).join("")}${type==="branch_patrols"&&r?.payload?.followup_slot?`<input type="hidden" name="followup_slot" value="${esc(r.payload.followup_slot)}">`:""}${type==="manager_rounds"?(()=>{const c=patrolShiftContext(),p=r?.payload||{};return `<input type="hidden" name="branch_context" value="${esc(p.branch_context??c.branch??"")}"><input type="hidden" name="supervisor_context" value="${esc(p.supervisor_context??c.supervisor??"")}"><input type="hidden" name="shift_context" value="${esc(p.shift_context??c.shift??"")}">`;})():""}${type==="bike_patrols"&&isEditing&&r?.payload?.branch?`<input type="hidden" name="branch" value="${esc(r.payload.branch)}">`:""}${isEditing?`<div class="field"><label>سبب التعديل (مطلوب للتوثيق)</label><input name="edit_reason" required placeholder="اكتب سبب تعديل السجل"></div>`:""}${["documents","incidents"].includes(type)?`<div class="field"><label>${type==="incidents"?"صور ومستندات البلاغ":"إرفاق ملفات"} (حتى 15 ميجابايت للملف)</label><input id="documentFiles" type="file" accept="${type==="incidents"?"image/*,.pdf,.doc,.docx":""}" multiple></div><div id="documentAttachments" class="muted">${r?"جارٍ تحميل المرفقات...":"يمكنك إرفاق الملفات بعد الحفظ."}</div>`:""}${type==="handovers"?`<div class="field signature-field"><label>توقيع المستلم (توقيع مرسوم محليًا)</label><canvas id="handoverSignature" width="900" height="240" aria-label="مساحة التوقيع"></canvas><input type="hidden" name="signature_data" value="${esc(r?.payload?.signature_data||"")}"><button type="button" class="secondary" id="clearSignature">مسح التوقيع</button><small class="muted">التوقيع صورة محفوظة ضمن سجل التسليم، وليس توقيعًا إلكترونيًا موثقًا.</small></div>`:""}<div class="actions"><button class="primary" id="saveRecord" type="submit">${type==="branch_patrols"&&r?.payload?.branch_repeat?"حفظ وقت المتابعة":"حفظ السجل"}</button><button class="secondary" id="cancelEdit" type="button">إلغاء</button></div><p id="saveStatus" class="muted" aria-live="polite"></p></form></div>`}
async function currentCoordinates(){
 let nativeError=null;
 const native=window.DEEBNativePlugins?.CurrentLocation;
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
    e=>reject(new Error(e.code===1?"لم تسمح للتطبيق باستخدام موقعك. افتح أذونات DEEB واختر السماح أثناء استخدام التطبيق.":e.code===2?"تعذر تحديد الموقع؛ تأكد من تشغيل خدمة الموقع GPS.":"انتهت مهلة تحديد الموقع، حاول مرة أخرى.")),
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
 let timer=null,sequence=0;
 const applyDirectCoordinates=()=>{
  const coords=extractSharedCoordinates(input.value);
  if(!coords)return false;
  const form=$("#recordForm");
  form.elements.namedItem("lat").value=coords.lat.toFixed(6);
  form.elements.namedItem("lng").value=coords.lng.toFixed(6);
  const site=nearestPatrolSite(coords);
  if(site&&form.elements.namedItem("site"))form.elements.namedItem("site").value=site.payload.name;
  return true;
 };
 const resolve=async()=>{
  const current=++sequence;
  const coords=await resolveBikePatrolLocation(input,"",()=>current===sequence);
  if(coords)toast("تم تحويل رابط خرائط جوجل إلى إحداثيات وحفظها في حقول مرور الدراجة.");
 };
 input.addEventListener("input",()=>{
  sequence++;
  clearTimeout(timer);
  if(applyDirectCoordinates())return;
  if(/^https:\/\//i.test(String(input.value||"").trim()))timer=setTimeout(resolve,700);
 });
 input.addEventListener("blur",()=>{
  clearTimeout(timer);
  if(!applyDirectCoordinates())resolve();
 });
}
function bindGlobalSearchSuggestions(){
 const input=$("#globalSearch");if(!input)return;
 let list=$("#globalSearchSuggestions");
 if(!list){list=document.createElement("datalist");list.id="globalSearchSuggestions";input.insertAdjacentElement("afterend",list);}
 input.setAttribute("list","globalSearchSuggestions");
 const update=()=>{
  const query=normalize(input.value);list.replaceChildren();if(!query)return;
  const values=new Set();
  cache.filter(record=>!record.is_archived).forEach(record=>Object.values(record.payload||{}).forEach(value=>{
   if(typeof value!=="string"&&typeof value!=="number")return;
   const candidate=String(value).trim();if(candidate&&normalize(candidate).includes(query))values.add(candidate);
  }));
  [...values].sort((a,b)=>a.localeCompare(b,"ar")).slice(0,20).forEach(value=>{const option=document.createElement("option");option.value=value;list.appendChild(option);});
 };
 input.addEventListener("input",update);input.addEventListener("focus",update);
}
function bindAutocomplete(){
 const sourceKeys={
  branch:[["branches","name"],["patrol_sites","name"]],
  site:[["patrol_sites","name"],["branches","name"]],
  person:[["patrol_people","name"],["emergency_people","name"],["branches","manager"]],
  supervisor:[["employees","name"],["managers","name"],["patrol_people","name"]],
  responsible:[["managers","name"],["patrol_people","name"],["emergency_people","name"],["branches","manager"],["branch_patrols","responsible"]],
  manager:[["managers","name"],["branches","manager"]],
  bike:[["bikes","number"]],
  sender:[["patrol_people","name"],["managers","name"],["branches","manager"]],
  receiver:[["patrol_people","name"],["managers","name"],["branches","manager"]],
  replacement:[["patrol_people","name"],["emergency_people","name"],["managers","name"],["branches","manager"]],
  employee:[["patrol_people","name"],["emergency_people","name"],["branches","manager"]],
  employee_name:[["patrol_people","name"],["emergency_people","name"],["branches","manager"]],
  patrol_person:[["patrol_people","name"]],
  emergency_person:[["emergency_people","name"]],
  branch_name:[["branches","name"]],
  site_name:[["patrol_sites","name"]],
  bike_number:[["bikes","number"]],
  department_manager:[["managers","name"],["branches","manager"]],
  team:[["patrol_people","name"],["emergency_people","name"]],
  location:[["patrol_sites","name"],["branches","name"]],
  department:[["managers","department"]],
  branches:[["branches","name"],["managers","branches"]],
  patrol_site:[["patrol_sites","name"]],
  employee_no:[["patrol_people","employee_no"]],
  phone:[["patrol_people","phone"],["emergency_people","phone"],["managers","phone"]]
 };

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
   const matches=values.filter(v=>!query||normalize(v).startsWith(query)).concat(values.filter(v=>query&&!normalize(v).startsWith(query)&&normalize(v).includes(query))).slice(0,10);
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
function patrolShiftContext(){try{return JSON.parse(localStorage.getItem("deboo_patrol_shift_context_v1")||"{}")||{};}catch(_){return {};}}
function patrolShiftContextMarkup(type){
 if(type!=="manager_rounds")return "";
 const c=patrolShiftContext();
 return `<div class="card patrol-shift-context" style="border:1px solid var(--border);padding:14px;margin-bottom:12px"><h3 style="margin-top:0">بيانات الشفت — تُسجّل مرة واحدة</h3><div class="form-grid"><div class="field"><label>الفرع</label><input id="patrolSessionBranch" value="${esc(c.branch||"")}" placeholder="اسم الفرع"></div><div class="field"><label>المشرف</label><input id="patrolSessionSupervisor" value="${esc(c.supervisor||"")}" placeholder="اسم المشرف"></div><div class="field"><label>الشفت</label><select id="patrolSessionShift"><option value="">اختر الشفت</option>${["صباحي","مسائي","ليلي"].map(v=>`<option value="${v}" ${c.shift===v?"selected":""}>${v}</option>`).join("")}</select></div></div><button type="button" class="primary" id="savePatrolShiftContext">حفظ بيانات الشفت</button><small class="muted" style="display:block;margin-top:7px">سيتم إدراج هذه البيانات تلقائيًا في كل تسجيل مرور جديد حتى تغيّرها للشفت التالي.</small></div>`;
}
function renderEntity(type){
 currentType=type;
 const editing=currentEdit;
 const host=$("#groupContent")||area;
 host.innerHTML=`${host===area?pageHead(labels[type],`<button class="primary" id="addRecord">+ إضافة سجل</button>`):`<div class="page-head"><h2>${labels[type]}</h2><button class="primary" id="addRecord">${type==="written_reports"?"+ إضافة تقرير يومي":type==="memos"?"+ إضافة مذكرة":type==="bike_shift_assignments"?"+ إضافة توزيع":"+ إضافة سجل"}</button></div>`}<div class="card"><div class="inline"><span class="pill">${rows(type).length} سجل</span><input id="localFilter" placeholder="تصفية النتائج..." value="${esc(searchTerm)}"></div></div>${patrolShiftContextMarkup(type)}${editing?.id||editing?formHTML(type,editing):""}<div class="card">${table(type)}</div>`;
 const saveShiftContext=$("#savePatrolShiftContext");
 if(saveShiftContext)saveShiftContext.addEventListener("click",()=>{
  const branch=$("#patrolSessionBranch")?.value.trim()||"",supervisor=$("#patrolSessionSupervisor")?.value.trim()||"",shift=$("#patrolSessionShift")?.value||"";
  if(!branch||!supervisor||!shift){toast("اكتب الفرع والمشرف واختر الشفت مرة واحدة أولًا.");return;}
  localStorage.setItem("deboo_patrol_shift_context_v1",JSON.stringify({branch,supervisor,shift,saved_at:new Date().toISOString()}));
  toast("تم حفظ بيانات الشفت، وستُستخدم تلقائيًا في تسجيلات المرور.");
  renderEntity(type);
 });
 bindAutocomplete();
 $("#branchPatrolDateFilter")?.addEventListener("change",event=>{selectedBranchPatrolDate=event.target.value;renderEntity("branch_patrols");});
 bindPatrolLocationInput(type);
 bindLocationCapture(type);
 if(type==="handovers"&&editing)bindHandoverSignature();
 if(["documents","incidents"].includes(type)&&editing?.id){
  DebooDB.attachments(editing.id).then(items=>{
   const box=$("#documentAttachments");if(!box)return;
   box.innerHTML=items.length?items.map(a=>`<div class="notice"><span>${esc(a.name)} (${Math.ceil(a.size/1024)} KB)</span> <button class="tiny" data-download-attachment="${a.id}">تنزيل</button></div>`).join(""):"لا توجد مرفقات محفوظة لهذا المستند.";
   $$('[data-download-attachment]').forEach(b=>b.onclick=async()=>{try{const item=await DebooDB.getAttachment(b.dataset.downloadAttachment);if(!item){toast("المرفق غير موجود");return;}await DebooDB.downloadBlob(item.blob,item.name);toast("تم حفظ المرفق في التنزيلات.");}catch(error){toast("تعذر تنزيل المرفق: "+(error.message||error));}});
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
 $("#addRecord").onclick=()=>{currentEmployeeDetailId=null;currentEdit={id:null,payload:{}};renderEntity(type);};
 $$("[data-employee-detail]").forEach(button=>button.addEventListener("click",()=>{currentEmployeeDetailId=button.dataset.employeeDetail;currentEdit=null;renderEntity(type);}));
 $("#employeeListBack")?.addEventListener("click",()=>{currentEmployeeDetailId=null;renderEntity(type);});
 $$("[data-employee-edit]").forEach(button=>button.addEventListener("click",()=>{const found=cache.find(x=>x.id===button.dataset.employeeEdit);if(found){currentEmployeeDetailId=found.id;currentEdit=found;renderEntity(type);$("#editor")?.scrollIntoView({behavior:"smooth"});}}));
 $$("[data-move-branch]").forEach(button=>button.addEventListener("click",()=>moveBranchOrder(button.dataset.moveBranch,Number(button.dataset.direction)||0)));
 $$("[data-change-branch-supervisor]").forEach(button=>button.addEventListener("click",()=>{
  const branch=button.dataset.changeBranchSupervisor,date=button.dataset.branchDate;
  const matches=cache.filter(x=>x.entity_type==="branch_patrols"&&!x.is_archived&&normalize(String(x.payload?.branch||"").trim()).replace(/\s+/g," ")===normalize(String(branch||"").trim()).replace(/\s+/g," ")&&String(x.payload?.patrol_date||"").slice(0,10)===date);
  if(!matches.length){toast("لا توجد متابعات لهذا الفرع في التاريخ المحدد.");return;}
  const latest=[...matches].sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||"")))[0];
  currentEdit={id:null,payload:{...latest.payload,branch_supervisor_edit:true,branch,patrol_date:date}};
  renderEntity("branch_patrols");
  $("#editor")?.scrollIntoView({behavior:"smooth",block:"start"});
  $("#recordForm")?.elements.namedItem("supervisor")?.focus();
 }));
 if(type==="branch_patrols"){
  $$("[data-branch-slot]").forEach(button=>button.addEventListener("click",()=>{
   const branch=button.dataset.branchName,date=button.dataset.branchDate;
   const d=new Date(),time=[String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join(":");
   const previous=cache.filter(x=>x.entity_type==="branch_patrols"&&!x.is_archived&&normalize(String(x.payload?.branch||"").trim()).replace(/\s+/g," ")===normalize(String(branch||"").trim()).replace(/\s+/g," ")&&String(x.payload?.patrol_date||"").slice(0,10)===date).sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||"")))[0];
   const inherited=previous?.payload||{};
   currentEdit={id:null,payload:{branch,patrol_date:date,patrol_time:time,followup_slot:String(Number(button.dataset.branchSlot)+1),branch_repeat:!!previous,supervisor:inherited.supervisor||"",responsible:inherited.responsible||"",shift:inherited.shift||"",}};
   renderEntity("branch_patrols");
   $("#editor")?.scrollIntoView({behavior:"smooth",block:"start"});
   if(previous)$("#recordForm")?.elements.namedItem("patrol_time")?.focus();else $("#recordForm")?.elements.namedItem("supervisor")?.focus();
   toast(previous?"أدخل توقيت المتابعة فقط ثم احفظه في خانته.":"أدخل بيانات الفرع والشفت الأساسية لأول مرة.");
  }));
 }
 $("#cancelEdit")?.addEventListener("click",()=>{currentEdit=null;renderEntity(type);});
 $("#recordForm")?.addEventListener("submit",async(event)=>{
  event.preventDefault();
  const form=$("#recordForm"),saveButton=$("#saveRecord"),status=$("#saveStatus");
  if(!form)return;
  if(!form.reportValidity()){toast("راجع الحقول المطلوبة قبل الحفظ.");if(status)status.textContent="راجع الحقول المطلوبة قبل الحفظ.";return;}
  const payload=Object.fromEntries(new FormData(form).entries());
  if(type==="branch_patrols"&&currentEdit?.payload?.branch_supervisor_edit){
   const branch=String(currentEdit.payload.branch||"").trim(),date=String(currentEdit.payload.patrol_date||"").slice(0,10),newSupervisor=String(payload.supervisor||"").trim();
   if(!newSupervisor){toast("اكتب اسم المشرف الجديد.");form.elements.namedItem("supervisor")?.focus();return;}
   const key=normalize(branch).replace(/\s+/g," ");
   const matches=cache.filter(x=>x.entity_type==="branch_patrols"&&!x.is_archived&&normalize(String(x.payload?.branch||"").trim()).replace(/\s+/g," ")===key&&String(x.payload?.patrol_date||"").slice(0,10)===date);
   if(!matches.length){toast("لم يتم العثور على متابعات هذا الفرع.");return;}
   if(saveButton){saveButton.disabled=true;saveButton.textContent="جارٍ تحديث المشرف...";}
   try{
    for(const record of matches)await DebooDB.save("branch_patrols",{...record.payload,supervisor:newSupervisor},record.id);
    currentEdit=null;await refresh();renderEntity("branch_patrols");
    toast("تم تغيير اسم المشرف في كل متابعات الفرع لهذا التاريخ.");
   }catch(error){if(saveButton){saveButton.disabled=false;saveButton.textContent="حفظ";}throw error;}
   return;
  }
  if(type==="branch_patrols"&&currentEdit?.payload?.branch_repeat){
   const branch=String(currentEdit.payload.branch||payload.branch||"").trim(),date=String(currentEdit.payload.patrol_date||payload.patrol_date||"").slice(0,10);
   const key=normalize(branch).replace(/\s+/g," ");
   const source=cache.filter(x=>x.entity_type==="branch_patrols"&&!x.is_archived&&normalize(String(x.payload?.branch||"").trim()).replace(/\s+/g," ")===key&&String(x.payload?.patrol_date||"").slice(0,10)===date).sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||"")))[0];
   if(source){["branch","supervisor","responsible","patrol_date","condition","notes"].forEach(field=>{if(source.payload?.[field]!==undefined)payload[field]=source.payload[field];});}
   payload.followup_slot=currentEdit.payload.followup_slot||payload.followup_slot||"";
  }
  if(type==="manager_rounds"){const c=patrolShiftContext();payload.branch_context=payload.branch_context||c.branch||"";payload.supervisor_context=payload.supervisor_context||c.supervisor||"";payload.shift_context=payload.shift_context||c.shift||"";if(!payload.branches)payload.branches=c.branch||"";}
  if(type==="bike_shift_assignments"){payload.assignments=[...form.querySelectorAll("[data-bike-assignment]")].map(el=>({bike_id:el.dataset.bikeAssignment,person_id:el.value}));Object.keys(payload).filter(key=>key.startsWith("assignment_")).forEach(key=>delete payload[key]);}
  if(type==="daily_rosters"){payload.patrol_people_ids=[...form.querySelectorAll('input[name="patrol_people_ids"]:checked')].map(o=>o.value);payload.emergency_people_ids=[...form.querySelectorAll('input[name="emergency_people_ids"]:checked')].map(o=>o.value);payload.bike_ids=[...form.querySelectorAll('input[name="bike_ids"]:checked')].map(o=>o.value);}
  Object.keys(payload).forEach(key=>{if(typeof payload[key]==="string")payload[key]=payload[key].trim();});
  if(["daily_rosters","bike_shift_assignments"].includes(type)&&(!payload.work_date||!payload.shift)){toast("حدد تاريخ الشفت ونوعه.");return;}
  if(type==="bike_shift_assignments"&&(!payload.assignments.length||payload.assignments.some(a=>!a.person_id))){toast("اختَر الفرد الراكب لكل دراجة مسجلة قبل الحفظ.");return;}
  if(type==="bike_patrols"&&!payload.patrol_date){const oldDate=currentEdit?.payload?.patrol_date||String(currentEdit?.payload?.patrol_time||"").slice(0,10);const now=new Date();payload.patrol_date=oldDate||[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");}
  if(type==="branches"&&!payload.name){if(status)status.textContent="اكتب اسم الفرع أولًا.";toast("اسم الفرع مطلوب.");form.elements.namedItem("name")?.focus();return;}
  const files=[...($("#documentFiles")?.files||[])];
  const oversizedFile=files.find(file=>file.size>15*1024*1024);
  if(oversizedFile){toast("الملف "+oversizedFile.name+" يتجاوز الحد المسموح 15 ميجابايت. لم يتم حفظ السجل.");if(status)status.textContent="اختر مرفقات لا يتجاوز حجم كل منها 15 ميجابايت.";return;}
  let editId=currentEdit?.id||null;
  if(["daily_rosters","bike_shift_assignments"].includes(type)&&!editId){const existing=cache.find(x=>x.entity_type===type&&!x.is_archived&&x.payload?.work_date===payload.work_date&&x.payload?.shift===payload.shift);if(existing)editId=existing.id;}
  if(saveButton){saveButton.disabled=true;saveButton.textContent="جارٍ الحفظ...";}
  if(status)status.textContent="جارٍ حفظ البيانات على هذا الجهاز...";
  let savedRecord=null;
  try{
   const saved=savedRecord=await DebooDB.save(type,payload,editId);
   if(["documents","incidents"].includes(type))for(const file of files)await DebooDB.saveAttachment(saved.id,file);
   const persisted=await DebooDB.getRecord(saved.id);
   if(!persisted||persisted.entity_type!==type)throw new Error("لم يتم تأكيد وجود السجل في قاعدة البيانات بعد الحفظ. أعد المحاولة.");
   currentEdit=null;if(type==="employees")currentEmployeeDetailId=saved.id;
   await refresh();renderEntity(type);toast("تم حفظ السجل والتحقق من وجوده في قاعدة البيانات.");
  }catch(e){
   const message=e?.message||"سبب غير معروف";
   if(savedRecord){
    currentEdit=await DebooDB.getRecord(savedRecord.id)||savedRecord;
    await refresh();
    renderEntity(type);
    toast("تم حفظ السجل، لكن تعذر حفظ كل المرفقات. راجع المرفقات المحفوظة وأضف الملفات المتبقية فقط.");
    return;
   }
   if(status)status.textContent="فشل الحفظ: "+message;
   toast("فشل الحفظ: "+message);
   if(saveButton){saveButton.disabled=false;saveButton.textContent="إعادة محاولة الحفظ";}
  }
 });
 $("#localFilter")?.addEventListener("input",e=>{const value=e.target.value,caret=e.target.selectionStart;searchTerm=value;renderEntity(type);const next=$("#localFilter");if(next){next.focus();next.setSelectionRange(caret,caret);}});
 $$('[data-edit]').forEach(b=>b.onclick=()=>{const found=cache.find(x=>x.id===b.dataset.edit);if(found){currentEdit=found;renderEntity(type);$("#editor")?.scrollIntoView({behavior:"smooth"});}});
 $$('[data-archive]').forEach(b=>b.onclick=async()=>{if(!confirm("تأكيد أرشفة السجل؟ لن يتم حذفه نهائيًا."))return;try{await DebooDB.archive(b.dataset.archive);await refresh();renderEntity(type);toast("تمت الأرشفة");}catch(e){toast(e.message);}});
 $$("[data-soft-delete]").forEach(b=>b.onclick=async()=>{if(!confirm("سيتم نقل بند المرور إلى المحذوفات لمدة 30 يومًا، ويمكنك استعادته خلالها. هل تريد المتابعة؟"))return;try{await DebooDB.softDelete(b.dataset.softDelete);await refresh();renderEntity(type);toast("تم نقل بند المرور إلى المحذوفات.");}catch(e){toast(e.message||"تعذر نقل بند المرور إلى المحذوفات.");}});
}
function landing(){
 const city=localStorage.getItem("deboo_weather_city")||"Cairo";
 area.innerHTML='<section class="weather-compact card" aria-label="ملخص أحوال الطقس"><div class="weather-compact-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><path d="M8 1v2m0 10v2M1 8h2m10 0h2m-2.1-4.9-1.4 1.4M4.5 11.5l-1.4 1.4"/><path d="M10 18h8a3 3 0 0 0 .2-6A5 5 0 0 0 8.5 14"/></svg></div><div class="weather-compact-main"><div class="weather-compact-title">أحوال الطقس <span id="weatherUpdated" class="pill">جارٍ التحديث</span></div><div class="weather-compact-line"><strong id="weatherTemp">--°</strong><span id="weatherDesc">جارٍ جلب حالة الجو...</span></div><small id="weatherExtra" class="muted">الطقس يحتاج اتصالًا بالإنترنت</small></div><div class="weather-compact-actions"><button class="secondary" id="weatherGo" type="button" aria-label="تحديث الطقس">تحديث</button><button class="secondary" id="weatherGPS" type="button" aria-label="استخدام موقعي">موقعي</button></div><input id="weatherCity" type="hidden" value="'+esc(city)+'"></section>';
 $("#weatherGo").onclick=()=>weather($("#weatherCity").value||"Cairo");
 $("#weatherGPS").onclick=async()=>{try{const p=await currentCoordinates();weatherCoords(p.latitude,p.longitude)}catch(e){toast(e.message||"تعذر تحديد موقعك الحالي")}};
 if(navigator.onLine)weather(city);else{$("#weatherDesc").textContent="في انتظار الاتصال بالإنترنت";$("#weatherExtra").textContent="سيتم تحديث الطقس عند عودة الاتصال."}
 if(window.__debooWeatherTimer)clearInterval(window.__debooWeatherTimer);
 window.__debooWeatherTimer=setInterval(()=>{if(["home","landing"].includes(currentPage)&&navigator.onLine){const selected=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(selected)}},30*60*1000);
}
function home(){if(localStorage.getItem("deboo_weather_city")==="Shibin El Kom")localStorage.setItem("deboo_weather_city","Cairo");const count=t=>rows(t).length;const openInc=rows("incidents").filter(x=>x.payload.status!=="مغلق").length;const openTasks=rows("tasks").filter(x=>!["مكتملة"].includes(x.payload.status)).length;const late=rows("tasks").filter(x=>x.payload.due_date&&new Date(x.payload.due_date)<new Date()&&x.payload.status!=="مكتملة").length;
 area.innerHTML=`${pageHead("لوحة التحكم",`<button class="secondary" id="refreshBtn">تحديث البيانات</button> <button class="secondary" id="logoutBtn">تسجيل الخروج</button>`)}
 ${stats([["إجمالي الفروع",count("branches")],["أفراد الدوريات",count("patrol_people")],["أفراد الطوارئ",count("emergency_people")],["الدراجات",count("bikes")],["البلاغات المفتوحة",openInc],["المهام الجارية",openTasks],["المهام المتأخرة",late],["حالات الطوارئ",count("emergencies")]])}
 <div class="card"><div class="page-head"><h2>حالة الطقس</h2><span class="pill" id="weatherUpdated">لم يتم التحديث</span></div><div class="weather"><div><div class="weather-temp" id="weatherTemp">--°</div><b id="weatherDesc">بانتظار تحديد الموقع</b><p class="muted" id="weatherExtra">الطقس يحتاج اتصالًا بالإنترنت</p></div><div class="field"><label>المدينة أو الموقع</label><div class="inline"><input id="weatherCity" placeholder="مثال: شبين الكوم" value="${esc(localStorage.getItem("deboo_weather_city")||"Cairo")}"><button class="primary" id="weatherGo">تحديث الطقس</button><button class="secondary" id="weatherGPS">موقعي</button></div></div></div></div>
 <div class="card"><h2>آخر العمليات</h2>${cache.slice(0,8).map(x=>`<div class="notice"><b>${esc(labels[x.entity_type]||x.entity_type)}</b> — ${esc(Object.values(x.payload||{}).filter(Boolean).slice(0,2).join(" • "))}<small class="muted"> | ${new Date(x.created_at).toLocaleString("ar-EG")}</small></div>`).join("")||'<div class="empty">لا توجد عمليات مسجلة</div>'}</div>
 <div class="card"><h2>تنبيهات المتابعة</h2>${late?`<div class="notice danger-text">يوجد ${late} مهمة متأخرة تحتاج مراجعة.</div>`:"<div class='notice ok-text'>لا توجد مهام متأخرة مسجلة.</div>"}${openInc?`<div class="notice">يوجد ${openInc} بلاغ مفتوح أو قيد المعالجة.</div>`:""}</div>`;
 $("#refreshBtn").onclick=async()=>{await refresh();home();toast("تم تحديث البيانات")};$("#logoutBtn").onclick=()=>{if(!pinLockEnabled()){toast("قفل PIN غير مفعّل. فعّله من الإعدادات أولًا إذا أردت تسجيل الخروج بالقفل.");return;}$("#appRoot").classList.add("hidden");$("#authPanel").classList.remove("hidden");$("#authPassword").value="";$("#authMessage").textContent="أدخل رمز PIN أو استخدم البصمة لفتح التطبيق.";setupBiometricLogin();};
 $("#weatherGo").onclick=()=>weather($("#weatherCity").value);$("#weatherGPS").onclick=async()=>{try{const p=await currentCoordinates();weatherCoords(p.latitude,p.longitude)}catch(e){toast(e.message||"تعذر تحديد موقعك الحالي")}};
 const savedCity=$("#weatherCity").value||"Cairo";
 if(navigator.onLine)weather(savedCity);else{$("#weatherDesc").textContent="في انتظار الاتصال بالإنترنت";$("#weatherExtra").textContent="سيتم عرض الطقس تلقائيًا عند عودة الاتصال."}
 if(window.__debooWeatherTimer)clearInterval(window.__debooWeatherTimer);
 window.__debooWeatherTimer=setInterval(()=>{if(currentPage==="home"&&navigator.onLine){const city=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(city)}},30*60*1000);
}
async function weather(city){if(!city)return;localStorage.setItem("deboo_weather_city",city);$("#weatherDesc").textContent="جارٍ جلب البيانات...";try{const g=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ar&format=json`);const j=await g.json();if(!j.results?.length)throw Error("لم يتم العثور على الموقع");await weatherCoords(j.results[0].latitude,j.results[0].longitude,j.results[0].name)}catch(e){$("#weatherDesc").textContent="تعذر تحديث الطقس";$("#weatherExtra").textContent=e.message}}
async function weatherCoords(lat,lon,name="موقعك"){try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`);if(!r.ok)throw Error("خدمة الطقس غير متاحة");const j=await r.json(),c=j.current;const desc=({0:"سماء صافية",1:"غالبًا صافٍ",2:"غائم جزئيًا",3:"غائم",45:"ضباب",48:"ضباب متجمد",51:"رذاذ خفيف",61:"مطر خفيف",63:"مطر متوسط",65:"مطر غزير",71:"ثلوج خفيفة",80:"زخات مطر",95:"عواصف رعدية"})[c.weather_code]||"حالة جوية متغيرة";$("#weatherTemp").textContent=Math.round(c.temperature_2m)+"°";$("#weatherDesc").textContent=desc+" — "+name;$("#weatherExtra").textContent=`الرطوبة ${c.relative_humidity_2m}% • الرياح ${c.wind_speed_10m} كم/س • المحسوسة ${c.apparent_temperature}°`;$("#weatherUpdated").textContent="آخر تحديث: "+new Date().toLocaleTimeString("ar-EG")}catch(e){$("#weatherDesc").textContent="تعذر تحديث الطقس";$("#weatherExtra").textContent=e.message}}
function groupPage(p){const list=pageGroups[p]||[];area.innerHTML=pageHead(p==="follow"?"متابعة الفروع":"البيانات الأساسية")+"<div class=\"subnav\">"+list.map((t,i)=>"<button data-type=\""+t+"\" class=\""+(i===0?"active":"")+"\">"+labels[t]+"</button>").join("")+"</div><div id=\"groupContent\"></div>";$$(".subnav button").forEach(b=>b.onclick=()=>{$$(".subnav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentEdit=null;currentEmployeeDetailId=null;renderEntity(b.dataset.type)});renderEntity(list[0]);}
function dataManagementPage(){area.innerHTML=pageHead("البيانات الأساسية","<button class=\"secondary\" id=\"backSystem\">رجوع للقائمة الرئيسية</button>")+"<p class=\"muted\">سجّل البيانات الأساسية للفروع وأفراد الدوريات والدراجات والمواقع والمديرين والمستندات والبيانات الإضافية من مكان واحد. ستظهر البيانات المسجلة في قوائم الاختيار بالنماذج المرتبطة بها.</p><div class=\"subnav\">"+pageGroups.data.map((t,i)=>"<button data-type=\""+t+"\" class=\""+(i===0?"active":"")+"\">"+labels[t]+"</button>").join("")+"</div><div id=\"groupContent\"></div>";$("#backSystem").onclick=()=>render("landing");$$(".subnav button").forEach(b=>b.onclick=()=>{$$(".subnav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentEdit=null;currentEmployeeDetailId=null;renderEntity(b.dataset.type)});renderEntity(pageGroups.data[0]);}
function emergencyPage(){area.innerHTML=`${pageHead("الطوارئ")}<div class="subnav"><button data-type="emergencies">حالات الطوارئ</button><button data-type="emergency_people">أفراد الطوارئ</button></div><div id="groupContent"></div>`;$$(".subnav button").forEach(b=>b.onclick=()=>{currentEdit=null;renderEntity(b.dataset.type)});renderEntity("emergencies")}
function patrolTimeMinutes(value){
 const raw=String(value||"").trim().replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
 const match=raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(ص|م|AM|PM)?$/i);
 if(!match)return null;
 let hour=Number(match[1]),minute=Number(match[2]);const suffix=String(match[3]||"").toLowerCase();
 if(hour>23||minute>59)return null;
 if(suffix){if(hour<1||hour>12)return null;hour=hour%12+(suffix==="م"||suffix==="pm"?12:0);}
 return hour*60+minute;
}
function comparePatrolTimes(a,b){
 const av=patrolTimeMinutes(a),bv=patrolTimeMinutes(b);
 if(av!==null&&bv!==null&&av!==bv)return av-bv;
 if(av!==null&&bv===null)return -1;
 if(av===null&&bv!==null)return 1;
 return String(a||"").localeCompare(String(b||""),"ar");
}
function mapPage(){
 const today=new Date().toLocaleDateString("en-CA");
 area.innerHTML=pageHead("مرور الدراجات",'<button class="primary" id="openBikePatrolRecords">تسجيل مرور جديد</button><button class="secondary" id="mapToday">اليوم</button>')+
 '<div class="card"><p class="muted">يعرض التطبيق نقاط الوصول التي تم حفظ إحداثياتها مع مرور الدراجات. اختر التاريخ والدراجة لعرض خط سير الزيارات حسب التوقيت.</p><div class="form"><div class="field"><label>تاريخ المرور</label><input id="mapDate" type="date" value="'+today+'"></div><div class="field"><label>الدراجة</label><select id="mapBike"><option value="">كل الدراجات</option>'+[...new Set(cache.filter(x=>x.entity_type==="bike_patrols"&&!x.is_archived).map(x=>String(x.payload?.bike||"").trim()).filter(Boolean))].sort().map(v=>'<option>'+esc(v)+'</option>').join("")+'</select></div></div><div id="bikeRouteSummary"></div></div>';
 const paint=()=>{
  const date=$("#mapDate").value,bike=$("#mapBike").value;
  const visits=cache.filter(x=>x.entity_type==="bike_patrols"&&!x.is_archived&&String(x.payload?.patrol_date||String(x.created_at||"").slice(0,10))===date&&(!bike||String(x.payload?.bike||"")===bike)).sort((a,b)=>comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time));
  const points=visits.map(x=>({row:x,p:x.payload||{}}));
  const located=points.filter(x=>validCoordinatePair(x.p.lat,x.p.lng));
  const coords=located.map(x=>Number(x.p.lat)+","+Number(x.p.lng));
  const routeUrl=coords.length>1?"https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(coords[0])+"&destination="+encodeURIComponent(coords[coords.length-1])+(coords.length>2?"&waypoints="+encodeURIComponent(coords.slice(1,-1).join("|")):"")+"&travelmode=driving":coords.length===1?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(coords[0]):"";
  $("#bikeRouteSummary").innerHTML='<div class="stats"><div class="stat"><strong>'+visits.length+'</strong><span>إجمالي الزيارات</span></div><div class="stat"><strong>'+located.length+'</strong><span>نقاط على الخريطة</span></div><div class="stat"><strong>'+new Set(visits.map(x=>x.payload?.bike||"")).size+'</strong><span>عدد الدراجات</span></div></div>'+(routeUrl?'<div class="actions"><a class="primary" target="_blank" rel="noopener" href="'+routeUrl+'">فتح خط السير على خرائط Google</a></div>':'<p class="notice">لا توجد إحداثيات محفوظة لهذه الزيارات. أضف إحداثيات الوصول أو شارك موقع واتساب مع التطبيق حتى تظهر النقاط على الخريطة.</p>')+(points.length?'<div class="table-wrap"><table><thead><tr><th>م</th><th>التوقيت</th><th>الدراجة</th><th>المكان</th><th>الإحداثيات</th><th>الخريطة</th></tr></thead><tbody>'+points.map((x,i)=>{const lat=Number(x.p.lat),lng=Number(x.p.lng),ok=String(x.p.lat??"").trim()!==""&&String(x.p.lng??"").trim()!==""&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=-90&&lat<=90&&lng>=-180&&lng<=180;return '<tr><td>'+(i+1)+'</td><td>'+esc(x.p.patrol_time||"—")+'</td><td>'+esc(x.p.bike||"—")+'</td><td>'+esc(x.p.site||x.p.branch||"غير محدد")+'</td><td>'+(ok?lat.toFixed(6)+", "+lng.toFixed(6):"غير مسجل")+'</td><td>'+(ok?'<a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat='+lat+'&mlon='+lng+'#map=16/'+lat+'/'+lng+'">عرض النقطة</a>':"—")+'</td></tr>';}).join("")+'</tbody></table></div>':'<div class="empty">لا توجد زيارات دراجات مسجلة في هذا التاريخ.</div>');
 };
 $("#openBikePatrolRecords").onclick=()=>render("bikepatrol");$("#mapDate").onchange=paint;$("#mapBike").onchange=paint;$("#mapToday").onclick=()=>{$("#mapDate").value=today;$("#mapBike").value="";paint();};paint();
}
function renderBikeLeafletMap(targetId, points){
 const target=document.getElementById(targetId);if(!target)return;
 if(!points.length){target.innerHTML='<div class="empty">لا توجد إحداثيات صحيحة لعرضها على الخريطة.</div>';return;}
 const draw=()=>{
  if(!window.L||!document.getElementById(targetId))return;
  const el=document.getElementById(targetId);if(el.dataset.mapReady==="1")return;el.dataset.mapReady="1";
  const map=L.map(el,{scrollWheelZoom:false});
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',crossOrigin:true}).addTo(map);
  const latlngs=points.map(p=>[p.lat,p.lng]);
  const byBike=new Map();points.forEach(p=>{const key=String(p.bike||"دراجة غير محددة");if(!byBike.has(key))byBike.set(key,[]);byBike.get(key).push([p.lat,p.lng]);});
  byBike.forEach((line)=>{if(line.length>1)L.polyline(line,{color:"#8b1732",weight:4,opacity:.75,dashArray:targetId==="bikeMapReportLeafletMap"?"7 5":null}).addTo(map);});if(targetId==="bikeMapReportLeafletMap"&&points.length>1){const coords=points.map(p=>p.lng+","+p.lat).join(";");fetch("https://router.project-osrm.org/route/v1/driving/"+coords+"?overview=full&geometries=geojson&steps=false").then(r=>{if(!r.ok)throw new Error("route");return r.json();}).then(data=>{if(data.code==="Ok"&&data.routes?.[0]){const road=data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);L.polyline(road,{color:"#8b1732",weight:5,opacity:.9}).addTo(map);const status=document.getElementById("deebRouteStatus");if(status)status.textContent="المسار مرسوم على شبكة الطرق حسب الإحداثيات المسجلة.";}}).catch(()=>{const status=document.getElementById("deebRouteStatus");if(status)status.textContent="تعذر جلب مسار الطرق؛ الخط المتقطع يوضح ترتيب نقاط المرور المسجلة فقط.";});}
  points.forEach((p,i)=>{
   const safe=v=>String(v||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
   const popup='<b>'+(i+1)+'. '+safe(p.bike||"دراجة غير محددة")+'</b><br>'+safe(p.site||"موقع المرور")+'<br>'+safe(p.date||"")+' '+safe(p.time||"");
   L.marker([p.lat,p.lng],{icon:L.divIcon({className:"deeb-map-pin",html:'<span>'+(i+1)+'</span>',iconSize:[30,30],iconAnchor:[15,15]})}).addTo(map).bindPopup(popup);
  });
  map.fitBounds(L.latLngBounds(latlngs).pad(.18),{maxZoom:16});setTimeout(()=>map.invalidateSize(),150);
 };
 if(window.L){draw();return;}
 if(!document.getElementById("deebLeafletCss")){const css=document.createElement("link");css.id="deebLeafletCss";css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(css);}
 let js=document.getElementById("deebLeafletJs");if(!js){js=document.createElement("script");js.id="deebLeafletJs";js.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";document.head.appendChild(js);}js.addEventListener("load",draw,{once:true});js.addEventListener("error",()=>{const current=document.getElementById(targetId);if(current)current.innerHTML='<div class="notice">تعذر تحميل مكتبة الخرائط. تحقق من اتصال الإنترنت ثم أعد فتح القسم.</div>';},{once:true});
}
function bikeMapsPage(){
 const bikes=[...new Set(cache.filter(x=>x.entity_type==="bike_patrols").map(x=>String(x.payload?.bike||"").trim()).filter(Boolean).concat(cache.filter(x=>x.entity_type==="bikes"&&!x.is_archived).map(x=>String(x.payload?.number||"").trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,"ar",{numeric:true}));
 const dateValue=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
 const todayDate=new Date(),today=dateValue(todayDate),yesterdayDate=new Date(todayDate);yesterdayDate.setDate(yesterdayDate.getDate()-1);const yesterday=dateValue(yesterdayDate);
 area.innerHTML=pageHead("خرائط الدراجات",'<button class="secondary" id="openBikeMapReports">تقارير خرائط الدراجات</button><button class="primary" id="openBikePatrolRecords">تسجيل مرور جديد</button>')+
 '<div class="card"><p class="muted">اعرض تحركات كل الدراجات في يوم واحد أو اختر دراجة محددة. اختر نفس التاريخ في خانتي البداية والنهاية لعرض يوم بعينه. تظهر النقاط المحفوظة بإحداثياتها فقط. لا يوجد تتبع مباشر؛ المسار يعتمد على سجلات المرور التي تم حفظها.</p><div class="form"><div class="field"><label>الدراجة</label><select id="individualBikeMap"><option value="">كل الدراجات</option>'+bikes.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("")+'</select></div><div class="field"><label>من تاريخ</label><input id="bikeMapFrom" type="date" value="'+today+'"></div><div class="field"><label>إلى تاريخ</label><input id="bikeMapTo" type="date" value="'+today+'"></div></div><div class="actions"><button class="secondary" id="bikeMapYesterday">خريطة أمس</button><button class="secondary" id="bikeMapToday">خريطة اليوم</button></div><div id="individualBikeMapContent"><div class="empty">جارٍ تجهيز خريطة اليوم.</div></div></div>';
 const normalizePatrolDate=value=>{
  let raw=String(value??"").trim().replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  if(!raw)return "";
  const iso=raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if(iso)return iso[1]+"-"+String(iso[2]).padStart(2,"0")+"-"+String(iso[3]).padStart(2,"0");
  const dmy=raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if(dmy)return dmy[3]+"-"+String(dmy[2]).padStart(2,"0")+"-"+String(dmy[1]).padStart(2,"0");
  const parsed=new Date(raw);
  return Number.isNaN(parsed.getTime())?"":dateValue(parsed);
 };
 const visitDate=x=>normalizePatrolDate(x.payload?.patrol_date)||normalizePatrolDate(x.created_at);
 const paint=()=>{
  const bike=$("#individualBikeMap").value,from=$("#bikeMapFrom").value,to=$("#bikeMapTo").value,host=$("#individualBikeMapContent");
  const visits=cache.filter(x=>x.entity_type==="bike_patrols"&&!x.is_archived&&(!bike||String(x.payload?.bike||"").trim()===bike)).filter(x=>{const d=visitDate(x);return (!from||d>=from)&&(!to||d<=to);}).sort((a,b)=>visitDate(a).localeCompare(visitDate(b))||comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time));
  const located=visits.filter(x=>validCoordinatePair(x.payload?.lat,x.payload?.lng));
  const coords=located.map(x=>Number(x.payload.lat)+","+Number(x.payload.lng));
  const routeUrl=bike?(coords.length>1?"https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(coords[0])+"&destination="+encodeURIComponent(coords[coords.length-1])+(coords.length>2?"&waypoints="+encodeURIComponent(coords.slice(1,-1).join("|")):"")+"&travelmode=driving":coords.length===1?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(coords[0]):""):"";
  host.innerHTML='<style>.deeb-live-map{height:380px;width:100%;margin:14px 0;border:1px solid #c99a32;border-radius:10px;z-index:1}.deeb-map-pin{background:transparent;border:0}.deeb-map-pin span{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:2px solid white;border-radius:50%;background:#8b1732;color:#fff;font-weight:bold;box-shadow:0 1px 5px #333}</style><div class="stats"><div class="stat"><strong>'+visits.length+'</strong><span>إجمالي الزيارات</span></div><div class="stat"><strong>'+located.length+'</strong><span>نقاط على الخريطة</span></div><div class="stat"><strong>'+Math.max(0,visits.length-located.length)+'</strong><span>مواقع بلا إحداثيات</span></div></div>'+(located.length?'<div id="individualBikeLeafletMap" class="deeb-live-map"></div>':'<p class="notice">'+(visits.length?'السجلات موجودة، لكن لا توجد إحداثيات محفوظة لعرضها على الخريطة.':'لا توجد زيارات مسجلة في الفترة المحددة.')+'</p>')+(routeUrl?'<div class="actions"><a class="primary" target="_blank" rel="noopener" href="'+routeUrl+'">فتح مسار الدراجة على خرائط Google</a></div>':'')+(visits.length?'<div class="table-wrap"><table><thead><tr><th>م</th><th>الدراجة</th><th>التاريخ</th><th>الوقت</th><th>الفرع / المكان</th><th>الإحداثيات</th><th>النقطة</th></tr></thead><tbody>'+visits.map((x,i)=>{const p=x.payload||{},ok=validCoordinatePair(p.lat,p.lng),lat=Number(p.lat),lng=Number(p.lng);return '<tr><td>'+(i+1)+'</td><td>'+esc(p.bike||"—")+'</td><td>'+esc(p.patrol_date||String(x.created_at||"").slice(0,10)||"—")+'</td><td>'+esc(p.patrol_time||"—")+'</td><td>'+esc(p.site||p.branch||"غير محدد")+'</td><td>'+(ok?lat.toFixed(6)+", "+lng.toFixed(6):"غير مسجل")+'</td><td>'+(ok?'<a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat='+lat+'&mlon='+lng+'#map=16/'+lat+'/'+lng+'">عرض النقطة</a>':"—")+'</td></tr>';}).join("")+'</tbody></table></div>':'');
  if(located.length)renderBikeLeafletMap("individualBikeLeafletMap",located.map(x=>({lat:Number(x.payload.lat),lng:Number(x.payload.lng),bike:x.payload.bike,site:x.payload.site||x.payload.branch,date:x.payload.patrol_date,time:x.payload.patrol_time})));
 };
 ["individualBikeMap","bikeMapFrom","bikeMapTo"].forEach(id=>$("#"+id).onchange=paint);
 $("#bikeMapYesterday").onclick=()=>{$("#bikeMapFrom").value=yesterday;$("#bikeMapTo").value=yesterday;paint();};
 $("#bikeMapToday").onclick=()=>{$("#bikeMapFrom").value=today;$("#bikeMapTo").value=today;paint();};
 $("#openBikePatrolRecords").onclick=()=>render("bikepatrol");
 $("#openBikeMapReports").onclick=()=>render("bikeMapReports");
 paint();
}
function bikeMapReportsPage(){
 const bikes=[...new Set(cache.filter(x=>x.entity_type==="bike_patrols"&&!x.is_deleted).map(x=>String(x.payload?.bike||"").trim()).filter(Boolean).concat(cache.filter(x=>x.entity_type==="bikes"&&!x.is_archived).map(x=>String(x.payload?.number||"").trim()).filter(Boolean)))].sort((a,b)=>a.localeCompare(b,"ar",{numeric:true}));
 const today=new Date().toLocaleDateString("en-CA"),monthStart=[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,"0"),"01"].join("-");
 area.innerHTML=pageHead("خرائط الدراجات",'<button class="secondary" id="backToBikeMaps">خرائط الدراجات</button><button class="primary" id="printBikeMapReport">طباعة التقرير</button><button class="secondary" id="saveBikeMapArchive">حفظ في الأرشيف</button><button class="secondary" id="saveBikeMapReportPdf">حفظ PDF</button><button class="secondary" id="saveBikeMapReportImage">حفظ التقرير صورة</button>')+
 '<div class="card"><p class="muted">خريطة مرور مستقلة لكل دراجة، بنفس بيانات وتصميم تقرير المرور الأصلي. تظهر الخريطة بدل جدول المرور، ولا يتم تعديل التقرير الأصلي.</p><div class="form"><div class="field"><label>الدراجة</label><select id="bikeMapReportBike"><option value="">اختر الدراجة</option>'+bikes.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("")+'</select></div><div class="field"><label>من تاريخ</label><input id="bikeMapReportFrom" type="date" value="'+monthStart+'"></div><div class="field"><label>إلى تاريخ</label><input id="bikeMapReportTo" type="date" value="'+today+'"></div></div><div id="bikeMapReportPreview"><div class="empty">اختر الدراجة لإعداد الخريطة.</div></div></div>';
 let reportHtml="",bikeMapArchiveKey="",bikeMapArchivePromise=null,reportVisits=[];
 const archiveBikeMapReport=async()=>{const bike=$("#bikeMapReportBike").value,from=$("#bikeMapReportFrom").value,to=$("#bikeMapReportTo").value;if(!reportHtml||!bike)throw new Error("اختر الدراجة أولًا لإعداد خريطتها.");const key=[bike,from,to,reportVisits.map(x=>x.id+":"+x.updated_at).join("|")].join("|");let fingerprint=2166136261;for(let i=0;i<key.length;i++){fingerprint^=key.charCodeAt(i);fingerprint=Math.imul(fingerprint,16777619);}const dedupeKey="deeb-bike-map-"+(fingerprint>>>0).toString(16);if(key===bikeMapArchiveKey&&bikeMapArchivePromise)return bikeMapArchivePromise;bikeMapArchiveKey=key;bikeMapArchivePromise=DebooDB.archiveReport({title:"خريطة مرور الدراجة "+bike,report_type:"bike_map",from_date:from,to_date:to,html:reportHtml,dedupe_key:dedupeKey,meta:{bike,data:reportVisits.map(x=>({id:x.id,created_at:x.created_at,payload:x.payload||{}}))}}).catch(error=>{if(bikeMapArchiveKey===key){bikeMapArchiveKey="";bikeMapArchivePromise=null;}throw error;});return bikeMapArchivePromise;};
 const build=()=>{
  const bike=$("#bikeMapReportBike").value,from=$("#bikeMapReportFrom").value,to=$("#bikeMapReportTo").value,host=$("#bikeMapReportPreview");
  if(!bike){reportHtml="";host.innerHTML='<div class="empty">اختر الدراجة لإعداد الخريطة.</div>';return;}
  const visitDate=x=>String(x.payload?.patrol_date||x.created_at||"").slice(0,10);
  const visits=cache.filter(x=>x.entity_type==="bike_patrols"&&!x.is_archived&&!x.is_deleted&&String(x.payload?.bike||"").trim()===bike).filter(x=>{const d=visitDate(x);return (!from||d>=from)&&(!to||d<=to);}).sort((a,b)=>visitDate(a).localeCompare(visitDate(b))||comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time));
  reportVisits=visits;
  const located=visits.filter(x=>validCoordinatePair(x.payload?.lat,x.payload?.lng));
  const mapPoints=located.map(x=>({number:visits.indexOf(x)+1,lat:Number(x.payload.lat),lng:Number(x.payload.lng),site:x.payload.site||x.payload.branch||x.payload.location||"موقع المرور",date:x.payload.patrol_date||visitDate(x),time:x.payload.patrol_time||""}));
  const detailPoints=visits.map((x,i)=>({number:i+1,site:x.payload?.site||x.payload?.branch||x.payload?.location||"موقع المرور",date:x.payload?.patrol_date||visitDate(x),time:x.payload?.patrol_time||"",coordinates:validCoordinatePair(x.payload?.lat,x.payload?.lng)?Number(x.payload.lat).toFixed(6)+", "+Number(x.payload.lng).toFixed(6):"الإحداثيات غير مسجلة"}));
  const mapJson=JSON.stringify(mapPoints).replace(/</g,"\\u003c");
  const bikeRecord=cache.find(x=>x.entity_type==="bikes"&&!x.is_archived&&String(x.payload?.number||"").trim()===bike);
  const bikeData=bikeRecord?.payload||{};
  const bikeIndex=bikes.indexOf(bike)+1;
  const person=String(bikeData.person||"").trim()||"—";
  const code=String(bikeData.code||"").trim()||"—";
  const bikeType=String(bikeData.type||bikeData.description||"").trim()||"—";
  const latestDate=visits.map(visitDate).filter(Boolean).sort().pop()||"—";
  const reportTitle="خريطة مرور دراجة "+bikeIndex;
  const metaHtml='<h2 class="bike-section-title">بيانات التقرير</h2><div class="bike-meta"><div class="bike-meta-date"><span>التاريخ</span><b>'+esc(latestDate==="—"?"—":new Date(latestDate+"T00:00:00").toLocaleDateString("ar-EG"))+'</b></div><div><span>اسم القائم بالمرور</span><b>'+esc(person)+'</b></div><div class="bike-meta-total"><span>عدد مرات المرور</span><b>'+visits.length+' مرة</b></div><div><span>نوع الدراجة</span><b>'+esc(bikeType)+'</b></div><div><span>رقم الدراجة</span><b>'+esc(bike)+'</b></div><div><span>كود الدراجة</span><b>'+esc(code)+'</b></div></div>';
  const detailRowCount=Math.max(1,Math.ceil(detailPoints.length/3));
  const detailHtml='<div class="deeb-map-details"><h3>تفاصيل نقاط المرور ('+detailPoints.length+' نقطة)</h3><ol style="height:125mm;grid-template-rows:repeat('+detailRowCount+',minmax(0,1fr))">'+detailPoints.map((p,index)=>'<li style="grid-column:'+(Math.floor(index/detailRowCount)+1)+';grid-row:'+(index%detailRowCount+1)+'"><b>'+p.number+'. '+esc(p.site)+'</b><span>'+esc(p.date)+' — '+esc(p.time||"وقت غير مسجل")+'</span><small>'+esc(p.coordinates)+'</small></li>').join("")+'</ol></div>';
  const mapMarkup=(located.length?'<div id="deebReportMap" class="deeb-report-map"></div><p id="deebRouteStatus" class="deeb-route-status">جارٍ تجهيز تفاصيل الطريق...</p>':'<div class="deeb-report-map-empty">لا توجد إحداثيات صحيحة محفوظة لهذه الدراجة في الفترة المحددة، لذلك لا يمكن رسم مسار جغرافي مؤكد.</div>')+(detailHtml||'<div class="deeb-map-details">لا توجد نقاط مرور مسجلة في الفترة المحددة.</div>');
  const routeCoords=located.map(x=>Number(x.payload.lat)+","+Number(x.payload.lng));
  const routeUrl=routeCoords.length>1?"https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(routeCoords[0])+"&destination="+encodeURIComponent(routeCoords[routeCoords.length-1])+(routeCoords.length>2?"&waypoints="+encodeURIComponent(routeCoords.slice(1,-1).join("|")):"")+"&travelmode=driving":routeCoords.length===1?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(routeCoords[0]):"";
  const printMapScript=located.length?"<link rel=\"stylesheet\" href=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css\"><script src=\"https://unpkg.com/leaflet@1.9.4/dist/leaflet.js\"></script><script>(function(){var pts=MAP_JSON;function safe(v){return String(v||\"\").replace(/[&<>\"]/g,function(c){return {\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\"}[c];});}function draw(){var el=document.getElementById(\"deebReportMap\");if(!window.L||!el){setTimeout(draw,250);return;}if(el.dataset.mapReady===\"1\")return;el.dataset.mapReady=\"1\";var m=L.map(el,{scrollWheelZoom:false});var tiles=L.tileLayer(\"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\",{maxZoom:19,attribution:\"© OpenStreetMap\",crossOrigin:true}).addTo(m);var ll=pts.map(function(p){return [p.lat,p.lng];});var line=L.polyline(ll,{color:\"#8b1732\",weight:4,opacity:.65,dashArray:\"7 5\"}).addTo(m);if(pts.length>1){var coords=pts.map(function(p){return p.lng+\",\"+p.lat;}).join(\";\");fetch(\"https://router.project-osrm.org/route/v1/driving/\"+coords+\"?overview=full&geometries=geojson&steps=false\").then(function(r){if(!r.ok)throw new Error(\"route\");return r.json();}).then(function(data){if(data.code===\"Ok\"&&data.routes&&data.routes[0]){var road=data.routes[0].geometry.coordinates.map(function(c){return [c[1],c[0]];});line.setLatLngs(road);line.setStyle({color:\"#8b1732\",weight:5,opacity:.9,dashArray:null});document.getElementById(\"deebRouteStatus\").textContent=\"المسار مرسوم على شبكة الطرق حسب الإحداثيات المسجلة.\";document.documentElement.setAttribute(\"data-deeb-route-ready\",\"1\");}else{document.getElementById(\"deebRouteStatus\").textContent=\"تعذر مطابقة نقاط المرور مع طريق متصل؛ الخط المتقطع يوضح ترتيب النقاط المسجلة.\";document.documentElement.setAttribute(\"data-deeb-route-ready\",\"1\");}}).catch(function(){document.getElementById(\"deebRouteStatus\").textContent=\"تعذر جلب مسار الطرق؛ الخط المتقطع يوضح ترتيب نقاط المرور المسجلة فقط.\";document.documentElement.setAttribute(\"data-deeb-route-ready\",\"1\");});}else{document.documentElement.setAttribute(\"data-deeb-route-ready\",\"1\");}pts.forEach(function(p,i){var number=p.number||i+1;var label=number+\". \"+safe(p.site)+\" — \"+safe(p.time||\"وقت غير مسجل\");L.marker([p.lat,p.lng],{icon:L.divIcon({className:\"deeb-map-pin\",html:\"<span>\"+number+\"</span>\",iconSize:[32,32],iconAnchor:[16,16]})}).addTo(m).bindPopup(\"<b>\"+label+\"</b><br>\"+safe(p.date)+\"<br>\"+p.lat.toFixed(6)+\", \"+p.lng.toFixed(6));});m.fitBounds(L.latLngBounds(ll).pad(.2),{maxZoom:17});setTimeout(function(){m.invalidateSize();document.documentElement.setAttribute(\"data-deeb-map-ready\",\"1\");},1200);tiles.on(\"load\",function(){document.documentElement.setAttribute(\"data-deeb-map-tiles\",\"ready\");});}if(document.readyState===\"loading\")document.addEventListener(\"DOMContentLoaded\",draw);else draw();})();</script>".replace("MAP_JSON",mapJson):""
  const style='<style>*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#10275b;font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.8;-webkit-print-color-adjust:exact;print-color-adjust:exact}.bike-sheet-section{position:relative;box-sizing:border-box;width:100%;height:289mm;min-height:0;margin:0 auto;padding:3mm;overflow:hidden;background:#fff;border:1.5px solid #c99a32;break-inside:avoid;page-break-inside:avoid}.brand{direction:ltr!important;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #c99a32;padding-bottom:9px;margin-bottom:14px}.brand-left{display:flex;flex-direction:column;align-items:flex-start}.brand-name{font-family:Georgia,serif;font-size:38px;font-weight:900;line-height:1.15;letter-spacing:.6px;color:#073b28;text-shadow:0 1px #c99a32}.official-tag{font-size:15px;font-weight:800;color:#10275b}.brand-tag{font-size:16px;font-weight:800;line-height:1.6;color:#073b28;text-align:right}.bike-report-heading{display:flex;flex-direction:column;align-items:center;gap:5px;margin:8px 0 12px;padding:10px 14px;border:1px solid #c99a32;background:#fbf4e6}.bike-report-heading h1{position:relative;width:100%;margin:0;padding:9px 16px;text-align:center;color:#fff;font-size:25px;font-weight:900;background:linear-gradient(90deg,#650b1c,#8b1429 50%,#650b1c);border:3px solid #c99a32;border-radius:10px}.bike-section-title{color:#fff;background:#073b28;border-right:5px solid #c99a32;padding:7px 11px;margin:8px 0 6px;font-size:16px;font-weight:900}.bike-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-bottom:10px}.bike-meta>div{display:flex;flex-direction:column;justify-content:center;min-height:55px;padding:7px 9px;background:#fbf4e6;border:1.5px solid #c99a32}.bike-meta span{font-size:12px;color:#073b28;font-weight:800}.bike-meta b{font-size:15px;color:#10275b;font-weight:900;overflow-wrap:anywhere}.deeb-report-map{height:60mm;width:100%;margin:3px 0;border:1.5px solid #c99a32;border-radius:4px;z-index:1;background:#f6ead2}.deeb-route-status{font-size:10px;color:#073b28;font-weight:800;margin:3px 0}.deeb-map-details-page{break-before:auto;page-break-before:auto;break-inside:avoid;page-break-inside:avoid;min-height:0}.deeb-map-details{margin:0;padding:3px 5px;border:1px solid #c99a32;background:#fbf4e6;color:#10275b}.deeb-map-details h3{margin:0 0 3px;color:#073b28;font-size:10px}.deeb-map-details ol{margin:0;padding:0 20px 0 0;display:grid;direction:rtl;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);grid-auto-flow:row;list-style:none;gap:1px 5px}.deeb-map-details li{list-style:none;margin:0;padding:1px 2px;border-bottom:1px solid #e0c98e;break-inside:avoid;page-break-inside:avoid;min-width:0}.deeb-map-details li b,.deeb-map-details li span,.deeb-map-details li small{display:block;font-size:8px;line-height:1.15;overflow-wrap:anywhere}.deeb-map-details li small{direction:ltr;text-align:right;color:#073b28}.deeb-report-map-empty{min-height:65mm;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;margin:8px 0;border:1.5px dashed #c99a32;background:#fbf4e6;color:#650b1c;font-weight:800}.deeb-map-pin{background:transparent;border:0}.deeb-map-pin span{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:2px solid white;border-radius:50%;background:#8b1732;color:#fff;font-weight:bold;box-shadow:0 1px 5px #333}.map-note{font-size:11px;color:#073b28;font-weight:700;margin:5px 0}.route-link{font-size:11px;color:#073b28;font-weight:800}.report-foot{display:flex;justify-content:space-between;gap:8px;margin-top:8px;padding-top:6px;border-top:3px solid #c99a32;color:#10275b;font-size:11px;font-weight:800}@page{size:A4 portrait;margin:4mm}@media print{html,body{width:100%;margin:0;padding:0}.bike-sheet-section{height:289mm;min-height:0;max-height:289mm;padding:2mm;overflow:hidden;break-inside:avoid;page-break-inside:avoid}.brand{padding-bottom:5px;margin-bottom:6px}.bike-report-heading{margin:5px 0 6px;padding:5px 8px}.bike-report-heading h1{font-size:24px;padding:6px 10px}.bike-meta{gap:4px;margin-bottom:6px}.bike-meta>div{display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:8px;min-height:30px;padding:4px 6px}.bike-meta span{font-size:11px;white-space:nowrap}.bike-meta b{min-width:0}.bike-meta b{font-size:13px}.deeb-report-map{height:60mm;margin:2px 0;break-inside:avoid;page-break-inside:avoid}.deeb-map-details-page{break-before:auto;page-break-before:auto;min-height:0}.deeb-map-details ol{direction:rtl;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);grid-auto-flow:row;list-style:none}.deeb-map-details li{list-style:none;break-inside:avoid;page-break-inside:avoid}.deeb-report-map-empty{min-height:65mm}.report-foot{margin-top:auto;padding-top:5px;font-size:10px}}@media screen and (max-width:600px){.bike-sheet-section{padding:12px}.bike-meta{grid-template-columns:repeat(2,minmax(0,1fr))}.deeb-report-map{height:380px}}</style>';
  const head='<div class="brand"><div class="brand-left"><div class="brand-name">DEEB</div><div class="official-tag">تقارير رسمي</div></div><div class="brand-tag">نظام متابعة التشغيل والدوريات</div></div><div class="bike-report-heading"><h1>'+esc(reportTitle)+'</h1></div>'+metaHtml;
  const note='<p class="map-note">الخريطة مرسومة من إحداثيات نقاط المرور المحفوظة، وبترتيب التاريخ ووقت المرور. لا تمثل تتبعًا مباشرًا.</p>';
  const routeLink=routeUrl?'<p class="route-link"><a href="'+routeUrl+'">فتح المسار على خرائط Google</a></p>':"";
  const footer='<div class="report-foot"><span>تم إنشاء التقرير بواسطة DEEB</span><span>اعتماد المسؤول: __________________</span></div>';
  const printBody='<section class="bike-sheet-section">'+head+mapMarkup+note+routeLink+footer+'</section>';
  reportHtml='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEEB | '+esc(reportTitle)+'</title>'+style+printMapScript+'</head><body>'+printBody+'</body></html>';
  host.innerHTML='<style>'+style.slice(7,style.lastIndexOf("</style>"))+'</style><section class="bike-sheet-section">'+head+(located.length?'<div id="bikeMapReportLeafletMap" class="deeb-report-map"></div><p id="deebRouteStatus" class="deeb-route-status">جارٍ تجهيز تفاصيل الطريق...</p>'+mapMarkup.slice(mapMarkup.indexOf('<div class="deeb-map-details"')):'' )+note+routeLink+footer+'</section>';
  if(located.length)renderBikeLeafletMap("bikeMapReportLeafletMap",mapPoints);
 };
 ["bikeMapReportBike","bikeMapReportFrom","bikeMapReportTo"].forEach(id=>$("#"+id).onchange=build);
 $("#backToBikeMaps").onclick=()=>render("bikeMaps");
 $("#saveBikeMapArchive").onclick=async()=>{try{await archiveBikeMapReport();toast("تم حفظ خريطة الدراجة في الأرشيف.");}catch(e){toast("تعذر أرشفة خريطة الدراجة: "+e.message);}};
 const sendToPrint=async(button)=>{if(!reportHtml){toast("اختر الدراجة أولًا.");return;}if(button.disabled)return;button.disabled=true;const oldText=button.textContent;button.textContent="جارٍ تجهيز التقرير...";try{const native=window.DEEBNativePlugins?.FileExport;if(native?.printHtml){await archiveBikeMapReport();const result=await native.printHtml({html:reportHtml});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة على الجهاز.");}else{await archiveBikeMapReport();const w=window.open("","_blank");if(!w)throw new Error("تعذر فتح نافذة الطباعة؛ اسمح بالنوافذ المنبثقة.");w.document.open();w.document.write(reportHtml);w.document.close();w.focus();setTimeout(()=>w.print(),1200);}toast("في نافذة الطباعة يمكنك اختيار الطابعة أو حفظ كملف PDF.");}catch(e){toast("تعذر فتح الطباعة: "+(e?.message||e));}finally{button.disabled=false;button.textContent=oldText;}};
 $("#printBikeMapReport").onclick=()=>sendToPrint($("#printBikeMapReport"));
 $("#saveBikeMapReportPdf").onclick=async()=>{if(!reportHtml){toast("اختر الدراجة أولًا.");return;}const button=$("#saveBikeMapReportPdf"),native=window.DEEBNativePlugins?.FileExport;if(!native?.saveHtmlAsPdf){toast("حفظ PDF المباشر يحتاج تحديث نسخة التطبيق.");return;}button.disabled=true;const oldText=button.textContent;button.textContent="جارٍ حفظ PDF...";try{await archiveBikeMapReport();const result=await native.saveHtmlAsPdf({html:reportHtml,name:"DEEB-bike-map-"+$("#bikeMapReportBike").value});if(result?.saved!==true)throw new Error("لم يؤكد النظام حفظ ملف PDF.");toast("تم حفظ ملف PDF في Downloads/DEEB.");}catch(e){toast("تعذر حفظ PDF: "+(e?.message||e));}finally{button.disabled=false;button.textContent=oldText;}};
 $("#saveBikeMapReportImage").onclick=async()=>{if(!reportHtml){toast("اختر الدراجة أولًا.");return;}const button=$("#saveBikeMapReportImage"),native=window.DEEBNativePlugins?.FileExport;if(!native?.saveHtmlAsImages){toast("حفظ الصور متاح من تطبيق DEEB على أندرويد.");return;}button.disabled=true;const oldText=button.textContent;button.textContent="جارٍ تجهيز الصورة...";try{await archiveBikeMapReport();const result=await native.saveHtmlAsImages({html:reportHtml,name:"DEEB-bike-map-"+$("#bikeMapReportBike").value});if(result?.saved!==true||!Number.isInteger(result.count)||result.count<1)throw new Error("لم يؤكد النظام حفظ الصور.");toast("تم حفظ "+result.count+" صورة للتقرير.");}catch(e){toast("تعذر حفظ الصور: "+(e?.message||e));}finally{button.disabled=false;button.textContent=oldText;}};
 build();
 const autoArchiveMap=()=>queueMicrotask(()=>{if(!reportHtml||!$("#bikeMapReportBike").value)return;archiveBikeMapReport().catch(error=>toast("تعذر حفظ خريطة الدراجة تلقائيًا في الأرشيف: "+(error?.message||error)));});
 ["bikeMapReportBike","bikeMapReportFrom","bikeMapReportTo"].forEach(id=>$("#"+id)?.addEventListener("change",autoArchiveMap));
 autoArchiveMap();
}
async function reports(){
 area.innerHTML=pageHead("مركز التقارير")+'<div class="card">جارٍ تحميل التقارير والسجلات...</div>';
 const [archivedData,approvedReports]=await Promise.all([DebooDB.all({archived:true}),DebooDB.approvedReports()]);
 const data=[...cache.filter(x=>!x.is_archived),...archivedData];
 const nowDate=new Date(),today=nowDate.toLocaleDateString("en-CA"),monthStart=[nowDate.getFullYear(),String(nowDate.getMonth()+1).padStart(2,"0"),"01"].join("-");
 area.innerHTML=pageHead("مركز التقارير", '<button type="button" hidden id="showArchive">فتح الأرشيف العام</button><button class="secondary" id="openBikeMapReports">تقرير خرائط الدراجات</button><button class="secondary" id="saveReportArchive">حفظ التقرير في الأرشيف</button><button class="primary" id="printReport">طباعة</button><button class="secondary" id="pdfReport">تصدير PDF</button><button class="secondary" id="saveReportImage">حفظ التقرير صورة</button><button class="secondary" id="excelReport">تصدير Excel</button><button class="secondary" id="csvReport">تصدير CSV</button><button class="secondary" id="approveReport">اعتماد نسخة التقرير</button>')+
 '<div class="card"><h3>تقارير نهاية الشفت</h3><p class="muted">اختر أي قسم لإصدار تقرير منفرد، أو اختر التقرير الشامل. يمكنك تحديد يوم أو فترة زمنية.</p><div class="actions"><button class="primary" id="monthlyReport">تقرير شهري</button><span id="bikeQuickReports" class="actions" style="display:contents"></span><button class="secondary" data-report-type="branch_patrols">متابعة الفروع</button><button class="secondary" data-report-type="manager_rounds">مرور المديرين</button><button class="secondary" data-report-type="incidents">البلاغات</button><button class="secondary" data-report-type="tasks">المهام</button><button class="secondary" data-report-type="written_reports">التقرير اليومي</button><button class="secondary" data-report-type="memos">المذكرة</button><button class="secondary" data-report-type="">التقرير الشامل</button></div><div class="form"><div class="field"><label>من تاريخ</label><input id="fromDate" type="date" value="'+monthStart+'"></div><div class="field"><label>إلى تاريخ</label><input id="toDate" type="date" value="'+today+'"></div><div class="field"><label>نوع التقرير</label><select id="reportType"><option value="">كل الأقسام</option>'+Object.entries(labels).filter(([k])=>k!=="bikes").map(([k,v])=>'<option value="'+esc(k)+'">'+esc(v)+'</option>').join("")+'</select></div><div class="field hidden" id="bikeReportFilter"><label>تقرير الدراجة للطباعة</label><select id="bikeReportSelect"><option value="all">كل تقارير الدراجات</option></select></div></div><div id="reportSummary"></div></div><div id="archivePanel" class="card hidden"><div class="page-head"><h3>الأرشيف العام</h3><div class="actions"><div id="archiveReportFilterSlot"></div><button class="secondary" id="closeArchive">العودة للتقارير</button></div></div><div id="archiveContent">جارٍ تحميل الأرشيف...</div></div>';
 $("#openBikeMapReports").onclick=()=>render("bikeMapReports");
 const dayOf=x=>(x.payload&&x.payload.work_date)||(["bike_patrols","branch_patrols","manager_rounds"].includes(x.entity_type)?(x.payload&&x.payload.patrol_date):x.entity_type==="incidents"?(x.payload&&x.payload.incident_date):["written_reports","memos"].includes(x.entity_type)?(x.payload&&x.payload.report_date):x.entity_type==="absences"?(x.payload&&x.payload.absence_date):x.entity_type==="handovers"?(x.payload&&x.payload.handover_date):x.entity_type==="emergencies"?(x.payload&&x.payload.emergency_date):null)||String(x.created_at||"").slice(0,10);
 let selectedArchiveIds=[],selectedArchivedRecordId="";
 const get=()=>{if(selectedArchivedRecordId)return data.filter(x=>x.id===selectedArchivedRecordId);if(selectedArchiveIds.length)return data.filter(x=>selectedArchiveIds.includes(x.id));const a=$("#fromDate").value,b=$("#toDate").value,t=$("#reportType").value;return data.filter(x=>(!t||x.entity_type===t)&&(!a||dayOf(x)>=a)&&(!b||dayOf(x)<=b));};
 const detailRows=x=>{const p=x.payload||{},defs=fields[x.entity_type]||[],known=defs.filter(f=>p[f[0]]!==undefined&&p[f[0]]!==null&&p[f[0]]!=="").map(f=>[f[1],String(p[f[0]])]),keys=new Set(defs.map(f=>f[0])),extra=Object.entries(p).filter(([k,v])=>!keys.has(k)&&v!==undefined&&v!==null&&v!=="").map(([k,v])=>[k,String(v)]);return known.concat(extra);};
 const reportKeyLabels={edit_reason:"سبب التعديل",created_at:"تاريخ الإنشاء",updated_at:"آخر تحديث",patrol_time:"وقت المرور",patrol_date:"تاريخ المرور",incident_time:"وقت البلاغ",incident_date:"تاريخ البلاغ",id:"رقم السجل"};
 const rowsFor=d=>d.map(x=>({section:labels[x.entity_type]||x.entity_type,date:dayOf(x),shift:(x.payload&&(x.payload.shift||x.payload.shift_name))||"—",time:(x.payload&&(x.payload.patrol_time||x.payload.incident_time))||"",details:detailRows(x).filter(v=>!["id","created_at","updated_at","is_archived","archived_at"].includes(v[0])).map(v=>(reportKeyLabels[v[0]]||v[0])+": "+v[1]).join(" | ")}));
 const bikeGroupsFor=d=>{
  const source=d.filter(x=>x.entity_type==="bike_patrols");
  const registry=data.filter(x=>x.entity_type==="bikes"&&!x.is_archived).slice().sort((a,b)=>String(a.created_at||"").localeCompare(String(b.created_at||"")));
  const groups=new Map();
  const addBike=(bike,bikeRecord=null)=>{
   const number=String(bike||"").trim();
   if(!number)return;
   const key=normalize(number);
   if(!groups.has(key))groups.set(key,{date:"",bike:number,bikeRecord,visits:[]});
   else if(bikeRecord&&!groups.get(key).bikeRecord)groups.get(key).bikeRecord=bikeRecord;
  };
  registry.forEach(row=>addBike(row.payload?.number,row));
  const registrationOrder=new Map(registry.map((row,index)=>[normalize(row.payload?.number),index+1]));
  source.forEach(x=>{
   const p=x.payload||{},bike=String(p.bike||"غير محدد").trim();
   addBike(bike);
   const group=groups.get(normalize(bike)),date=dayOf(x);
   if(date>group.date)group.date=date;
   group.visits.push(x);
  });
  const result=[...groups.values()].sort((a,b)=>{
   const ai=registrationOrder.get(normalize(a.bike))||Number.MAX_SAFE_INTEGER,bi=registrationOrder.get(normalize(b.bike))||Number.MAX_SAFE_INTEGER;
   return ai-bi||a.bike.localeCompare(b.bike,"ar",{numeric:true});
  }).map((g,index)=>{
   const bp=g.bikeRecord?.payload||{};
   const timeMinutes=value=>{const raw=String(value||"").trim().replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g,d=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));const match=raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(ص|م|AM|PM)?$/i);if(!match)return null;let hour=Number(match[1]),minute=Number(match[2]);const suffix=String(match[3]||"").toLowerCase();if(hour>23||minute>59)return null;if(suffix){if(hour<1||hour>12)return null;hour=hour%12+(suffix==="م"||suffix==="pm"?12:0);}return hour*60+minute;};
   const compareVisitTime=(a,b)=>{const av=timeMinutes(a.payload?.patrol_time),bv=timeMinutes(b.payload?.patrol_time);if(av!==null&&bv!==null&&av!==bv)return av-bv;if(av!==null&&bv===null)return -1;if(av===null&&bv!==null)return 1;return String(a.payload?.patrol_time||"").localeCompare(String(b.payload?.patrol_time||""))||String(a.created_at||"").localeCompare(String(b.created_at||""))||String(a.id||"").localeCompare(String(b.id||""));};
   g.visits.sort((a,b)=>dayOf(a).localeCompare(dayOf(b))||compareVisitTime(a,b));
   const sites=g.visits.map(v=>{
    const p=v.payload||{},site=String(p.site||p.branch||p.location||"غير محدد").trim();
    const lat=String(p.lat??"").trim(),lng=String(p.lng??"").trim(),locationUrl=String(p.location_url??"").trim();const coordinates=validCoordinatePair(lat,lng)?("خط العرض: "+lat+" | خط الطول: "+lng):(locationUrl||"—");
    return {site,entries:[{date:dayOf(v),time:String(p.patrol_time||"—"),coordinates,notes:String(p.notes||"").trim()}],times:[String(p.patrol_time||"—")]};
   });
   const persons=[...new Set(g.visits.map(v=>String(v.payload?.person||v.payload?.responsible||"").trim()).filter(Boolean))];
   return {date:g.date,bike:g.bike,reportNumber:registrationOrder.get(normalize(g.bike))||index+1,person:persons.join("، ")||"—",code:bp.code||"—",type:bp.type||bp.description||"—",visits:g.visits,sites};
  });
  return result;
 };
 const branchGroupsFor=d=>{
  const groups=new Map();
  d.filter(x=>x.entity_type==="branch_patrols").forEach(x=>{
   const p=x.payload||{},date=dayOf(x),branch=String(p.branch||"غير محدد").trim(),key=date+"|"+branch;
   if(!groups.has(key))groups.set(key,{date,branch,visits:[]});
   groups.get(key).visits.push(x);
  });
  return [...groups.values()].map(g=>{
   g.visits.sort((a,b)=>comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time));
   const latest=[...g.visits].reverse().find(v=>String(v.payload?.supervisor||"").trim());
   return {...g,supervisor:String(latest?.payload?.supervisor||"—")};
  }).sort((a,b)=>(a.date+"|"+a.branch).localeCompare(b.date+"|"+b.branch,"ar")).flatMap(g=>Array.from({length:Math.max(1,Math.ceil(g.visits.length/5))},(_,i)=>({...g,continuation:i>0,visits:g.visits.slice(i*5,(i+1)*5)})));
 };
 let selectedBikeReport="all";
  const refreshReport=()=>{
  const d=get(),counts={};d.forEach(x=>counts[x.entity_type]=(counts[x.entity_type]||0)+1);
  if($("#reportType").value==="bike_patrols"){
   const groups=bikeGroupsFor(d),visitCount=d.length;
    const selector=$("#bikeReportSelect");selector.innerHTML='<option value="all">كل تقارير الدراجات</option>'+groups.map(g=>'<option value="'+esc(g.bike)+'">تقرير مرور دراجة '+g.reportNumber+'</option>').join("");if(selectedBikeReport!=="all"&&!groups.some(g=>g.bike===selectedBikeReport))selectedBikeReport="all";selector.value=selectedBikeReport;const visibleGroups=groups.filter(g=>selectedBikeReport==="all"||g.bike===selectedBikeReport);$("#bikeReportFilter").classList.remove("hidden");
   const uniqueBikeCount=groups.length;
   $("#reportSummary").innerHTML="<h3>تقارير مرور الدراجات — كل دراجة في تقرير مستقل</h3><p>الفترة: "+esc($("#fromDate").value)+" إلى "+esc($("#toDate").value)+" • إجمالي مرات المرور: "+visitCount+" • عدد الدراجات: "+uniqueBikeCount+"</p>"+visibleGroups.map(g=>{return "<section class='card bike-report-preview'><h3 class=\"report-preview-title\">"+"تقرير مرور دراجة "+g.reportNumber+"</h3><div class='stats'><div class='stat'><span>اسم القائم بالمرور</span><b>"+esc(g.person)+"</b></div><div class='stat'><span>رقم الدراجة</span><b>"+esc(g.bike)+"</b></div><div class='stat'><span>كود الدراجة</span><b>"+esc(g.code)+"</b></div><div class='stat'><span>نوع الدراجة</span><b>"+esc(g.type)+"</b></div></div><div class='table-wrap'><table><thead><tr><th>التاريخ</th><th>الفرع / المخزن / مركز الخدمة</th><th>مرور 1</th><th>مرور 2</th><th>مرور 3</th><th>مرور 4</th><th>مرور 5</th></tr></thead><tbody>"+g.sites.map(r=>"<tr><td>"+esc(r.entries?.[0]?.date||g.date||"—")+"</td><td>"+esc(r.site)+"</td>"+Array.from({length:5},(_,i)=>"<td>"+esc(r.times[i]||"—")+"</td>").join("")+"</tr>"+Array.from({length:Math.max(0,Math.ceil(r.times.length/5)-1)},(_,chunk)=>"<tr><td>"+esc(r.entries?.[0]?.date||g.date||"—")+"</td><td>"+esc(r.site)+" — استكمال</td>"+Array.from({length:5},(_,i)=>"<td>"+esc(r.times[(chunk+1)*5+i]||"—")+"</td>").join("")+"</tr>").join("")).join("")+"</tbody></table></div></section>";}).join("")||"<div class='empty'>لا توجد سجلات مرور دراجات في الفترة المحددة</div>";
   return;
  }
  $("#bikeReportFilter").classList.toggle("hidden",$("#reportType").value!=="bike_patrols");
   if($("#reportType").value==="branch_patrols"){
   const groups=branchGroupsFor(d),slots=5,displayDate=value=>{if(!value)return "—";const date=new Date(value+"T12:00:00");return Number.isNaN(date.getTime())?esc(value):esc(date.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));};
   $("#reportSummary").innerHTML="<h3 class=\"report-preview-title\">تقرير متابعة الفروع</h3><p>الفترة: "+esc($("#fromDate").value)+" إلى "+esc($("#toDate").value)+" • عدد الفروع/الأيام: "+groups.length+" • إجمالي المتابعات: "+d.length+"</p><div class='table-wrap'><table><thead><tr><th>الفرع</th><th>المشرف</th>"+Array.from({length:slots},(_,i)=>"<th>متابعة "+(i+1)+"</th>").join("")+"</tr></thead><tbody>"+groups.map(g=>"<tr><td>"+esc(g.branch+(g.continuation?" — استكمال":""))+"</td><td>"+esc(g.supervisor)+"</td>"+Array.from({length:slots},(_,i)=>"<td>"+esc(g.visits[i]?.payload?.patrol_time||"—")+"</td>").join("")+"</tr>").join("")+"</tbody></table></div><p class='muted'>المُعد: DEEB • التوقيع والاعتماد: __________________</p>";
   return;
  }
  const rows=rowsFor(d);
  $("#reportSummary").innerHTML="<h3>تقرير "+esc($("#reportType").selectedOptions[0].textContent)+"</h3><p>الفترة: "+esc($("#fromDate").value)+" إلى "+esc($("#toDate").value)+" • عدد السجلات: "+d.length+" • تاريخ الإصدار: "+new Date().toLocaleString("ar-EG")+"</p><div class='stats'>"+Object.entries(counts).map(([k,v])=>"<div class='stat'><b>"+v+"</b><span>"+esc(labels[k]||k)+"</span></div>").join("")+"</div><div class='table-wrap'><table><thead><tr><th>القسم</th><th>التاريخ</th><th>الوقت</th><th>تفاصيل السجل</th></tr></thead><tbody>"+rows.map(x=>"<tr><td>"+esc(x.section)+"</td><td>"+esc(x.date)+"</td><td>"+esc(x.time)+"</td><td>"+esc(x.details)+"</td></tr>").join("")+"</tbody></table></div><p class='muted'>المُعد: DEEB • التوقيع: __________________</p>";
 };
 ["fromDate","toDate","reportType"].forEach(id=>$("#"+id).onchange=()=>{selectedBikeReport="all";selectedArchiveIds=[];selectedArchivedRecordId="";refreshReport();refreshBikeQuickReports();});
 const refreshBikeQuickReports=()=>{const groups=bikeGroupsFor(data),host=$("#bikeQuickReports");host.innerHTML=groups.map(g=>'<button type="button" class="secondary" data-bike-number="'+esc(g.bike)+'">تقرير مرور دراجة '+g.reportNumber+'</button>').join("");host.onclick=e=>{const btn=e.target.closest("[data-bike-number]");if(!btn)return;selectedBikeReport=btn.dataset.bikeNumber;$("#reportType").value="bike_patrols";refreshReport();$("#bikeReportSelect").value=selectedBikeReport;};};
  $("#bikeReportSelect").onchange=()=>{selectedBikeReport=$("#bikeReportSelect").value;refreshReport();};
 document.querySelectorAll("[data-report-type]").forEach(btn=>btn.onclick=()=>{selectedBikeReport="all";selectedArchiveIds=[];selectedArchivedRecordId="";$("#reportType").value=btn.dataset.reportType;refreshReport();refreshBikeQuickReports();});
 $("#monthlyReport").onclick=()=>{selectedBikeReport="all";$("#fromDate").value=monthStart;$("#toDate").value=today;$("#reportType").value="";refreshReport();refreshBikeQuickReports();};
 refreshReport();
 refreshBikeQuickReports();
 const rowsForExport=d=>{
  if($("#reportType").value==="branch_patrols"){
   const groups=branchGroupsFor(d),slots=5;
   return [["الموقع","المشرف",...Array.from({length:slots},(_,i)=>"متابعة "+(i+1))],...groups.map(g=>[g.branch+(g.continuation?" — استكمال":""),g.supervisor,...Array.from({length:slots},(_,i)=>g.visits[i]?.payload?.patrol_time||"")])];
  }
  if($("#reportType").value==="bike_patrols"){
   const out=[["التاريخ","اسم القائم بالمرور","رقم الدراجة","كود الدراجة","نوع الدراجة","الفرع / المخزن / مركز الخدمة","مرور","الإحداثيات / رابط الموقع"]];
   bikeGroupsFor(d).filter(g=>selectedBikeReport==="all"||g.bike===selectedBikeReport).forEach(g=>g.visits.forEach(v=>{
    const p=v.payload||{};
    const site=String(p.site||p.branch||p.location||"غير محدد");
    const coordinates=validCoordinatePair(p.lat,p.lng)?("خط العرض: "+String(p.lat).trim()+" | خط الطول: "+String(p.lng).trim()):String(p.location_url||"").trim();
    out.push([dayOf(v),String(p.person||p.responsible||"—"),g.bike,g.code,g.type,site,String(p.patrol_time||""),coordinates]);
   }));
   return out;
  }
  return [["القسم","التاريخ","الوقت","تفاصيل السجل"],...rowsFor(d).map(x=>[x.section,x.date,x.time,x.details])];
 };
 const saveFile=async(name,mime,content)=>{try{const native=window.DEEBNativePlugins?.FileExport;if(native&&native.saveFile){const bytes=new TextEncoder().encode(content);let binary="";for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+0x8000,bytes.length)));await native.saveFile({name:name,mimeType:mime,base64:btoa(binary)});toast("تم حفظ الملف داخل Downloads/DEEB");}else{await DebooDB.downloadBlob(new Blob([content],{type:mime}),name);toast("تم تجهيز الملف للتنزيل");}}catch(e){toast("تعذر حفظ الملف: "+(e.message||e));}};
 const saveBinaryFile=async(name,mime,bytes)=>{try{const native=window.DEEBNativePlugins?.FileExport;if(native&&native.saveFile){let binary="";const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));await native.saveFile({name:name,mimeType:mime,base64:btoa(binary)});toast("تم حفظ ملف Excel داخل Downloads/DEEB");}else{DebooDB.downloadBlob(new Blob([bytes],{type:mime}),name);toast("تم تجهيز ملف Excel للتنزيل");}}catch(e){toast("تعذر حفظ ملف Excel: "+(e.message||e));}};
 const createXlsx=rows=>{
  const enc=new TextEncoder(),xmlEscape=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
  const colName=n=>{let out="";while(n){const r=(n-1)%26;out=String.fromCharCode(65+r)+out;n=Math.floor((n-1)/26);}return out;};
  const colWidths=[16,24,16,16,18,34,18,42,30];
  const rowHeight=(row,ri)=>{if(ri===0)return 30;const lineCounts=row.map((value,ci)=>String(value??"").split(/\r?\n/).reduce((count,line)=>count+Math.max(1,Math.ceil([...line].length/(colWidths[ci]||22))),0));return Math.min(409.5,Math.max(24,...lineCounts.map(lines=>lines*16+8)));};
  const sheetRows=rows.map((row,ri)=>'<row r="'+(ri+1)+'" ht="'+rowHeight(row,ri)+'" customHeight="1">'+row.map((value,ci)=>'<c r="'+colName(ci+1)+(ri+1)+'" s="'+(ri===0?1:2)+'" t="inlineStr"><is><t xml:space="preserve">'+xmlEscape(value)+'</t></is></c>').join("")+'</row>').join("");
  const columnWidths=Array.from({length:Math.max(1,...rows.map(r=>r.length))},(_,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(colWidths[i]||22)+'" customWidth="1"/>').join("");
  const sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols>'+columnWidths+'</cols><sheetData>'+sheetRows+'</sheetData><autoFilter ref="A1:'+colName(Math.max(1,...rows.map(r=>r.length)))+Math.max(1,rows.length)+'"/><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>';
  const files={
   "[Content_Types].xml":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
   "_rels/.rels":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
   "xl/workbook.xml":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="DEEB" sheetId="1" r:id="rId1"/></sheets></workbook>',
   "xl/_rels/workbook.xml.rels":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
   "xl/styles.xml":'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font><font><sz val="11"/><color rgb="FF202938"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF243B53"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD5DCE5"/></left><right style="thin"><color rgb="FFD5DCE5"/></right><top style="thin"><color rgb="FFD5DCE5"/></top><bottom style="thin"><color rgb="FFD5DCE5"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" horizontal="right"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" horizontal="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1" horizontal="right"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
   "xl/worksheets/sheet1.xml":sheet
  };
  const crc32=data=>{let c=0xffffffff;for(let i=0;i<data.length;i++){c^=data[i];for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
  const u16=n=>[n&255,(n>>>8)&255],u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255],join=parts=>{const size=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(size);let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;};
  const local=[],central=[];let offset=0;
  Object.entries(files).forEach(([name,content])=>{const filename=enc.encode(name),data=enc.encode(content),crc=crc32(data);
   const header=new Uint8Array([0x50,0x4b,0x03,0x04,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(filename.length),...u16(0)]);
   local.push(header,filename,data);
   const centralHeader=new Uint8Array([0x50,0x4b,0x01,0x02,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(filename.length),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset)]);
   central.push(centralHeader,filename);offset+=header.length+filename.length+data.length;
  });
  const centralBytes=join(central),localBytes=join(local),end=new Uint8Array([0x50,0x4b,0x05,0x06,...u16(0),...u16(0),...u16(Object.keys(files).length),...u16(Object.keys(files).length),...u32(centralBytes.length),...u32(localBytes.length),...u16(0)]);
  return join([localBytes,centralBytes,end]);
 };
 // Report location display: valid coordinates take priority over the shared map URL.
 // Apply consistently to image export, print/PDF, and approved snapshots.
 const reportCoordinatesOnly=(html,d)=>{
  if($("#reportType").value!=="bike_patrols")return html;
  const groups=bikeGroupsFor(d).filter(g=>selectedBikeReport==="all"||g.bike===selectedBikeReport);
  const visits=groups.flatMap(g=>g.visits);
  let index=0;
  return html.replace(/(<td class="bike-coordinates">)[\s\S]*?(<\/td>)/g,(match,open,close)=>{
   const visit=visits[index++];
   if(!visit)return match;
   const p=visit.payload||{};
   const location=validCoordinatePair(p.lat,p.lng)
    ? "خط العرض: "+String(p.lat).trim()+" | خط الطول: "+String(p.lng).trim()
    : String(p.location_url||"").trim();
   return open+esc(location||"—").replace(/\n/g,"<br>")+close;
  });
 };
 const printHtml=d=>{
    if(["written_reports","memos"].includes($("#reportType").value)){
   const documentTitle=$("#reportType").value==="memos"?"مذكرة":"التقرير اليومي";
   const dateLabel=value=>{if(!value)return "—";const date=new Date(value+"T12:00:00");return Number.isNaN(date.getTime())?esc(value):esc(date.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));};
   const records=[...d].sort((a,b)=>dayOf(a).localeCompare(dayOf(b))||String(a.created_at||"").localeCompare(String(b.created_at||"")));
   const pages=records.map((record,index)=>{const p=record.payload||{},text=esc(p.report_text||"").replace(/\n/g,"<br>");return '<section class="written-page"><div class="written-inner"><div class="brand"><div class="brand-left"><div class="brand-name">DEEB</div><div class="official-tag">تقارير رسمي</div></div><div class="brand-tag">نظام متابعة التشغيل والدوريات</div></div><h1>'+documentTitle+'</h1><div class="meta"><div><b>التاريخ</b><span>'+dateLabel(p.report_date||dayOf(record))+'</span></div><div><b>الشفت</b><span>'+esc(p.shift||"—")+'</span></div><div><b>القائم بالتقرير</b><span>'+esc(p.prepared_by||"—")+'</span></div></div><div class="report-body">'+(text||"—")+'</div><div class="foot"><span>تم إنشاء التقرير بواسطة DEEB</span><span>اعتماد المسؤول: __________________</span></div></div></section>';}).join("");
   return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEEB | '+documentTitle+'</title><style>*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;background:#fff;color:#10275b;font:14px/1.8 Tahoma,Arial,sans-serif}.written-page{width:208mm;min-height:287mm;height:auto;max-width:900px;margin:18px auto;padding:0;overflow:visible;break-after:page;page-break-after:always}.written-page:last-child{break-after:auto;page-break-after:auto}.written-inner{display:flex;flex-direction:column;width:100%;min-height:279mm;padding:4mm 5mm;transform:none}.brand{direction:ltr!important;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #c99a32;padding-bottom:9px;margin-bottom:14px}.brand-name{font-family:Georgia,serif;font-size:38px;font-weight:900;letter-spacing:1px;color:#073b28;text-shadow:0 1px #c99a32}.brand-tag{font-size:14px;font-weight:800;color:#073b28}.brand-name:after{content:"";display:block;width:92%;height:4px;margin-top:2px;background:linear-gradient(90deg,#c99a32 0%,#f3d77e 45%,#c99a32 100%);transform:skewY(-5deg)}h1{text-align:center;position:relative;font-size:25px;color:#fff;background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c);border:3px solid #c99a32;border-radius:32px;margin:14px 26px 17px;padding:8px 14px;box-shadow:0 2px 0 #8a641d}h1:before,h1:after{content:"";position:absolute;top:50%;width:30px;height:12px;background:linear-gradient(180deg,#f7df91,#b88622,#f7df91);transform:translateY(-50%);z-index:-1}h1:before{right:-30px}h1:after{left:-30px}h2{font-size:15px;color:#fff;border-right:5px solid #c99a32;background:#073b28;padding:7px 11px;margin:14px 0 8px;break-after:avoid;page-break-after:avoid}.meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:0 0 12px}.meta>div{border:1.5px solid #c99a32;background:#fbf4e6;padding:8px 11px;min-height:0;break-inside:avoid;page-break-inside:avoid}.meta b,.meta span{display:block}.meta b{font-size:12px;color:#073b28}.meta span{font-size:14px;font-weight:700;color:#10275b}.report-body{flex:1 0 auto;border:1.5px solid #c99a32;border-radius:0;background:#fff;padding:14px 16px;min-height:185mm;font-family:"Noto Naskh Arabic","Noto Sans Arabic",Tahoma,Arial,sans-serif;font-size:18px;font-weight:600;line-height:2;color:#111111;text-align:right;letter-spacing:normal;white-space:normal;overflow-wrap:anywhere;word-break:normal;orphans:2;widows:2}.foot{display:flex;justify-content:space-between;gap:16px;border-top:2px solid #c99a32;padding-top:8px;margin-top:auto;padding-bottom:2mm;font-size:11px;font-weight:700;color:#10275b;break-inside:avoid;page-break-inside:avoid}@page{size:A4 portrait;margin:5mm 1mm}@media print{html,body{width:auto!important;margin:0!important;padding:0!important;background:#fff!important}.written-page{width:208mm;min-height:287mm;height:auto;max-width:none;margin:0;padding:0;overflow:visible;break-after:page;page-break-after:always}.written-page:last-child{break-after:auto;page-break-after:auto}.written-inner{display:flex;flex-direction:column;width:100%;min-height:279mm;padding:4mm 5mm;transform:none}.meta{gap:6px;margin:0 0 10px}.meta>div{padding:7px 9px;min-height:0}.meta b{font-size:11px}.meta span{font-size:13px}.report-body{flex:1 0 auto;min-height:185mm;break-inside:auto;page-break-inside:auto;padding:12px 14px;font-family:"Noto Naskh Arabic","Noto Sans Arabic",Tahoma,Arial,sans-serif;font-size:18px;font-weight:600;line-height:2;color:#111111;text-align:right}.foot{break-inside:avoid;page-break-inside:avoid}} .report-preview-title{font-size:23px!important;font-weight:900!important;line-height:1.5!important;color:#650b1c!important;border-right:6px solid #c99a32!important;padding:10px 14px!important;margin:0 0 16px!important;background:#fbf4e6!important;border-radius:0 12px 12px 0!important}.report-print-title{display:block!important;width:100%!important;max-width:100%!important;font-size:30px!important;font-weight:900!important;line-height:1.5!important;letter-spacing:0!important;text-align:center!important;margin:12px auto 18px!important;padding:12px 18px!important;color:#fff!important;background:linear-gradient(90deg,#650b1c,#8b1429 50%,#650b1c)!important;border:3px solid #c99a32!important;border-radius:18px!important;box-shadow:0 2px 0 #8a641d!important;overflow-wrap:anywhere!important}/* DEEB shared reference identity */.brand{direction:ltr!important;border-bottom:3px solid #c99a32!important;padding-bottom:9px!important;margin-bottom:14px!important}.brand-name{font-family:Georgia,serif!important;font-size:38px!important;font-weight:900!important;letter-spacing:.6px!important;color:#073b28!important;text-shadow:0 1px #c99a32!important}.brand-name:after{content:""!important;display:block!important;width:92%!important;height:4px!important;margin-top:2px!important;background:linear-gradient(90deg,#c99a32 0%,#f3d77e 45%,#c99a32 100%)!important;transform:skewY(-5deg)!important}.brand-tag{font-size:16px!important;font-weight:800!important;line-height:1.6!important;color:#073b28!important}.official-tag{font-size:15px!important;font-weight:800!important;color:#10275b!important}h1{position:relative!important;isolation:isolate!important;text-align:center!important;color:#fff!important;font-weight:900!important;background:linear-gradient(90deg,#650b1c,#8b1429 50%,#650b1c)!important;border:3px solid #c99a32!important;border-radius:32px!important;padding:9px 18px!important;box-shadow:0 2px 0 #8a641d!important}h1:before,h1:after{content:""!important;position:absolute!important;top:50%!important;width:clamp(22px,8%,76px)!important;height:28px!important;background:repeating-linear-gradient(180deg,#f7df91 0 4px,#b88622 5px 8px,#f7df91 9px 11px)!important;transform:translateY(-50%)!important;z-index:-1!important}h1:before{right:100%!important;border-radius:3px 0 0 3px!important}h1:after{left:100%!important;border-radius:0 3px 3px 0!important}h2,.section-title,.bike-section-title{color:#fff!important;background:#073b28!important;border:0!important;border-right:5px solid #c99a32!important;border-radius:0 18px 0 0!important;padding:8px 12px!important;font-weight:900!important}.meta>div,.overview-item,.metric,.bike-meta>div{background:#fbf4e6!important;border:1.5px solid #c99a32!important;color:#10275b!important}.meta b,.overview-item span,.metric span,.bike-meta span{color:#073b28!important;font-weight:800!important}.meta span,.overview-item b,.metric b,.bike-meta b{color:#10275b!important}.report-table th,.branch-table th,.bike-table th{background:#073b28!important;color:#fff!important;border:1.5px solid #c99a32!important}.report-table td,.branch-table td,.bike-table td{border:1.5px solid #c99a32!important;color:#10275b!important}.report-table tbody tr:nth-child(even),.branch-table tbody tr:nth-child(even),.bike-table tbody tr:nth-child(even){background:#f6ead2!important}.report-body{background:#fffaf0!important;border:2px solid #c99a32!important;border-radius:16px!important}.foot,.footer,.report-foot{border-top:3px solid #c99a32!important;color:#10275b!important;font-weight:800!important}/* Branch report print fit: preserve readable type while reserving room for all 10 rows */@media print{.branch-sheet-section{height:285mm!important;min-height:285mm!important;padding:1mm 0!important}.branch-sheet-section .brand{padding-bottom:3px!important;margin-bottom:3px!important}.branch-sheet-section .brand-name{font-size:34px!important;line-height:1.05!important}.branch-sheet-section .brand-tag{font-size:14px!important;line-height:1.25!important}.branch-sheet-section .bike-report-heading{margin:2px 0 3px!important;padding:2px 5px!important}.branch-sheet-section .bike-report-heading h1{font-size:22px!important;line-height:1.2!important;padding:3px 8px!important;margin:2px 0!important}.branch-sheet-section .period{flex-basis:22mm!important;height:22mm!important;min-height:22mm!important;margin:0 0 3px!important;padding:3mm 5mm!important;font-size:22px!important;line-height:1.4!important}.branch-sheet-section .branch-table-wrap{flex:1 1 auto!important;min-height:0!important}.branch-sheet-section .branch-table{height:auto!important;width:100%!important}.branch-sheet-section .branch-table th{font-size:14px!important;line-height:1.25!important;padding:4px 3px!important}.branch-sheet-section .branch-table tbody tr{height:17mm!important;min-height:17mm!important}.branch-sheet-section .branch-table tbody td{height:17mm!important;min-height:17mm!important;padding:3px 3px!important;font-size:14px!important;line-height:1.3!important;vertical-align:middle!important}.branch-sheet-section .branch-table td:first-child{font-size:14px!important}.branch-sheet-section .foot{margin-top:3px!important;padding-top:3px!important;font-size:10px!important;line-height:1.2!important}}</style></head><body>'+pages+'</body></html>'
  }
  if($("#reportType").value==="branch_patrols"){
   const groups=branchGroupsFor(d),slots=5,title="تقرير متابعة الفروع",formatDate=value=>value?new Date(value+"T12:00:00").toLocaleDateString("ar-EG",{day:"numeric",month:"long",year:"numeric"}):"—",formatDayDate=value=>{if(!value)return "—";const date=new Date(value+"T12:00:00");return Number.isNaN(date.getTime())?esc(value):esc(date.toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));},period=formatDate($("#fromDate").value)+" — "+formatDate($("#toDate").value),issued=formatDate(new Date().toLocaleDateString("en-CA"));
   const pageSize=10,reportPages=Array.from({length:Math.max(1,Math.ceil(groups.length/pageSize))},(_,i)=>groups.slice(i*pageSize,(i+1)*pageSize)),branchSheets=reportPages.map((page,pageIndex)=>{
    const continuation=pageIndex>0,pageTitle=continuation?"باقي "+title:title;
    const rows=page.map(g=>'<tr><td>'+esc(g.branch+(g.continuation?" — استكمال":""))+'</td><td>'+esc(g.supervisor)+'</td>'+Array.from({length:slots},(_,i)=>'<td>'+esc(g.visits[i]?.payload?.patrol_time||"")+'</td>').join("")+'</tr>').join("")+Array.from({length:Math.max(0,pageSize-page.length)},()=>'<tr class="branch-empty-row">'+Array.from({length:2+slots},()=>'<td></td>').join("")+'</tr>').join("");
    const pageFooter="";
    const approval=pageIndex===reportPages.length-1?'<span>اعتماد المسؤول: __________________</span>':"";
    return '<main class="sheet branch-sheet-section"><div class="brand"><div class="brand-left"><div class="brand-name">DEEB</div><div class="official-tag">تقارير رسمي</div></div><div class="brand-tag">نظام متابعة التشغيل والدوريات</div></div><div class="bike-report-heading"><span class="bike-report-kicker">تقرير رسمي • متابعة ميدانية</span><h1 class="report-print-title">'+pageTitle+'</h1></div><p class="period">الفترة: '+esc(period)+' • تاريخ الإصدار: '+esc(issued)+' • إجمالي المتابعات: '+groups.length+'</p><div class="branch-table-wrap"><table class="branch-table"><thead><tr><th>الموقع</th><th>المشرف</th>'+Array.from({length:slots},(_,i)=>'<th>متابعة '+(i+1)+'</th>').join("")+'</tr></thead><tbody>'+rows+'</tbody></table></div><div class="foot"><span>تم إنشاء التقرير بواسطة DEEB</span>'+pageFooter+approval+'</div></main>';
   }).join("");

   return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEEB | '+title+'</title><style>*{box-sizing:border-box}body{margin:0;background:#fff;color:#000;font:16px/1.85 Tahoma,Arial,sans-serif}.sheet{width:100%;max-width:none;min-height:0;height:auto;margin:0;padding:0;background:#fff;border:0;box-sizing:border-box}.branch-sheet-section{break-after:page;page-break-after:always}.branch-sheet-section:last-of-type{break-after:auto;page-break-after:auto}.branch-sheet-section .branch-table tr{break-inside:avoid;page-break-inside:avoid}.brand{direction:ltr!important;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #bfc3c8;padding-bottom:15px;margin-bottom:21px}.brand-name{font-size:38px;font-weight:900;line-height:1.2;color:#000;letter-spacing:.4px}.brand-tag{font-size:16px;font-weight:600;line-height:1.7;color:#073b28}h1{text-align:center;color:#000;font-size:26px;margin:13px 0}.period{text-align:center;color:#000;font-size:22px;font-weight:800;line-height:2.1;margin:0 0 23px;padding:19px 28px;min-height:76px;width:100%;background:#fbf4e6;border:1px solid #bfc3c8;border-radius:0;letter-spacing:.1px}.branch-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:17px}.branch-table th{background:#073b28;color:#fff;font-size:16px;font-weight:800;padding:19px 6px;min-height:76px;line-height:2.1;border:1.5px solid #b88a2b;white-space:nowrap}.branch-table td{padding:19px 6px;min-height:76px;line-height:2.1;border:1.5px solid #b88a2b;text-align:center;font-size:16px;font-weight:600;color:#000;min-width:0;overflow-wrap:anywhere}.branch-table th:first-child,.branch-table td:first-child{width:18%;min-width:0}.branch-table th:nth-child(2),.branch-table td:nth-child(2){width:16%;min-width:0}.branch-table th:nth-child(n+3),.branch-table td:nth-child(n+3){width:13.2%;min-width:0}.branch-table td:first-child{font-weight:800;font-size:17px;text-align:right}.branch-table tbody tr:nth-child(even){background:#f6ead2}.foot{display:flex;justify-content:space-between;margin-top:24px;padding-top:12px;border-top:1px solid #bfc3c8;color:#222}@page{size:A4 portrait;margin:1mm 1mm 1mm 0}@media print{html{display:block!important;width:100%!important;min-width:0!important;max-width:none!important;height:auto!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important}body{display:block!important;width:209mm!important;min-width:209mm!important;max-width:209mm!important;height:auto!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important;font-size:14px!important;line-height:1.45!important;direction:rtl!important}.bike-sheet-section{display:block!important;box-sizing:border-box!important;width:208mm!important;min-width:208mm!important;max-width:208mm!important;min-height:0!important;height:auto!important;margin:0!important;padding:4mm!important;border:1.5px solid #c99a32!important;border-radius:0!important;overflow:visible!important;break-inside:avoid!important;page-break-inside:avoid!important;break-after:page!important;page-break-after:always!important}.bike-sheet-section:last-child{break-after:auto!important;page-break-after:auto!important}.brand{padding-bottom:5px!important;margin-bottom:6px!important}.brand-name{font-size:38px!important;line-height:1.2!important}.official-tag{font-size:16px!important;line-height:1.5!important}.brand-tag{font-size:18px!important;line-height:1.7!important}.bike-report-heading{gap:2px!important;margin:5px 0 6px!important;padding:5px 8px!important}.bike-report-kicker{font-size:12px!important}.bike-report-heading h1{font-size:26px!important;padding:5px 10px!important;line-height:1.35!important}.bike-report-date{margin:0 0 6px!important;padding:4px 8px!important;line-height:1.35!important}.bike-section-title{font-size:16px!important;line-height:1.4!important;padding:5px 8px!important;margin:6px 0 4px!important}.bike-meta{gap:4px!important;margin-bottom:6px!important}.bike-meta>div{padding:4px 6px!important;line-height:1.25!important}.bike-meta span{font-size:12px!important;line-height:1.25!important}.bike-meta b{font-size:14px!important;line-height:1.25!important;margin-top:1px!important}.bike-table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;font-size:13px!important}.bike-table th{font-size:14px!important;line-height:1.35!important;padding:5px 3px!important}.bike-table td{font-size:12px!important;line-height:1.25!important;padding:3px 2px!important}.bike-table td.bike-coordinates,.bike-table td.bike-notes{font-size:12px!important;line-height:1.25!important;padding:3px 2px!important;overflow-wrap:anywhere}.bike-table td.bike-patrol-times{font-size:11px!important;line-height:1.35!important}.report-foot,.report-page-note{margin-top:6px!important;padding-top:5px!important;font-size:10px!important;line-height:1.3!important} .bike-table thead{display:table-header-group!important}.bike-table tr{break-inside:avoid!important;page-break-inside:avoid!important}}.sheet{width:100%;max-width:none;min-height:210mm;margin:0;padding:0;border:0}.brand{padding-bottom:8px;margin-bottom:10px}.brand-name{font-size:30px}.brand-tag{font-size:13px}h1{font-size:21px;margin:7px 0}.period{font-size:17px;line-height:1.8;min-height:64px;margin:0 0 15px;padding:11px 16px;width:100%}.branch-table-wrap{break-inside:avoid;page-break-inside:avoid}.branch-table{font-size:13px}.branch-table th{font-size:12px;padding:8px 2px;min-height:0;line-height:1.5}.branch-table td{font-size:12px;padding:8px 2px;min-height:0;line-height:1.5}.branch-table td:first-child{font-size:12px}.branch-table td.branch-date{font-size:10px;line-height:1.4}.foot{margin-top:12px;padding-top:7px;font-size:11px}.branch-table{break-inside:avoid;page-break-inside:avoid}.branch-table thead{display:table-header-group}.branch-table-wrap,.branch-table,.branch-table tbody,main.sheet{break-inside:auto!important;page-break-inside:auto!important;overflow:visible!important}.branch-table tr{break-inside:avoid!important;page-break-inside:avoid!important}.foot{break-inside:avoid!important;page-break-inside:avoid!important}main.sheet{break-after:auto;page-break-after:auto}.branch-sheet-section{break-after:page!important;page-break-after:always!important}.branch-sheet-section:last-of-type{break-after:auto!important;page-break-after:auto!important}@media print{.branch-sheet-section{display:flex!important;flex-direction:column!important;box-sizing:border-box!important;width:209mm!important;height:285mm!important;min-height:285mm!important;max-height:none!important;margin:0!important;padding:2mm 1mm 2mm 0!important;border:1.5px solid #c99a32!important;overflow:visible!important;break-inside:avoid!important;page-break-inside:avoid!important}.branch-sheet-section .brand{flex:0 0 auto!important;padding-bottom:5px!important;margin-bottom:6px!important}.branch-sheet-section .bike-report-heading{flex:0 0 auto!important;margin:5px 0 6px!important;padding:5px 8px!important}.branch-sheet-section .period{display:flex!important;flex:0 0 22mm!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:100%!important;height:22mm!important;min-height:22mm!important;margin:0 0 6px!important;padding:4mm 6mm!important;background:#fff4d8!important;border:2px solid #b88a2b!important;color:#10275b!important;text-align:center!important;font-family:Tahoma,Arial,sans-serif!important;font-size:22px!important;font-weight:900!important;line-height:1.5!important;letter-spacing:0!important;white-space:normal!important;overflow:visible!important}.branch-table-wrap{display:flex!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;overflow:visible!important}.branch-table{width:100%!important;height:auto!important;table-layout:fixed!important;border-collapse:collapse!important}.branch-table thead{display:table-header-group!important;height:auto!important}.branch-table tbody{height:auto!important}.branch-table tbody tr{height:19mm!important;min-height:19mm!important;break-inside:avoid!important;page-break-inside:avoid!important}.branch-table tbody td{height:auto!important;min-height:19mm!important;vertical-align:middle!important;padding:5px 3px!important;line-height:1.4!important;overflow-wrap:anywhere!important;overflow:visible!important}.branch-table th{padding:6px 3px!important;font-size:14px!important;line-height:1.35!important}.branch-table td,.branch-table td:first-child{font-size:14px!important;line-height:1.4!important}.branch-empty-row td{color:transparent!important}.branch-sheet-section .foot{flex:0 0 auto!important;margin-top:5px!important;padding-top:5px!important;font-size:10px!important}}}.branch-table th{font-size:14px!important;font-weight:900!important;border:2px solid #b88a2b!important;background:#073b28!important;color:#fff!important;padding:14px 5px!important}.branch-table td{font-size:14px!important;font-weight:700!important;border:1.7px solid #b88a2b!important;padding:16px 5px!important;line-height:1.9!important;color:#10275b!important}.branch-table tbody tr:nth-child(even){background:#f6ead2!important}.brand{direction:ltr!important;border-bottom:3px solid #c99a32!important}.brand-name{color:#073b28!important}.period{border:1.7px solid #c99a32!important;background:#fbf4e6!important;color:#10275b!important;font-weight:900!important}.foot{border-top:3px solid #c99a32!important;color:#10275b!important;font-weight:800!important}h1{text-align:center!important;color:#fff!important;background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)!important;border:3px solid #c99a32!important;border-radius:28px!important;padding:8px 16px!important}.brand{direction:ltr!important;border-bottom:3px solid #c99a32!important}.brand-name{color:#073b28!important;text-shadow:0 1px #c99a32!important}.brand-tag{color:#073b28!important;font-weight:800!important}h1{color:#fff!important;background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)!important;border:3px solid #c99a32!important;border-radius:28px!important;padding:8px 16px!important;text-align:center!important}.overview-item,.metric{background:#fbf4e6!important;border:1.5px solid #c99a32!important;color:#10275b!important}.overview-item span,.metric span{color:#073b28!important}.overview-item b,.metric b{color:#10275b!important}.section-title,.bike-section-title{color:#fff!important;background:#073b28!important;border-right:5px solid #c99a32!important;border-bottom:0!important;padding:7px 11px!important}.report-table th,.branch-table th,.bike-table th{background:#073b28!important;color:#fff!important;border:1.5px solid #c99a32!important}.report-table td,.branch-table td,.bike-table td{border:1.5px solid #c99a32!important;color:#10275b!important}.report-table tbody tr:nth-child(even),.branch-table tbody tr:nth-child(even),.bike-table tbody tr:nth-child(even){background:#f6ead2!important}.bike-meta>div{border:1.5px solid #c99a32!important;background:#fbf4e6!important}.report-foot,.footer,.foot{border-top:3px solid #c99a32!important;color:#10275b!important}.bike-continuation h1{background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)!important;border:3px solid #c99a32!important}.report-page-note{border-color:#c99a32!important;color:#10275b!important}/* DEEB shared reference identity */.brand{direction:ltr!important;border-bottom:3px solid #c99a32!important;padding-bottom:9px!important;margin-bottom:14px!important}.brand-name{font-family:Georgia,serif!important;font-size:38px!important;font-weight:900!important;letter-spacing:.6px!important;color:#073b28!important;text-shadow:0 1px #c99a32!important}.brand-name:after{content:""!important;display:block!important;width:92%!important;height:4px!important;margin-top:2px!important;background:linear-gradient(90deg,#c99a32 0%,#f3d77e 45%,#c99a32 100%)!important;transform:skewY(-5deg)!important}.brand-tag{font-size:16px!important;font-weight:800!important;line-height:1.6!important;color:#073b28!important}.official-tag{font-size:15px!important;font-weight:800!important;color:#10275b!important}h1{position:relative!important;isolation:isolate!important;text-align:center!important;color:#fff!important;font-weight:900!important;background:linear-gradient(90deg,#650b1c,#8b1429 50%,#650b1c)!important;border:3px solid #c99a32!important;border-radius:32px!important;padding:9px 18px!important;box-shadow:0 2px 0 #8a641d!important}h1:before,h1:after{content:""!important;position:absolute!important;top:50%!important;width:clamp(22px,8%,76px)!important;height:28px!important;background:repeating-linear-gradient(180deg,#f7df91 0 4px,#b88622 5px 8px,#f7df91 9px 11px)!important;transform:translateY(-50%)!important;z-index:-1!important}h1:before{right:100%!important;border-radius:3px 0 0 3px!important}h1:after{left:100%!important;border-radius:0 3px 3px 0!important}h2,.section-title,.bike-section-title{color:#fff!important;background:#073b28!important;border:0!important;border-right:5px solid #c99a32!important;border-radius:0 18px 0 0!important;padding:8px 12px!important;font-weight:900!important}.meta>div,.overview-item,.metric,.bike-meta>div{background:#fbf4e6!important;border:1.5px solid #c99a32!important;color:#10275b!important}.meta b,.overview-item span,.metric span,.bike-meta span{color:#073b28!important;font-weight:800!important}.meta span,.overview-item b,.metric b,.bike-meta b{color:#10275b!important}.report-table th,.branch-table th,.bike-table th{background:#073b28!important;color:#fff!important;border:1.5px solid #c99a32!important}.report-table td,.branch-table td,.bike-table td{border:1.5px solid #c99a32!important;color:#10275b!important}.report-table tbody tr:nth-child(even),.branch-table tbody tr:nth-child(even),.bike-table tbody tr:nth-child(even){background:#f6ead2!important}.report-body{background:#fffaf0!important;border:2px solid #c99a32!important;border-radius:16px!important}.foot,.footer,.report-foot{border-top:3px solid #c99a32!important;color:#10275b!important;font-weight:800!important}</style></head><body>'+branchSheets+'</body>'+'</html>';
  }
  if($("#reportType").value==="bike_patrols"){
   const allGroups=bikeGroupsFor(d),groups=allGroups.filter(g=>selectedBikeReport==="all"||g.bike===selectedBikeReport),title=selectedBikeReport==="all"?"تقرير مرور الدراجات":("تقرير مرور دراجة "+(groups.find(g=>g.bike===selectedBikeReport)?.reportNumber||"")),period=[$("#fromDate").value,$("#toDate").value].filter(Boolean).sort().join(" — "),reportDate=new Date().toLocaleDateString("ar-EG");
       const totalBikePages=groups.reduce((sum,g)=>sum+Math.max(1,Math.ceil(g.sites.reduce((n,r)=>n+r.entries.length,0)/20)),0);let pageCursor=0;const sections=groups.map((g,gi)=>{
    const sectionTitle="تقرير مرور دراجة "+g.reportNumber;
    const entries=g.sites.flatMap(r=>r.entries.map(v=>({...v,site:r.site})));
    const maxRowsPerPage=20,pageCount=Math.max(1,Math.ceil(entries.length/maxRowsPerPage));
    const pages=Array.from({length:pageCount},(_,page)=>entries.slice(page*maxRowsPerPage,(page+1)*maxRowsPerPage));
    return pages.map((pageRows,pageIndex)=>{
     const siteRows=pageRows.map(v=>{
      const patrol=esc(v.time||"—");
      const coordinates=esc(v.coordinates||"—").replace(/\n/g,"<br>");
      return '<tr><td>'+esc(v.site)+'</td><td class="bike-patrol-times">'+patrol+'</td><td class="bike-coordinates">'+coordinates+'</td></tr>';
     }).join("")+Array.from({length:Math.max(0,20-pageRows.length)},()=>'<tr class="bike-empty-row"><td> </td><td> </td><td> </td></tr>').join("");
     const continuation=pageIndex>0;
     const pageTitle=continuation?"باقي "+sectionTitle:sectionTitle;
     const meta=continuation?"":'<h2 class="bike-section-title">بيانات التقرير</h2><div class="bike-meta"><div class="bike-meta-date"><span>التاريخ</span><b>'+esc(g.date?new Date(g.date+"T00:00:00").toLocaleDateString("ar-EG"):reportDate)+'</b></div><div><span>اسم القائم بالمرور</span><b>'+esc(g.person)+'</b></div><div class="bike-meta-total"><span>عدد مرات المرور</span><b>'+g.visits.length+' مرة</b></div><div><span>نوع الدراجة</span><b>'+esc(g.type)+'</b></div><div><span>رقم الدراجة</span><b>'+esc(g.bike)+'</b></div><div><span>كود الدراجة</span><b>'+esc(g.code)+'</b></div></div>';
     const pageNumber="";
     const footer=pageIndex===pages.length-1?'<div class="report-foot"><span>تم إنشاء التقرير بواسطة DEEB</span><span>اعتماد المسؤول: __________________</span></div>':'<div class="report-page-note"><span>يتبع في الصفحة التالية</span></div>';
     return '<section class="bike-sheet-section '+(continuation?"bike-continuation":"")+'"><div class="brand"><div class="brand-left"><div class="brand-name">DEEB</div><div class="official-tag">تقارير رسمي</div></div><div class="brand-tag">نظام متابعة التشغيل والدوريات</div></div><div class="bike-report-heading"><h1 class="report-print-title">'+pageTitle+'</h1></div>'+meta+'<table class="bike-table"><thead><tr><th>الموقع</th><th>توقيت المرور</th><th>الإحداثيات</th></tr></thead><tbody>'+(siteRows||'<tr><td colspan="3">لا توجد مرات مرور مسجلة لهذه الدراجة في الفترة المحددة</td></tr>')+'</tbody></table>'+footer+'</section>';
    }).join("");
   }).join("");;
   return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEEB | '+title+'</title><style>*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#000;font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.8;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{max-width:1100px;min-height:75vh;margin:20px auto;padding:28px;background:#fff;border:1px solid #bfc3c8}.brand{direction:ltr!important;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #c99a32;padding-bottom:12px;margin-bottom:15px}.brand-left{display:flex;flex-direction:column;align-items:flex-start}.brand-name{font-size:38px;font-weight:900;line-height:1.2;color:#073b28;letter-spacing:.5px}.official-tag{font-size:16px;font-weight:800;line-height:1.5;color:#10275b}.brand-tag{font-size:18px;font-weight:800;line-height:1.7;color:#073b28;text-align:right}h1{position:relative;overflow:visible;text-align:center;font-size:26px;margin:18px 12% 16px;color:#fff;background:linear-gradient(90deg,#650b1c,#8b1429 50%,#650b1c);border:3px solid #c99a32;border-radius:28px;padding:8px 16px;box-shadow:0 2px 0 #f5df9a inset,0 2px 5px #8b6a25}h1:before,h1:after{content:"";position:absolute;top:16%;width:22%;height:68%;z-index:-1;background:repeating-linear-gradient(180deg,#f7dc83 0 4px,#bd8627 5px 8px,#fff0b2 9px 11px);border:1px solid #a97820}h1:before{right:91%;clip-path:polygon(0 0,100% 12%,100% 88%,0 100%)}h1:after{left:91%;clip-path:polygon(0 12%,100% 0,100% 100%,0 88%)}.bike-report-heading{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;margin:12px 0 14px;padding:12px 16px;border:1px solid #c99a32;background:#fbf4e6}.bike-report-kicker{display:block;color:#073b28;font-size:13px;font-weight:900;letter-spacing:.2px}.bike-report-heading h1{width:100%;margin:0;padding:10px 16px;border-radius:8px;background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c);box-shadow:none}.period{text-align:center;color:#073b28;margin:0 0 12px;padding:9px 14px;min-height:0;width:100%;font-size:17px;font-weight:800;line-height:1.7;border:1.5px solid #c99a32;background:#fbf4e6}.bike-sheet-section{position:relative;box-sizing:border-box;width:100%;min-height:141.4vw;margin:0 auto 16px;padding:4vw;background:#fff;border:1.5px solid #c99a32;border-radius:10px;break-inside:avoid;page-break-inside:avoid;break-after:page;page-break-after:always;-webkit-print-color-adjust:exact;print-color-adjust:exact}.bike-sheet-section:last-child{break-after:auto;page-break-after:auto}.bike-section-title{font-size:16px;font-weight:800;color:#fff;border-right:4px solid #c99a32;padding:10px 10px;margin:13px 0 8px;background:#073b28}.bike-report-date{display:flex;justify-content:flex-start;align-items:center;gap:12px;margin:0 0 12px;padding:8px 12px;background:#fbf4e6;border:1.5px solid #c99a32;color:#10275b;font-weight:800}.bike-report-date span{color:#073b28}.bike-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}.bike-meta-total,.bike-meta-date{grid-column:span 1}.bike-meta-date{direction:rtl;text-align:center}.bike-meta>div{border:1.5px solid #b88a2b;border-radius:0;padding:7px 8px;background:#fbf4e6;min-height:0;line-height:1.35}.bike-meta span{display:block;font-size:12px;line-height:1.35;color:#222}.bike-meta b{display:block;margin-top:2px;font-size:14px;line-height:1.35;color:#10275b;overflow-wrap:anywhere}.bike-report-date{display:flex;justify-content:center;align-items:center;gap:12px;margin:8px auto 12px;padding:5px 14px;width:max-content;min-width:180px;border:1.5px solid #b88a2b;background:#fbf4e6;color:#10275b;font-size:14px;line-height:1.4}.bike-report-date span{font-weight:700}.bike-report-date b{font-weight:900}.bike-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:15px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.bike-table th{background:#073b28;color:#fff;font-size:14px;font-weight:800;padding:16px 5px;line-height:1.8;border:1.5px solid #b88a2b}.bike-table td{padding:12px 5px;line-height:1.5;border:1.5px solid #b88a2b;text-align:center;font-size:13px;font-weight:600;color:#000;overflow-wrap:anywhere}.bike-table th:first-child,.bike-table td:first-child{width:30%;text-align:center}.bike-table th:nth-child(2),.bike-table td:nth-child(2){width:16%}.bike-table th:nth-child(3),.bike-table td:nth-child(3){width:40%}.bike-table th:nth-child(4),.bike-table td:nth-child(4){width:14%}.bike-table tbody tr:nth-child(even){background:#f6ead2}.bike-table td.bike-coordinates,.bike-table td.bike-notes,.bike-table td.bike-patrol-times{text-align:right;font-size:11px;line-height:1.7;overflow-wrap:anywhere}.bike-table td.bike-coordinates{direction:ltr;text-align:center;font-variant-numeric:tabular-nums;white-space:nowrap;overflow-wrap:normal;font-size:10px;line-height:1.2;padding:3px 2px}.bike-table td.bike-patrol-times{text-align:center!important;direction:ltr;font-variant-numeric:tabular-nums;white-space:nowrap}.bike-table td.bike-coordinates>div+div,.bike-table td.bike-notes>div+div,.bike-table td.bike-patrol-times>div+div{border-top:1px dotted #999;padding-top:3px;margin-top:3px}.bike-table td.bike-notes>div+div{border-top:1px dotted #999;padding-top:3px;margin-top:3px}.bike-table td:first-child{font-weight:800}.bike-table tbody tr:nth-child(even){background:#f6ead2}.report-foot{display:flex;justify-content:space-between;border-top:3px solid #c99a32;padding-top:10px;margin-top:18px;color:#222;font-size:11px}@page{size:A4 portrait;margin:8mm 1mm}@media print{html,body{display:block!important;width:208mm!important;min-width:208mm!important;max-width:208mm!important;height:auto!important;margin:0 auto!important;padding:0!important;overflow:visible!important;background:#fff;font-size:12px;line-height:1.45;direction:rtl!important}.sheet{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:0!important;height:auto!important;overflow:visible!important;margin:0!important;padding:0!important;border:0!important;float:none!important;position:static!important}.bike-fit-content{display:block!important;box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:100%!important;height:auto!important;margin:0!important;padding:0!important;transform:none!important;float:none!important}.brand{padding-bottom:8px;margin-bottom:10px}.brand-name{font-size:34px;line-height:1.15}.official-tag{font-size:13px;line-height:1.4}.brand-tag{font-size:14px;line-height:1.5}h1{font-size:21px;margin:7px 0}.period{font-size:17px;line-height:1.8;min-height:64px;padding:11px 16px;margin:0 0 15px}.bike-sheet-section{box-sizing:border-box!important;width:100%!important;height:auto!important;max-height:none!important;min-height:0!important;margin:0!important;padding:0!important;display:block!important;overflow:visible!important;break-inside:auto!important;page-break-inside:auto!important;break-after:page!important;page-break-after:always!important;zoom:1}.bike-sheet-section:last-child{break-after:auto!important;page-break-after:auto!important}.bike-section-title{font-size:12px;padding:5px 8px;margin:7px 0 5px;border-right:3px solid #888;background:#073b28}.bike-meta{grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;margin:0 0 3mm!important}.bike-meta>div{min-height:0!important;padding:2px 5px!important;line-height:1.15!important;border:1px solid #c99a32;background:#fbf4e6;break-inside:avoid;page-break-inside:avoid}.bike-meta span{font-size:10px;line-height:1.3}.bike-meta b{font-size:12px;line-height:1.3;margin-top:1px}.bike-section-title{font-size:10px;color:#fff!important;padding:2px 6px;margin:2mm 0 1mm;border-right:2px solid #c99a32;background:#073b28}.bike-table{font-size:13px;break-inside:auto;page-break-inside:auto;width:100%;height:auto}.bike-table{display:table!important;flex:none!important;min-height:0!important;height:auto!important;font-size:13px!important}.bike-table th{background:#073b28;color:#fff;font-size:13px;font-weight:900;padding:8px 4px;line-height:1.45;border:1.5px solid #c99a32;white-space:normal}.bike-table td{font-size:12px;padding:7px 4px;line-height:1.45;border:1.5px solid #c99a32;text-align:center;font-weight:700;overflow-wrap:anywhere}.bike-table th:first-child,.bike-table td:first-child{width:12%;text-align:center}.bike-table th:nth-child(2),.bike-table td:nth-child(2){width:18%}.bike-table th:nth-child(3),.bike-table td:nth-child(3){width:14%}.bike-table th:nth-child(4),.bike-table td:nth-child(4){width:42%}.bike-table th:nth-child(5),.bike-table td:nth-child(5){width:14%}.bike-table td.bike-coordinates,.bike-table td.bike-notes,.bike-table td.bike-patrol-times{font-size:11.5px;line-height:1.45;overflow-wrap:anywhere}.bike-table td.bike-coordinates{direction:ltr;text-align:center;font-variant-numeric:tabular-nums;white-space:nowrap;overflow-wrap:normal;font-size:10px;line-height:1.2;padding:3px 2px}.bike-table td.bike-patrol-times{text-align:center!important;direction:ltr;font-variant-numeric:tabular-nums;white-space:nowrap}.bike-table thead{display:table-header-group}.bike-table tr{break-inside:avoid;page-break-inside:avoid}.report-foot{padding-top:7px;margin-top:12px;font-size:11px;break-inside:avoid;page-break-inside:avoid}}@media screen and (max-width:640px){.sheet{margin:0;padding:14px}.bike-meta{grid-template-columns:repeat(2,minmax(0,1fr))}.bike-table{font-size:10px}.bike-table th,.bike-table td{padding:8px 3px;font-size:10px}}.brand{direction:ltr!important;border-bottom:3px solid #c99a32!important}.brand-name{color:#073b28!important;text-shadow:0 1px #c99a32!important}.brand-tag{color:#073b28!important;font-weight:800!important}h1{color:#fff!important;background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)!important;border:3px solid #c99a32!important;border-radius:28px!important;padding:8px 16px!important}.bike-section-title{color:#fff!important;background:#073b28!important;border-right:5px solid #c99a32!important}.bike-meta>div{border:1.5px solid #c99a32!important;background:#fbf4e6!important}.bike-table th{background:#073b28!important;color:#fff!important;border:1.5px solid #c99a32!important}.bike-table td{border:1.5px solid #c99a32!important;color:#10275b!important}.bike-table tbody tr:nth-child(even){background:#f6ead2!important}.report-foot,.report-page-note{border-color:#c99a32!important;color:#10275b!important}.bike-continuation h1{background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)!important;border:3px solid #c99a32!important}/* DEEB shared reference identity */.brand{direction:ltr!important;border-bottom:3px solid #c99a32!important;padding-bottom:9px!important;margin-bottom:14px!important}.brand-name{font-family:Georgia,serif!important;font-size:38px!important;font-weight:900!important;letter-spacing:.6px!important;color:#073b28!important;text-shadow:0 1px #c99a32!important}.brand-name:after{content:""!important;display:block!important;width:92%!important;height:4px!important;margin-top:2px!important;background:linear-gradient(90deg,#c99a32 0%,#f3d77e 45%,#c99a32 100%)!important;transform:skewY(-5deg)!important}.brand-tag{font-size:16px!important;font-weight:800!important;line-height:1.6!important;color:#073b28!important}.official-tag{font-size:15px!important;font-weight:800!important;color:#10275b!important}h1{position:relative!important;isolation:isolate!important;text-align:center!important;color:#fff!important;font-weight:900!important;background:linear-gradient(90deg,#650b1c,#8b1429 50%,#650b1c)!important;border:3px solid #c99a32!important;border-radius:32px!important;padding:9px 18px!important;box-shadow:0 2px 0 #8a641d!important}h1:before,h1:after{content:""!important;position:absolute!important;top:50%!important;width:clamp(22px,8%,76px)!important;height:28px!important;background:repeating-linear-gradient(180deg,#f7df91 0 4px,#b88622 5px 8px,#f7df91 9px 11px)!important;transform:translateY(-50%)!important;z-index:-1!important}h1:before{right:100%!important;border-radius:3px 0 0 3px!important}h1:after{left:100%!important;border-radius:0 3px 3px 0!important}h2,.section-title,.bike-section-title{color:#fff!important;background:#073b28!important;border:0!important;border-right:5px solid #c99a32!important;border-radius:0 18px 0 0!important;padding:8px 12px!important;font-weight:900!important}.meta>div,.overview-item,.metric,.bike-meta>div{background:#fbf4e6!important;border:1.5px solid #c99a32!important;color:#10275b!important}.meta b,.overview-item span,.metric span,.bike-meta span{color:#073b28!important;font-weight:800!important}.meta span,.overview-item b,.metric b,.bike-meta b{color:#10275b!important}.report-table th,.branch-table th,.bike-table th{background:#073b28!important;color:#fff!important;border:1.5px solid #c99a32!important}.report-table td,.branch-table td,.bike-table td{border:1.5px solid #c99a32!important;color:#10275b!important}.report-table tbody tr:nth-child(even),.branch-table tbody tr:nth-child(even),.bike-table tbody tr:nth-child(even){background:#f6ead2!important}.report-body{background:#fffaf0!important;border:2px solid #c99a32!important;border-radius:16px!important}.foot,.footer,.report-foot{border-top:3px solid #c99a32!important;color:#10275b!important;font-weight:800!important}/* Bike patrol reference proportions: preserve all original font sizes; reduce notes width and compact cell padding */.bike-table{width:100%!important;table-layout:fixed!important}.bike-table th:nth-child(1),.bike-table td:nth-child(1){width:22%!important}.bike-table th:nth-child(2),.bike-table td:nth-child(2){width:16%!important}.bike-table th:nth-child(3),.bike-table td:nth-child(3){width:48%!important}.bike-table th:nth-child(4),.bike-table td:nth-child(4){width:14%!important}.bike-table td.bike-coordinates{direction:ltr!important;text-align:center!important;white-space:nowrap!important;overflow-wrap:normal!important;word-break:normal!important;font-size:13px!important;line-height:1.25!important;padding:3px 2px!important}.bike-table td.bike-notes{font-size:13px!important;line-height:1.25!important;padding:3px 2px!important;overflow-wrap:anywhere!important;white-space:normal!important}.bike-table th{padding:5px 3px!important}.bike-table td{padding:3px 2px!important}.bike-report-date{grid-column:1/-1!important;display:flex!important;justify-content:center!important;align-items:center!important;gap:12px!important;border:1.5px solid #c99a32!important;background:#fbf4e6!important;padding:6px 10px!important;text-align:center!important}.bike-report-date span{font-size:12px!important;color:#073b28!important;font-weight:800!important}.bike-report-date b{font-size:14px!important;color:#10275b!important}/* Shared DEEB brand and readable layout for preview and PNG export. */ .brand{direction:ltr!important;display:flex!important;justify-content:space-between!important;align-items:center!important;width:100%!important;border-bottom:2px solid #c99a32!important} .brand-left{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;min-width:35mm!important} .brand-name{display:block!important;font-family:Georgia,serif!important;font-size:38px!important;font-weight:900!important;line-height:1.15!important;letter-spacing:1px!important;color:#073b28!important;text-shadow:0 1px #c99a32!important} .brand-name:after{display:block!important;width:100%!important;height:4px!important;margin-top:2px!important;background:linear-gradient(90deg,#c99a32,#f3d77e,#c99a32)!important} .bike-table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important} .bike-table th:first-child,.bike-table td:first-child{width:34%!important} .bike-table th:nth-child(2),.bike-table td:nth-child(2){width:18%!important} .bike-table th:nth-child(3),.bike-table td:nth-child(3){width:48%!important} .bike-table td,.bike-table td.bike-coordinates,.bike-table td.bike-patrol-times{font-size:13px!important;line-height:1.4!important} .report-page-number{display:none!important} /* DEEB print finishing rules: keep wordmark visible at upper-left and preserve readable A4 columns. */ @media print{ .brand{direction:ltr!important;display:flex!important;justify-content:space-between!important;align-items:center!important;width:100%!important;min-height:18mm!important;padding:3mm 2mm 2mm!important;margin:0 0 4mm!important;border-bottom:2px solid #c99a32!important;break-inside:avoid!important;page-break-inside:avoid!important} .brand-left{display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important;min-width:35mm!important} .brand-name{display:block!important;font-family:Georgia,serif!important;font-size:38px!important;font-weight:900!important;line-height:1.15!important;letter-spacing:1px!important;color:#073b28!important;text-shadow:0 1px #c99a32!important} .brand-name:after{display:block!important;width:100%!important;height:4px!important;margin-top:2px!important;background:linear-gradient(90deg,#c99a32,#f3d77e,#c99a32)!important} .official-tag{font-size:14px!important;font-weight:800!important;color:#10275b!important} .brand-tag{font-size:14px!important;font-weight:800!important;color:#073b28!important;text-align:right!important} .bike-table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important} .bike-table th:first-child,.bike-table td:first-child{width:34%!important} .bike-table th:nth-child(2),.bike-table td:nth-child(2){width:18%!important} .bike-table th:nth-child(3),.bike-table td:nth-child(3){width:48%!important} .bike-table th{font-size:13px!important;line-height:1.45!important;padding:7px 4px!important} .bike-table td,.bike-table td.bike-coordinates,.bike-table td.bike-notes,.bike-table td.bike-patrol-times{font-size:13px!important;line-height:1.4!important;padding:5px 3px!important;white-space:normal!important;overflow-wrap:anywhere!important} .bike-table td.bike-coordinates{direction:ltr!important;text-align:center!important;font-variant-numeric:tabular-nums!important} .bike-table td.bike-patrol-times{direction:ltr!important;text-align:center!important;font-variant-numeric:tabular-nums!important} .report-foot{display:flex!important;justify-content:space-between!important;align-items:center!important;gap:8px!important;margin-top:5mm!important;padding-top:3mm!important;border-top:2px solid #c99a32!important;break-inside:avoid!important;page-break-inside:avoid!important} .report-page-number{display:none!important} } /* Motorcycle report: preserve the original 18-row height and paginate overflow without compressing rows. */@media print{.bike-sheet-section{display:flex!important;flex-direction:column!important;width:100%!important;margin-left:0!important;margin-right:0!important;height:281mm!important;min-height:281mm!important;max-height:281mm!important;box-sizing:border-box!important;overflow:hidden!important}.bike-table{flex:1 1 auto!important;width:100%!important;height:1px!important;min-height:0!important;table-layout:fixed!important;border-collapse:collapse!important}.bike-table thead{display:table-header-group!important;height:10mm!important}.bike-table tbody{height:calc(100% - 10mm)!important}.bike-table tbody tr{height:calc((100% - 10mm)/20)!important;break-inside:avoid!important;page-break-inside:avoid!important}.bike-table tbody td{height:calc((100% - 10mm)/20)!important;vertical-align:middle!important;padding-top:6px!important;padding-bottom:6px!important}.bike-empty-row td{color:transparent!important}.report-foot,.report-page-note{margin-top:auto!important;flex-shrink:0!important}}</style></head><body><main class=\"sheet\"><div class=\"bike-fit-content\">'+(sections||'<section class=\"bike-sheet-section\"><div class=\"brand\"><div><div class=\"brand-name\">DEEB</div><div class=\"brand-tag\">نظام متابعة التشغيل والدوريات</div></div><div class=\"brand-tag\">تقرير رسمي</div></div><h1>'+title+'</h1><p class=\"period\">الفترة: '+esc(period)+'</p><p>لا توجد سجلات في الفترة المحددة</p></section>')+'</div></main></body></html>';
  }
  const rows=rowsFor(d),counts={};
  rows.forEach(x=>counts[x.section]=(counts[x.section]||0)+1);
  const reportTitle=$("#reportType").selectedOptions[0].textContent;
  const period=$("#fromDate").value+" — "+$("#toDate").value;
  const tableRows=rows.map((x,i)=>'<tr><td class="row-number">'+(i+1)+'</td><td>'+esc(x.section)+'</td><td>'+esc(x.time||"—")+'</td><td class="details-cell">'+esc(x.details||"—")+'</td></tr>').join("");
  const summary=Object.entries(counts).map(([k,v])=>'<div class="metric"><b>'+v+'</b><span>'+esc(k)+'</span></div>').join("");
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEEB | '+esc(reportTitle)+'</title><style>*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#000;font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.8;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{width:100%;max-width:none;min-height:0;height:auto;margin:0;padding:0;background:#fff;border:0;box-sizing:border-box}.brand{direction:ltr!important;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #bfc3c8;padding-bottom:12px;margin-bottom:16px}.brand-name{font-size:38px;font-weight:900;line-height:1.2;letter-spacing:.4px;color:#000}.brand-tag{font-size:16px;font-weight:600;line-height:1.7;color:#073b28}h1{font-size:26px;margin:13px 0;color:#000;text-align:center}.subtitle{margin:0;color:#222;font-size:13px;text-align:center}.overview{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.overview-item{flex:1;min-width:150px;background:#fbf4e6;border:1px solid #bfc3c8;border-radius:0;padding:19px 16px;min-height:76px;line-height:2.1}.overview-item span{display:block;color:#222;font-size:13px}.overview-item b{display:block;font-size:16px;margin-top:3px;color:#000}.metrics{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 18px}.metric{display:flex;align-items:center;gap:8px;padding:10px 12px;min-height:58px;line-height:1.8;border-radius:0;background:#f6ead2;border:1px solid #bfc3c8;font-size:12px;color:#000}.metric b{color:#000;font-size:15px}.section-title{font-size:16px;color:#000;border-bottom:1px solid #bfc3c8;padding-bottom:8px;margin:18px 0 10px}.report-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:17px;color:#000}.report-table th{background:#073b28;color:#000;font-size:16px;font-weight:800;padding:19px 6px;line-height:2.1;border:1.5px solid #b88a2b}.report-table td{padding:19px 6px;line-height:2.1;border:1.5px solid #b88a2b;text-align:right;font-size:16px;font-weight:600;color:#000;vertical-align:top;overflow-wrap:anywhere}.report-table th:first-child,.report-table td:first-child{width:5%;text-align:center}.report-table th:nth-child(2),.report-table td:nth-child(2){width:17%}.report-table th:nth-child(3),.report-table td:nth-child(3){width:12%;text-align:center}.report-table th:last-child,.report-table td:last-child{width:66%}.report-table tbody tr:nth-child(even){background:#f6ead2}.footer{margin-top:22px;padding-top:12px;border-top:1px solid #bfc3c8;display:flex;justify-content:space-between;gap:20px;color:#222;font-size:11px}.signature{min-width:190px;text-align:center;color:#111}.empty{padding:12px;color:#333}@page{size:A4 portrait;margin:10mm 1mm}@media print{html,body{background:#fff}.sheet{max-width:none;margin:0;padding:0;border:0}.overview-item{min-height:64px;padding:11px 12px}.metric{min-height:54px;padding:8px 10px}.report-table th,.report-table td{padding:11px 3px;font-size:12px;line-height:1.8}.report-table tr{break-inside:avoid;page-break-inside:avoid}.report-table thead{display:table-header-group}}@media screen and (max-width:600px){.sheet{margin:0;padding:14px}.report-table{font-size:11px}.report-table th,.report-table td{padding:8px 4px;font-size:11px}}.bike-section-title{border-right:5px solid #555!important;background:#dfe3e9!important;font-size:17px!important;font-weight:900!important}.bike-meta>div{border:2px solid #555!important;background:#f0f0f0!important;padding:13px 9px!important}.bike-meta span{font-size:13px!important;font-weight:700!important}.bike-meta b{font-size:17px!important;font-weight:900!important}.bike-table th{border:2px solid #333!important;background:#dfe3e9!important;font-size:15px!important;font-weight:900!important;padding:12px 5px!important}.bike-table td{border:1.7px solid #444!important;font-size:14px!important;font-weight:700!important;padding:11px 5px!important;line-height:1.55!important}.bike-table td.bike-coordinates,.bike-table td.bike-notes{font-size:14px!important;line-height:1.55!important;padding:3px 2px!important}.bike-table td.bike-patrol-times{font-size:12px!important;line-height:1.5!important}.report-foot{border-top:2px solid #555!important;font-size:12px!important;font-weight:700!important}.bike-table th:nth-child(1),.bike-table td:nth-child(1){width:22%!important}.bike-table th:nth-child(2),.bike-table td:nth-child(2){width:15%!important}.bike-table th:nth-child(3),.bike-table td:nth-child(3){width:37%!important}.bike-table th:nth-child(4),.bike-table td:nth-child(4){width:26%!important}.bike-date{font-size:12px!important;font-weight:800!important;text-align:center!important;line-height:1.5!important;white-space:normal!important}.report-page-note{display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;border-top:2px solid #555;padding-top:7px;margin-top:12px;font-size:11px;font-weight:700}.report-page-number{white-space:nowrap;font-weight:800;color:#10275b}.bike-continuation h1{background:#e7e9ed;border-right:5px solid #555;padding:8px}.bike-sheet-section{break-inside:avoid!important;page-break-inside:avoid!important}.bike-sheet-section+.bike-sheet-section{break-before:auto!important;page-break-before:auto!important}@media print{.bike-sheet-section{display:flex!important;flex-direction:column!important;height:281mm!important;min-height:281mm!important;max-height:281mm!important;box-sizing:border-box!important;overflow:hidden!important;break-after:page!important;page-break-after:always!important}.bike-sheet-section:last-child{break-after:auto!important;page-break-after:auto!important}.bike-table{flex:1 1 auto!important;height:1px!important;min-height:0!important;table-layout:fixed!important}.bike-table th,.bike-table td{overflow-wrap:anywhere!important;white-space:normal!important}.bike-date{font-size:10px!important}.report-page-note{font-size:10px!important;margin-top:8px!important;padding-top:5px!important}.report-page-number{display:none!important}}.brand{direction:ltr!important;border-bottom:3px solid #c99a32!important}.brand-name{color:#073b28!important;text-shadow:0 1px #c99a32!important}.brand-tag{color:#073b28!important;font-weight:800!important}h1{color:#fff!important;background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)!important;border:3px solid #c99a32!important;border-radius:28px!important;padding:8px 16px!important;text-align:center!important}.overview-item,.metric{background:#fbf4e6!important;border:1.5px solid #c99a32!important;color:#10275b!important}.overview-item span,.metric span{color:#073b28!important}.overview-item b,.metric b{color:#10275b!important}.section-title,.bike-section-title{color:#fff!important;background:#073b28!important;border-right:5px solid #c99a32!important;border-bottom:0!important;padding:7px 11px!important}.report-table th,.branch-table th,.bike-table th{background:#073b28!important;color:#fff!important;border:1.5px solid #c99a32!important}.report-table td,.branch-table td,.bike-table td{border:1.5px solid #c99a32!important;color:#10275b!important}.report-table tbody tr:nth-child(even),.branch-table tbody tr:nth-child(even),.bike-table tbody tr:nth-child(even){background:#f6ead2!important}.bike-meta>div{border:1.5px solid #c99a32!important;background:#fbf4e6!important}.report-foot,.footer,.foot{border-top:3px solid #c99a32!important;color:#10275b!important}.bike-continuation h1{background:linear-gradient(90deg,#650b1c,#8b1429,#650b1c)!important;border:3px solid #c99a32!important}.report-page-note{border-color:#c99a32!important;color:#10275b!important}/* DEEB shared reference identity */.brand{direction:ltr!important;border-bottom:3px solid #c99a32!important;padding-bottom:9px!important;margin-bottom:14px!important}.brand-name{font-family:Georgia,serif!important;font-size:38px!important;font-weight:900!important;letter-spacing:.6px!important;color:#073b28!important;text-shadow:0 1px #c99a32!important}.brand-name:after{content:""!important;display:block!important;width:92%!important;height:4px!important;margin-top:2px!important;background:linear-gradient(90deg,#c99a32 0%,#f3d77e 45%,#c99a32 100%)!important;transform:skewY(-5deg)!important}.brand-tag{font-size:16px!important;font-weight:800!important;line-height:1.6!important;color:#073b28!important}.official-tag{font-size:15px!important;font-weight:800!important;color:#10275b!important}h1{position:relative!important;isolation:isolate!important;text-align:center!important;color:#fff!important;font-weight:900!important;background:linear-gradient(90deg,#650b1c,#8b1429 50%,#650b1c)!important;border:3px solid #c99a32!important;border-radius:32px!important;padding:9px 18px!important;box-shadow:0 2px 0 #8a641d!important}h1:before,h1:after{content:""!important;position:absolute!important;top:50%!important;width:clamp(22px,8%,76px)!important;height:28px!important;background:repeating-linear-gradient(180deg,#f7df91 0 4px,#b88622 5px 8px,#f7df91 9px 11px)!important;transform:translateY(-50%)!important;z-index:-1!important}h1:before{right:100%!important;border-radius:3px 0 0 3px!important}h1:after{left:100%!important;border-radius:0 3px 3px 0!important}h2,.section-title,.bike-section-title{color:#fff!important;background:#073b28!important;border:0!important;border-right:5px solid #c99a32!important;border-radius:0 18px 0 0!important;padding:8px 12px!important;font-weight:900!important}.meta>div,.overview-item,.metric,.bike-meta>div{background:#fbf4e6!important;border:1.5px solid #c99a32!important;color:#10275b!important}.meta b,.overview-item span,.metric span,.bike-meta span{color:#073b28!important;font-weight:800!important}.meta span,.overview-item b,.metric b,.bike-meta b{color:#10275b!important}.report-table th,.branch-table th,.bike-table th{background:#073b28!important;color:#fff!important;border:1.5px solid #c99a32!important}.report-table td,.branch-table td,.bike-table td{border:1.5px solid #c99a32!important;color:#10275b!important}.report-table tbody tr:nth-child(even),.branch-table tbody tr:nth-child(even),.bike-table tbody tr:nth-child(even){background:#f6ead2!important}.report-body{background:#fffaf0!important;border:2px solid #c99a32!important;border-radius:16px!important}.foot,.footer,.report-foot{border-top:3px solid #c99a32!important;color:#10275b!important;font-weight:800!important}</style></head><body><main class="sheet"><div class="brand"><div class="brand-left"><div class="brand-name">DEEB</div><div class="official-tag">تقارير رسمي</div></div><div class="brand-tag">نظام متابعة التشغيل والدوريات</div></div><h1>تقرير '+esc(reportTitle)+'</h1><p class="subtitle">ملخص السجلات خلال الفترة المحددة</p><div class="overview"><div class="overview-item"><span>الفترة</span><b>'+esc(period)+'</b></div><div class="overview-item"><span>إجمالي السجلات</span><b>'+rows.length+'</b></div><div class="overview-item"><span>تاريخ ووقت الإصدار</span><b>'+esc(new Date().toLocaleString("ar-EG"))+'</b></div></div><div class="metrics">'+summary+'</div><h2 class="section-title">تفاصيل السجلات</h2><table class="report-table"><thead><tr><th>م</th><th>القسم</th><th>الوقت</th><th>تفاصيل السجل</th></tr></thead><tbody>'+(tableRows||'<tr><td colspan="4" class="empty">لا توجد سجلات في الفترة المحددة</td></tr>')+'</tbody></table><div class="footer"><span>تم إنشاء هذا التقرير بواسطة DEEB</span><span class="signature">اعتماد المسؤول: __________________</span></div></main>'+'</body></html>';
}

 // Improve contrast and legibility consistently across every standalone report
 // (screen preview, Android PNG export, and print/PDF) without changing layout.
 const readableReportHtml=html=>html.replace("</style>",`
 /* Branch follow-up: remove CSS page margins, compensate left offset, and enlarge the 10 follow-up rows. */
 @page{size:A4 portrait;margin:0}
 @media print{
  .branch-sheet-section{position:relative!important;left:0!important;right:auto!important;display:flex!important;flex-direction:column!important;box-sizing:border-box!important;width:208mm!important;min-width:208mm!important;max-width:208mm!important;height:auto!important;min-height:297mm!important;max-height:none!important;margin-left:auto!important;margin-right:auto!important;margin-top:0!important;margin-bottom:0!important;padding:0!important;overflow:visible!important;break-inside:avoid!important;page-break-inside:avoid!important;break-after:page!important;page-break-after:always!important}
  .branch-sheet-section:last-of-type{break-after:auto!important;page-break-after:auto!important}
  .branch-sheet-section .brand{flex:0 0 auto!important;padding-bottom:3px!important;margin-bottom:4px!important}
  .branch-sheet-section .bike-report-heading{flex:0 0 auto!important;margin:3px 0 4px!important;padding:2px 5px!important}
  .branch-sheet-section .bike-report-heading h1{font-size:22px!important;line-height:1.25!important;padding:3px 8px!important;margin:2px 0!important}
  .branch-sheet-section .period{display:block!important;flex:0 0 auto!important;width:100%!important;height:auto!important;min-height:18mm!important;margin:0 0 3px!important;padding:3mm 4mm!important;font-size:20px!important;line-height:1.35!important}
  .branch-sheet-section .branch-table-wrap{display:block!important;flex:1 1 auto!important;width:100%!important;height:auto!important;min-height:0!important;overflow:visible!important}
  .branch-sheet-section .branch-table{display:table!important;width:100%!important;height:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
  .branch-sheet-section .branch-table thead{display:table-header-group!important}
  .branch-sheet-section .branch-table thead tr{height:12mm!important;min-height:12mm!important}
  .branch-sheet-section .branch-table thead th{height:12mm!important;min-height:12mm!important;padding:8px 4px!important;font-size:15px!important;line-height:1.3!important;vertical-align:middle!important}
  .branch-sheet-section .branch-table tbody tr{height:22mm!important;min-height:22mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
  .branch-sheet-section .branch-table tbody td{height:22mm!important;min-height:22mm!important;padding:3px 4px!important;font-size:14px!important;line-height:1.25!important;vertical-align:middle!important;overflow:visible!important}
  .branch-sheet-section .branch-table th{padding:8px 4px!important;font-size:15px!important;line-height:1.3!important;min-height:12mm!important}
  .branch-sheet-section .foot{flex:0 0 auto!important;margin-top:auto!important;padding-top:3px!important;font-size:10px!important;line-height:1.2!important}
 }
 .report-body{color:#000!important;font-size:20px!important;font-weight:800!important;line-height:1.85!important;-webkit-text-fill-color:#000!important}
 .meta b,.meta span,.overview-item span,.overview-item b,.metric span,.metric b,.bike-meta span,.bike-meta b{color:#000!important;-webkit-text-fill-color:#000!important}
 .meta b,.overview-item span,.metric span,.bike-meta span{font-size:16px!important;font-weight:800!important}
 .meta span,.overview-item b,.metric b,.bike-meta b{font-size:20px!important;font-weight:800!important;line-height:1.5!important}
 .report-table td,.branch-table td,.bike-table td{color:#000!important;-webkit-text-fill-color:#000!important;font-size:19px!important;font-weight:800!important;line-height:1.5!important;overflow-wrap:anywhere}
 .report-table th,.branch-table th,.bike-table th{font-size:16px!important;font-weight:900!important;line-height:1.4!important}
 .bike-table td.bike-coordinates,.bike-table td.bike-patrol-times{font-size:16px!important;font-weight:800!important;line-height:1.4!important;overflow-wrap:anywhere}
 .foot,.report-foot,.report-page-note{color:#000!important;-webkit-text-fill-color:#000!important;font-size:13px!important;font-weight:700!important}
 .written-page,.written-inner,.sheet{color:#000}
 /* Center branch follow-up sheets on the full A4 page: equal 1mm left/right margins. */
 @media print{
  html,body{width:210mm!important;min-width:210mm!important;max-width:210mm!important;margin:0!important;padding:0!important;position:static!important;transform:none!important;overflow:visible!important}
  .branch-sheet-section{box-sizing:border-box!important;width:208mm!important;min-width:208mm!important;max-width:208mm!important;margin-left:auto!important;margin-right:auto!important;left:auto!important;right:auto!important;transform:none!important}
 }
 /* Keep the original compact typography of bike patrol reports; the larger shared report rules apply only to other report types. */
 .bike-sheet-section .bike-report-kicker{font-size:12px!important;line-height:1.35!important}
 .bike-sheet-section .bike-report-heading h1{font-size:26px!important;line-height:1.35!important}
 .bike-sheet-section .bike-section-title{font-size:16px!important;line-height:1.4!important}
 .bike-sheet-section .bike-meta span{font-size:14px!important;line-height:1.3!important}
 .bike-sheet-section .bike-meta b{font-size:16px!important;line-height:1.3!important}
 /* Motorcycle report metadata: keep each label and its value side by side to reclaim vertical space. */
 .bike-sheet-section .bike-meta>div{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:7px!important;min-width:0!important}
 .bike-sheet-section .bike-meta span{display:inline!important;flex:0 0 auto!important;white-space:nowrap!important}
 .bike-sheet-section .bike-meta b{display:inline!important;min-width:0!important;margin:0!important;overflow-wrap:anywhere!important}

 .bike-sheet-section .bike-table th{font-size:14px!important;line-height:1.35!important}
 .bike-sheet-section .bike-table td{font-size:12px!important;line-height:1.25!important}
 .bike-sheet-section .bike-table td.bike-coordinates,.bike-sheet-section .bike-table td.bike-notes{font-size:12px!important;line-height:1.25!important}
 .bike-sheet-section .bike-table td.bike-patrol-times{font-size:11px!important;line-height:1.35!important}
 .bike-sheet-section .report-foot,.bike-sheet-section .report-page-note{font-size:10px!important;line-height:1.3!important}
 /* Branch follow-up PDF only: centered A4 page with equal side margins and ten rows. */
  @page branch-followup{size:A4 portrait;margin:2mm 3mm 1mm 3mm!important}
  @media print{
   .branch-pdf-mode .branch-sheet-section{page:branch-followup!important;box-sizing:border-box!important;width:204mm!important;min-width:204mm!important;max-width:204mm!important;height:294mm!important;min-height:294mm!important;max-height:294mm!important;margin:0!important;padding:2mm 0!important;left:auto!important;right:auto!important;transform:none!important;overflow:visible!important}
   .branch-pdf-mode .branch-sheet-section .branch-table-wrap{flex:1 1 auto!important;min-height:0!important;width:100%!important}
   .branch-pdf-mode .branch-sheet-section .branch-table{width:100%!important;height:100%!important;table-layout:fixed!important}
   .branch-pdf-mode .branch-sheet-section .branch-table tbody tr{height:19mm!important;min-height:19mm!important;break-inside:avoid!important;page-break-inside:avoid!important}
   .branch-pdf-mode .branch-sheet-section .branch-table tbody td{height:19mm!important;min-height:19mm!important;padding:3px 4px!important;vertical-align:middle!important}
  }
 /* Unified A4 print safe area: symmetric side margins and visible breathing room above the DEEB masthead. */
 @page{size:A4 portrait;margin:2mm 3mm 1mm!important}
 @media print{
  html,body{width:auto!important;min-width:0!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}
  .branch-sheet-section,.bike-sheet-section,.written-page,main.sheet{box-sizing:border-box!important;width:204mm!important;min-width:204mm!important;max-width:204mm!important;margin-left:auto!important;margin-right:auto!important}
  .branch-sheet-section{padding-top:4mm!important}
  .bike-sheet-section{padding-top:6mm!important}
  .written-page{padding-top:4mm!important}
  main.sheet{padding:4mm 3mm 0!important}
  .brand{margin-top:2mm!important}
 }
 `+"</style>");

 $("#saveReportImage").onclick=async()=>{const d=get(),hasBikeReport=$("#reportType").value==="bike_patrols"&&cache.some(x=>x.entity_type==="bikes"&&!x.is_archived);if(!d.length&&!hasBikeReport){toast("لا توجد سجلات في الفترة المحددة");return;}const native=window.DEEBNativePlugins?.FileExport;if(!native||!native.saveHtmlAsImages){toast("حفظ التقرير في معرض الصور متاح من تطبيق DEEB على أندرويد");return;}const button=$("#saveReportImage");button.disabled=true;button.textContent="جارٍ تجهيز الصورة...";try{await archiveCurrentReport();const result=await native.saveHtmlAsImages({html:reportCoordinatesOnly(readableReportHtml(printHtml(d)),d),name:"DEEB-report"});if(result?.saved!==true||!Number.isInteger(result.count)||result.count<1)throw new Error("لم يؤكد النظام حفظ صورة واحدة على الأقل.");toast("تم حفظ "+result.count+" صورة في معرض الصور داخل Pictures/DEEB");}catch(e){toast("تعذر حفظ صورة التقرير: "+(e.message||e));}finally{button.disabled=false;button.textContent="حفظ التقرير صورة";}};
 let archivedReportKey="",archivedReportPromise=null;
 const archiveCurrentReport=async()=>{
  const d=get(),type=$("#reportType").value||"all",from=$("#fromDate").value,to=$("#toDate").value;
  const html=reportCoordinatesOnly(readableReportHtml(printHtml(d)),d);
  const key=[type,from,to,selectedBikeReport||"all",selectedArchivedRecordId||"",selectedArchiveIds.slice().sort().join(","),d.map(x=>x.id+":"+x.updated_at).join("|")].join("::");
  let fingerprint=2166136261;
  for(let i=0;i<key.length;i++){fingerprint^=key.charCodeAt(i);fingerprint=Math.imul(fingerprint,16777619);}
  const dedupeKey="deeb-report-"+(fingerprint>>>0).toString(16);
  if(key===archivedReportKey&&archivedReportPromise)return archivedReportPromise;
  archivedReportKey=key;
  archivedReportPromise=DebooDB.archiveReport({title:(type==="all"?"التقرير الشامل":labels[type]||type),report_type:type,from_date:from,to_date:to,html,dedupe_key:dedupeKey,meta:{record_count:d.length,data:d,selected_bike_report:selectedBikeReport}}).catch(error=>{if(archivedReportKey===key){archivedReportKey="";archivedReportPromise=null;}throw error;});
  return archivedReportPromise;
 };
 const autoArchiveCurrentReport=async()=>{
  const d=get(),type=$("#reportType").value,hasBikeReport=type==="bike_patrols"&&cache.some(x=>x.entity_type==="bikes"&&!x.is_archived);
  if(!d.length&&!hasBikeReport)return null;
  return archiveCurrentReport();
 };
 const queueAutomaticReportArchive=()=>queueMicrotask(()=>autoArchiveCurrentReport().catch(error=>toast("تعذر حفظ التقرير تلقائيًا في الأرشيف: "+(error?.message||error))));
 ["fromDate","toDate","reportType","bikeReportSelect"].forEach(id=>$("#"+id)?.addEventListener("change",queueAutomaticReportArchive));
 $("#monthlyReport")?.addEventListener("click",queueAutomaticReportArchive);
 $("#bikeQuickReports")?.addEventListener("click",queueAutomaticReportArchive);
 area.querySelectorAll("[data-report-type]").forEach(button=>button.addEventListener("click",queueAutomaticReportArchive));
 queueAutomaticReportArchive();
 const buildArchivedReportHtml=item=>{
  const snapshot=item?.snapshot||item||{},meta=snapshot.meta||{};
  const type=String(snapshot.report_type||item?.report_type||"all");
  if(type==="bike_map"){
   let html=String(snapshot.html||item?.html||"");
   const bike=String(meta.bike||"");
   const from=String(snapshot.from_date||item?.from_date||"");
   const to=String(snapshot.to_date||item?.to_date||"");
   const visits=Array.isArray(meta.data)?meta.data.filter(x=>{const p=x.payload||{},d=String(p.patrol_date||x.created_at||"").slice(0,10);return String(p.bike||"").trim()===bike&&(!from||d>=from)&&(!to||d<=to);}).sort((a,b)=>String(a.payload?.patrol_date||a.created_at||"").localeCompare(String(b.payload?.patrol_date||b.created_at||""))||comparePatrolTimes(a.payload?.patrol_time,b.payload?.patrol_time)):[];
   if(!Array.isArray(meta.data))return html;
   const points=visits.filter(x=>validCoordinatePair(x.payload?.lat,x.payload?.lng)).map(x=>({lat:Number(x.payload.lat),lng:Number(x.payload.lng),site:x.payload.site||x.payload.branch||x.payload.location||"موقع المرور",date:x.payload.patrol_date||String(x.created_at||"").slice(0,10),time:x.payload.patrol_time||""}));
   const json=JSON.stringify(points).replace(/</g,"\\u003c");
   if(html.includes("var pts="))html=html.replace(/var pts=\[[\s\S]*?\];function safe/, "var pts="+json+";function safe");
   const detailList=points.map((p,i)=>'<li><b>'+(i+1)+'. '+esc(p.site)+'</b><span>'+esc(p.date)+' — '+esc(p.time||"وقت غير مسجل")+'</span><small>'+p.lat.toFixed(6)+", "+p.lng.toFixed(6)+'</small></li>').join("");
   if(html.includes('<div class="deeb-map-details">'))html=html.replace(/<ol>[\s\S]*?<\/ol>/,'<ol>'+detailList+'</ol>');
   return html;
  }
  let source=Array.isArray(snapshot.data)?snapshot.data:Array.isArray(meta.data)?meta.data:null;
  if(!source){
   const from=String(snapshot.from_date||item?.from_date||""),to=String(snapshot.to_date||item?.to_date||"");
   source=data.filter(x=>(!type||type==="all"||x.entity_type===type)&&(!from||dayOf(x)>=from)&&(!to||dayOf(x)<=to));
   if(Number.isFinite(Number(meta.record_count))&&source.length!==Number(meta.record_count))return snapshot.html||item?.html||"";
  }
  const oldType=$("#reportType").value,oldFrom=$("#fromDate").value,oldTo=$("#toDate").value,oldBike=selectedBikeReport;
  try{
   $("#reportType").value=type==="all"?"":type;
   $("#fromDate").value=String(snapshot.from_date||item?.from_date||"");
   $("#toDate").value=String(snapshot.to_date||item?.to_date||"");
   selectedBikeReport=String(meta.selected_bike_report||"all");
   return reportCoordinatesOnly(readableReportHtml(printHtml(source)),source);
  }finally{
   $("#reportType").value=oldType;$("#fromDate").value=oldFrom;$("#toDate").value=oldTo;selectedBikeReport=oldBike;
  }
 };
 const openArchivedReportViewer=(item,html)=>{
  if(!item||!html){toast("بيانات التقرير المحفوظ غير متاحة.");return;}
  area.querySelector("#archiveReportViewer")?.remove();
  const viewer=document.createElement("div");
  viewer.id="archiveReportViewer";
  viewer.style.cssText="position:fixed;inset:0;z-index:99999;background:#f3f0e8;display:flex;flex-direction:column;padding:10px;gap:8px";
  viewer.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px;background:#fff;border:1px solid #c9c1b2;border-radius:12px"><strong>'+esc(item.title||item.snapshot?.title||"التقرير المحفوظ")+'</strong><div style="display:flex;gap:7px;flex-wrap:wrap"><button type="button" class="primary" id="archiveViewerPrint">طباعة التقرير</button><button type="button" class="secondary" id="archiveViewerPdf">حفظ PDF</button><button type="button" class="secondary" id="archiveViewerImage">حفظ صورة</button><button type="button" class="secondary" id="archiveViewerClose">رجوع للأرشيف</button></div></div><iframe title="معاينة التقرير المحفوظ" style="width:100%;flex:1;min-height:0;background:#fff;border:1px solid #c9c1b2;border-radius:8px"></iframe>';
  area.appendChild(viewer);
  viewer.querySelector("iframe").srcdoc=html;
  const runPrint=async()=>{const native=window.DEEBNativePlugins?.FileExport;if(native?.printHtml){const result=await native.printHtml({html});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة.");}else{const w=window.open("","_blank");if(!w)throw new Error("تعذر فتح نافذة الطباعة.");w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),700);}toast("تم إرسال التقرير للطباعة.");};
  viewer.querySelector("#archiveViewerPrint").onclick=async()=>{try{await runPrint();}catch(e){toast("تعذرت الطباعة: "+(e?.message||e));}};
  viewer.querySelector("#archiveViewerPdf").onclick=async()=>{const native=window.DEEBNativePlugins?.FileExport;if(!native?.saveHtmlAsPdf){toast("حفظ PDF المباشر غير متاح في هذه النسخة.");return;}const b=viewer.querySelector("#archiveViewerPdf");b.disabled=true;try{const result=await native.saveHtmlAsPdf({html,name:"DEEB-archive-"+item.id});if(result?.saved!==true)throw new Error("لم يؤكد النظام حفظ PDF.");toast("تم حفظ PDF في Downloads/DEEB.");}catch(e){toast("تعذر حفظ PDF: "+(e?.message||e));}finally{b.disabled=false;}};
  viewer.querySelector("#archiveViewerImage").onclick=async()=>{const native=window.DEEBNativePlugins?.FileExport;if(!native?.saveHtmlAsImages){toast("حفظ الصور غير متاح في هذه النسخة.");return;}const b=viewer.querySelector("#archiveViewerImage");b.disabled=true;try{const result=await native.saveHtmlAsImages({html,name:"DEEB-archive-"+item.id});if(result?.saved!==true||!Number.isInteger(result.count)||result.count<1)throw new Error("لم يؤكد النظام حفظ الصور.");toast("تم حفظ صور التقرير في Pictures/DEEB.");}catch(e){toast("تعذر حفظ الصور: "+(e?.message||e));}finally{b.disabled=false;}};
  viewer.querySelector("#archiveViewerClose").onclick=()=>viewer.remove();
 };
 $("#saveReportArchive").onclick=async()=>{try{await archiveCurrentReport();toast("تم حفظ التقرير في الأرشيف بنجاح.");}catch(e){toast("تعذر حفظ التقرير في الأرشيف: "+e.message);}};
 const sendReportToPrinter=async()=>{
  const button=$("#printReport");if(button.disabled)return;
  const d=get(),hasBikeReport=$("#reportType").value==="bike_patrols"&&cache.some(x=>x.entity_type==="bikes"&&!x.is_archived);
  if(!d.length&&!hasBikeReport){toast("لا توجد سجلات في الفترة المحددة");return;}
  button.disabled=true;const oldText=button.textContent;button.textContent="جارٍ تجهيز الطباعة...";
  try{
   await archiveCurrentReport();
   const html=readableReportHtml(printHtml(d));
   const outputHtml=reportCoordinatesOnly(html,d);
   const printHtmlOutput=$("#reportType").value==="branch_patrols"?outputHtml.replace("<body>","<body class=\"branch-pdf-mode\">"):outputHtml;
   const native=window.DEEBNativePlugins?.FileExport;
   if(native?.printHtml){const result=await native.printHtml({html:printHtmlOutput});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة على الجهاز.");}
   else{const w=window.open("","_blank");if(!w)throw new Error("تعذر فتح نافذة الطباعة؛ اسمح بالنوافذ المنبثقة.");w.document.open();w.document.write(printHtmlOutput);w.document.close();w.focus();setTimeout(()=>w.print(),700);}
   toast("تم إرسال التقرير إلى خدمة الطباعة.");
  }catch(e){toast("تعذرت طباعة التقرير: "+(e?.message||e));}
  finally{button.disabled=false;button.textContent=oldText;}
 };
 $("#pdfReport").onclick=async()=>{const d=get(),hasBikeReport=$("#reportType").value==="bike_patrols"&&cache.some(x=>x.entity_type==="bikes"&&!x.is_archived);if(!d.length&&!hasBikeReport){toast("لا توجد سجلات في الفترة المحددة");return;}const button=$("#pdfReport"),native=window.DEEBNativePlugins?.FileExport;if(!native?.saveHtmlAsPdf){toast("حفظ PDF المباشر يحتاج تحديث نسخة التطبيق.");return;}button.disabled=true;const oldText=button.textContent;button.textContent="جارٍ حفظ PDF...";try{await archiveCurrentReport();const html=reportCoordinatesOnly(readableReportHtml(printHtml(d)),d);const result=await native.saveHtmlAsPdf({html,name:"DEEB-report"});if(result?.saved!==true)throw new Error("لم يؤكد النظام حفظ ملف PDF.");toast("تم حفظ ملف PDF في Downloads/DEEB.");}catch(e){toast("تعذر حفظ PDF: "+(e?.message||e));}finally{button.disabled=false;button.textContent=oldText;}};
 $("#printReport").onclick=async()=>sendReportToPrinter();
 $("#excelReport").onclick=async()=>{const d=get();if(!d.length){toast("لا توجد سجلات للتصدير");return;}const button=$("#excelReport");button.disabled=true;const oldText=button.textContent;button.textContent="جارٍ إنشاء Excel...";try{await archiveCurrentReport();const bytes=createXlsx(rowsForExport(d));await saveBinaryFile("DEEB-report.xlsx","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",bytes);}catch(e){toast("تعذر إنشاء ملف Excel: "+(e.message||e));}finally{button.disabled=false;button.textContent=oldText;}};
 $("#csvReport").onclick=async()=>{const d=get();if(!d.length){toast("لا توجد سجلات للتصدير");return;}try{await archiveCurrentReport();}catch(e){toast("تعذر حفظ التقرير في الأرشيف: "+e.message);return;}const q=v=>"\""+String(v??"").replace(/"/g,'""')+"\"";const csv=rowsForExport(d).map(row=>row.map(q).join(",")).join("\r\n");saveFile("DEEB-report.csv","text/csv;charset=utf-8","\ufeff"+csv);};
 $("#approveReport").onclick=async()=>{try{const d=get();if(!d.length){toast("لا توجد سجلات لاعتمادها");return;}await archiveCurrentReport();await DebooDB.approve({title:"تقرير معتمد",created_at:new Date().toISOString(),report_type:$("#reportType").value,from_date:$("#fromDate").value,to_date:$("#toDate").value,html:reportCoordinatesOnly(readableReportHtml(printHtml(d)),d),data:d});toast("تم حفظ نسخة التقرير المعتمدة محليًا");}catch(e){toast("تعذر اعتماد التقرير: "+e.message);}};
 let archiveDateSelection="",archiveShiftSelection="",archiveTypeSelection="",archiveBranchSelection="",archiveBikeSelection="",archiveReportSelection="categories",archiveReportDateSelection="",archiveSearchText="";
 const showArchive=async()=>{
  $("#archivePanel")?.classList.remove("hidden");$("#reportSummary")?.parentElement?.classList.add("hidden");
  const [archived,approved,reportArchives]=await Promise.all([DebooDB.all({archived:true}),DebooDB.approvedReports(),DebooDB.reportArchives()]),host=$("#archiveContent");
  reportArchives.forEach(item=>{const snapshot=item.snapshot||item,meta=snapshot.meta||(snapshot.meta={});if(String(snapshot.report_type||item.report_type)==="bike_map"&&!Array.isArray(meta.data)){const bike=String(meta.bike||"").trim(),from=String(snapshot.from_date||item.from_date||""),to=String(snapshot.to_date||item.to_date||""),records=[...data,...archived],seen=new Set();meta.data=records.filter(x=>x.entity_type==="bike_patrols"&&!x.is_deleted&&String(x.payload?.bike||"").trim()===bike).filter(x=>{const d=String(x.payload?.patrol_date||x.created_at||"").slice(0,10);return (!from||d>=from)&&(!to||d<=to)&&!seen.has(x.id)&&seen.add(x.id);}).map(x=>({id:x.id,created_at:x.created_at,payload:x.payload||{}}));}});
  const typeTitle=type=>({all:"التقرير الشامل",archived_records:"السجلات المؤرشفة",written_reports:"التقرير اليومي",memos:"المذكرة",branch_patrols:"متابعة الفروع",manager_rounds:"مرور المديرين",bike_map:"خرائط الدراجات",bike_patrols:"متابعة مرور الدراجات"}[type]||labels[type]||type);
  const getReportType=item=>String(item.snapshot?.report_type||item.report_type||"all");
  if(archiveReportSelection==="categories"){
   // كل نوع يمكن اختياره في مركز التقارير له قسم مقابل هنا، بالإضافة إلى خرائط الدراجات.
   const reportTypes=[...new Set([...Array.from(area.querySelectorAll("[data-report-type]"),button=>button.dataset.reportType).filter(Boolean),...reportArchives.map(getReportType),...approved.map(getReportType),"all","archived_records","bike_map","bike_patrols"])].filter(type=>type&&type!=="bikes").sort((a,b)=>typeTitle(a).localeCompare(typeTitle(b),"ar"));
   host.innerHTML=reportTypes.length?'<p class="muted archive-instruction">اختار نوع التقرير، وبعدها حدد التاريخ لعرض التقارير الخاصة باليوم المطلوب.</p><div class="archive-category-grid">'+reportTypes.map(type=>
    '<button type="button" class="archive-category" data-archive-category="'+esc(type)+'"><strong>'+esc(typeTitle(type))+'</strong><span>عرض التقارير حسب التاريخ</span></button>'
   ).join("")+'</div>':'<div class="empty">لا توجد تقارير أو سجلات مؤرشفة حتى الآن.</div>';
   host.querySelectorAll("[data-archive-category]").forEach(button=>button.onclick=()=>{archiveReportSelection=button.dataset.archiveCategory;showArchive();});
   return;
  }
  if(archiveReportSelection!=="archived_records"){
   const type=archiveReportSelection;
   const saved=reportArchives.filter(x=>String(x.snapshot?.report_type||x.report_type||"all")===type);
   const approvedForType=approved.filter(x=>getReportType(x)===type);
   const selectedDate=archiveReportDateSelection;
   const inSelectedDate=item=>{
    if(!selectedDate)return false;
    const snapshot=item.snapshot||item,meta=snapshot.meta||item.meta||{};
    const from=String(item.from_date||snapshot.from_date||"").slice(0,10);
    const to=String(item.to_date||snapshot.to_date||"").slice(0,10);
    if(from||to)if((!from||selectedDate>=from)&&(!to||selectedDate<=to))return true;
    const rows=Array.isArray(meta.data)?meta.data:(Array.isArray(snapshot.data)?snapshot.data:[]);const dates=rows.map(row=>String(row.payload?.work_date||row.payload?.patrol_date||row.payload?.incident_date||row.payload?.report_date||row.payload?.absence_date||row.payload?.handover_date||row.payload?.emergency_date||row.created_at||"").slice(0,10)).filter(Boolean);
    return dates.includes(selectedDate)||String(item.created_at||"").slice(0,10)===selectedDate;
   };
   const search=archiveSearchText.trim().toLocaleLowerCase("ar");
   const matches=item=>inSelectedDate(item)&&(!search||[item.title,item.report_type,item.created_at,item.from_date,item.to_date,JSON.stringify(item.snapshot||{}),JSON.stringify(item.meta||{})].join(" ").toLocaleLowerCase("ar").includes(search));
   const savedForDate=saved.filter(matches);
   const approvedForDate=approvedForType.filter(matches);
   const archivedForDate=selectedDate?archived.filter(x=>x.entity_type===type&&dayOf(x)===selectedDate):[];
   const savedRows=savedForDate.map(x=>'<tr><td>'+esc(x.title||typeTitle(type))+'</td><td>'+esc(String(x.created_at||"").replace("T"," ").slice(0,16))+'</td><td>'+esc((x.from_date||"—")+" — "+(x.to_date||"—"))+'</td><td><button class="tiny primary" data-print-report-archive="'+esc(x.id)+'">فتح التقرير</button> <button class="tiny" data-pdf-report-archive="'+esc(x.id)+'">حفظ PDF</button> <button class="tiny" data-image-report-archive="'+esc(x.id)+'">حفظ صورة</button></td></tr>').join("");
   const approvedRows=approvedForDate.map(x=>'<tr><td>'+esc(x.snapshot?.title||x.title||"تقرير DEEB")+'</td><td>'+esc(String(x.created_at||"").replace("T"," ").slice(0,16))+'</td><td><button class="tiny primary" data-print-approved="'+esc(x.id)+'">فتح التقرير</button> <button class="tiny" data-pdf-approved="'+esc(x.id)+'">حفظ PDF</button> <button class="tiny" data-image-approved="'+esc(x.id)+'">حفظ صورة</button></td></tr>').join("");
   host.innerHTML='<div class="archive-category-back"><button type="button" class="secondary" id="archiveBackToTypes">العودة لأنواع التقارير</button></div>'+
    '<div class="field archive-date-picker"><label for="archiveReportDate">اختار تاريخ التقرير المطلوب</label><input id="archiveReportDate" type="date" value="'+esc(selectedDate)+'"></div>'+
    (selectedDate?
      (savedForDate.length||approvedForDate.length||archivedForDate.length?
       (savedForDate.length?'<h4>التقارير المحفوظة</h4><div class="table-wrap"><table><thead><tr><th>التقرير</th><th>تاريخ الحفظ</th><th>الفترة</th><th>الإجراءات</th></tr></thead><tbody>'+savedRows+'</tbody></table></div>':'')+
       (approvedForDate.length?'<h4>نسخ التقارير المعتمدة</h4><div class="table-wrap"><table><thead><tr><th>التقرير</th><th>تاريخ الاعتماد</th><th>الإجراءات</th></tr></thead><tbody>'+approvedRows+'</tbody></table></div>':'')+
       (archivedForDate.length?'<h4>السجلات المؤرشفة في التاريخ المحدد</h4><div class="table-wrap"><table><thead><tr><th>القسم</th><th>عدد السجلات</th><th>التاريخ</th><th>الإجراء</th></tr></thead><tbody><tr><td>'+esc(typeTitle(type))+'</td><td>'+archivedForDate.length+'</td><td>'+esc(selectedDate)+'</td><td><button type="button" class="tiny primary" id="openArchivedDateReport">فتح التقرير</button> <button type="button" class="tiny" id="pdfArchivedDateReport">حفظ PDF</button> <button type="button" class="tiny" id="imageArchivedDateReport">حفظ صورة</button></td></tr></tbody></table></div>':'')
       :'<div class="empty">لا توجد بيانات محفوظة من هذا النوع في التاريخ المحدد.</div>')
      :'<div class="empty">اختار التاريخ علشان تظهر التقارير والسجلات الخاصة باليوم ده.</div>');
   $("#archiveBackToTypes").onclick=()=>{archiveReportSelection="categories";archiveReportDateSelection="";archiveSearchText="";showArchive();};
   $("#archiveReportDate").onchange=e=>{archiveReportDateSelection=e.target.value;showArchive();};
   const buildArchivedRecordsReport=()=>{
    if(!archivedForDate.length)return "";
    const oldType=$("#reportType").value,oldFrom=$("#fromDate").value,oldTo=$("#toDate").value,oldBike=selectedBikeReport;
    try{$("#reportType").value=type;$("#fromDate").value=selectedDate;$("#toDate").value=selectedDate;selectedBikeReport="all";return reportCoordinatesOnly(readableReportHtml(printHtml(archivedForDate)),archivedForDate);}
    finally{$("#reportType").value=oldType;$("#fromDate").value=oldFrom;$("#toDate").value=oldTo;selectedBikeReport=oldBike;}
   };
   const exportArchivedRecords=async(kind)=>{
    const html=buildArchivedRecordsReport();if(!html){toast("لا توجد بيانات لإنشاء التقرير.");return;}
    const native=window.DEEBNativePlugins?.FileExport;if(!native){toast("خدمة حفظ الملفات غير متاحة.");return;}
    try{if(kind==="pdf"&&native.saveHtmlAsPdf){const result=await native.saveHtmlAsPdf({html,name:"DEEB-archive-"+type+"-"+selectedDate});if(result?.saved!==true)throw new Error("لم يؤكد النظام حفظ PDF.");toast("تم حفظ PDF في Downloads/DEEB.");}
    else if(kind==="image"&&native.saveHtmlAsImages){const result=await native.saveHtmlAsImages({html,name:"DEEB-archive-"+type+"-"+selectedDate});if(result?.saved!==true||!Number.isInteger(result.count)||result.count<1)throw new Error("لم يؤكد النظام حفظ الصور.");toast("تم حفظ صور التقرير في Pictures/DEEB.");}
    else if(native.printHtml){const result=await native.printHtml({html});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة.");toast("تم إرسال التقرير للطباعة.");}else throw new Error("ميزة الحفظ غير متاحة.");}catch(e){toast("تعذر تجهيز التقرير: "+(e?.message||e));}
   };
   $("#openArchivedDateReport")?.addEventListener("click",()=>openArchivedReportViewer({title:typeTitle(type)+" - "+selectedDate,report_type:type,from_date:selectedDate,to_date:selectedDate,meta:{data:archivedForDate}},buildArchivedRecordsReport()));
   $("#pdfArchivedDateReport")?.addEventListener("click",()=>exportArchivedRecords("pdf"));
   $("#imageArchivedDateReport")?.addEventListener("click",()=>exportArchivedRecords("image"));
   const exportItem=async(item,kind,button)=>{
    const html=buildArchivedReportHtml(item);
    if(!html){toast("بيانات التقرير المؤرشف غير متاحة.");return;}
    const native=window.DEEBNativePlugins?.FileExport;
    if(!native){toast("خدمة حفظ الملفات غير متاحة.");return;}
    button.disabled=true;const old=button.textContent;button.textContent="جارٍ التجهيز...";
    try{
     if(kind==="pdf"&&native.saveHtmlAsPdf){const result=await native.saveHtmlAsPdf({html,name:"DEEB-archive-"+item.id});if(result?.saved!==true)throw new Error("لم يؤكد النظام حفظ PDF.");toast("تم حفظ PDF في Downloads/DEEB.");}
     else if(kind==="image"&&native.saveHtmlAsImages){const result=await native.saveHtmlAsImages({html,name:"DEEB-archive-"+item.id});if(result?.saved!==true||!Number.isInteger(result.count)||result.count<1)throw new Error("لم يؤكد النظام حفظ الصور.");toast("تم حفظ صور التقرير في Pictures/DEEB.");}
     else if(native.printHtml){const result=await native.printHtml({html});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة.");toast("اختر حفظ PDF من نافذة الطباعة.");}
     else throw new Error("ميزة الحفظ غير متاحة.");
    }catch(e){toast("تعذر الحفظ: "+(e?.message||e));}
    finally{button.disabled=false;button.textContent=old;}
   };
   host.querySelectorAll("[data-print-report-archive]").forEach(btn=>btn.onclick=()=>{const item=savedForDate.find(x=>String(x.id)===btn.dataset.printReportArchive);openArchivedReportViewer(item,buildArchivedReportHtml(item));});
   host.querySelectorAll("[data-pdf-report-archive]").forEach(btn=>btn.onclick=()=>exportItem(savedForDate.find(x=>String(x.id)===btn.dataset.pdfReportArchive),"pdf",btn));
   host.querySelectorAll("[data-image-report-archive]").forEach(btn=>btn.onclick=()=>exportItem(savedForDate.find(x=>String(x.id)===btn.dataset.imageReportArchive),"image",btn));
   host.querySelectorAll("[data-print-approved]").forEach(btn=>btn.onclick=()=>{const item=approvedForDate.find(x=>String(x.id)===btn.dataset.printApproved);openArchivedReportViewer(item,buildArchivedReportHtml(item));});
   host.querySelectorAll("[data-pdf-approved]").forEach(btn=>btn.onclick=()=>{const item=approvedForDate.find(x=>String(x.id)===btn.dataset.pdfApproved);exportItem(item?{...item,html:buildArchivedReportHtml(item)}:null,"pdf",btn);});
   host.querySelectorAll("[data-image-approved]").forEach(btn=>btn.onclick=()=>{const item=approvedForDate.find(x=>String(x.id)===btn.dataset.imageApproved);exportItem(item?{...item,html:buildArchivedReportHtml(item)}:null,"image",btn);});
   return;
  }
  const dates=[...new Set(archived.map(dayOf).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
  const shifts=[...new Set(archived.map(x=>String(x.payload?.shift||x.payload?.shift_name||"غير محدد")))].sort();
const branches=[...new Set(archived.map(x=>String(x.payload?.branch||x.branch_id||"غير محدد"))) ].sort();
  const bikes=[...new Set([...data.filter(x=>x.entity_type==="bikes").map(x=>String(x.payload?.number||"").trim()),...archived.filter(x=>x.entity_type==="bike_patrols").map(x=>String(x.payload?.bike||"").trim())].filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ar",{numeric:true}));
  const searchNeedle=archiveSearchText.trim().toLocaleLowerCase("ar");
  const matchesArchiveSearch=x=>!searchNeedle||[x.title,x.report_type,x.entity_type,x.created_at,x.from_date,x.to_date,JSON.stringify(x.payload||{}),JSON.stringify(x.meta||{})].join(" ").toLocaleLowerCase("ar").includes(searchNeedle);
  const filtered=archived.filter(x=>(!archiveDateSelection||dayOf(x)===archiveDateSelection)&&(!archiveShiftSelection||String(x.payload?.shift||x.payload?.shift_name||"غير محدد")===archiveShiftSelection)&&(!archiveTypeSelection||x.entity_type===archiveTypeSelection)&&(!archiveBranchSelection||String(x.payload?.branch||x.branch_id||"غير محدد")===archiveBranchSelection)&&(!archiveBikeSelection||(x.entity_type==="bike_patrols"&&String(x.payload?.bike||"").trim()===archiveBikeSelection))&&matchesArchiveSearch(x));
  host.innerHTML=(archived.length||approved.length||reportArchives.length)?`<div class="field archive-search"><label for="archiveSearchInput">بحث في الأرشيف</label><input id="archiveSearchInput" type="search" value="${esc(archiveSearchText)}" placeholder="ابحث باسم التقرير أو التاريخ أو الدراجة أو التفاصيل"></div>${reportArchives.length?`<div class="field"><label>اختيار أرشيف التقارير</label><select id="archiveReportFilter"><option value="all" ${archiveReportSelection==="all"?"selected":""}>كل التقارير</option>${[...new Set(reportArchives.map(x=>String(x.report_type||"all")).filter(type=>type!=="all"))].sort().map(type=>`<option value="${esc(type)}" ${archiveReportSelection===type?"selected":""}>${esc(type==="bike_map"?"خرائط الدراجات":labels[type]||type)}</option>`).join("")}</select></div>${(archiveReportSelection==="all"||archiveReportSelection==="bike_map")&&reportArchives.some(x=>x.report_type==="bike_map")?`<h4>أرشيف خرائط الدراجات</h4><div class="table-wrap"><table><thead><tr><th>التقرير</th><th>تاريخ الحفظ</th><th>الفترة</th><th>إجراء</th></tr></thead><tbody>${reportArchives.filter(x=>x.report_type==="bike_map"&&matchesArchiveSearch(x)).map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(String(x.created_at||"").replace("T"," ").slice(0,16))}</td><td>${esc((x.from_date||"—")+" — "+(x.to_date||"—"))}</td><td><button class="tiny" data-print-report-archive="${x.id}">عرض / طباعة</button> <button class="tiny" data-pdf-report-archive="${x.id}">حفظ PDF</button> <button class="tiny" data-image-report-archive="${x.id}">حفظ صورة</button></td></tr>`).join("")}</tbody></table></div>`:""}${reportArchives.some(x=>x.report_type!=="bike_map"&&(archiveReportSelection==="all"||x.report_type===archiveReportSelection))?`<h4>التقارير المحفوظة</h4><div class="table-wrap"><table><thead><tr><th>التقرير</th><th>تاريخ الحفظ</th><th>الفترة</th><th>إجراء</th></tr></thead><tbody>${reportArchives.filter(x=>x.report_type!=="bike_map"&&(archiveReportSelection==="all"||x.report_type===archiveReportSelection)&&matchesArchiveSearch(x)).map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(String(x.created_at||"").replace("T"," ").slice(0,16))}</td><td>${esc((x.from_date||"—")+" — "+(x.to_date||"—"))}</td><td><button class="tiny" data-print-report-archive="${x.id}">عرض / طباعة</button> <button class="tiny" data-pdf-report-archive="${x.id}">حفظ PDF</button> <button class="tiny" data-image-report-archive="${x.id}">حفظ صورة</button></td></tr>`).join("")}</tbody></table></div>`:""}`:""}${approved.length?`<h4>التقارير المعتمدة المحفوظة</h4><div class="table-wrap"><table><thead><tr><th>التقرير</th><th>تاريخ الحفظ</th><th>إجراء</th></tr></thead><tbody>${approved.filter(matchesArchiveSearch).slice().sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||""))).map(x=>`<tr><td>${esc(x.snapshot?.title||x.title||"تقرير DEEB")}</td><td>${esc(String(x.created_at||"").replace("T"," ").slice(0,16))}</td><td><button class="tiny" data-print-approved="${x.id}">عرض / طباعة</button> <button class="tiny" data-pdf-approved="${x.id}">حفظ PDF</button> <button class="tiny" data-image-approved="${x.id}">حفظ صورة</button></td></tr>`).join("")}</tbody></table></div>`:""}${archived.length?`<h4>أرشيف المتابعات والسجلات</h4><div class="actions"><button type="button" class="primary" id="createSelectedArchiveReport">إنشاء تقرير بالمتابعات المحددة</button><span class="muted">يمكنك تحديد سجلات من تواريخ مختلفة.</span></div><div class="inline archive-filters"><div class="field"><label>تصفية بالتاريخ</label><select id="archiveDateFilter"><option value="">كل التواريخ</option>${dates.map(v=>`<option value="${esc(v)}" ${v===archiveDateSelection?"selected":""}>${esc(v)}</option>`).join("")}</select></div><div class="field"><label>تصفية بالشفت</label><select id="archiveShiftFilter"><option value="">كل الشفتات</option>${shifts.map(v=>`<option value="${esc(v)}" ${v===archiveShiftSelection?"selected":""}>${esc(v)}</option>`).join("")}</select></div><div class="field"><label>تصفية بنوع المتابعة</label><select id="archiveTypeFilter"><option value="">كل الأنواع</option>${Object.entries(labels).map(([k,v])=>`<option value="${esc(k)}" ${k===archiveTypeSelection?"selected":""}>${esc(v)}</option>`).join("")}</select></div><div class="field"><label>تصفية بالفرع</label><select id="archiveBranchFilter"><option value="">كل الفروع</option>${branches.map(v=>`<option value="${esc(v)}" ${v===archiveBranchSelection?"selected":""}>${esc(v)}</option>`).join("")}</select></div><div class="field"><label>اختيار الدراجة</label><select id="archiveBikeFilter"><option value="">كل الدراجات</option>${bikes.map(v=>`<option value="${esc(v)}" ${v===archiveBikeSelection?"selected":""}>الدراجة ${esc(v)}</option>`).join("")}</select></div></div><p class="muted">عدد السجلات المعروضة: ${filtered.length} — كل سجل مرتبط بتاريخ وشفت محددين.</p><div class="table-wrap"><table><thead><tr><th>اختيار</th><th>القسم</th><th>التاريخ</th><th>الشفت</th><th>التفاصيل</th><th>إجراء</th></tr></thead><tbody>${filtered.map(x=>'<tr><td><input type="checkbox" data-select-archive="'+x.id+'" '+(selectedArchiveIds.includes(x.id)?"checked":"")+'></td><td>'+esc(labels[x.entity_type]||x.entity_type)+'</td><td>'+esc(dayOf(x))+'</td><td>'+esc(x.payload?.shift||x.payload?.shift_name||"غير محدد")+'</td><td>'+esc(detailRows(x).map(v=>v.join(": ")).join(" | "))+'</td><td><button class="tiny" data-print-archived="'+x.id+'">طباعة التقرير</button> <button class="tiny" data-edit-archived="'+x.id+'">مراجعة / تعديل</button> <button class="tiny" data-restore-record="'+x.id+'">استعادة</button></td></tr>').join("")||'<tr><td colspan="6">لا توجد سجلات لهذا التاريخ والشفت.</td></tr>'}</tbody></table></div>`:""}`:"<div class=\"empty\">لا توجد تقارير أو سجلات مؤرشفة حتى الآن.</div>";
  host.insertAdjacentHTML("afterbegin", '<div class="card archive-overview"><h3>ملخص الأرشيف</h3>'+stats([["التقارير المحفوظة",reportArchives.length],["خرائط الدراجات",reportArchives.filter(x=>x.report_type==="bike_map").length],["النسخ المعتمدة",approved.length],["السجلات المؤرشفة",archived.length]])+'</div>');
  if(!$("#archiveReportFilter"))host.insertAdjacentHTML("afterbegin", `<div class="field"><label>اختيار أرشيف التقارير</label><select id="archiveReportFilter"><option value="all" ${archiveReportSelection==="all"?"selected":""}>كل التقارير</option>${[...new Set(reportArchives.map(x=>String(x.report_type||"all")).filter(type=>type!=="all"))].sort().map(type=>`<option value="${esc(type)}" ${archiveReportSelection===type?"selected":""}>${esc(type==="bike_map"?"خرائط الدراجات":labels[type]||type)}</option>`).join("")}</select></div>`);
   const archiveFilter=host.querySelector("#archiveReportFilter")?.closest(".field");const archiveFilterSlot=$("#archiveReportFilterSlot");if(archiveFilter&&archiveFilterSlot)archiveFilterSlot.replaceChildren(archiveFilter);
  if(archiveReportSelection==="bike_map"&&!reportArchives.some(x=>x.report_type==="bike_map"))host.insertAdjacentHTML("beforeend", '<div class="empty">لا توجد خرائط دراجات محفوظة حتى الآن. احفظ تقرير الخريطة أولًا.</div>');
  if(archiveReportSelection!=="all"&&archiveReportSelection!=="bike_map"&&!reportArchives.some(x=>x.report_type===archiveReportSelection))host.insertAdjacentHTML("beforeend", '<div class="empty">لا توجد تقارير من النوع المحدد محفوظة حتى الآن.</div>');
  host.querySelectorAll("[data-print-report-archive]").forEach(btn=>btn.onclick=async()=>{const item=reportArchives.find(x=>x.id===btn.dataset.printReportArchive),html=buildArchivedReportHtml(item);if(!html){toast("بيانات التقرير المؤرشف غير متاحة للطباعة.");return;}try{const native=window.DEEBNativePlugins?.FileExport;if(native?.printHtml){const result=await native.printHtml({html});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة على الجهاز.");}else{const w=window.open("","_blank");if(!w)throw new Error("تعذر فتح نافذة الطباعة.");w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),700);}toast("تم تجهيز التقرير من قالب الطباعة الحالي وإرساله للطباعة.");}catch(e){toast("تعذرت طباعة التقرير المؤرشف: "+(e?.message||e));}});
   $("#archiveReportFilter")?.addEventListener("change",e=>{archiveReportSelection=e.target.value;showArchive();});
   $("#archiveSearchInput")?.addEventListener("input",async e=>{const position=e.target.selectionStart;archiveSearchText=e.target.value;await showArchive();const next=$("#archiveSearchInput");next?.focus();next?.setSelectionRange(position,position);});
   const saveArchivedImage=async(item,button)=>{const html=buildArchivedReportHtml(item);if(!html){toast("بيانات التقرير المؤرشف غير متاحة.");return;}const native=window.DEEBNativePlugins?.FileExport;if(!native?.saveHtmlAsImages){toast("حفظ الصور متاح من تطبيق DEEB على أندرويد.");return;}button.disabled=true;const oldText=button.textContent;button.textContent="جارٍ حفظ الصور...";try{const result=await native.saveHtmlAsImages({html,name:"DEEB-archive-"+item.id});if(result?.saved!==true||!Number.isInteger(result.count)||result.count<1)throw new Error("لم يؤكد النظام حفظ الصور.");toast("تم حفظ "+result.count+" صورة في Pictures/DEEB.");}catch(e){toast("تعذر حفظ صور التقرير: "+(e?.message||e));}finally{button.disabled=false;button.textContent=oldText;}};
  const saveArchivedPdf=async(item,button)=>{const html=buildArchivedReportHtml(item);if(!html){toast("بيانات التقرير المؤرشف غير متاحة.");return;}button.disabled=true;const oldText=button.textContent;button.textContent="جارٍ حفظ PDF...";try{const native=window.DEEBNativePlugins?.FileExport;if(native?.saveHtmlAsPdf){const result=await native.saveHtmlAsPdf({html,name:"DEEB-archive-"+item.id});if(result?.saved!==true)throw new Error("لم يؤكد النظام حفظ PDF.");toast("تم حفظ PDF في Downloads/DEEB.");}else if(native?.printHtml){const result=await native.printHtml({html});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة.");toast("اختر حفظ PDF من نافذة الطباعة.");}else{const w=window.open("","_blank");if(!w)throw new Error("تعذر فتح نافذة الطباعة.");w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),700);toast("اختر حفظ PDF من نافذة الطباعة.");}}catch(e){toast("تعذر حفظ PDF: "+(e?.message||e));}finally{button.disabled=false;button.textContent=oldText;}};
  host.querySelectorAll("[data-pdf-report-archive]").forEach(btn=>btn.onclick=()=>saveArchivedPdf(reportArchives.find(x=>x.id===btn.dataset.pdfReportArchive),btn));
  host.querySelectorAll("[data-image-report-archive]").forEach(btn=>btn.onclick=()=>saveArchivedImage(reportArchives.find(x=>x.id===btn.dataset.imageReportArchive),btn));
  host.querySelectorAll("[data-pdf-approved]").forEach(btn=>{const item=approved.find(x=>x.id===btn.dataset.pdfApproved);const html=item?.snapshot?.html||(Array.isArray(item?.snapshot?.data)?readableReportHtml(reportHTML(item.snapshot.data)):"");btn.onclick=()=>saveArchivedPdf(item?{...item,html}:null,btn);});
  host.querySelectorAll("[data-image-approved]").forEach(btn=>{const item=approved.find(x=>x.id===btn.dataset.imageApproved);const html=item?.snapshot?.html||(Array.isArray(item?.snapshot?.data)?readableReportHtml(reportHTML(item.snapshot.data)):"");btn.onclick=()=>saveArchivedImage(item?{...item,html}:null,btn);});
  host.querySelectorAll("[data-print-approved]").forEach(btn=>btn.onclick=async()=>{const item=approved.find(x=>x.id===btn.dataset.printApproved),html=buildArchivedReportHtml(item);if(!html){toast("لا توجد بيانات قابلة للطباعة في هذه النسخة المحفوظة.");return;}try{const native=window.DEEBNativePlugins?.FileExport;if(native?.printHtml){const result=await native.printHtml({html});if(result?.started!==true)throw new Error("لم تبدأ خدمة الطباعة على الجهاز.");}else{const w=window.open("","_blank");if(!w)throw new Error("تعذر فتح نافذة الطباعة؛ اسمح بالنوافذ المنبثقة.");w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),700);}toast("تم إرسال النسخة المحفوظة للطباعة.");}catch(e){toast("تعذرت طباعة النسخة المحفوظة: "+(e?.message||e));}});
  host.querySelectorAll("[data-select-archive]").forEach(input=>input.addEventListener("change",()=>{const id=input.dataset.selectArchive;if(input.checked&&!selectedArchiveIds.includes(id))selectedArchiveIds.push(id);else selectedArchiveIds=selectedArchiveIds.filter(x=>x!==id);}));
  $("#createSelectedArchiveReport")?.addEventListener("click",()=>{if(!selectedArchiveIds.length){toast("حدد متابعة واحدة على الأقل أولًا.");return;}const selected=archived.filter(x=>selectedArchiveIds.includes(x.id)),dates=selected.map(dayOf).filter(Boolean).sort();selectedArchivedRecordId="";$("#archivePanel").classList.add("hidden");$("#reportSummary").parentElement.classList.remove("hidden");$("#reportType").value="";if(dates.length){$("#fromDate").value=dates[0];$("#toDate").value=dates[dates.length-1];}refreshReport();toast("تم تجهيز تقرير بالمتابعات التي اخترتها.");});
  host.querySelectorAll("[data-print-archived]").forEach(btn=>btn.onclick=()=>{const record=archived.find(x=>x.id===btn.dataset.printArchived);if(!record)return;selectedArchiveIds=[];selectedArchivedRecordId=record.id;const date=dayOf(record);$("#fromDate").value=date;$("#toDate").value=date;$("#reportType").value=record.entity_type;$("#archivePanel").classList.add("hidden");$("#reportSummary").parentElement.classList.remove("hidden");refreshReport();$("#printReport").click();selectedArchivedRecordId="";});
  $("#archiveDateFilter")?.addEventListener("change",e=>{archiveDateSelection=e.target.value;showArchive();});
  $("#archiveShiftFilter")?.addEventListener("change",e=>{archiveShiftSelection=e.target.value;showArchive();});
  $("#archiveTypeFilter")?.addEventListener("change",e=>{archiveTypeSelection=e.target.value;showArchive();});
  $("#archiveBranchFilter")?.addEventListener("change",e=>{archiveBranchSelection=e.target.value;showArchive();});
  $("#archiveBikeFilter")?.addEventListener("change",e=>{archiveBikeSelection=e.target.value;showArchive();});
  host.querySelectorAll("[data-edit-archived]").forEach(btn=>btn.onclick=async()=>{const record=archived.find(x=>x.id===btn.dataset.editArchived);if(!record)return;const type=record.entity_type;$("#archivePanel").classList.add("hidden");$("#reportSummary").parentElement.classList.remove("hidden");render("follow");const tab=document.querySelector('.subnav [data-type="'+type+'"]');if(tab)tab.click();else{currentType=type;currentEdit=record;renderEntity(type);}currentEdit=record;renderEntity(type);$("#editor")?.scrollIntoView({behavior:"smooth",block:"start"});toast("تعديل السجل المؤرشف لن يلغي أرشفته أو يغيّر تاريخه.");});
  host.insertAdjacentHTML("afterbegin", '<div class="archive-category-back"><button type="button" class="secondary" id="archiveBackToTypes">العودة لأنواع التقارير</button></div>');
  $("#archiveBackToTypes").onclick=()=>{archiveReportSelection="categories";showArchive();};
  host.querySelectorAll("[data-restore-record]").forEach(btn=>btn.onclick=async()=>{if(!confirm("استعادة السجل إلى قائمة العمل؟"))return;try{await DebooDB.unarchive(btn.dataset.restoreRecord);await refresh();toast("تمت استعادة السجل");await showArchive();}catch(e){toast("تعذرت الاستعادة: "+e.message);}});
 };
 window.DEebOpenArchive=showArchive;
 $("#showArchive").onclick=()=>window.DEebOpenArchive();$("#closeArchive").onclick=()=>{$("#archivePanel").classList.add("hidden");$("#reportSummary").parentElement.classList.remove("hidden");};
}
function reportHTML(d){const by={};d.forEach(x=>by[x.entity_type]=(by[x.entity_type]||0)+1);return `<h3>تقرير DEEB</h3><p class="muted">تاريخ الإنشاء: ${new Date().toLocaleString("ar-EG")} • عدد السجلات: ${d.length}</p>${stats(Object.entries(by).map(([k,v])=>[labels[k]||k,v]))}<div class="table-wrap"><table><thead><tr><th>القسم</th><th>التاريخ</th><th>ملخص</th></tr></thead><tbody>${d.map(x=>`<tr><td>${labels[x.entity_type]||x.entity_type}</td><td>${new Date(x.created_at).toLocaleString("ar-EG")}</td><td>${esc(Object.values(x.payload||{}).filter(Boolean).slice(0,4).join(" • "))}</td></tr>`).join("")}</tbody></table></div><p class="muted">المُعد: المستخدم المسجل حاليًا • الاعتماد والتوقيع: __________________</p>`}
async function settings(){area.innerHTML=`${pageHead("الإعدادات", '<button class="secondary" id="settingsHome">القائمة الرئيسية</button>')}<div class="card"><h3>النسخ الاحتياطي والاستعادة</h3><p class="muted">إنشاء نسخة خارجية أو استعادة نسخة سابقة، وإدارة النسخ التلقائية من مكان واحد.</p><button class="secondary" type="button" id="settingsBackup">فتح النسخ الاحتياطي والاستعادة</button></div><div class="card"><h3>وضع التشغيل الفردي</h3><p class="muted">يعمل DEEB محليًا على جهاز واحد دون حساب أو إنترنت. يظل هذا الوضع متاحًا حتى عند عدم إعداد اتصال الإدارة.</p><span class="pill">تخزين محلي IndexedDB</span><div class="actions"><button class="secondary" id="installAppBtn">تثبيت التطبيق على الجهاز</button><button class="secondary" id="storageCheckBtn">فحص مساحة التخزين</button><button class="secondary" id="storagePersistBtn">طلب حماية البيانات من الإزالة التلقائية</button></div><div id="deviceStatus" class="muted" aria-live="polite">جارٍ فحص حالة الجهاز...</div></div>
<div class="card"><h3>تشغيل الإدارة على عدة أجهزة</h3><p class="muted">اربط الأجهزة بإدارة واحدة لمزامنة السجلات. الاتصال لا يبدأ إلا بعد إعداد مشروع Supabase وإنشاء حساب المدير الأول من لوحة Auth ثم تسجيل الدخول. لا تضع هنا أي مفتاح service-role؛ استخدم anon/public فقط.</p>
<div class="field"><label for="teamSupabaseUrl">رابط مشروع Supabase</label><input id="teamSupabaseUrl" type="url" placeholder="https://your-project.supabase.co" autocomplete="url"></div>
<div class="field"><label for="teamAnonKey">مفتاح anon / publishable</label><input id="teamAnonKey" type="password" placeholder="المفتاح العام للمشروع" autocomplete="off"></div>
<div class="actions"><button class="secondary" id="teamSaveConfig">حفظ إعداد الاتصال</button></div>
<div class="field"><label for="teamEmail">البريد الإلكتروني لحساب الإدارة</label><input id="teamEmail" type="email" autocomplete="username"></div>
<div class="field"><label for="teamPassword">كلمة المرور</label><input id="teamPassword" type="password" autocomplete="current-password"></div>
<div class="actions"><button class="primary" id="teamSignIn">تسجيل الدخول</button><button class="secondary" id="teamSignOut">تسجيل الخروج</button></div>
<p class="muted">إنشاء الإدارة لأول مرة متاح فقط لحساب المالك المعتمد مسبقًا من إعدادات Supabase، لمنع أي مستخدم عادي من الاستحواذ على الإدارة.</p><div class="field"><label for="teamOrganizationName">اسم الإدارة (لإنشاء الإدارة لأول مرة فقط)</label><input id="teamOrganizationName" placeholder="اسم إدارة الأمن"></div>
<div class="field"><label for="teamDisplayName">اسم مدير النظام</label><input id="teamDisplayName" placeholder="الاسم الظاهر"></div>
<div class="actions"><button class="secondary" id="teamBootstrap">إنشاء الإدارة لأول مرة</button><button class="primary" id="teamSyncNow">مزامنة الآن</button><button class="secondary" id="teamLocalMode">العودة للوضع الفردي</button></div>
<div id="teamSyncStatus" class="notice" aria-live="polite">الوضع الفردي هو الوضع الافتراضي. لم يتم تشغيل المزامنة.</div>
</div>
<div class="card"><h3>إنشاء رمز QR دون إنترنت</h3><p class="muted">أنشئ رمزًا نصيًا أو لرابط أو رقم سجل، ثم احفظه كصورة PNG. لا تُدخل بيانات سرية في رمز يمكن لأي شخص مسحه.</p><div class="field"><label for="qrText">النص أو الرابط</label><textarea id="qrText" rows="3" placeholder="اكتب النص أو الرابط المراد تحويله إلى QR"></textarea></div><div class="actions"><button class="secondary" id="makeQR">إنشاء QR</button><button class="secondary" id="downloadQR" disabled>تنزيل صورة PNG</button></div><div id="qrOutput" class="qr-output hidden"><canvas id="qrCanvas" width="320" height="320" aria-label="رمز QR"></canvas><div class="muted" id="qrStatus"></div></div></div><div class="card"><h3>تنبيهات المهام والبلاغات</h3><p class="muted">يمكن إرسال تنبيه أثناء فتح التطبيق عند وجود مهام متأخرة أو بلاغات عاجلة. التنبيه الخلفي الدائم غير مضمون على كل الأجهزة.</p><div class="actions"><button class="secondary" id="enableNotifications">تفعيل التنبيهات</button><button class="secondary" id="checkNotifications">فحص الآن</button></div><div id="notificationStatus" class="muted"></div></div><div class="card"><h3>سجل الأحداث</h3><div id="auditArea">جارٍ التحميل...</div></div><div class="card"><h3>قفل التطبيق برمز PIN</h3><p class="muted">التطبيق يفتح مباشرة دون PIN افتراضيًا. احفظ رمزًا أولًا، ثم فعّل القفل بنفسك عند الحاجة. الرمز محلي من 4 إلى 8 أرقام وتُخزّن بصمته باستخدام PBKDF2. هذا القفل لا يشفر قاعدة البيانات ولا يغني عن حماية الجهاز.</p><div class="form"><div class="field"><label>رمز PIN جديد</label><input id="newPin" type="password" inputmode="numeric" maxlength="8" placeholder="4 إلى 8 أرقام"></div><div class="field"><label>تأكيد رمز PIN</label><input id="confirmPin" type="password" inputmode="numeric" maxlength="8" placeholder="أعد كتابة الرمز"></div></div><div class="actions"><button class="secondary" id="savePin">حفظ / تغيير PIN</button><button class="primary" id="enablePinLock">تفعيل طلب PIN عند الفتح</button><button class="secondary" id="disablePinLock">تعطيل طلب PIN مع الاحتفاظ بالرمز</button><button class="secondary" id="disablePin">حذف رمز PIN نهائيًا</button></div><div id="pinStatus" class="muted" aria-live="polite"></div></div>
<div class="card">
<h3>فتح التطبيق بالبصمة</h3>
<p class="muted">فعّل البصمة لفتح التطبيق بسرعة، مع الاحتفاظ برمز PIN كطريقة بديلة.</p>
<div class="actions">
<button class="primary" id="enableBiometric">تفعيل البصمة</button>
<button class="secondary" id="disableBiometric">إلغاء البصمة</button>
</div>
<div id="biometricStatus" class="muted"></div>
</div>
<div class="card"><h3>ملاحظات</h3><p class="muted">الطقس يحتاج الإنترنت. الوضع الفردي لا يحتاج حسابًا. مزامنة الإدارة تتطلب إعداد Supabase وتطبيق ملفات قاعدة البيانات على مشروع السيرفر قبل استخدامها. البصمة متاحة عند بناء نسخة Android المدعومة.</p></div>`;
$("#settingsHome").onclick=()=>render("landing");
 $("#settingsBackup").onclick=()=>render("backup");
 
 const teamStatus=$("#teamSyncStatus");
 const teamConfig=window.DEEBTeamSync;
 const teamSetStatus=(message)=>{if(teamStatus)teamStatus.textContent=message;};
 if(teamConfig){
  const savedTeamConfig=teamConfig.status?await teamConfig.status():{configured:false};
  if(savedTeamConfig.configured)$("#teamSupabaseUrl").value=savedTeamConfig.url||"";
  const refreshTeamStatus=async()=>{
   try{const [auth,dbStatus]=await Promise.all([teamConfig.status(),DebooDB.syncStatus()]);
    teamSetStatus(`الاتصال: ${auth.configured?"مُعد":"غير مُعد"} • الحساب: ${auth.signedIn?"مسجل":"غير مسجل"} • الوضع: ${dbStatus.mode==="team"?"إدارة متعددة الأجهزة":"فردي"} • معلّق: ${dbStatus.pending} • تمت مزامنته: ${dbStatus.synced} • تعارضات: ${dbStatus.open_conflicts}`);
   }catch(error){teamSetStatus("تعذر قراءة حالة المزامنة: "+error.message);}
  };
  $("#teamSaveConfig").onclick=()=>{try{const saved=teamConfig.configure({url:$("#teamSupabaseUrl").value,anonKey:$("#teamAnonKey").value});teamSetStatus("تم حفظ إعداد الاتصال: "+saved.url+" — لم يتم تسجيل الدخول بعد.");}catch(error){teamSetStatus(error.message);}};
  $("#teamSignIn").onclick=async()=>{const btn=$("#teamSignIn");btn.disabled=true;try{const result=await teamConfig.signIn($("#teamEmail").value,$("#teamPassword").value);$("#teamPassword").value="";teamSetStatus("تم تسجيل الدخول بالحساب: "+(result.user.email||result.user.id)+". إذا كانت هذه أول مرة، أنشئ الإدارة أولًا.");await refreshTeamStatus();}catch(error){teamSetStatus("فشل تسجيل الدخول: "+error.message);}finally{btn.disabled=false;}};
  $("#teamBootstrap").onclick=async()=>{const btn=$("#teamBootstrap");btn.disabled=true;try{const result=await teamConfig.bootstrapOrganization($("#teamOrganizationName").value,$("#teamDisplayName").value);teamSetStatus("تم إنشاء الإدارة وحساب مدير النظام. جاري تسجيل الجهاز والمزامنة...");const synced=await teamConfig.syncNow();teamSetStatus("تم إعداد الإدارة والجهاز. السجلات المرسلة: "+synced.pushed.sent+" • السجلات المستلمة: "+synced.pulled.records);}catch(error){teamSetStatus("تعذر إنشاء الإدارة: "+error.message);}finally{btn.disabled=false;}};
  $("#teamSyncNow").onclick=async()=>{const btn=$("#teamSyncNow");btn.disabled=true;try{const result=await teamConfig.syncNow();teamSetStatus("اكتملت دورة المزامنة. مرسل: "+result.pushed.sent+" • تعارضات: "+result.pushed.conflicts+" • أخطاء: "+result.pushed.failed+" • مستلم: "+result.pulled.records+" • متروك لحماية تعديلاتك المحلية: "+result.pulled.skipped_local);}catch(error){teamSetStatus("تعذرت المزامنة: "+error.message);}finally{btn.disabled=false;await refreshTeamStatus();}};
  $("#teamSignOut").onclick=async()=>{try{await teamConfig.signOut();teamSetStatus("تم تسجيل الخروج. البيانات المحلية وقائمة المزامنة محفوظة كما هي.");await refreshTeamStatus();}catch(error){teamSetStatus("تعذر تسجيل الخروج: "+error.message);}};
  $("#teamLocalMode").onclick=async()=>{try{const result=await DebooDB.clearTeamContext();teamSetStatus("عاد التطبيق للوضع الفردي. العمليات غير المرسلة ما زالت محفوظة: "+result.pending_mutations+".");await refreshTeamStatus();}catch(error){teamSetStatus(error.message);}};
  await refreshTeamStatus();
 }
 const deviceStatus=$("#deviceStatus"),installBtn=$("#installAppBtn");
 const showDeviceStatus=async()=>{const online=navigator.onLine;let usage="غير متاح";try{if(navigator.storage?.estimate){const e=await navigator.storage.estimate();usage=`${(e.usage||0)/1048576|0} ميجابايت مستخدمة من ${(e.quota||0)/1048576|0} ميجابايت تقريبًا`;}}catch{}const persisted=navigator.storage?.persisted?await navigator.storage.persisted():null;deviceStatus.textContent=`الاتصال: ${online?"متصل":"غير متصل"} • التخزين: ${usage} • حماية البيانات: ${persisted===null?"غير مدعومة":persisted?"مفعّلة":"غير مفعّلة"}`};
 const isInstalled=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
 installBtn.disabled=false;
 installBtn.textContent=isInstalled?"التطبيق مثبت بالفعل":"تثبيت التطبيق على الجهاز";
 installBtn.onclick=async()=>{if(isInstalled){deviceStatus.textContent="تطبيق DEEB مثبت بالفعل على هذا الجهاز.";return;}if(!deferredInstallPrompt){deviceStatus.textContent="التثبيت متاح من قائمة المتصفح: افتح قائمة Chrome ثم اختر إضافة إلى الشاشة الرئيسية أو تثبيت التطبيق. إذا لم يظهر الخيار، افتح الموقع عبر HTTPS.";return;}try{deferredInstallPrompt.prompt();const choice=await deferredInstallPrompt.userChoice;deviceStatus.textContent=choice.outcome==="accepted"?"تم قبول طلب تثبيت DEEB.":"تم إلغاء طلب التثبيت.";deferredInstallPrompt=null;installBtn.textContent="تم إرسال طلب التثبيت";}catch(e){deviceStatus.textContent="تعذر بدء التثبيت: "+(e.message||e);}};
 $("#storageCheckBtn").onclick=showDeviceStatus;
 $("#storagePersistBtn").onclick=async()=>{if(!navigator.storage?.persist){deviceStatus.textContent="المتصفح لا يدعم طلب حماية التخزين الدائم.";return;}try{const ok=await navigator.storage.persist();deviceStatus.textContent=ok?"وافق المتصفح على حماية التخزين من الإزالة التلقائية.":"لم يمنح المتصفح الحماية الدائمة؛ احتفظ بنسخة احتياطية خارج الجهاز.";await showDeviceStatus();}catch(e){deviceStatus.textContent="تعذر طلب الحماية: "+e.message;}};
 showDeviceStatus();
 const qrText=$("#qrText"),qrCanvas=$("#qrCanvas"),qrOut=$("#qrOutput"),qrDownload=$("#downloadQR"),qrStatus=$("#qrStatus");let qrReady=false;
 $("#makeQR").onclick=()=>{const value=qrText.value.trim();if(!value){qrStatus.textContent="اكتب نصًا أو رابطًا أولًا.";qrOut.classList.remove("hidden");return;}try{if(!window.DebooQRCode)throw Error("مكتبة QR غير محملة.");const qr=new DebooQRCode(0,DebooQRErrorCorrectLevel.M);qr.addData(value);qr.make();const count=qr.getModuleCount(),ctx=qrCanvas.getContext("2d"),quiet=4,scale=Math.floor(320/(count+quiet*2)),size=scale*(count+quiet*2),offset=Math.floor((320-size)/2);ctx.fillStyle="#ffffff";ctx.fillRect(0,0,320,320);ctx.fillStyle="#050c19";for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))ctx.fillRect(offset+(col+quiet)*scale,offset+(row+quiet)*scale,scale,scale);qrOut.classList.remove("hidden");qrDownload.disabled=false;qrReady=true;qrStatus.textContent=`تم إنشاء الرمز بنجاح (${count} × ${count}) — يعمل دون اتصال.`;}catch(e){qrReady=false;qrDownload.disabled=true;qrOut.classList.remove("hidden");qrStatus.textContent="تعذر إنشاء الرمز: "+e.message;}};
 qrDownload.onclick=async()=>{if(!qrReady)return;qrDownload.disabled=true;try{const data=qrCanvas.toDataURL("image/png"),raw=atob(data.split(",")[1]),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);await DebooDB.downloadBlob(new Blob([bytes],{type:"image/png"}),"DEEB-QR.png");qrStatus.textContent="تم حفظ صورة QR في التنزيلات."; }catch(error){qrStatus.textContent="تعذر حفظ صورة QR: "+(error.message||error);}finally{qrDownload.disabled=false;}};
;
 const pinStatus=$("#pinStatus");
 $("#savePin").onclick=async()=>{const a=$("#newPin").value,b=$("#confirmPin").value;if(a!==b){pinStatus.textContent="الرمزان غير متطابقين.";return;}try{await storePin(a);pinStatus.textContent="تم حفظ رمز PIN فقط. التطبيق ما زال يفتح مباشرة؛ فعّل طلب PIN بزر التفعيل إذا أردت.";
 $("#newPin").value=$("#confirmPin").value="";}catch(e){pinStatus.textContent=e.message;}};
 $("#enablePinLock").onclick=()=>{if(!localStorage.getItem("deboo16_pin_v1")){pinStatus.textContent="احفظ رمز PIN أولًا، ثم فعّل القفل.";return;}localStorage.setItem(PIN_LOCK_KEY,"1");pinStatus.textContent="تم تفعيل قفل PIN. سيُطلب الرمز عند فتح التطبيق وبعد انتقاله للخلفية.";};
 $("#disablePinLock").onclick=()=>{localStorage.removeItem(PIN_LOCK_KEY);localStorage.removeItem(BIOMETRIC_KEY);pinStatus.textContent="تم تعطيل طلب PIN. سيظل الرمز محفوظًا ويمكنك تفعيل القفل مرة أخرى وقتما تريد.";setupBiometricLogin();};
 $("#disablePin").onclick=()=>{if(!confirm("هل تريد حذف رمز PIN نهائيًا؟ سيُفتح التطبيق مباشرة."))return;localStorage.removeItem(PIN_LOCK_KEY);localStorage.removeItem("deboo16_pin_v1");localStorage.removeItem("deboo16_pin_attempts");localStorage.removeItem(BIOMETRIC_KEY);pinStatus.textContent="تم إلغاء القفل؛ سيفتح التطبيق مباشرة دون PIN أو بصمة.";};
 const biometricStatus=$("#biometricStatus");
 $("#enableBiometric").onclick=async()=>{
  if(!pinLockEnabled()){biometricStatus.textContent="فعّل قفل PIN أولًا؛ البصمة تعمل كطريقة فتح بديلة عند تفعيل القفل.";return;}
  try{await checkBiometricAvailability();localStorage.setItem(BIOMETRIC_KEY,"1");biometricStatus.textContent="تم تفعيل البصمة. ستظهر بجوار زر فتح PIN عند قفل التطبيق.";setupBiometricLogin();}
  catch(e){localStorage.removeItem(BIOMETRIC_KEY);biometricStatus.textContent=e.message||"تعذر تفعيل البصمة على هذا الجهاز.";setupBiometricLogin();}
 };
 $("#disableBiometric").onclick=()=>{localStorage.removeItem(BIOMETRIC_KEY);biometricStatus.textContent="تم إلغاء فتح التطبيق بالبصمة. "+(pinLockEnabled()?"يمكنك استخدام PIN.":"التطبيق يفتح مباشرة دون PIN.");setupBiometricLogin();};
 pinStatus.textContent=pinLockEnabled()?"قفل PIN مفعّل؛ سيُطلب الرمز عند فتح التطبيق.":(localStorage.getItem("deboo16_pin_v1")?"قفل PIN غير مفعّل؛ التطبيق يفتح مباشرة.":"لا يوجد رمز PIN محفوظ؛ التطبيق يفتح مباشرة.");
 biometricStatus.textContent=localStorage.getItem(BIOMETRIC_KEY)==="1"&&pinLockEnabled()?"البصمة مفعّلة؛ PIN يظل متاحًا كبديل.":"البصمة غير مفعّلة.";
 const status=$("#notificationStatus");
 const checkAlerts=notify=>{const nowDate=new Date(),today=[nowDate.getFullYear(),String(nowDate.getMonth()+1).padStart(2,"0"),String(nowDate.getDate()).padStart(2,"0")].join("-");const late=cache.filter(x=>x.entity_type==="tasks"&&!x.is_archived&&x.payload?.due_date&&x.payload.due_date<today&&x.payload.status!=="مكتملة");const urgent=cache.filter(x=>x.entity_type==="incidents"&&!x.is_archived&&["عاجل","مرتفع"].includes(x.payload?.priority)&&x.payload?.status!=="مغلق");const message=`مهام متأخرة: ${late.length} — بلاغات عاجلة/مرتفعة مفتوحة: ${urgent.length}`;status.textContent=message;if(notify&&"Notification" in window&&Notification.permission==="granted"&&(late.length||urgent.length))new Notification("تنبيهات DEEB",{body:message,icon:"./icon.svg"});};
 $("#enableNotifications").onclick=async()=>{if(!("Notification" in window)){status.textContent="هذا المتصفح لا يدعم إشعارات النظام.";return;}const permission=await Notification.requestPermission();status.textContent=permission==="granted"?"تم السماح بالإشعارات. اضغط فحص الآن لإرسال التنبيه عند وجود عناصر.":"لم يتم منح إذن الإشعارات.";};
 $("#checkNotifications").onclick=()=>checkAlerts(true);checkAlerts(false);
 try{const a=await DebooDB.audit();$("#auditArea").innerHTML=a.map(x=>`<div class="notice">${esc(x.action)} — ${esc(x.reason||"")} <small>${new Date(x.created_at).toLocaleString("ar-EG")}</small></div>`).join("")||"لا توجد أحداث"}catch(e){$("#auditArea").textContent=e.message}
}
function bikePatrolPage(){singleSectionPage("مرور الدراجات","bike_patrols");}
function bikePatrolDeletedPage(){
 area.innerHTML=pageHead("محذوفات مرور الدراجات",'<button class="secondary" type="button" id="backToBikePatrols">العودة لمرور الدراجات</button>')+'<div id="bikeDeletedContent" class="card"><div class="muted">جارٍ تحميل المحذوفات...</div></div>';
 $("#backToBikePatrols").onclick=()=>render("bikepatrol");
 DebooDB.all({deleted:true}).then(items=>{
  const deleted=items.filter(x=>x.entity_type==="bike_patrols").sort((a,b)=>String(b.deleted_at||"").localeCompare(String(a.deleted_at||"")));
  const host=$("#bikeDeletedContent");if(!host)return;
  if(!deleted.length){host.innerHTML='<div class="empty">لا توجد بنود مرور دراجات في المحذوفات.</div>';return;}
  host.innerHTML='<div class="notice">تُحذف البنود نهائيًا تلقائيًا بعد مرور 30 يومًا من تاريخ نقلها إلى المحذوفات.</div><div class="table-wrap"><table><thead><tr><th>الدراجة</th><th>الفرد</th><th>المكان</th><th>تاريخ المرور</th><th>المتبقي</th><th>إجراء</th></tr></thead><tbody>'+deleted.map(row=>{
   const p=row.payload||{},deletedAt=Date.parse(row.deleted_at||row.updated_at||row.created_at),days=Math.max(0,30-Math.floor((Date.now()-deletedAt)/86400000));
   return '<tr><td>'+esc(p.bike||"—")+'</td><td>'+esc(p.person||"—")+'</td><td>'+esc(p.site||"—")+'</td><td>'+esc(p.patrol_date||"—")+'</td><td>'+days+' يوم</td><td><button type="button" class="tiny" data-restore-deleted="'+esc(row.id)+'">استعادة</button></td></tr>';
  }).join("")+'</tbody></table></div>';
  host.querySelectorAll("[data-restore-deleted]").forEach(button=>button.onclick=async()=>{
   if(!confirm("استعادة بند المرور إلى سجل مرور الدراجات؟"))return;
   button.disabled=true;
   try{await DebooDB.restoreDeleted(button.dataset.restoreDeleted);await refresh();bikePatrolDeletedPage();toast("تمت استعادة بند المرور.");}
   catch(error){toast(error.message||"تعذرت استعادة بند المرور.");button.disabled=false;}
  });
 }).catch(error=>{const host=$("#bikeDeletedContent");if(host)host.textContent="تعذر تحميل المحذوفات: "+(error.message||error);});
}
function singleSectionPage(title,type){
 area.innerHTML=`${pageHead(title,type==="bike_patrols"?'<button class="secondary" type="button" id="openBikePatrolDeleted">المحذوفات</button>':"")}<div id="groupContent"></div>`;
 currentEdit=null;currentEmployeeDetailId=null;searchTerm="";
 if(type==="bike_patrols")$("#openBikePatrolDeleted")?.addEventListener("click",()=>render("bikePatrolDeleted"));
 renderEntity(type);
}
function statisticsPage(){
 const count=t=>rows(t).length;
 const openInc=rows("incidents").filter(x=>x.payload?.status!=="مغلق").length;
 const openTasks=rows("tasks").filter(x=>x.payload?.status!=="مكتملة").length;
 const lateTasks=rows("tasks").filter(x=>x.payload?.due_date&&x.payload.due_date<new Date().toLocaleDateString("en-CA")&&x.payload?.status!=="مكتملة").length;
 const today=new Date().toLocaleDateString("en-CA");
 const todayVisits=rows("branch_patrols").filter(x=>String(x.payload?.patrol_date||"").slice(0,10)===today).length;
 const bikeVisits=rows("bike_patrols").filter(x=>String(x.payload?.patrol_date||"").slice(0,10)===today).length;
 area.innerHTML=`${pageHead("الإحصائيات")}
 <div class="card"><h2>ملخص التشغيل</h2>${stats([["الفروع",count("branches")],["متابعات الفروع اليوم",todayVisits],["مرور الدراجات اليوم",bikeVisits],["الموظفون المسجلون",count("employees")],["البلاغات المفتوحة",openInc],["المهام المفتوحة",openTasks],["المهام المتأخرة",lateTasks],["حالات الطوارئ",count("emergencies")]])}</div>
 <div class="card"><h2>السجلات حسب القسم</h2>${stats(Object.entries(labels).filter(([type])=>count(type)>0).map(([type,label])=>[label,count(type)]))}</div>`;
}
async function openArchivePage(){
 await reports();
 const open=$("#showArchive");
 const archivePanel=$("#archivePanel");
 if(!archivePanel)throw new Error("تعذر فتح الأرشيف العام.");
 // اترك مركز التقارير وعناصره في DOM مخفية؛ أدوات عرض وطباعة التقارير تعتمد عليها عند فتح تقرير من الأرشيف.
 archivePanel.classList.remove("hidden");
 const reportHead=area.querySelector(":scope > .page-head");
 if(reportHead)reportHead.classList.add("hidden");
 const reportCard=$("#reportSummary")?.closest(".card");
 if(reportCard)reportCard.classList.add("hidden");
 if(typeof window.DEebOpenArchive!=="function")throw new Error("تعذر تجهيز وظيفة عرض الأرشيف.");
 await window.DEebOpenArchive();
 const heading=archivePanel.querySelector(".page-head h3");
 if(heading)heading.textContent="الأرشيف العام";
 const back=$("#closeArchive");
 if(back){back.textContent="القائمة الرئيسية";back.onclick=()=>render("landing");}
}
async function openBackupPage(){
 area.innerHTML=pageHead("النسخ الاحتياطي والاستعادة", '<button class="secondary" id="backupHome">القائمة الرئيسية</button>')+`
 <div class="card"><h3>نسخة احتياطية خارجية</h3><p class="muted">نزّل ملف JSON يحتوي على بيانات التطبيق ومرفقاته، واحتفظ به خارج الهاتف في مكان آمن.</p><div class="actions"><button class="primary" id="backupBtn">إنشاء وتنزيل نسخة احتياطية</button><label class="secondary">استعادة نسخة JSON من ملف <input id="restoreFile" type="file" accept="application/json" hidden></label></div><p class="muted">الاستعادة تستبدل البيانات الحالية بمحتويات النسخة المختارة. أنشئ نسخة حديثة أولًا.</p></div>
 <div class="card"><h3>النسخ التلقائية على هذا الجهاز</h3><p class="muted">يحاول التطبيق إنشاء نسخة تلقائية يوميًا ويحتفظ بآخر 3 نسخ. النسخ المحلية لا تحمي عند فقد الهاتف أو حذف بيانات التطبيق.</p><div id="autoBackupArea" class="muted">جارٍ تحميل النسخ التلقائية...</div></div>`;
 $("#backupHome").onclick=()=>render("settings");
 $("#backupBtn").onclick=async()=>{const button=$("#backupBtn");button.disabled=true;try{const b=await DebooDB.backup();await DebooDB.downloadBlob(new Blob([JSON.stringify(b,null,2)],{type:"application/json"}),"DEEB-backup-"+new Date().toISOString().slice(0,10)+".json");toast("تم إنشاء النسخة الاحتياطية وحفظها في التنزيلات");}catch(e){toast("تعذر إنشاء النسخة الاحتياطية: "+(e.message||e));}finally{button.disabled=false;}};
 $("#restoreFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(!confirm("سيتم استبدال السجلات الحالية بالنسخة المختارة. هل تريد المتابعة؟"))return;await DebooDB.restore(obj);await refresh();toast("اكتملت الاستعادة");openBackupPage();}catch(err){toast("فشلت الاستعادة: "+err.message)}};
 try{
  const host=$("#autoBackupArea");
  const latest=await DebooDB.createAutoBackup();
  const backups=await DebooDB.automaticBackups();
  const status=latest.reason==="attachments-over-limit"?"تخطى التطبيق النسخة التلقائية اليوم لأن حجم المرفقات تجاوز 30 ميجابايت.":latest.updated?"تم تحديث النسخة التلقائية لهذا اليوم.":latest.created?"تم إنشاء النسخة التلقائية لهذا اليوم.":"لم يتم تأكيد تحديث نسخة جديدة.";
  host.innerHTML='<div class="notice">'+esc(status)+'</div>'+(backups.length?'<b>النسخ المحفوظة:</b>'+backups.map(x=>'<div class="notice">'+esc(x.date)+' — '+x.record_count+' سجل — '+x.attachment_count+' مرفق <button class="tiny" data-auto-restore="'+x.id+'">استعادة هذه النسخة</button></div>').join(""):"لا توجد نسخ تلقائية محفوظة.");
  host.querySelectorAll("[data-auto-restore]").forEach(btn=>btn.onclick=async()=>{if(!confirm("سيتم استبدال بيانات العمل الحالية بهذه النسخة. هل لديك نسخة خارجية حديثة؟"))return;btn.disabled=true;try{await DebooDB.restoreAutoBackup(btn.dataset.autoRestore);await refresh();toast("تمت استعادة النسخة التلقائية.");openBackupPage();}catch(e){toast("تعذرت الاستعادة: "+e.message);}finally{btn.disabled=false;}});
 }catch(e){host.textContent="تعذر تحميل النسخ التلقائية: "+e.message;}
}
function sectionPage(key){const section=sectionMenus[key];if(!section)throw new Error("القسم غير معروف: "+key);area.innerHTML=pageHead(section.title)+"<div class=\"tiles section-tiles\">"+section.items.map(item=>"<button class=\"tile\" type=\"button\" data-subpage=\""+item[0]+"\"><span>›</span><b>"+item[1]+"</b></button>").join("")+"</div>";area.querySelectorAll("[data-subpage]").forEach(button=>button.addEventListener("click",()=>render(button.dataset.subpage)));}
function render(p){
 currentPage=p;currentType=null;
 try{
  if(!area)throw new Error("منطقة عرض الأقسام غير موجودة في الصفحة.");
  document.querySelector(".app-shell")?.classList.toggle("page-open",p!=="landing");
  document.querySelectorAll(".tile").forEach(b=>b.classList.toggle("active",b.dataset.page===(p==="landing"?"home":p)));
  searchTerm=$("#globalSearch")?.value||"";
  if(p==="landing")landing();
  else if(p==="home")home();
  else if(p==="tasksGroup"){render("operations");return;}
  else if(sectionMenus[p])sectionPage(p);
  else if(p==="follow")groupPage(p);
  else if(p==="emergency")emergencyPage();
  else if(p==="map")mapPage();
  else if(p==="bikePatrolDeleted")bikePatrolDeletedPage();
  else if(p==="bikeMaps")bikeMapsPage();
  else if(p==="bikeShiftAssignments")singleSectionPage("توزيع شفت مرور الدراجات","bike_shift_assignments");
  else if(p==="bikeMapReports")bikeMapReportsPage();
  else if(p==="bikepatrol")bikePatrolPage();
  else if(p==="reports")reports().catch(error=>{console.error("DEEB reports load failed:",error);area.innerHTML=pageHead("تعذر تحميل التقارير والسجلات")+'<div class="card notice">'+esc(error?.message||error)+'</div>';});
  else if(p==="employees")singleSectionPage("سجل الموظفين","employees");
  else if(p==="managerRounds")singleSectionPage("مرور المديرين","manager_rounds");
  else if(p==="handovers")singleSectionPage("تسليم واستلام الشفت","handovers");
  else if(p==="data")dataManagementPage();
  else if(p==="attendance")singleSectionPage("سجل الغياب والاستئذان","absences");
  else if(p==="incidents")singleSectionPage("الحوادث والبلاغات","incidents");
  else if(p==="tasks")singleSectionPage("المهام والتكليفات","tasks");
  else if(p==="stats")statisticsPage();
  else if(p==="archive")openArchivePage().catch(error=>{console.error("DEEB archive navigation failed:",error);if(area)area.innerHTML=pageHead("تعذر فتح الأرشيف العام")+'<div class="card"><p class="notice">'+esc(error?.message||String(error))+'</p><button class="primary" type="button" data-back-home>العودة للرئيسية</button></div>';});
  else if(p==="backup")openBackupPage();
  else if(p==="settings")settings();
  else throw new Error("القسم المطلوب غير مربوط بصفحة داخل التطبيق: "+p);
  if(p!=="home"&&!area.innerHTML.trim())throw new Error("القسم لم يُنشئ محتوى للعرض.");
  window.scrollTo({top:area.offsetTop-12,behavior:"smooth"});
 }catch(error){
  console.error("DEEB section navigation failed:",p,error);
  if(area)area.innerHTML=pageHead("تعذر فتح القسم")+ '<div class="card"><h3>حدث خطأ أثناء فتح هذا القسم</h3><p class="notice">'+esc(error?.message||String(error))+'</p><button class="primary" type="button" data-back-home>العودة للرئيسية</button></div>';
 }
}
window.DEebRender=render;
document.addEventListener("click",event=>{const button=event.target.closest("#mainTiles [data-page], .stories [data-page]");if(!button)return;event.preventDefault();render(button.dataset.page);});
document.addEventListener("click",e=>{if(e.target.closest("[data-back-home]"))render("landing")});
bindGlobalSearchSuggestions();$("#globalSearch").addEventListener("input",e=>{const value=e.target.value,caret=e.target.selectionStart;searchTerm=value;if(currentType){renderEntity(currentType);const next=$("#globalSearch");if(next){next.focus();next.setSelectionRange(caret,caret)}}});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;if(currentPage==="settings")settings();});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;toast("تم تثبيت DEEB على الجهاز.");if(currentPage==="settings")settings();});
window.addEventListener("online",()=>{const el=$("#deviceStatus");if(el)el.textContent="عاد الاتصال بالإنترنت.";if(["home","landing"].includes(currentPage)){const city=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(city);}});
window.addEventListener("offline",()=>{const el=$("#deviceStatus");if(el)el.textContent="أنت تعمل دون اتصال؛ البيانات المحلية تظل متاحة.";const desc=$("#weatherDesc"),extra=$("#weatherExtra");if(desc)desc.textContent="لا يوجد اتصال بالإنترنت";if(extra)extra.textContent="سيتم تحديث الطقس تلقائيًا عند عودة الاتصال.";});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&["home","landing"].includes(currentPage)&&navigator.onLine){const city=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(city);}});
// Auto-lock the local interface whenever the app is backgrounded, but only when PIN protection is enabled.
function lockApplication(){if(!pinLockEnabled())return;const root=$("#appRoot"),auth=$("#authPanel");if(root&&!root.classList.contains("hidden")){root.classList.add("hidden");auth?.classList.remove("hidden");$("#authPassword").value="";$("#authMessage").textContent="تم قفل التطبيق تلقائيًا. أدخل رمز PIN للمتابعة.";}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")lockApplication();});
window.addEventListener("pagehide",lockApplication);
dateText();if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));authState().catch(e=>toast(e.message));
})();