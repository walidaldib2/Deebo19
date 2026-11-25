/* DEBOO16 Local Edition — IndexedDB storage; no Supabase required. */
window.DebooDB = (() => {
  "use strict";
  const DB_NAME = "DEBOO16_LOCAL_DB";
  const DB_VERSION = 4;
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
        // Additive sync stores only: existing operational stores and their records are untouched.
        if (!d.objectStoreNames.contains("sync_state")) d.createObjectStore("sync_state",{keyPath:"key"});
        if (!d.objectStoreNames.contains("sync_outbox")) {
          const q=d.createObjectStore("sync_outbox",{keyPath:"mutation_id"});
          q.createIndex("status_created_at",["status","created_at"],{unique:false});
          q.createIndex("next_attempt_at","next_attempt_at",{unique:false});
          q.createIndex("record_id","record_id",{unique:false});
        }
        if (!d.objectStoreNames.contains("sync_conflicts")) {
          const c=d.createObjectStore("sync_conflicts",{keyPath:"id"});
          c.createIndex("status_created_at",["status","created_at"],{unique:false});
          c.createIndex("record_id","record_id",{unique:false});
        }
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
    data=data.filter(x=>!!x.is_archived===!!opts.archived&&!!x.is_deleted===!!opts.deleted);
    data.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
    return Number.isFinite(opts.limit)&&opts.limit>=0?data.slice(0,opts.limit):data;
  }
  function localDateISO(date=new Date()) { return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-"); }
  function recordWorkDate(row) {
    const p=row.payload||{};
    const value=p.work_date||p.patrol_date||p.incident_date||p.report_date||p.absence_date||p.handover_date||p.emergency_date||p.task_date;
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value||"")))return String(value);
    const created=String(row.created_at||"").slice(0,10);
    return /^\d{4}-\d{2}-\d{2}$/.test(created)?created:"";
  }
  function shiftIdentity(payload={}) {
    const shift=String(payload.shift||payload.shift_name||"").trim();
    const date=String(payload.work_date||payload.patrol_date||payload.incident_date||payload.report_date||payload.absence_date||payload.handover_date||payload.emergency_date||payload.task_date||"").trim();
    return shift&&/^\d{4}-\d{2}-\d{2}$/.test(date)?{shift_name:shift,shift_key:date+"|"+shift}:{};
  }
  async function archivePastDays(today=localDateISO()) {
    const shiftTypes=new Set(["daily_rosters","branch_patrols","bike_patrols","manager_rounds","incidents","written_reports","absences","handovers","emergencies","tasks","memos"]);
    const rows=await getAll("records");
    const candidates=rows.filter(row=>{
      if(row.is_archived||row.is_deleted||!shiftTypes.has(row.entity_type))return false;
      const date=recordWorkDate(row);
      return /^\d{4}-\d{2}-\d{2}$/.test(date)&&date<today;
    });
    if(!candidates.length)return {archived:0,today};
    const d=await openDB(),stamp=now(),prepared=[];
    for(const old of candidates){
      const row={...old,is_archived:true,archived_at:stamp,updated_at:stamp};
      const auditItem=makeAudit("archive",old.id,old,row,"أرشفة تلقائية لانتهاء يوم الشفت");
      const mutation=await prepareRecordMutation(row,"archive",{record:row,audit:auditItem},old);
      prepared.push({row,auditItem,mutation});
    }
    const hasMutations=prepared.some(x=>x.mutation);
    await new Promise((resolve,reject)=>{
      const names=hasMutations?["records","audit_logs","sync_outbox"]:["records","audit_logs"];
      const tx=d.transaction(names,"readwrite"),records=tx.objectStore("records"),logs=tx.objectStore("audit_logs");
      prepared.forEach(item=>{
        records.put(item.row);
        logs.put(item.auditItem);
        putRecordMutation(tx,item.mutation);
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
  async function prepareRecordMutation(row,action,snapshot,old=null) {
    const context=await getTeamContext();
    if(context.mode!=="team")return null;
    const device=await deviceIdentity(),stamp=now();
    return {mutation_id:uid(),record_id:row.id,entity_type:row.entity_type,action,branch_id:row.branch_id||null,
      org_id:context.org_id,user_id:context.user_id,device_id:device.device_id,
      base_revision:Number(old?.server_revision||old?.revision||0),
      snapshot:JSON.parse(JSON.stringify(snapshot)),created_at:stamp,local_updated_at:row.updated_at||stamp,
      status:"pending",attempts:0,next_attempt_at:stamp,last_error:null,server_revision:null};
  }
  function putRecordMutation(tx,mutation) {
    if(mutation)tx.objectStore("sync_outbox").put(mutation);
  }
  async function save(type,payload,id=null) {
    if(!type||!payload||typeof payload!=="object"||Array.isArray(payload)) throw new Error("بيانات السجل غير صالحة.");
    const old=id?await get("records",id):null;
    if(id&&!old) throw new Error("السجل المطلوب تعديله غير موجود.");
    const savedPayload={...payload};
    const operationalTypes=new Set(["daily_rosters","branch_patrols","bike_patrols","manager_rounds","incidents","written_reports","absences","handovers","emergencies","tasks","memos"]);
    if(operationalTypes.has(type)){
      const workDate=recordWorkDate({entity_type:type,payload:savedPayload,created_at:old?.created_at||now()});
      if(workDate)savedPayload.work_date=workDate;
      const shiftMeta=shiftIdentity(savedPayload);
      if(shiftMeta.shift_key){savedPayload.shift_name=shiftMeta.shift_name;savedPayload.shift_key=shiftMeta.shift_key;}
    }
    const row={id:id||uid(),entity_type:type,payload:savedPayload,branch_id:payload.branch_id||null,status:payload.status||"active",is_archived:!!old?.is_archived,is_deleted:false,...(old?.archived_at?{archived_at:old.archived_at}:{}),created_at:old?.created_at||now(),updated_at:now(),created_by:old?.created_by||"local"};
    const auditItem=makeAudit(id?"update":"create",row.id,old,row,id?(payload.edit_reason||"تعديل سجل"):"إضافة سجل");
    const d=await openDB();
    const syncAction=type==="handovers"?"handover_version":(id?"update":"create");
    let syncMutation=await prepareRecordMutation(row,syncAction,{record:row,audit:auditItem},old);
    if(type==="bike_patrols") {
      const bike=String(payload.bike||"").trim().toLocaleLowerCase("ar");
      if(!bike) throw new Error("يجب تحديد رقم الدراجة.");
      await new Promise((resolve,reject)=>{
        const tx=d.transaction(syncMutation?["records","audit_logs","sync_outbox"]:["records","audit_logs"],"readwrite");
        // Motorcycle visits are intentionally repeatable; no uniqueness scan is needed.
        // Persist the visit and its audit entry atomically without loading the full records store.
        tx.objectStore("records").put(row);
        tx.objectStore("audit_logs").put(auditItem);
        putRecordMutation(tx,syncMutation);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error("فشل حفظ مرور الدراجة وسجل المراجعة."));
        tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حفظ مرور الدراجة."));
      });
    } else if(type==="handovers") {
      const versionNumber=(old?.payload?._version||0)+1;
      row.payload._version=versionNumber;
      const version={id:uid(),record_id:row.id,version:versionNumber,snapshot:JSON.parse(JSON.stringify(row)),created_at:now(),reason:payload.edit_reason||(id?"تحديث تسليم الشفت":"إنشاء تسليم الشفت")};
      auditItem.new_data=row;
      if(syncMutation)syncMutation.snapshot={record:row,handover_version:version,audit:auditItem};
      await new Promise((resolve,reject)=>{
        const tx=d.transaction(syncMutation?["records","handover_versions","audit_logs","sync_outbox"]:["records","handover_versions","audit_logs"],"readwrite");
        tx.objectStore("records").put(row);
        tx.objectStore("handover_versions").put(version);
        tx.objectStore("audit_logs").put(auditItem);
        putRecordMutation(tx,syncMutation);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error||new Error("فشل حفظ تسليم الشفت وإصداره وسجل المراجعة."));
        tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حفظ تسليم الشفت."));
      });
    } else {
      await new Promise((resolve,reject)=>{
        const tx=d.transaction(syncMutation?["records","audit_logs","sync_outbox"]:["records","audit_logs"],"readwrite");
        tx.objectStore("records").put(row);
        tx.objectStore("audit_logs").put(auditItem);
        putRecordMutation(tx,syncMutation);
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
    const row={...old,is_archived:true,updated_at:now()},d=await openDB(),auditItem=makeAudit("archive",id,old,row,reason);
    const mutation=await prepareRecordMutation(row,"archive",{record:row,audit:auditItem},old);
    await new Promise((resolve,reject)=>{const tx=d.transaction(mutation?["records","audit_logs","sync_outbox"]:["records","audit_logs"],"readwrite");tx.objectStore("records").put(row);tx.objectStore("audit_logs").put(auditItem);putRecordMutation(tx,mutation);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("فشلت الأرشفة وسجل المراجعة."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء الأرشفة."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
    return row;
  }
  async function softDelete(id,reason="نقل بند مرور دراجة إلى المحذوفات") {
    const old=await get("records",id);
    if(!old)throw new Error("بند المرور غير موجود.");
    if(old.entity_type!=="bike_patrols")throw new Error("الحذف المؤقت متاح لبنود مرور الدراجات فقط.");
    if(old.is_deleted)throw new Error("بند المرور موجود بالفعل في المحذوفات.");
    const stamp=now(),row={...old,is_deleted:true,deleted_at:stamp,updated_at:stamp},d=await openDB(),auditItem=makeAudit("soft_delete",id,old,row,reason);
    const mutation=await prepareRecordMutation(row,"soft_delete",{record:row,audit:auditItem},old);
    await new Promise((resolve,reject)=>{const tx=d.transaction(mutation?["records","audit_logs","sync_outbox"]:["records","audit_logs"],"readwrite");tx.objectStore("records").put(row);tx.objectStore("audit_logs").put(auditItem);putRecordMutation(tx,mutation);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("تعذر نقل بند المرور إلى المحذوفات."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء نقل بند المرور."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB deleted-item backup:",error);}
    return row;
  }
  async function restoreDeleted(id,reason="استعادة بند مرور دراجة من المحذوفات") {
    const old=await get("records",id);
    if(!old||!old.is_deleted||old.entity_type!=="bike_patrols")throw new Error("بند المرور غير موجود في المحذوفات.");
    const row={...old,is_deleted:false,is_archived:false,updated_at:now()};delete row.deleted_at;delete row.archived_at;
    const d=await openDB(),auditItem=makeAudit("restore_deleted",id,old,row,reason),mutation=await prepareRecordMutation(row,"restore_deleted",{record:row,audit:auditItem},old);
    await new Promise((resolve,reject)=>{const tx=d.transaction(mutation?["records","audit_logs","sync_outbox"]:["records","audit_logs"],"readwrite");tx.objectStore("records").put(row);tx.objectStore("audit_logs").put(auditItem);putRecordMutation(tx,mutation);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("تعذرت استعادة بند المرور."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء الاستعادة."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB restored-item backup:",error);}
    return row;
  }
  async function purgeExpiredDeleted(nowDate=new Date()) {
    const cutoff=nowDate.getTime()-30*24*60*60*1000;
    const expired=(await getAll("records")).filter(row=>row.is_deleted&&Date.parse(row.deleted_at||"")<=cutoff);
    if(!expired.length)return 0;
    const d=await openDB();
    await new Promise((resolve,reject)=>{const tx=d.transaction(["records","audit_logs"],"readwrite"),records=tx.objectStore("records"),logs=tx.objectStore("audit_logs");
      expired.forEach(old=>{records.delete(old.id);logs.put(makeAudit("permanent_delete",old.id,old,null,"حذف تلقائي بعد مرور 30 يومًا في المحذوفات"));});
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("تعذر تنظيف المحذوفات المنتهية."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء تنظيف المحذوفات."));
    });
    try{await createAutoBackup();}catch(error){console.warn("DEEB expired-deleted backup:",error);}
    return expired.length;
  }
  async function unarchive(id,reason="استعادة سجل من الأرشيف") {
    const old=await get("records",id);if(!old)throw new Error("السجل غير موجود.");
    const row={...old,is_archived:false,updated_at:now()},d=await openDB(),auditItem=makeAudit("unarchive",id,old,row,reason),mutation=await prepareRecordMutation(row,"unarchive",{record:row,audit:auditItem},old);
    await new Promise((resolve,reject)=>{const tx=d.transaction(mutation?["records","audit_logs","sync_outbox"]:["records","audit_logs"],"readwrite");tx.objectStore("records").put(row);tx.objectStore("audit_logs").put(auditItem);putRecordMutation(tx,mutation);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("فشلت الاستعادة وسجل المراجعة."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء الاستعادة."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
    return row;
  }
  async function audit(limit=100) {return (await getAll("audit_logs")).sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,limit);}
  async function handoverHistory(recordId) {
    return (await getAll("handover_versions")).filter(v=>v.record_id===recordId).sort((a,b)=>a.version-b.version);
  }
  async function saveAttachment(recordId,file) {
    if(!recordId||!file) throw new Error("بيانات المرفق غير مكتملة.");
    if(file.size>15*1024*1024) throw new Error("حجم المرفق يتجاوز 15 ميجابايت.");
    const item={id:uid(),record_id:recordId,name:file.name,type:file.type||"application/octet-stream",size:file.size,blob:file,created_at:now()};
    const parent=await get("records",recordId),d=await openDB(),auditItem=makeAudit("attachment",recordId,null,{name:item.name,size:item.size},"إضافة مرفق");
    const syncRow={id:item.id,entity_type:"attachments",branch_id:parent?.branch_id||null,updated_at:item.created_at};
    const mutation=await prepareRecordMutation(syncRow,"attachment",{attachment:{id:item.id,record_id:recordId,name:item.name,type:item.type,size:item.size,created_at:item.created_at},audit:auditItem},null);
    await new Promise((resolve,reject)=>{const tx=d.transaction(mutation?["attachments","audit_logs","sync_outbox"]:["attachments","audit_logs"],"readwrite");tx.objectStore("attachments").put(item);tx.objectStore("audit_logs").put(auditItem);putRecordMutation(tx,mutation);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("فشل حفظ المرفق وسجل المراجعة."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حفظ المرفق."));});
    try{await createAutoBackup();}catch(error){console.warn("DEEB automatic backup:",error);}
    return item;
  }
  async function attachments(recordId) {return (await getAll("attachments")).filter(a=>a.record_id===recordId);}
  async function getAttachment(id) {return get("attachments",id);}
  async function approvedReports() { return (await getAll("approved_reports")).sort((a,b)=>String(b.created_at||"").localeCompare(String(a.created_at||""))); }
  async function approve(snapshot) {
    const item={id:uid(),title:"تقرير DEEB",snapshot,created_at:now(),actor:"مستخدم الجهاز"};
    const auditItem=makeAudit("approve",item.id,null,item,"اعتماد نسخة تقرير");
    const syncRow={id:item.id,entity_type:"approved_reports",branch_id:snapshot?.branch_id||null,updated_at:item.created_at};
    const mutation=await prepareRecordMutation(syncRow,"approve",{approved_report:item,audit:auditItem},null);
    const d=await openDB();
    await new Promise((resolve,reject)=>{const tx=d.transaction(mutation?["approved_reports","audit_logs","sync_outbox"]:["approved_reports","audit_logs"],"readwrite");tx.objectStore("approved_reports").put(item);tx.objectStore("audit_logs").put(auditItem);putRecordMutation(tx,mutation);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("فشل اعتماد التقرير وسجل المراجعة."));tx.onabort=()=>reject(tx.error||new Error("تم إلغاء اعتماد التقرير."));});
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
    const attachmentBytes=attachments.reduce((sum,x)=>sum+Number(x.size||0),0);
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
    // Validate active bike visits while allowing any number of registered bikes per day.
    const patrols=obj.records.filter(x=>x.entity_type==="bike_patrols"&&!x.is_archived&&!x.is_deleted);
    for(const row of patrols){
      const bike=String(row.payload?.bike||"").trim();
      const patrolDate=String(row.payload?.patrol_date||"").trim();
      const stamp=String(row.created_at||"");
      const day=/^\d{4}-\d{2}-\d{2}$/.test(patrolDate)?patrolDate:stamp.slice(0,10);
      if(!bike||!/^\d{4}-\d{2}-\d{2}$/.test(day)||Number.isNaN(Date.parse(day+"T00:00:00Z")))
        throw new Error("يوجد مرور دراجة ببيانات ناقصة أو تاريخ غير صالح في النسخة؛ لم يتم تغيير بياناتك.");
    }
    if((obj.attachments||[]).some(x=>!recordIds.has(x.record_id))) throw new Error("يوجد مرفق مرتبط بسجل غير موجود في النسخة؛ لم يتم تغيير بياناتك.");
    if((obj.handover_versions||[]).some(x=>!recordIds.has(x.record_id)||!Number.isInteger(x.version)||x.version<1||!x.snapshot||typeof x.snapshot!=="object")) throw new Error("يوجد إصدار تسليم غير مرتبط بسجل صالح؛ لم يتم تغيير بياناتك.");
    const teamContext=await getTeamContext();
    const unsynced=(await getAll("sync_outbox")).filter(x=>["pending","conflict"].includes(x.status));
    if(teamContext.mode==="team"||unsynced.length) throw new Error("لا يمكن استعادة نسخة محلية أثناء وضع الفريق أو مع وجود عمليات مزامنة معلقة؛ أكمل المزامنة أو عالج التعارضات أولاً.");
    const preparedAttachments=(obj.attachments||[]).map(x=>{
      let blob=x.blob instanceof Blob?x.blob:null;
      if(!blob){if(typeof x.data_url!=="string"||!/^data:[^;,]+;base64,[A-Za-z0-9+/=]*$/.test(x.data_url)) throw new Error("بيانات المرفق "+(x.name||x.id)+" غير صالحة؛ لم يتم تغيير بياناتك.");blob=dataURLToBlob(x.data_url);}
      if(blob.size>15*1024*1024) throw new Error("المرفق "+(x.name||x.id)+" يتجاوز الحد المسموح 15 ميجابايت.");
      if(!x.record_id||typeof x.name!=="string") throw new Error("بيانات مرفق ناقصة؛ لم يتم تغيير بياناتك.");
      const item={...x,blob};delete item.data_url;return item;
    });
    const current=await backup();
    if(current.records.length||current.attachments.length) await downloadBlob(new Blob([JSON.stringify(current,null,2)],{type:"application/json"}),"DEEB-before-restore.json");
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
  // Local-first sync primitives. They are inert unless a team context is explicitly configured.
  async function readSyncState(key) { return get("sync_state",key); }
  async function writeSyncState(key,value) {
    const item={key,value,updated_at:now()};
    await txStore("sync_state","readwrite",store=>store.put(item));
    return item;
  }
  async function deviceIdentity() {
    const d=await openDB();
    return new Promise((resolve,reject)=>{
      const tx=d.transaction("sync_state","readwrite"),store=tx.objectStore("sync_state");
      let value=null;
      const request=store.get("device_identity");
      request.onsuccess=()=>{
        const existing=request.result?.value;
        if(existing?.device_id){value=existing;return;}
        value={device_id:uid(),created_at:now(),platform:typeof navigator!=="undefined"?(navigator.userAgent||"web").slice(0,160):"test"};
        store.put({key:"device_identity",value,updated_at:now()});
      };
      tx.oncomplete=()=>resolve(value);
      tx.onerror=()=>reject(tx.error||new Error("تعذر تثبيت هوية هذا الجهاز."));
      tx.onabort=()=>reject(tx.error||new Error("تم إلغاء إنشاء هوية الجهاز."));
    });
  }
  async function setTeamContext(context) {
    if(!context||typeof context!=="object"||!context.org_id||!context.user_id) throw new Error("بيانات ربط الإدارة والمستخدم غير مكتملة.");
    const orgId=String(context.org_id),current=await readSyncState("team_context"),lock=await readSyncState("organization_lock");
    if(lock?.value?.org_id&&lock.value.org_id!==orgId) throw new Error("هذا الإصدار مخصص لإدارة واحدة ولا يمكن ربطه بإدارة أخرى.");
    const pending=(await getAll("sync_outbox")).filter(x=>["pending","conflict"].includes(x.status));
    if(current?.value?.mode==="team"&&current.value.org_id!==orgId&&pending.length) throw new Error("لا يمكن تغيير الإدارة مع وجود عمليات مزامنة معلقة.");
    const value={mode:"team",org_id:orgId,user_id:String(context.user_id),display_name:String(context.display_name||""),configured_at:current?.value?.configured_at||now()};
    await deviceIdentity();
    if(!lock?.value?.org_id)await writeSyncState("organization_lock",{org_id:orgId,locked_at:now()});
    await writeSyncState("team_context",value);
    return value;
  }
  async function clearTeamContext() {
    const pending=await getAll("sync_outbox");
    await writeSyncState("team_context",{mode:"local",cleared_at:now(),pending_mutations:pending.filter(x=>x.status!=="synced").length});
    return {mode:"local",pending_mutations:pending.filter(x=>x.status!=="synced").length};
  }
  async function getTeamContext() {
    const item=await readSyncState("team_context");
    return item?.value||{mode:"local"};
  }
  async function enqueueSyncMutation(input) {
    const context=await getTeamContext();
    if(context.mode!=="team") throw new Error("المزامنة غير مفعلة؛ التطبيق يعمل في الوضع الفردي المحلي.");
    if(!input||!input.record_id||!input.entity_type||!input.action) throw new Error("بيانات عملية المزامنة غير مكتملة.");
    const allowed=new Set(["create","update","archive","unarchive","soft_delete","restore_deleted","attachment","approve","handover_version"]);
    if(!allowed.has(input.action)) throw new Error("نوع عملية المزامنة غير مسموح.");
    const device=await deviceIdentity(),stamp=now();
    const row={
      mutation_id:input.mutation_id||uid(),record_id:String(input.record_id),entity_type:String(input.entity_type),
      action:input.action,branch_id:input.branch_id||null,org_id:context.org_id,user_id:context.user_id,
      device_id:device.device_id,schema_version:4,base_revision:Number.isInteger(input.base_revision)?input.base_revision:0,
      snapshot:input.snapshot==null?null:JSON.parse(JSON.stringify(input.snapshot)),
      created_at:stamp,local_updated_at:input.local_updated_at||stamp,status:"pending",
      attempts:0,next_attempt_at:stamp,last_error:null,server_revision:null
    };
    const existing=await get("sync_outbox",row.mutation_id);
    if(existing)return existing;
    try { await txStore("sync_outbox","readwrite",store=>store.add(row)); }
    catch(error) {
      // A concurrent retry with the same idempotency key may win the insert.
      const raced=await get("sync_outbox",row.mutation_id);
      if(raced)return raced;
      throw error;
    }
    return row;
  }
  async function pendingSyncMutations(limit=100,at=new Date()) {
    const stamp=at instanceof Date?at.toISOString():String(at);
    return (await getAll("sync_outbox"))
      .filter(x=>x.status==="pending"&&(!x.next_attempt_at||x.next_attempt_at<=stamp))
      .sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)))
      .slice(0,Math.max(0,Math.min(500,Number(limit)||100)));
  }
  async function markSyncMutationSynced(mutationId,serverRevision=null) {
    const row=await get("sync_outbox",mutationId);if(!row)return null;
    const updated={...row,status:"synced",server_revision:serverRevision,synced_at:now(),last_error:null};
    await txStore("sync_outbox","readwrite",store=>store.put(updated));return updated;
  }
  async function retrySyncMutation(mutationId,error) {
    const row=await get("sync_outbox",mutationId);if(!row||row.status==="synced"||row.status==="conflict"||row.status==="superseded")return row;
    const attempts=(row.attempts||0)+1,delay=Math.min(60*60*1000,1000*Math.pow(2,Math.min(attempts,12)));
    const updated={...row,status:"pending",attempts,next_attempt_at:new Date(Date.now()+delay).toISOString(),last_error:String(error?.message||error||"تعذرت المزامنة").slice(0,500)};
    await txStore("sync_outbox","readwrite",store=>store.put(updated));return updated;
  }
  async function addSyncConflict(input) {
    if(!input?.record_id||!input?.mutation_id)throw new Error("بيانات تعارض المزامنة غير مكتملة.");
    const context=await getTeamContext();
    const row={id:input.id||uid(),org_id:context.org_id||input.org_id||null,record_id:input.record_id,mutation_id:input.mutation_id,
      base_revision:Number(input.base_revision||0),server_revision:Number(input.server_revision||0),
      local_snapshot:input.local_snapshot??null,server_snapshot:input.server_snapshot??null,
      status:"open",created_at:now(),resolution:null,resolved_at:null};
    const d=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=d.transaction(["sync_conflicts","sync_outbox"],"readwrite");
      tx.objectStore("sync_conflicts").add(row);
      const mutationRequest=tx.objectStore("sync_outbox").get(row.mutation_id);
      mutationRequest.onsuccess=()=>{
        const mutation=mutationRequest.result;
        if(mutation&&mutation.status!=="synced"&&mutation.status!=="superseded"){
          tx.objectStore("sync_outbox").put({...mutation,status:"conflict",conflict_id:row.id,last_error:"revision_conflict"});
        }
      };
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("تعذر حفظ تعارض المزامنة."));
      tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حفظ تعارض المزامنة."));
    });
    return row;
  }
  async function resolveSyncConflict(id,resolution) {
    const row=await get("sync_conflicts",id);if(!row)throw new Error("تعارض المزامنة غير موجود.");
    if(row.status!=="open")throw new Error("تمت معالجة هذا التعارض من قبل.");
    const choice=resolution?.choice||"keep_server";
    const updated={...row,status:"resolved",resolution:resolution==null?null:JSON.parse(JSON.stringify(resolution)),resolved_at:now()};
    const d=await openDB();
    await new Promise((resolve,reject)=>{
      const tx=d.transaction(["sync_conflicts","sync_outbox"],"readwrite");
      tx.objectStore("sync_conflicts").put(updated);
      const request=tx.objectStore("sync_outbox").get(row.mutation_id);
      request.onsuccess=()=>{
        const mutation=request.result;
        if(!mutation)return;
        if(choice==="keep_local"||choice==="manual_merge"){
          const snapshot=resolution?.snapshot??mutation.snapshot;
          tx.objectStore("sync_outbox").put({...mutation,status:"pending",snapshot,base_revision:row.server_revision,
            attempts:0,next_attempt_at:now(),last_error:null,conflict_id:null});
        }else{
          tx.objectStore("sync_outbox").put({...mutation,status:"superseded",superseded_at:now(),last_error:null});
        }
      };
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("تعذر اعتماد حل تعارض المزامنة."));
      tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حل تعارض المزامنة."));
    });
    return updated;
  }
  async function setRecordServerRevision(recordId,revision) {
    const row=await get("records",recordId);
    if(!row)return null;
    const updated={...row,server_revision:Number(revision)||0};
    await txStore("records","readwrite",store=>store.put(updated));
    return updated;
  }
  async function applyRemoteSyncPage(remoteRows=[]) {
    if(!Array.isArray(remoteRows))throw new Error("بيانات صفحة المزامنة غير صالحة.");
    const d=await openDB();
    const pendingIds=new Set((await getAll("sync_outbox"))
      .filter(x=>["pending","conflict"].includes(x.status)).map(x=>x.record_id));
    let applied=0,skippedLocal=0;
    await new Promise((resolve,reject)=>{
      const tx=d.transaction(["records"],"readwrite"),store=tx.objectStore("records");
      for(const remote of remoteRows){
        if(!remote||!remote.id||!remote.entity_type)continue;
        if(pendingIds.has(remote.id)){skippedLocal++;continue;}
        const row={
          id:String(remote.id),entity_type:String(remote.entity_type),
          payload:remote.payload&&typeof remote.payload==="object"?remote.payload:{},
          branch_id:remote.branch_id||null,status:remote.status||"active",
          is_archived:!!remote.is_archived,is_deleted:!!remote.is_deleted,
          ...(remote.deleted_at?{deleted_at:remote.deleted_at}:{}),
          ...(remote.delete_reason?{delete_reason:remote.delete_reason}:{}),
          created_at:remote.created_at||now(),updated_at:remote.updated_at||now(),
          created_by:remote.created_by||"team",server_revision:Number(remote.revision)||1,
          revision:Number(remote.revision)||1,remote_synced_at:now()
        };
        store.put(row);applied++;
      }
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||new Error("تعذر تطبيق سجلات الإدارة المستلمة."));
      tx.onabort=()=>reject(tx.error||new Error("تم إلغاء تطبيق صفحة المزامنة."));
    });
    return {applied,skipped_local:skippedLocal};
  }
  async function applyRemoteAuxData(input={}) {
    const d=await openDB(),names=["audit_logs","approved_reports","handover_versions","attachments"];
    let applied=0;
    await new Promise((resolve,reject)=>{
      const tx=d.transaction(names,"readwrite");
      const specs=[
        ["audit_logs",input.audit_logs||[],row=>({...row,actor:row.actor||row.actor_user_id||"عضو الإدارة"})],
        ["approved_reports",input.approved_reports||[],row=>({...row,actor:row.actor||row.actor_user_id||"عضو الإدارة"})],
        ["handover_versions",input.handover_versions||[],row=>row],
        ["attachments",input.attachments||[],row=>({...row,name:row.name||row.file_name,type:row.type||row.mime_type,size:Number(row.size||row.size_bytes||0),upload_status:"uploaded"})]
      ];
      for(const [name,rows,map] of specs){
        const store=tx.objectStore(name);
        for(const source of rows){
          if(!source?.id)continue;
          if(name==="attachments"){
            const req=store.get(source.id);
            req.onsuccess=()=>{
              const previous=req.result||{};
              store.put({...map(source),...previous,
                id:source.id,record_id:source.record_id,
                name:source.file_name||previous.name||source.name,
                type:source.mime_type||previous.type||source.type,
                size:Number(source.size_bytes||previous.size||source.size||0),
                storage_path:source.storage_path,
                upload_status:"uploaded",
                created_at:source.created_at||previous.created_at});
            };
          }else store.put(map(source));
          applied++;
        }
      }
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||new Error("تعذر حفظ بيانات الإدارة الإضافية."));
      tx.onabort=()=>reject(tx.error||new Error("تم إلغاء حفظ بيانات الإدارة الإضافية."));
    });
    return {applied};
  }
  async function saveRemoteAttachment(metadata,blob) {
    if(!metadata?.id||!blob)throw new Error("بيانات المرفق المستلم غير مكتملة.");
    const previous=await get("attachments",metadata.id);
    const item={...previous,...metadata,id:metadata.id,record_id:metadata.record_id,
      name:metadata.file_name||metadata.name||previous?.name||"مرفق",
      type:metadata.mime_type||metadata.type||blob.type||"application/octet-stream",
      size:Number(metadata.size_bytes||metadata.size||blob.size),
      blob,storage_path:metadata.storage_path,upload_status:"uploaded",
      created_at:metadata.created_at||previous?.created_at||now()};
    await txStore("attachments","readwrite",store=>store.put(item));
    return item;
  }
  async function syncStatus() {
    const [context,outbox,conflicts]=await Promise.all([getTeamContext(),getAll("sync_outbox"),getAll("sync_conflicts")]);
    return {mode:context.mode||"local",pending:outbox.filter(x=>x.status==="pending").length,
      synced:outbox.filter(x=>x.status==="synced").length,open_conflicts:conflicts.filter(x=>x.status==="open").length,
      failed:outbox.filter(x=>x.status==="failed").length};
  }
  async function syncCursor() { return (await readSyncState("sync_cursor"))?.value||null; }
  async function setSyncCursor(value) { return writeSyncState("sync_cursor",value); }
  return {init,configured,list,all,archivePastDays,purgeExpiredDeleted,getRecord:(id)=>get("records",id),save,archive,unarchive,softDelete,restoreDeleted,audit,approve,approvedReports,backup,restore,createAutoBackup,automaticBackups,restoreAutoBackup,downloadBlob,handoverHistory,saveAttachment,attachments,getAttachment,deviceIdentity,setTeamContext,clearTeamContext,getTeamContext,enqueueSyncMutation,pendingSyncMutations,markSyncMutationSynced,retrySyncMutation,addSyncConflict,resolveSyncConflict,setRecordServerRevision,applyRemoteSyncPage,applyRemoteAuxData,saveRemoteAttachment,syncStatus,syncCursor,setSyncCursor,local:true};
})();