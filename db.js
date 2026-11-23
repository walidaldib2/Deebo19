/* DEBOO16 Local Edition — IndexedDB storage; no Supabase required. */
window.DebooDB = (() => {
  "use strict";
  const DB_NAME = "DEBOO16_LOCAL_DB";
  const DB_VERSION = 3;
  let dbPromise;
  const now = () => new Date().toISOString();
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "d16-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  function openDB() {
    if (!("indexedDB" in window)) return Promise.reject(new Error("هذا المتصفح لا يدعم التخزين المحلي المطلوب."));
    if (!dbPromise) dbPromise = new Promise((resolve,reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains("records")) {
          const s = d.createObjectStore("records", {keyPath:"id"});
          s.createIndex("entity_type","entity_type",{unique:false});
          s.createIndex("created_at","created_at",{unique:false});
        }
        if (!d.objectStoreNames.contains("audit_logs")) d.createObjectStore("audit_logs",{keyPath:"id"});
        if (!d.objectStoreNames.contains("approved_reports")) d.createObjectStore("approved_reports",{keyPath:"id"});
        if (!d.objectStoreNames.contains("handover_versions")) {
          const v=d.createObjectStore("handover_versions",{keyPath:"id"});
          v.createIndex("record_id","record_id",{unique:false});
          v.createIndex("created_at","created_at",{unique:false});
        }
        if (!d.objectStoreNames.contains("attachments")) {
          const a=d.createObjectStore("attachments",{keyPath:"id"});
          a.createIndex("record_id","record_id",{unique:false});
        }
        if (!d.objectStoreNames.contains("automatic_backups")) d.createObjectStore("automatic_backups",{keyPath:"id"});
      };
      req.onsuccess = () => {
        const connection=req.result;
        connection.onversionchange=()=>{connection.close();dbPromise=null;};
        connection.onclose=()=>{dbPromise=null;};
        resolve(connection);
      };
      req.onerror = () => {
        const error=req.error || new Error("تعذر فتح قاعدة البيانات المحلية.");
        dbPromise=null;
        reject(error);
      };
      req.onblocked = () => console.warn("DEEB IndexedDB upgrade is waiting for another open app window to close.");
    });
    return dbPromise;
  }
  async function txStore(name,mode,work) {
    const d=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=d.transaction(name,mode), store=tx.objectStore(name);
      let result;
      try { result=work(store,tx); } catch(e) { try{tx.abort()}catch{} reject(e); return; }
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(tx.error || new Error("فشلت عملية التخزين."));
      tx.onabort=()=>reject(tx.error || new Error("تم إلغاء عملية التخزين."));
    });
  }
  async function getAll(name) {
    const d=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=d.transaction(name,"readonly"),req=tx.objectStore(name).getAll();
      req.onsuccess=()=>resolve(req.result||[]);
      req.onerror=()=>reject(req.error);
    });
  }
  async function get(name,id) {
    const d=await openDB();
    return new Promise((resolve,reject)=>{
      const req=d.transaction(name,"readonly").objectStore(name).get(id);
      req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
    });
  }
  async function addAudit(action,recordId,oldData,newData,reason) {
    const item={id:uid(),action,record_id:recordId||null,old_data:oldData||null,new_data:newData||null,reason:reason||"",created_at:now(),actor:"مستخدم الجهاز"};
    await txStore("audit_logs","readwrite",s=>s.put(item));
  }
  function init(){ return {auth:{signOut:async()=>({error:null}),getUser:async()=>({data:{user:{email:"مستخدم محلي"}}})}}; }
  const configured=()=>true;
  async function all(opts={}) {
    let data=await getAll("records");
    data=data.filter(x=>!!x.is_archived===!!opts.archived);
    data.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
    return Number.isFinite(opts.limit)&&opts.limit>=0?data.slice(0,opts.limit):data;
  }
  function localDateISO(date=new Date()) { return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-"); }
  function isValidISODate(value) {
    const day=String(value||"");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
    const parsed=new Date(day+"T00:00:00.000Z");
    return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===day;
  }
  const WORK_DATE_FIELDS=["work_date","patrol_date","incident_date","report_date","absence_date","handover_date","emergency_date","task_date"];
  function recordWorkDate(row) {
    const p=row.payload||{};
    const value=WORK_DATE_FIELDS.map(key=>p[key]).find(v=>String(v||"").trim());
    if(isValidISODate(value))return String(value);
    const created=String(row.created_at||"").slice(0,10);
    return isValidISODate(created)?created:"";
  }
  function shiftIdentity(payload={}) {
    const shift=String(payload.shift||payload.shift_name||"").trim();
    const date=String(payload.work_date||payload.patrol_date||payload.incident_date||payload.report_date||payload.absence_date||payload.handover_date||payload.emergency_date||payload.task_date||"").trim();
    return shift&&/^\d{4}-\d{2}-\d{2}$/.test(date)?{shift_name:shift,shift_key:date+"|"+shift}:{};
  }
  async function archivePastDays(today=localDateISO()) {
    if(!isValidISODate(today))throw new Error("تاريخ الأرشفة غير صحيح.");
    const shiftTypes=new Set(["daily_rosters","branch_patrols","bike_patrols","manager_rounds","incidents","written_reports","absences","handovers","emergencies","tasks"]);
    const rows=await getAll("records");
    const candidates=rows.filter(row=>{
      if(row.is_archived||!shiftTypes.has(row.entity_type))return false;
      const date=recordWorkDate(row);
      return /^\d{4}-\d{2}-\d{2}$/.test(date)&&date<today;
    });
    if(!candidates.length)return {archived:0,today};
    const d=await openDB(),stamp=now();
    await new Promise((resolve,reject)=>{
      const tx=d.transaction(["records","audit_logs"],"readwrite"),records=tx.objectStore("records"),logs=tx.objectStore("audit_logs");
      candidates.forEach(old=>{
        const row={...old,is_archived:true,archived_at:stamp,updated_at:stamp};
        records.put(row);
        logs.put(makeAudit("archive",old.id,old,row,"أرشفة تلقائية لانتهاء يوم الشفت"));
      });
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||new Error("تعذرت الأرشفة التلقائية."));
      tx.onabort=()=>reject(tx.error||new Error("تم إلغاء الأرشفة التلقائية."));
    });
    try{await createAutoBackup();}catch(error){console.warn("DEEB archive backup:",error);}
    return {archived:candidates.length,today};
  }
  async function list(type,opts={}) {
    const data=await all({archived:opts.archived,limit:opts.limit});
    return data.filter(x=>x.entity_type===type&&(!opts.branch_id||x.branch_id===opts.branch_id)&&(!opts.status||x.status===opts.status));
  }
  function makeAudit(action,recordId,oldData,newData,reason) {
    return {id:uid(),action,record_id:recordId||null,old_data:oldData||null,new_data:newData||null,reason:reason||"",created_at:now(),actor:"مستخدم الجهاز"};
  }
  async function save(type,payload,id=null) {
    if(!type||!payload||typeof payload!=="object"||Array.isArray(payload)) throw new Error("بيانات السجل غير صالحة.");
    const old=id?await get("records",id):null;
    if(id&&!old) throw new Error("السجل المطلوب تعديله غير موجود.");
    const savedPayload={...payload};
    const operationalTypes=new Set(["daily_rosters","branch_patrols","bike_patrols","manager_rounds","incidents","written_reports","absences","handovers","emergencies","tasks"]);
    if(operationalTypes.has(type)){
      for(const key of WORK_DATE_FIELDS){
        const value=String(savedPayload[key]??"").trim();
        if(value&&!isValidISODate(value))throw new Error("التاريخ المدخل غير صحيح؛ راجع اليوم والشهر والسنة.");
      }
      const workDate=recordWorkDate({entity_type:type,payload:savedPayload,created_at:old?.created_at||now()});
      if(workDate)savedPayload.work_date=workDate;
      const shiftMeta=shiftIdentity(savedPayload);
      if(shiftMeta.shift_key){savedPayload.shift_name=shiftMeta.shift_name;savedPayload.shift_key=shiftMeta.shift_key;}
    }
    const row={id:id||uid(),entity_type:type,payload:savedPayload,branch_id:payload.branch_id||null,status:payload.status||"active",is_archived:!!old?.is_archived,...(old?.archived_at?{archived_at:old.archived_at}:{}),created_at:old?.created_at||now(),updated_at:now(),created_by:old?.created_by||"local"};
    const auditItem=makeAudit(id?"update":"create",row.id,old,row,id?(payload.edit_reason||"تعديل سجل"):"إضافة سجل");
    const d=await openDB();
    if(type==="bike_patrols") {
      const bike=String(payload.bike||"").trim().toLocaleLowerCase("ar");
      if(!bike) throw new Error("يجب تحديد رقم الدراجة.");
      await new Promise((resolve,reject)=>{
        const tx=d.transaction(["records","audit_logs"],"readwrite");
        const store=tx.objectStore("records"),req=store.getAll();
        let validationError=null;
        req.onsuccess=()=>{
          store.put(row);
          tx.objectStore("audit_logs").put(auditItem);
        };
        req.onerror=()=>{validationError=req.error||new Error("تعذر قراءة سجلات مرور الدراجات.");try{tx.abort()}catch{}};
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(validationError||tx.error||new Error("فشل حفظ مرور الدراجة وسجل المراجعة."));
        tx.onabort=()=>reject(validationError||tx.error||new Error("تم إلغاء حفظ مرور الدراجة."));
      });
    } else if(type==="handovers") {
      const versionNumber=(old?.payload?._version||0)+1;
      row.payload._version=versionNumber;
      const version={id:uid(),record_id:row.id,version:versionNumber,snapshot:JSON.parse(JSON.stringify(row)),created_at:now(),reason:payload.edit_reason||(id?"تحديث تسليم الشفت":"إنشاء تسليم الشفت")};
      auditItem.new_data=row;
      await new Promise((resolve,reject)=>{
        const tx=d.transaction(["records","handover_versions","audit_logs"],"readwrite");
        tx.objectStore("records").put(row);
        tx.objectStore("handover_versions").put(version);
        tx.objectStore("audit_logs").put(auditItem);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error("فشل حفظ تسليم الشفت وإصداره وسجل المراجعة."));
        tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حفظ تسليم الشفت."));
      });
    } else {
      await new Promise((resolve,reject)=>{
        const tx=d.transaction(["records","audit_logs"],"readwrite");
        tx.objectStore("records").put(row);
        tx.objectStore("audit_logs").put(auditItem);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error("فشل حفظ السجل وسجل المراجعة."));
        tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حفظ السجل."));
      });
    }
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
    return row;
  }
  async function archive(id,reason="أرشفة سجل") {
    const old=await get("records",id);if(!old)throw new Error("السجل غير موجود.");
    const row={...old,is_archived:true,updated_at:now()},d=await openDB();
    await new Promise((resolve,reject)=>{const tx=d.transaction(["records","audit_logs"],"readwrite");tx.objectStore("records").put(row);tx.objectStore("audit_logs").put(makeAudit("archive",id,old,row,reason));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("فشلت الأرشفة وسجل المراجعة."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء الأرشفة."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
    return row;
  }
  async function unarchive(id,reason="استعادة سجل من الأرشيف") {
    const old=await get("records",id);if(!old)throw new Error("السجل غير موجود.");
    const row={...old,is_archived:false,updated_at:now()},d=await openDB();
    await new Promise((resolve,reject)=>{const tx=d.transaction(["records","audit_logs"],"readwrite");tx.objectStore("records").put(row);tx.objectStore("audit_logs").put(makeAudit("unarchive",id,old,row,reason));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("فشلت الاستعادة وسجل المراجعة."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء الاستعادة."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
    return row;
  }
  async function audit(limit=100) {return (await getAll("audit_logs")).sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,limit);}
  async function handoverHistory(recordId) {
    return (await getAll("handover_versions")).filter(v=>v.record_id===recordId).sort((a,b)=>a.version-b.version);
  }
  async function saveAttachment(recordId,file) {
    if(!recordId||!file) throw new Error("بيانات المرفق غير مكتملة.");
    if(!Number.isFinite(Number(file.size))||Number(file.size)<0) throw new Error("حجم المرفق غير صالح.");
    if(file.size>15*1024*1024) throw new Error("حجم المرفق يتجاوز 15 ميجابايت.");
    const parent=await get("records",recordId);
    if(!parent) throw new Error("السجل المرتبط بالمرفق غير موجود؛ لم يتم حفظ المرفق.");
    const item={id:uid(),record_id:recordId,name:file.name,type:file.type||"application/octet-stream",size:file.size,blob:file,created_at:now()};
    const d=await openDB();
    await new Promise((resolve,reject)=>{const tx=d.transaction(["attachments","audit_logs"],"readwrite");tx.objectStore("attachments").put(item);tx.objectStore("audit_logs").put(makeAudit("attachment",recordId,null,{name:item.name,size:item.size},"إضافة مرفق"));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("فشل حفظ المرفق وسجل المراجعة."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حفظ المرفق."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
    return item;
  }
  async function attachments(recordId) {return (await getAll("attachments")).filter(a=>a.record_id===recordId);}
  async function getAttachment(id) {return get("attachments",id);}
  async function approvedReports() { return (await getAll("approved_reports")).sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||""))); }
  async function approve(snapshot) {
    const item={id:uid(),title:"تقرير DEEB",snapshot,created_at:now(),actor:"مستخدم الجهاز"};
    const d=await openDB();
    await new Promise((resolve,reject)=>{const tx=d.transaction(["approved_reports","audit_logs"],"readwrite");tx.objectStore("approved_reports").put(item);tx.objectStore("audit_logs").put(makeAudit("approve",item.id,null,item,"اعتماد نسخة تقرير"));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("فشل اعتماد التقرير وسجل المراجعة."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء اعتماد التقرير."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
    return item;
  }
  function blobToDataURL(blob) {
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
  }
  function dataURLToBlob(dataURL) {
    const [head,data]=String(dataURL).split(",");
    const mime=(head.match(/data:([^;]+)/)||[])[1]||"application/octet-stream";
    const raw=atob(data||"");const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return new Blob([bytes],{type:mime});
  }
  async function createAutoBackup() {
    const existing=await getAll("automatic_backups");
    const today=now().slice(0,10);
    const sameDay=existing.find(x=>x.date===today);
    const [records,audit_logs,approved_reports,handover_versions,attachments]=await Promise.all([getAll("records"),getAll("audit_logs"),getAll("approved_reports"),getAll("handover_versions"),getAll("attachments")]);
    const attachmentBytes=attachments.reduce((sum,x)=>sum+Number(x.blob?.size??x.size??0),0);
    if(attachmentBytes>30*1024*1024)return {created:false,date:today,reason:"attachments-over-limit"};
    const snapshot={app:"DEEB",format:2,mode:"local",created_at:now(),records,audit_logs,approved_reports,handover_versions,attachments};
    const item={id:sameDay?.id||uid(),date:today,created_at:now(),record_count:records.length,attachment_count:attachments.length,snapshot};
    const d=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=d.transaction("automatic_backups","readwrite"),store=tx.objectStore("automatic_backups");
      store.put(item);
      const keep=[...existing.filter(x=>x.id!==item.id),item].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,3);
      const keepIds=new Set(keep.map(x=>x.id));
      existing.filter(x=>!keepIds.has(x.id)).forEach(x=>store.delete(x.id));
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("تعذر حفظ النسخة التلقائية."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء النسخة التلقائية."));
    });
    return {created:!sameDay,updated:!!sameDay,id:item.id,date:today,record_count:records.length,attachment_count:attachments.length};
  }
  async function automaticBackups() {
    return (await getAll("automatic_backups")).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).map(({snapshot,...meta})=>meta);
  }
  async function restoreAutoBackup(id) {
    const item=await get("automatic_backups",id);
    if(!item?.snapshot)throw new Error("النسخة التلقائية غير موجودة أو تالفة.");
    await restore(item.snapshot);
    return {date:item.date,record_count:item.record_count};
  }
  async function backup() {
    const [records,audit_logs,approved_reports,handover_versions,rawAttachments]=await Promise.all([
      getAll("records"),getAll("audit_logs"),getAll("approved_reports"),getAll("handover_versions"),getAll("attachments")]);
    const attachments=await Promise.all(rawAttachments.map(async a=>({...a,blob:undefined,data_url:await blobToDataURL(a.blob)})));
    return {app:"DEEB",format:2,mode:"local",created_at:now(),records,audit_logs,approved_reports,handover_versions,attachments};
  }
  async function restore(obj) {
    if(!obj||!["DEEB","DEEBO","DEBOO16"].includes(obj.app)||![1,2].includes(obj.format)||!Array.isArray(obj.records)||!Array.isArray(obj.audit_logs)) throw new Error("ملف النسخة غير صالح أو غير متوافق.");
    const optionalArrays=["approved_reports","handover_versions","attachments"];
    for(const key of optionalArrays) if(obj[key]!==undefined&&!Array.isArray(obj[key])) throw new Error("قسم "+key+" في النسخة غير صالح.");
    const validRows=(rows,key)=>rows.every(x=>x&&typeof x==="object"&&typeof x.id==="string"&&x.id.length>0);
    if(!validRows(obj.records,"records")||obj.records.some(x=>typeof x.entity_type!=="string"||!x.payload||typeof x.payload!=="object"||Array.isArray(x.payload))) throw new Error("تحتوي النسخة على سجل غير صالح؛ لم يتم تغيير بياناتك.");
    if(!validRows(obj.audit_logs,"audit_logs")||!validRows(obj.approved_reports||[],"approved_reports")||!validRows(obj.handover_versions||[],"handover_versions")||!validRows(obj.attachments||[],"attachments")) throw new Error("تحتوي النسخة على عنصر ناقص المعرّف؛ لم يتم تغيير بياناتك.");
    const checkUnique=(rows,label)=>{const ids=rows.map(x=>x.id);if(new Set(ids).size!==ids.length)throw new Error("تحتوي النسخة على معرّفات مكررة في "+label+"؛ لم يتم تغيير بياناتك.");};
    checkUnique(obj.records,"السجلات");checkUnique(obj.audit_logs,"سجل المراجعة");checkUnique(obj.approved_reports||[],"التقارير");checkUnique(obj.handover_versions||[],"إصدارات التسليم");checkUnique(obj.attachments||[],"المرفقات");
    const recordIds=new Set(obj.records.map(x=>x.id));
    const operationalTypes=new Set(["daily_rosters","branch_patrols","bike_patrols","manager_rounds","incidents","written_reports","absences","handovers","emergencies","tasks"]);
    for(const row of obj.records){
      if(!operationalTypes.has(row.entity_type))continue;
      for(const key of WORK_DATE_FIELDS){
        const value=String(row.payload?.[key]??"").trim();
        if(value&&!isValidISODate(value))throw new Error("يوجد سجل بتاريخ غير صالح في النسخة ("+key+")؛ لم يتم تغيير بياناتك.");
      }
    }
    // Validate active bike visits while allowing any number of registered bikes per day.
    const patrols=obj.records.filter(x=>x.entity_type==="bike_patrols"&&!x.is_archived);
    for(const row of patrols){
      const bike=String(row.payload?.bike||"").trim();
      const patrolDate=String(row.payload?.patrol_date||"").trim();
      const stamp=String(row.created_at||"");
      const day=patrolDate||stamp.slice(0,10);
      if(!bike||!isValidISODate(day))
        throw new Error("يوجد مرور دراجة ببيانات ناقصة أو تاريخ غير صالح في النسخة؛ لم يتم تغيير بياناتك.");
    }
    if((obj.attachments||[]).some(x=>!recordIds.has(x.record_id))) throw new Error("يوجد مرفق مرتبط بسجل غير موجود في النسخة؛ لم يتم تغيير بياناتك.");
    if((obj.handover_versions||[]).some(x=>!recordIds.has(x.record_id)||!Number.isInteger(x.version)||x.version<1||!x.snapshot||typeof x.snapshot!=="object")) throw new Error("يوجد إصدار تسليم غير مرتبط بسجل صالح؛ لم يتم تغيير بياناتك.");
    const preparedAttachments=(obj.attachments||[]).map(x=>{
      let blob=x.blob instanceof Blob?x.blob:null;
      if(!blob){if(typeof x.data_url!=="string"||!/^data:[^;,]+;base64,[A-Za-z0-9+/=]*$/.test(x.data_url)) throw new Error("بيانات المرفق "+(x.name||x.id)+" غير صالحة؛ لم يتم تغيير بياناتك.");blob=dataURLToBlob(x.data_url);}
      if(blob.size>15*1024*1024) throw new Error("المرفق "+(x.name||x.id)+" يتجاوز الحد المسموح 15 ميجابايت.");
      if(!x.record_id||typeof x.name!=="string") throw new Error("بيانات مرفق ناقصة؛ لم يتم تغيير بياناتك.");
      const item={...x,blob,size:blob.size};delete item.data_url;return item;
    });
    const current=await backup();
    if(current.records.length||current.audit_logs.length||current.approved_reports.length||current.handover_versions.length||current.attachments.length) await downloadBlob(new Blob([JSON.stringify(current,null,2)],{type:"application/json"}),"DEEB-before-restore.json");
    const d=await openDB();
    await new Promise((resolve,reject)=>{
      const names=["records","audit_logs","approved_reports","handover_versions","attachments"];
      const tx=d.transaction(names,"readwrite");
      for(const name of names) tx.objectStore(name).clear();
      obj.records.forEach(x=>tx.objectStore("records").put(x));
      obj.audit_logs.forEach(x=>tx.objectStore("audit_logs").put(x));
      (obj.approved_reports||[]).forEach(x=>tx.objectStore("approved_reports").put(x));
      (obj.handover_versions||[]).forEach(x=>tx.objectStore("handover_versions").put(x));
      preparedAttachments.forEach(x=>tx.objectStore("attachments").put(x));
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error("تعذرت الاستعادة."));
    });
    await addAudit("restore",null,null,{count:obj.records.length},"استعادة نسخة احتياطية");
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
  }
  async function downloadBlob(blob,name) {
    const native=window.DEEBNativePlugins?.FileExport;
    if(native?.saveFile&&blob?.arrayBuffer){
      const bytes=new Uint8Array(await blob.arrayBuffer());
      let binary="";
      for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,Math.min(offset+0x8000,bytes.length)));
      const result=await native.saveFile({name,mimeType:blob.type||"application/octet-stream",base64:btoa(binary)});
      return result;
    }
    const a=document.createElement("a"),url=URL.createObjectURL(blob);
    a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    return {saved:true,name};
  }
  return {init,configured,list,all,archivePastDays,getRecord:(id)=>get("records",id),save,archive,unarchive,audit,approve,approvedReports,backup,restore,createAutoBackup,automaticBackups,restoreAutoBackup,downloadBlob,handoverHistory,saveAttachment,attachments,getAttachment,local:true};
})();