(() => {
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const area=$("#contentArea");
const labels={branches:"الفروع",patrol_people:"أفراد الدوريات",emergency_people:"أفراد الطوارئ",bikes:"الدراجات",managers:"مديرو الأقسام",branch_patrols:"متابعة الفروع",bike_patrols:"مرور الدراجات",manager_rounds:"مرور مديري الأقسام",incidents:"البلاغات والحوادث",tasks:"المهام اليومية",handovers:"تسليم واستلام الشفت",absences:"غياب المسؤولين",emergencies:"حالات الطوارئ",documents:"خزنة المستندات",patrol_sites:"المخازن والمعارض ومراكز الخدمة",employees:"سجل الموظفين"};
const fields={
branches:[["name","اسم الفرع","text",1],["code","كود الفرع","text"],["address","العنوان","text"],["manager","المسؤول","text"],["phone","رقم التواصل","tel"],["lat","خط العرض","number"],["lng","خط الطول","number"],["status","الحالة","select","نشط|متوقف"]],
patrol_people:[["name","اسم فرد الدورية","text",1],["employee_no","الرقم الوظيفي","text"],["phone","رقم الهاتف","tel"],["branch","الفرع","text"],["job","الوظيفة","text"],["status","الحالة","select","متاح|إجازة|موقوف"]],
emergency_people:[["name","اسم فرد الطوارئ","text",1],["specialty","التخصص","text"],["phone","رقم الهاتف","tel"],["branch","الفرع","text"],["availability","التوفر","select","متاح|مشغول|إجازة"]],
bikes:[["number","رقم الدراجة","text",1],["code","كود الدراجة","text"],["type","نوع الدراجة","text"],["description","الوصف","text"],["person","الفرد المسؤول","text"],["status","الحالة","select","جاهزة|بالمرور|صيانة|متوقفة"]],
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
employees:[["name","اسم الموظف","text",1],["sap_no","رقم ساب","text"],["phone","رقم الهاتف","tel"],["branch","الفرع","text"],["job","الوظيفة","select","مدير إدارة|مدير قسم|مشرف|مسؤول أمن",1]],
documents:[["title","اسم المستند","text",1],["category","التصنيف","text"],["reference","رقم / مرجع المستند","text"],["notes","ملاحظات","textarea"]]
};
const pageGroups={follow:["branch_patrols","bike_patrols","manager_rounds","incidents","tasks","handovers","absences"],data:["branches","patrol_people","emergency_people","bikes","patrol_sites","managers","employees","documents"],emergency:["emergencies","emergency_people"]};
let cache=[],currentPage="home",currentType=null,currentEdit=null,currentEmployeeDetailId=null,weatherTimer=null,searchTerm="",deferredInstallPrompt=null;
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
 catch(error){console.warn("DEEB share intake:",error);}
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
const BRANCH_ORDER_KEY="deboo16_branch_order_v1";
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
 const names=orderedBranchNames([...branches,...records.map(r=>String(r.payload?.branch||"").trim()).filter(Boolean)]);
 const datesByBranch=new Map();
 names.forEach(name=>datesByBranch.set(name,new Set([today])));
 records.forEach(r=>{const name=String(r.payload?.branch||"").trim(),date=String(r.payload?.patrol_date||today);if(!datesByBranch.has(name))datesByBranch.set(name,new Set([today]));datesByBranch.get(name).add(date);});
 const visible=names.flatMap(name=>[...datesByBranch.get(name)].sort((a,b)=>b.localeCompare(a)).map(date=>({name,date,visits:records.filter(r=>String(r.payload?.branch||"").trim()===name&&String(r.payload?.patrol_date||today)===date).sort((a,b)=>String(a.payload?.patrol_time||"").localeCompare(String(b.payload?.patrol_time||"")))}))).filter(row=>!searchTerm||normalize(row.name).includes(normalize(searchTerm))||row.date.includes(searchTerm));
 if(!visible.length)return '<div class="empty">لا توجد فروع مسجلة. أضف الفروع من إدارة البيانات أولًا.</div>';
 const slotCount=Math.max(5,...visible.map(row=>row.visits.length+1));
 return `<div class="table-wrap"><table class="branch-patrol-grid"><thead><tr><th>الفرع</th><th>تاريخ المرور</th>${Array.from({length:slotCount},(_,i)=>`<th>متابعة ${i+1}</th>`).join("")}<th class="no-print">تعديل آخر السطر</th></tr></thead><tbody>${visible.map(row=>`<tr><td><div class="branch-order-cell"><b>${esc(row.name)}</b><span class="branch-order-actions no-print"><button type="button" class="tiny" data-move-branch="${esc(row.name)}" data-direction="-1" title="لأعلى">↑</button><button type="button" class="tiny" data-move-branch="${esc(row.name)}" data-direction="1" title="لأسفل">↓</button></span></div></td><td>${esc(row.date)}</td>${Array.from({length:slotCount},(_,slot)=>{const visit=row.visits[slot];return `<td>${visit?`<span class="branch-time-cell"><input class="branch-time-edit" type="time" value="${esc(visit.payload?.patrol_time||"")}" data-visit-id="${visit.id}" aria-label="تعديل توقيت المرور"><button type="button" class="tiny" data-edit="${visit.id}" data-type="branch_patrols" title="تعديل بيانات المرور">✎</button></span>`:`<button type="button" class="secondary tiny branch-slot" data-branch-slot="${slot}" data-branch-name="${esc(row.name)}" data-branch-date="${esc(row.date)}">＋ تسجيل</button>`}</td>`;}).join("")}<td class="no-print"><div class="actions">${row.visits.length?row.visits.map((v,i)=>`<button type="button" class="tiny" data-edit="${v.id}" data-type="branch_patrols">تعديل ${i+1}</button>`).join(""):"—"}</div></td></tr>`).join("")}</tbody></table></div>`;
}
function table(type){if(type==="employees"){const employeeQuery=String(searchTerm||"").trim().toLocaleLowerCase("ar");const list=rows(type).filter(r=>!employeeQuery||String(r.payload?.name||"").toLocaleLowerCase("ar").includes(employeeQuery)||String(r.payload?.job||"").toLocaleLowerCase("ar").includes(employeeQuery)||String(r.payload?.sap_no||"").toLocaleLowerCase("ar").includes(employeeQuery));const selected=list.find(r=>r.id===currentEmployeeDetailId)||null;if(selected){const p=selected.payload||{};return `<div class="employee-detail"><div class="page-head"><h3>بيانات الموظف</h3><button class="secondary" type="button" id="employeeListBack">رجوع للقائمة</button></div><div class="employee-profile"><div class="employee-name">${esc(p.name)}</div><div class="employee-meta">${esc(p.job||"—")}</div></div><dl class="employee-fields">${[["رقم ساب",p.sap_no],["رقم الهاتف",p.phone],["الفرع",p.branch],["الوظيفة",p.job]].map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v||"—")}</dd></div>`).join("")}</dl><div class="actions"><button class="primary" type="button" data-employee-edit="${selected.id}">تعديل البيانات</button><button class="secondary" type="button" data-archive="${selected.id}">أرشفة الموظف</button></div></div>`;}if(!list.length)return `<div class="empty">لا يوجد موظفون مسجلون. اضغط «إضافة سجل» لإضافة أول موظف.</div>`;return `<div class="employee-list">${list.map(r=>`<button type="button" class="employee-list-item" data-employee-detail="${r.id}"><span class="employee-list-name">${esc(r.payload?.name||"بدون اسم")}</span><span class="employee-list-job">${esc(r.payload?.job||"")}</span><span class="employee-list-arrow">‹</span></button>`).join("")}</div>`;}if(type==="branch_patrols")return branchPatrolTable();const list=type==="branches"?orderedBranchNames(rows(type).map(r=>r.payload?.name)).map(name=>rows(type).find(r=>String(r.payload?.name||"").trim()===name)).filter(Boolean):rows(type),fs=fields[type]||[];if(!list.length)return `<div class="empty">لا توجد سجلات حتى الآن</div>`;
 const cols=fs.slice(0,5);return `<div class="table-wrap"><table><thead><tr><th>م</th>${cols.map(f=>`<th>${f[1]}</th>`).join("")}<th>التاريخ</th><th class="no-print">إجراء</th></tr></thead><tbody>${list.map((r,i)=>`<tr><td>${i+1}</td>${cols.map(f=>`<td>${f[0]==="location_url"&&(String(r.payload?.[f[0]]||"").startsWith("https://")||String(r.payload?.[f[0]]||"").startsWith("http://"))?`<a target="_blank" rel="noopener" href="${esc(r.payload[f[0]])}">فتح الموقع</a>`:esc(r.payload?.[f[0]])}</td>`).join("")}<td>${new Date(["bike_patrols","branch_patrols"].includes(type)&&r.payload?.patrol_date?r.payload.patrol_date+"T"+(r.payload.patrol_time||"00:00"):r.created_at).toLocaleString("ar-EG")}</td><td class="no-print"><button class="tiny" data-edit="${r.id}" data-type="${type}">تعديل</button> ${type==="branches"?`<button class="tiny" data-move-branch="${esc(r.payload?.name||"")}" data-direction="-1" title="تحريك لأعلى">↑</button><button class="tiny" data-move-branch="${esc(r.payload?.name||"")}" data-direction="1" title="تحريك لأسفل">↓</button>`:""} <button class="tiny" data-archive="${r.id}">أرشفة</button> ${["branches","patrol_sites","bike_patrols","incidents","emergencies"].includes(type)&&Number.isFinite(Number(r.payload?.lat))&&Number.isFinite(Number(r.payload?.lng))&&Number(r.payload.lat)>=-90&&Number(r.payload.lat)<=90&&Number(r.payload.lng)>=-180&&Number(r.payload.lng)<=180?`<a class="tiny map-link" target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${encodeURIComponent(r.payload.lat)}&mlon=${encodeURIComponent(r.payload.lng)}#map=16/${encodeURIComponent(r.payload.lat)}/${encodeURIComponent(r.payload.lng)}">الخريطة</a>`:""}</td></tr>`).join("")}</tbody></table></div>`}
function formHTML(type,r=null){const isEditing=!!r?.id;const fs=fields[type]||[];const gpsButton=["branches","patrol_sites","incidents","emergencies","bike_patrols"].includes(type)?`<div class="field gps-field"><button type="button" class="secondary" id="captureCurrentLocation">📍 تحديد موقعي الحالي</button><small class="muted" id="gpsStatus">احصل على إحداثيات الموقع لإرفاقها بالسجل.</small></div>`:"";return `<div class="card" id="editor"><h3>${isEditing?"تعديل":"إضافة"} ${labels[type]}</h3><form id="recordForm" class="form">${gpsButton}${fs.map(f=>{let val=r?.payload?.[f[0]]??"";if(["bike_patrols","branch_patrols"].includes(type)&&!isEditing&&f[0]==="patrol_date"){const d=new Date();val=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}if(["bike_patrols","branch_patrols"].includes(type)&&!isEditing&&f[0]==="patrol_time"){const d=new Date();val=[String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join(":");}if(type==="bike_patrols"&&isEditing&&r?.payload){const legacy=String(r.payload.patrol_time||"");if(f[0]==="site"&&!val)val=r.payload.branch||"";if(f[0]==="patrol_date"&&!val)val=legacy.slice(0,10);if(f[0]==="patrol_time"&&legacy.includes("T"))val=legacy.slice(11,16);}let input=f[2]==="textarea"?`<textarea name="${f[0]}">${esc(val)}</textarea>`:f[2]==="select"?`<select name="${f[0]}">${f[3].split("|").map(v=>`<option ${v===val?"selected":""}>${v}</option>`).join("")}</select>`:`<input name="${f[0]}" type="${f[2]}" value="${esc(val)}" ${((f[2]==="select" ? f[4] : f[3])===1)?"required":""}>`;return `<div class="field"><label>${f[1]}</label>${input}</div>`}).join("")}${isEditing?`<div class="field"><label>سبب التعديل (مطلوب للتوثيق)</label><input name="edit_reason" required placeholder="اكتب سبب تعديل السجل"></div>`:""}${type==="documents"?`<div class="field"><label>إرفاق ملفات (حتى 15 ميجابايت للملف)</label><input id="documentFiles" type="file" multiple></div><div id="documentAttachments" class="muted">${r?"جارٍ تحميل المرفقات...":"يمكنك إرفاق الملفات بعد الحفظ."}</div>`:""}${type==="handovers"?`<div class="field signature-field"><label>توقيع المستلم (توقيع مرسوم محليًا)</label><canvas id="handoverSignature" width="900" height="240" aria-label="مساحة التوقيع"></canvas><input type="hidden" name="signature_data" value="${esc(r?.payload?.signature_data||"")}"><button type="button" class="secondary" id="clearSignature">مسح التوقيع</button><small class="muted">التوقيع صورة محفوظة ضمن سجل التسليم، وليس توقيعًا إلكترونيًا موثقًا.</small></div>`:""}<div class="actions"><button class="primary" id="saveRecord" type="submit">حفظ السجل</button><button class="secondary" id="cancelEdit" type="button">إلغاء</button></div><p id="saveStatus" class="muted" aria-live="polite"></p></form></div>`}
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
  site:[["patrol_sites","name"],["branches","name"]],
  person:[["patrol_people","name"],["emergency_people","name"],["branches","manager"]],
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
   $('[data-download-attachment]').forEach(b=>b.onclick=async()=>{try{const item=await DebooDB.getAttachment(b.dataset.downloadAttachment);if(!item){toast("المرفق غير موجود");return;}await DebooDB.downloadBlob(item.blob,item.name);toast("تم حفظ المرفق في التنزيلات.");}catch(error){toast("تعذر تنزيل المرفق: "+(error.message||error));}});
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
 $("[data-employee-detail]").forEach(button=>button.addEventListener("click",()=>{currentEmployeeDetailId=button.dataset.employeeDetail;currentEdit=null;renderEntity(type);}));
 $("#employeeListBack")?.addEventListener("click",()=>{currentEmployeeDetailId=null;renderEntity(type);});
 $("[data-employee-edit]").forEach(button=>button.addEventListener("click",()=>{const found=cache.find(x=>x.id===button.dataset.employeeEdit);if(found){currentEmployeeDetailId=found.id;currentEdit=found;renderEntity(type);$("#editor")?.scrollIntoView({behavior:"smooth"});}}));
 $$("[data-move-branch]").forEach(button=>button.addEventListener("click",()=>moveBranchOrder(button.dataset.moveBranch,Number(button.dataset.direction)||0)));
 if(type==="branch_patrols"){
  $$(".branch-time-edit").forEach(input=>input.addEventListener("change",async()=>{
   const visitId=input.dataset.visitId,newTime=input.value;
   if(!newTime){toast("اختار توقيت صحيح.");return;}
   const record=cache.find(item=>item.id===visitId);
   if(!record||record.entity_type!=="branch_patrols"){toast("سجل المرور غير موجود.");return;}
   input.disabled=true;
   try{
    const payload={...record.payload,patrol_time:newTime};
    await DebooDB.save("branch_patrols",payload,visitId);
    await refresh();renderEntity("branch_patrols");toast("تم تعديل توقيت المرور إلى "+newTime);
   }catch(error){input.disabled=false;toast("تعذر تعديل التوقيت: "+error.message);}
  }));
  $$("[data-branch-slot]").forEach(button=>button.addEventListener("click",async()=>{
   if(button.disabled)return;
   const branch=button.dataset.branchName,date=button.dataset.branchDate;
   const d=new Date(),time=[String(d.getHours()).padStart(2,"0"),String(d.getMinutes()).padStart(2,"0")].join(":");
   button.disabled=true;button.textContent="جارٍ الحفظ...";
   try{await DebooDB.save("branch_patrols",{branch,patrol_date:date,patrol_time:time,responsible:"",condition:"",notes:""},null);await refresh();renderEntity("branch_patrols");toast("تم تسجيل المرور الساعة "+time);}
   catch(error){button.disabled=false;button.textContent="＋ تسجيل";toast("تعذر تسجيل المرور: "+error.message);}
  }));
 }
 $("#cancelEdit")?.addEventListener("click",()=>{currentEdit=null;renderEntity(type);});
 $("#recordForm")?.addEventListener("submit",async(event)=>{
  event.preventDefault();
  const form=$("#recordForm"),saveButton=$("#saveRecord"),status=$("#saveStatus");
  if(!form)return;
  if(!form.reportValidity()){toast("راجع الحقول المطلوبة قبل الحفظ.");if(status)status.textContent="راجع الحقول المطلوبة قبل الحفظ.";return;}
  const payload=Object.fromEntries(new FormData(form).entries());
  Object.keys(payload).forEach(key=>{if(typeof payload[key]==="string")payload[key]=payload[key].trim();});
  if(type==="branches"&&!payload.name){if(status)status.textContent="اكتب اسم الفرع أولًا.";toast("اسم الفرع مطلوب.");form.elements.namedItem("name")?.focus();return;}
  const files=[...($("#documentFiles")?.files||[])],editId=currentEdit?.id||null;
  if(saveButton){saveButton.disabled=true;saveButton.textContent="جارٍ الحفظ...";}
  if(status)status.textContent="جارٍ حفظ البيانات على هذا الجهاز...";
  try{
   const saved=await DebooDB.save(type,payload,editId);
   if(type==="documents")for(const file of files)await DebooDB.saveAttachment(saved.id,file);
   const persisted=await DebooDB.getRecord(saved.id);
   if(!persisted||persisted.entity_type!==type)throw new Error("لم يتم تأكيد وجود السجل في قاعدة البيانات بعد الحفظ. أعد المحاولة.");
   currentEdit=null;if(type==="employees")currentEmployeeDetailId=saved.id;
   await refresh();renderEntity(type);toast("تم حفظ السجل والتحقق من وجوده في قاعدة البيانات.");
  }catch(e){
   const message=e?.message||"سبب غير معروف";
   if(status)status.textContent="فشل الحفظ: "+message;
   toast("فشل الحفظ: "+message);
   if(saveButton){saveButton.disabled=false;saveButton.textContent="إعادة محاولة الحفظ";}
  }
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
function groupPage(p){const list=pageGroups[p]||[];area.innerHTML=`${pageHead(p==="follow"?"المتابعة":"البيانات")}<div class="subnav">${list.map((t,i)=>`<button data-type="${t}" class="${i===0?"active":""}">${labels[t]}</button>`).join("")}</div><div id="groupContent"></div>`;$$(".subnav button").forEach(b=>b.onclick=()=>{$$(".subnav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentEdit=null;currentEmployeeDetailId=null;renderEntity(b.dataset.type)});renderEntity(list[0]);}
function dataManagementPage(){
 area.innerHTML=`${pageHead("إدارة البيانات",`<button class="secondary" id="backSettings">العودة للإعدادات</button>`)}<p class="muted">إدارة بيانات الفروع والأفراد والدراجات والمديرين والموظفين والمستندات من مكان واحد.</p><div class="subnav">${pageGroups.data.map((t,i)=>`<button data-type="${t}" class="${i===0?"active":""}">${labels[t]}</button>`).join("")}</div><div id="groupContent"></div>`;
 $("#backSettings").onclick=()=>render("settings");
 $$(".subnav button").forEach(b=>b.onclick=()=>{$$(".subnav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentEdit=null;currentEmployeeDetailId=null;renderEntity(b.dataset.type)});
 renderEntity(pageGroups.data[0]);
}
function emergencyPage(){area.innerHTML=`${pageHead("الطوارئ")}<div class="subnav"><button data-type="emergencies">حالات الطوارئ</button><button data-type="emergency_people">أفراد الطوارئ</button></div><div id="groupContent"></div>`;$$(".subnav button").forEach(b=>b.onclick=()=>{currentEdit=null;renderEntity(b.dataset.type)});renderEntity("emergencies")}
function reports(){
 const data=cache.filter(x=>!x.is_archived);
 const today=new Date().toLocaleDateString("en-CA");
 area.innerHTML=pageHead("مركز التقارير", '<button class="secondary" id="showArchive">الأرشيف</button><button class="primary" id="printReport">طباعة</button><button class="secondary" id="pdfReport">تصدير PDF</button><button class="secondary" id="saveReportImage">حفظ التقرير صورة</button><button class="secondary" id="excelReport">تصدير Excel</button><button class="secondary" id="csvReport">تصدير CSV</button><button class="secondary" id="approveReport">اعتماد نسخة التقرير</button>')+
 '<div class="card"><h3>تقارير نهاية الشفت</h3><p class="muted">اختر أي قسم لإصدار تقرير منفرد، أو اختر التقرير الشامل. يمكنك تحديد يوم أو فترة زمنية.</p><div class="actions"><button class="secondary" data-report-type="bike_patrols">مرور الدراجات</button><button class="secondary" data-report-type="branch_patrols">متابعة الفروع</button><button class="secondary" data-report-type="manager_rounds">مرور المديرين</button><button class="secondary" data-report-type="incidents">البلاغات</button><button class="secondary" data-report-type="tasks">المهام</button><button class="secondary" data-report-type="">التقرير الشامل</button></div><div class="form"><div class="field"><label>من تاريخ</label><input id="fromDate" type="date" value="'+today+'"></div><div class="field"><label>إلى تاريخ</label><input id="toDate" type="date" value="'+today+'"></div><div class="field"><label>نوع التقرير</label><select id="reportType"><option value="">كل الأقسام</option>'+Object.entries(labels).map(([k,v])=>'<option value="'+esc(k)+'">'+esc(v)+'</option>').join("")+'</select></div></div><div id="reportSummary"></div></div><div id="archivePanel" class="card hidden"><div class="page-head"><h3>أرشيف السجلات</h3><button class="secondary" id="closeArchive">العودة للتقارير</button></div><div id="archiveContent">جارٍ تحميل الأرشيف...</div></div>';
 const dayOf=x=>(["bike_patrols","branch_patrols"].includes(x.entity_type)?(x.payload&&x.payload.patrol_date):null)||String(x.created_at||"").slice(0,10);
 const get=()=>{const a=$("#fromDate").value,b=$("#toDate").value,t=$("#reportType").value;return data.filter(x=>(!t||x.entity_type===t)&&(!a||dayOf(x)>=a)&&(!b||dayOf(x)<=b));};
 const detailRows=x=>{const p=x.payload||{},defs=fields[x.entity_type]||[],known=defs.filter(f=>p[f[0]]!==undefined&&p[f[0]]!==null&&p[f[0]]!=="").map(f=>[f[1],String(p[f[0]])]),keys=new Set(defs.map(f=>f[0])),extra=Object.entries(p).filter(([k,v])=>!keys.has(k)&&v!==undefined&&v!==null&&v!=="").map(([k,v])=>[k,String(v)]);return known.concat(extra);};
 const reportKeyLabels={edit_reason:"سبب التعديل",created_at:"تاريخ الإنشاء",updated_at:"آخر تحديث",patrol_time:"وقت المرور",patrol_date:"تاريخ المرور",id:"رقم السجل"};
 const rowsFor=d=>d.map(x=>({section:labels[x.entity_type]||x.entity_type,date:dayOf(x),time:(x.payload&&x.payload.patrol_time)||"",details:detailRows(x).filter(v=>!["id","created_at","updated_at","is_archived","archived_at"].includes(v[0])).map(v=>(reportKeyLabels[v[0]]||v[0])+": "+v[1]).join(" | ")}));
 const bikeGroupsFor=d=>{
  const source=d.filter(x=>x.entity_type==="bike_patrols");
  const groups=new Map();
  source.forEach(x=>{
   const p=x.payload||{},date=dayOf(x),bike=String(p.bike||"غير محدد").trim();
   const key=date+"|"+bike;
   if(!groups.has(key))groups.set(key,{date,bike,visits:[]});
   groups.get(key).visits.push(x);
  });
  return [...groups.values()].map(g=>{
   const bikeRecord=data.concat(cache).find(x=>x.entity_type==="bikes"&&String(x.payload?.number||"").trim()===g.bike);
   const bp=bikeRecord?.payload||{};
   const sites=new Map();
   g.visits.sort((a,b)=>String(a.payload?.patrol_time||"").localeCompare(String(b.payload?.patrol_time||"")));
   g.visits.forEach(v=>{
    const p=v.payload||{},site=String(p.site||p.branch||p.location||"غير محدد").trim();
    if(!sites.has(site))sites.set(site,[]);
    sites.get(site).push(String(p.patrol_time||"—"));
   });
   return {date:g.date,bike:g.bike,person:bp.person||g.visits[0]?.payload?.person||g.visits[0]?.payload?.responsible||"غير مسجل",code:bp.code||"غير مسجل",type:bp.type||bp.description||"غير مسجل",sites:[...sites.entries()].map(([site,times])=>({site,times}))};
  });
 };
 const refreshReport=()=>{
  const d=get(),counts={};d.forEach(x=>counts[x.entity_type]=(counts[x.entity_type]||0)+1);
  if($("#reportType").value==="bike_patrols"){
   const groups=bikeGroupsFor(d),visitCount=d.length;
   $("#reportSummary").innerHTML="<h3>تقرير مرور الدراجات</h3><p>الفترة: "+esc($("#fromDate").value)+" إلى "+esc($("#toDate").value)+" • إجمالي مرات المرور: "+visitCount+" • عدد الدراجات: "+groups.length+"</p>"+groups.map((g,gi)=>"<section class='card bike-report-preview'><h3>بيانات القائم بالمرور والدراجة — "+(gi+1)+"</h3><div class='stats'><div class='stat'><span>اسم القائم بالمرور</span><b>"+esc(g.person)+"</b></div><div class='stat'><span>رقم الدراجة</span><b>"+esc(g.bike)+"</b></div><div class='stat'><span>كود الدراجة</span><b>"+esc(g.code)+"</b></div><div class='stat'><span>نوع الدراجة</span><b>"+esc(g.type)+"</b></div><div class='stat'><span>تاريخ المرور</span><b>"+esc(g.date)+"</b></div></div><div class='table-wrap'><table><thead><tr><th>الفرع / المخزن / مركز الخدمة</th><th>مرور 1</th><th>مرور 2</th><th>مرور 3</th><th>مرور 4</th><th>مرور 5</th></tr></thead><tbody>"+g.sites.map(r=>"<tr><td>"+esc(r.site)+"</td>"+Array.from({length:5},(_,i)=>"<td>"+esc(r.times[i]||"—")+"</td>").join("")+"</tr>"+(r.times.length>5?"<tr><td>"+esc(r.site)+" — استكمال</td>"+Array.from({length:5},(_,i)=>"<td>"+esc(r.times[i+5]||"—")+"</td>").join("")+"</tr>":"")).join("")+"</tbody></table></div></section>").join("")||"<div class='empty'>لا توجد سجلات مرور دراجات في الفترة المحددة</div>";
   return;
  }
  const rows=rowsFor(d);
  $("#reportSummary").innerHTML="<h3>تقرير "+esc($("#reportType").selectedOptions[0].textContent)+"</h3><p>الفترة: "+esc($("#fromDate").value)+" إلى "+esc($("#toDate").value)+" • عدد السجلات: "+d.length+" • تاريخ الإصدار: "+new Date().toLocaleString("ar-EG")+"</p><div class='stats'>"+Object.entries(counts).map(([k,v])=>"<div class='stat'><b>"+v+"</b><span>"+esc(labels[k]||k)+"</span></div>").join("")+"</div><div class='table-wrap'><table><thead><tr><th>القسم</th><th>التاريخ</th><th>الوقت</th><th>تفاصيل السجل</th></tr></thead><tbody>"+rows.map(x=>"<tr><td>"+esc(x.section)+"</td><td>"+esc(x.date)+"</td><td>"+esc(x.time)+"</td><td>"+esc(x.details)+"</td></tr>").join("")+"</tbody></table></div><p class='muted'>المُعد: DEEB • التوقيع: __________________</p>";
 };
 ["fromDate","toDate","reportType"].forEach(id=>$("#"+id).onchange=refreshReport);
 document.querySelectorAll("[data-report-type]").forEach(btn=>btn.onclick=()=>{$("#reportType").value=btn.dataset.reportType;refreshReport();});
 refreshReport();
 const rowsForExport=d=>{
  if($("#reportType").value==="bike_patrols"){
   const out=[["التاريخ","اسم القائم بالمرور","رقم الدراجة","كود الدراجة","نوع الدراجة","الفرع / المخزن / مركز الخدمة","مرور 1","مرور 2","مرور 3","مرور 4","مرور 5"]];
   bikeGroupsFor(d).forEach(g=>g.sites.forEach(r=>{
    out.push([g.date,g.person,g.bike,g.code,g.type,r.site,...Array.from({length:5},(_,i)=>r.times[i]||"")]);
    for(let offset=5;offset<r.times.length;offset+=5)out.push([g.date,g.person,g.bike,g.code,g.type,r.site+" — استكمال",...Array.from({length:5},(_,i)=>r.times[offset+i]||"")]);
   }));
   return out;
  }
  return [["القسم","التاريخ","الوقت","تفاصيل السجل"],...rowsFor(d).map(x=>[x.section,x.date,x.time,x.details])];
 };
 const saveFile=async(name,mime,content)=>{try{const native=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.FileExport;if(native&&native.saveFile){const bytes=new TextEncoder().encode(content);let binary="";for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);await native.saveFile({name:name,mimeType:mime,base64:btoa(binary)});toast("تم حفظ الملف داخل Downloads/DEEB");}else{DebooDB.downloadBlob(new Blob([content],{type:mime}),name);toast("تم تجهيز الملف للتنزيل");}}catch(e){toast("تعذر حفظ الملف: "+(e.message||e));}};
 const printHtml=d=>{
  if($("#reportType").value==="bike_patrols"){
   const groups=bikeGroupsFor(d),title="تقرير مرور الدراجات",period=$("#fromDate").value+" — "+$("#toDate").value;
   const sections=groups.map((g,gi)=>'<section class="bike-sheet-section"><h2 class="bike-section-title">بيانات القائم بالمرور والدراجة</h2><div class="bike-meta"><div><span>اسم القائم بالمرور</span><b>'+esc(g.person)+'</b></div><div><span>رقم الدراجة</span><b>'+esc(g.bike)+'</b></div><div><span>كود الدراجة</span><b>'+esc(g.code)+'</b></div><div><span>نوع الدراجة</span><b>'+esc(g.type)+'</b></div><div><span>تاريخ المرور</span><b>'+esc(g.date)+'</b></div></div><h2 class="bike-section-title">الأماكن التي تم المرور عليها</h2><table class="bike-table"><thead><tr><th>الفرع / المخزن / مركز الخدمة</th><th>مرور 1</th><th>مرور 2</th><th>مرور 3</th><th>مرور 4</th><th>مرور 5</th></tr></thead><tbody>'+g.sites.map(r=>'<tr><td>'+esc(r.site)+'</td>'+Array.from({length:5},(_,i)=>'<td>'+esc(r.times[i]||'—')+'</td>').join('')+'</tr>'+(r.times.length>5?'<tr><td>'+esc(r.site)+' — استكمال</td>'+Array.from({length:5},(_,i)=>'<td>'+esc(r.times[i+5]||'—')+'</td>').join('')+'</tr>':'')).join('')+'</tbody></table></section>').join('');
   return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEEB | '+title+'</title><style>*{box-sizing:border-box}html,body{margin:0;background:#eef1f5;color:#172438;font-family:Tahoma,Arial,sans-serif;font-size:13px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{max-width:980px;margin:22px auto;padding:28px;background:#fff;border:1px solid #dce2ea;box-shadow:0 4px 22px #17243818}.brand{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #b99753;padding-bottom:12px;margin-bottom:16px}.brand-name{font-size:27px;font-weight:900;color:#14253d}.brand-tag{font-size:11px;color:#69778a}h1{text-align:center;font-size:22px;margin:10px 0 4px;color:#172b49}.period{text-align:center;color:#68778a;margin:0 0 18px;font-size:12px}.bike-sheet-section{margin:0 0 22px;break-inside:avoid;page-break-inside:avoid}.bike-section-title{font-size:15px;color:#172b49;border-right:4px solid #b99753;padding:5px 9px;margin:15px 0 10px;background:#f5f7fa}.bike-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:14px}.bike-meta>div{border:1px solid #dce2ea;border-radius:6px;padding:8px 10px;background:#f8f9fb;min-height:52px}.bike-meta span{display:block;font-size:10px;color:#68778a}.bike-meta b{display:block;margin-top:3px;font-size:13px;color:#172b49;overflow-wrap:anywhere}.bike-table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px}.bike-table th{background:#172b49;color:#fff;font-weight:700;padding:10px 6px;border:1px solid #172b49}.bike-table td{padding:10px 6px;border:1px solid #cfd7e2;text-align:center;overflow-wrap:anywhere}.bike-table td:first-child{text-align:right;font-weight:700;width:30%;background:#f5f7fa}.bike-table tbody tr:nth-child(even){background:#fafbfd}.report-foot{display:flex;justify-content:space-between;border-top:1px solid #dce2ea;padding-top:12px;margin-top:20px;color:#68778a;font-size:11px}@page{size:A4 landscape;margin:12mm}@media print{html,body{background:#fff}.sheet{max-width:none;margin:0;padding:0;border:0;box-shadow:none}.bike-table thead{display:table-header-group}.bike-table tr{break-inside:avoid;page-break-inside:avoid}.bike-sheet-section{break-inside:auto;page-break-inside:auto}}@media screen and (max-width:640px){.sheet{margin:0;padding:14px}.bike-meta{grid-template-columns:repeat(2,minmax(0,1fr))}.bike-table{font-size:10px}.bike-table th,.bike-table td{padding:6px 3px}}</style></head><body><main class="sheet"><div class="brand"><div><div class="brand-name">DEEB</div><div class="brand-tag">نظام متابعة التشغيل والدوريات</div></div><div class="brand-tag">تقرير رسمي</div><h1>'+title+'</h1><p class="period">الفترة: '+esc(period)+' • إجمالي مرات المرور: '+d.length+'</p>'+(sections||'<p>لا توجد سجلات في الفترة المحددة</p>')+'<div class="report-foot"><span>تم إنشاء التقرير بواسطة DEEB</span><span>اعتماد المسؤول: __________________</span></div></main></body></html>';
  }
  const rows=rowsFor(d),counts={};
  rows.forEach(x=>counts[x.section]=(counts[x.section]||0)+1);
  const reportTitle=$("#reportType").selectedOptions[0].textContent;
  const period=$("#fromDate").value+" — "+$("#toDate").value;
  const cards=rows.map((x,i)=>'<article class="record"><header class="record-head"><span class="record-no">سجل '+(i+1)+'</span><strong>'+esc(x.section)+'</strong><span class="record-date">'+esc(x.date||"—")+(x.time?' • '+esc(x.time):'')+'</span></header><div class="record-details">'+(x.details?x.details.split(" | ").map(part=>{const p=part.indexOf(": ");return '<div class="detail"><span>'+esc(p>=0?part.slice(0,p):"التفاصيل")+'</span><b>'+esc(p>=0?part.slice(p+2):part)+'</b></div>';}).join(""):'<div class="empty">لا توجد تفاصيل إضافية لهذا السجل</div>')+'</div></article>').join("");
  const summary=Object.entries(counts).map(([k,v])=>'<div class="metric"><b>'+v+'</b><span>'+esc(k)+'</span></div>').join("");
  return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEEB | '+esc(reportTitle)+'</title><style>*{box-sizing:border-box}html,body{margin:0;background:#eef1f5;color:#172438;font-family:Tahoma,Arial,sans-serif;font-size:14px;line-height:1.65;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{max-width:900px;margin:24px auto;padding:28px;background:#fff;border:1px solid #dce2ea;box-shadow:0 4px 22px #17243818}.brand{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #b99753;padding-bottom:14px;margin-bottom:20px}.brand-name{font-size:28px;font-weight:900;letter-spacing:1px;color:#14253d}.brand-tag{font-size:12px;color:#69778a}h1{font-size:23px;margin:0 0 6px;color:#172b49}.subtitle{margin:0;color:#68778a;font-size:13px}.overview{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}.overview-item{flex:1;min-width:150px;background:#f4f6f9;border:1px solid #e0e5ec;border-right:4px solid #b99753;border-radius:8px;padding:10px 13px}.overview-item span{display:block;color:#6a7788;font-size:11px}.overview-item b{display:block;font-size:14px;margin-top:3px;color:#172b49}.metrics{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 20px}.metric{display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:20px;background:#eef2f7;border:1px solid #dce3ed;font-size:12px}.metric b{color:#9b7734;font-size:16px}.section-title{font-size:16px;color:#172b49;border-bottom:1px solid #dce2ea;padding-bottom:8px;margin:22px 0 12px}.record{border:1px solid #d9e0e9;border-radius:9px;margin:0 0 12px;overflow:hidden;break-inside:avoid;page-break-inside:avoid}.record-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#f1f4f8;padding:9px 12px;border-bottom:1px solid #d9e0e9}.record-head strong{color:#172b49;font-size:14px}.record-no{background:#172b49;color:#fff;border-radius:4px;padding:2px 7px;font-size:10px}.record-date{margin-right:auto;color:#64748b;font-size:11px}.record-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 16px;padding:7px 12px}.detail{display:flex;gap:8px;align-items:flex-start;padding:7px 0;border-bottom:1px dashed #e4e8ee;min-width:0}.detail span{color:#68778a;min-width:100px;font-size:11px}.detail b{font-weight:700;color:#24364e;overflow-wrap:anywhere}.footer{margin-top:28px;padding-top:14px;border-top:1px solid #dce2ea;display:flex;justify-content:space-between;gap:20px;color:#6b7788;font-size:11px}.signature{min-width:190px;text-align:center;color:#26364d}.empty{padding:12px;color:#7b8796}@page{size:A4;margin:13mm}@media print{html,body{background:#fff}.sheet{max-width:none;margin:0;padding:0;border:0;box-shadow:none}.record{break-inside:avoid;page-break-inside:avoid}.overview-item,.record-head,.metric{print-color-adjust:exact;-webkit-print-color-adjust:exact}}@media screen and (max-width:600px){.sheet{margin:0;padding:16px}.record-details{grid-template-columns:1fr}.detail span{min-width:88px}}</style></head><body><main class="sheet"><div class="brand"><div><div class="brand-name">DEEB</div><div class="brand-tag">نظام متابعة التشغيل والدوريات</div></div><div class="brand-tag">تقرير رسمي</div><h1>تقرير '+esc(reportTitle)+'</h1><p class="subtitle">ملخص السجلات خلال الفترة المحددة</p><div class="overview"><div class="overview-item"><span>الفترة</span><b>'+esc(period)+'</b></div><div class="overview-item"><span>إجمالي السجلات</span><b>'+rows.length+'</b></div><div class="overview-item"><span>تاريخ ووقت الإصدار</span><b>'+esc(new Date().toLocaleString("ar-EG"))+'</b></div></div><div class="metrics">'+summary+'</div><h2 class="section-title">تفاصيل السجلات</h2>'+(cards||'<div class="empty">لا توجد سجلات في الفترة المحددة</div>')+'<div class="footer"><span>تم إنشاء هذا التقرير بواسطة DEEB</span><span class="signature">اعتماد المسؤول: __________________</span></div></main></body></html>';
}
 $("#saveReportImage").onclick=async()=>{const d=get();if(!d.length){toast("لا توجد سجلات في الفترة المحددة");return;}const native=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.FileExport;if(!native||!native.saveHtmlAsImages){toast("حفظ التقرير في معرض الصور متاح من تطبيق DEEB على أندرويد");return;}const button=$("#saveReportImage");button.disabled=true;button.textContent="جارٍ تجهيز الصورة...";try{const result=await native.saveHtmlAsImages({html:printHtml(d),name:"DEEB-report"});toast("تم حفظ "+(result.count||1)+" صورة في معرض الصور داخل Pictures/DEEB");}catch(e){toast("تعذر حفظ صورة التقرير: "+(e.message||e));}finally{button.disabled=false;button.textContent="حفظ التقرير صورة";}};
 $("#pdfReport").onclick=()=>{toast("من شاشة الطباعة اختر حفظ كملف PDF لتصدير التقرير.");$("#printReport").click();};
 $("#printReport").onclick=async()=>{const d=get();if(!d.length){toast("لا توجد سجلات في الفترة المحددة");return;}const html=printHtml(d);try{const native=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.FileExport;if(native&&native.printHtml){await native.printHtml({html:html});}else{const w=window.open("","_blank");if(!w){toast("تعذر فتح نافذة الطباعة؛ اسمح بالنوافذ المنبثقة");return;}w.document.open();w.document.write(html);w.document.close();w.focus();setTimeout(()=>w.print(),500);}}catch(e){toast("تعذرت الطباعة: "+(e.message||e));}};
 $("#excelReport").onclick=()=>{const d=get();if(!d.length){toast("لا توجد سجلات للتصدير");return;}const xe=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\x27/g,"&apos;");const xmlRows=rowsForExport(d).map(row=>"<Row>"+row.map(cell=>"<Cell><Data ss:Type=\"String\">"+xe(cell)+"</Data></Cell>").join("")+"</Row>").join("");const xml='<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="DEEB"><Table>'+xmlRows+'</Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><DisplayRightToLeft/></WorksheetOptions></Worksheet></Workbook>';saveFile("DEEB-report.xls","application/vnd.ms-excel;charset=utf-8","\ufeff"+xml);};
 $("#csvReport").onclick=()=>{const d=get();if(!d.length){toast("لا توجد سجلات للتصدير");return;}const q=v=>"\""+String(v??"").replace(/"/g,'""')+"\"";const csv=rowsForExport(d).map(row=>row.map(q).join(",")).join("\r\n");saveFile("DEEB-report.csv","text/csv;charset=utf-8","\ufeff"+csv);};
 $("#approveReport").onclick=async()=>{try{const d=get();if(!d.length){toast("لا توجد سجلات لاعتمادها");return;}await DebooDB.approve({title:"تقرير معتمد",created_at:new Date().toISOString(),data:d});toast("تم حفظ نسخة التقرير المعتمدة محليًا");}catch(e){toast("تعذر اعتماد التقرير: "+e.message);}};
 const showArchive=async()=>{$("#archivePanel").classList.remove("hidden");$("#reportSummary").parentElement.classList.add("hidden");const archived=await DebooDB.all({archived:true}),host=$("#archiveContent");host.innerHTML=archived.length?'<div class="table-wrap"><table><thead><tr><th>القسم</th><th>التاريخ</th><th>التفاصيل</th><th>إجراء</th></tr></thead><tbody>'+archived.map(x=>'<tr><td>'+esc(labels[x.entity_type]||x.entity_type)+'</td><td>'+esc(dayOf(x))+'</td><td>'+esc(detailRows(x).map(v=>v.join(": ")).join(" | "))+'</td><td><button class="tiny" data-restore-record="'+x.id+'">استعادة</button></td></tr>').join("")+'</tbody></table></div>':"<div class=\"empty\">الأرشيف فارغ حاليًا.</div>";host.querySelectorAll("[data-restore-record]").forEach(btn=>btn.onclick=async()=>{if(!confirm("استعادة السجل إلى قائمة العمل؟"))return;try{await DebooDB.unarchive(btn.dataset.restoreRecord);await refresh();toast("تمت استعادة السجل");await showArchive();}catch(e){toast("تعذرت الاستعادة: "+e.message);}});};
 $("#showArchive").onclick=showArchive;$("#closeArchive").onclick=()=>{$("#archivePanel").classList.add("hidden");$("#reportSummary").parentElement.classList.remove("hidden");};
}
function reportHTML(d){const by={};d.forEach(x=>by[x.entity_type]=(by[x.entity_type]||0)+1);return `<h3>تقرير DEEB</h3><p class="muted">تاريخ الإنشاء: ${new Date().toLocaleString("ar-EG")} • عدد السجلات: ${d.length}</p>${stats(Object.entries(by).map(([k,v])=>[labels[k]||k,v]))}<div class="table-wrap"><table><thead><tr><th>القسم</th><th>التاريخ</th><th>ملخص</th></tr></thead><tbody>${d.map(x=>`<tr><td>${labels[x.entity_type]||x.entity_type}</td><td>${new Date(x.created_at).toLocaleString("ar-EG")}</td><td>${esc(Object.values(x.payload||{}).filter(Boolean).slice(0,4).join(" • "))}</td></tr>`).join("")}</tbody></table></div><p class="muted">المُعد: المستخدم المسجل حاليًا • الاعتماد والتوقيع: __________________</p>`}
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
 $("#backupBtn").onclick=async()=>{const button=$("#backupBtn");button.disabled=true;try{const b=await DebooDB.backup();await DebooDB.downloadBlob(new Blob([JSON.stringify(b,null,2)],{type:"application/json"}),"DEEB-backup-"+new Date().toISOString().slice(0,10)+".json");toast("تم إنشاء النسخة الاحتياطية وحفظها في التنزيلات");}catch(e){toast("تعذر إنشاء النسخة الاحتياطية: "+(e.message||e));}finally{button.disabled=false;}};
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
 const checkAlerts=notify=>{const nowDate=new Date(),today=[nowDate.getFullYear(),String(nowDate.getMonth()+1).padStart(2,"0"),String(nowDate.getDate()).padStart(2,"0")].join("-");const late=cache.filter(x=>x.entity_type==="tasks"&&!x.is_archived&&x.payload?.due_date&&x.payload.due_date<today&&x.payload.status!=="مكتملة");const urgent=cache.filter(x=>x.entity_type==="incidents"&&!x.is_archived&&["عاجل","مرتفع"].includes(x.payload?.priority)&&x.payload?.status!=="مغلق");const message=`مهام متأخرة: ${late.length} — بلاغات عاجلة/مرتفعة مفتوحة: ${urgent.length}`;status.textContent=message;if(notify&&"Notification" in window&&Notification.permission==="granted"&&(late.length||urgent.length))new Notification("تنبيهات DEEB",{body:message,icon:"./icon.svg"});};
 $("#enableNotifications").onclick=async()=>{if(!("Notification" in window)){status.textContent="هذا المتصفح لا يدعم إشعارات النظام.";return;}const permission=await Notification.requestPermission();status.textContent=permission==="granted"?"تم السماح بالإشعارات. اضغط فحص الآن لإرسال التنبيه عند وجود عناصر.":"لم يتم منح إذن الإشعارات.";};
 $("#checkNotifications").onclick=()=>checkAlerts(true);checkAlerts(false);
 try{const a=await DebooDB.audit();$("#auditArea").innerHTML=a.map(x=>`<div class="notice">${esc(x.action)} — ${esc(x.reason||"")} <small>${new Date(x.created_at).toLocaleString("ar-EG")}</small></div>`).join("")||"لا توجد أحداث"}catch(e){$("#auditArea").textContent=e.message}
}
function render(p){currentPage=p;document.querySelector(".app-shell")?.classList.toggle("page-open",p!=="home");$$(".tile").forEach(b=>b.classList.toggle("active",b.dataset.page===p));searchTerm=$("#globalSearch").value||"";if(p==="home")home();else if(p==="follow")groupPage(p);else if(p==="emergency")emergencyPage();else if(p==="reports")reports();else if(p==="settings")settings();window.scrollTo({top:$("#contentArea").offsetTop-12,behavior:"smooth"})}
$$("[data-page]").forEach(b=>b.onclick=()=>render(b.dataset.page));
document.addEventListener("click",e=>{if(e.target.closest("[data-back-home]"))render("home")});
$("#globalSearch").addEventListener("input",e=>{const value=e.target.value,caret=e.target.selectionStart;searchTerm=value;if(currentType){renderEntity(currentType);const next=$("#globalSearch");if(next){next.focus();next.setSelectionRange(caret,caret)}}});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;if(currentPage==="settings")settings();});
window.addEventListener("appinstalled",()=>{deferredInstallPrompt=null;toast("تم تثبيت DEEB على الجهاز.");if(currentPage==="settings")settings();});
window.addEventListener("online",()=>{const el=$("#deviceStatus");if(el)el.textContent="عاد الاتصال بالإنترنت.";if(currentPage==="home"){const city=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(city);}});
window.addEventListener("offline",()=>{const el=$("#deviceStatus");if(el)el.textContent="أنت تعمل دون اتصال؛ البيانات المحلية تظل متاحة.";const desc=$("#weatherDesc"),extra=$("#weatherExtra");if(desc)desc.textContent="لا يوجد اتصال بالإنترنت";if(extra)extra.textContent="سيتم تحديث الطقس تلقائيًا عند عودة الاتصال.";});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&currentPage==="home"&&navigator.onLine){const city=$("#weatherCity")?.value||localStorage.getItem("deboo_weather_city")||"Cairo";weather(city);}});
// Auto-lock the local interface whenever the app is backgrounded, but only when PIN protection is enabled.
function lockApplication(){if(!localStorage.getItem("deboo16_pin_v1"))return;const root=$("#appRoot"),auth=$("#authPanel");if(root&&!root.classList.contains("hidden")){root.classList.add("hidden");auth?.classList.remove("hidden");$("#authPassword").value="";$("#authMessage").textContent="تم قفل التطبيق تلقائيًا. أدخل رمز PIN للمتابعة.";}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")lockApplication();});
window.addEventListener("pagehide",lockApplication);
dateText();if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));authState().catch(e=>toast(e.message));
})();
