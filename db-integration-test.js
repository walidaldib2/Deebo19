const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
require("fake-indexeddb/auto");

global.window = global;
global.crypto = webcrypto;
let nativeSaveCount = 0;
global.DEEBNativePlugins = { FileExport: { saveFile: async () => { nativeSaveCount++; return { saved: true }; } } };
global.FileReader = class {
  async readAsDataURL(blob) {
    try {
      const bytes = Buffer.from(await blob.arrayBuffer());
      this.result = "data:" + (blob.type || "application/octet-stream") + ";base64," + bytes.toString("base64");
      this.onload?.({ target: this });
    } catch (error) {
      this.error = error;
      this.onerror?.(error);
    }
  }
};
require("./db.js");

async function main() {
  const db = global.DebooDB;
  assert.ok(db, "Database API should initialize");

  // Backup restore must validate bike patrol_date, not the time-only patrol_time field.
  await db.restore({app:"DEEB",format:2,records:[{id:"bike-restore-check",entity_type:"bike_patrols",payload:{bike:"دراجة اختبار",patrol_date:"2026-11-18",patrol_time:"09:35"},created_at:"2026-11-18T09:35:00.000Z"}],audit_logs:[]});
  assert.ok((await db.all()).some(x=>x.id==="bike-restore-check"), "A valid HH:mm motorcycle visit should restore successfully");
  const beforeInvalidRestore=(await db.all()).map(x=>x.id).sort();
  await assert.rejects(db.restore({app:"DEEB",format:2,records:[{id:"invalid-calendar-bike",entity_type:"bike_patrols",payload:{bike:"دراجة بتاريخ غير صحيح",patrol_date:"2026-02-31",patrol_time:"09:35"},created_at:"2026-02-28T09:35:00.000Z"}],audit_logs:[]}),/تاريخ غير صالح/);
  assert.deepEqual((await db.all()).map(x=>x.id).sort(),beforeInvalidRestore,"An impossible calendar date must not replace existing records");
  await assert.rejects(db.restore({app:"DEEB",format:2,records:[{id:"invalid-written-date",entity_type:"written_reports",payload:{report_date:"2026-02-31",report_text:"اختبار"},created_at:"2026-02-28T09:35:00.000Z"}],audit_logs:[]}),/تاريخ غير صالح/);
  assert.deepEqual((await db.all()).map(x=>x.id).sort(),beforeInvalidRestore,"An invalid written-report date must not replace existing records");

  // Every operational record rejects impossible calendar dates before persistence.
  for (const [type,field] of [["daily_rosters","work_date"],["incidents","incident_date"],["written_reports","report_date"],["absences","absence_date"],["handovers","handover_date"],["emergencies","emergency_date"],["tasks","task_date"],["branch_patrols","work_date"],["manager_rounds","work_date"]]) {
    await assert.rejects(db.save(type,{[field]:"2026-02-31",description:"invalid date"}),/التاريخ المدخل غير صحيح/);
  }
  await assert.rejects(db.archivePastDays("2026-02-31"),/تاريخ الأرشفة غير صحيح/);

  // Existing audit-only data must also trigger a pre-restore safety export.
  await db.restore({app:"DEEB",format:2,records:[],audit_logs:[{id:"audit-only-before-restore",action:"test"}]});
  const savesBeforeAuditOnlyRestore = nativeSaveCount;
  await db.restore({app:"DEEB",format:2,records:[],audit_logs:[]});
  assert.equal(nativeSaveCount,savesBeforeAuditOnlyRestore+1,"Audit-only local data must be backed up before restore replaces it");

  // Branch create, primary-key read-back, and audit are one committed operation.
  const branch = await db.save("branches", { name: "فرع اختبار آلي", code: "QA-01" });
  const storedBranch = await db.getRecord(branch.id);
  assert.equal(storedBranch?.entity_type, "branches");
  assert.equal(storedBranch?.payload?.name, "فرع اختبار آلي");
  assert.ok((await db.audit()).some(x => x.record_id === branch.id && x.action === "create"));

  // Editing must update the same record, not create a duplicate.
  const edited = await db.save("branches", { name: "فرع اختبار معدل", code: "QA-01", edit_reason: "اختبار" }, branch.id);
  assert.equal(edited.id, branch.id);
  assert.equal((await db.all()).filter(x => x.entity_type === "branches").length, 1);
  assert.equal((await db.getRecord(branch.id)).payload.name, "فرع اختبار معدل");

  // Archive and restore must move the record between active and archived views.
  await db.archive(branch.id);
  assert.equal((await db.all()).some(x => x.id === branch.id), false);
  assert.equal((await db.all({ archived: true })).some(x => x.id === branch.id), true);
  await db.unarchive(branch.id);
  assert.equal((await db.all()).some(x => x.id === branch.id), true);

  // Bike registry is dynamic: ten distinct bikes and repeated visits must all save.
  for (let i = 1; i <= 10; i++) {
    await db.save("bike_patrols", { bike: "دراجة " + i, patrol_date: "2026-11-19", patrol_time: "10:" + String(i).padStart(2,"0") });
  }
  await db.save("bike_patrols", { bike: "دراجة 1", patrol_date: "2026-11-19", patrol_time: "11:00" });
  assert.equal((await db.all()).filter(x => x.entity_type === "bike_patrols").length, 12);

  // Motorcycle patrol records preserve the actual person who conducted each visit.
  const namedVisit = await db.save("bike_patrols", { bike: "دراجة 1", person: "فرد مرور اختبار", site: "مخزن اختبار", patrol_date: "2026-11-19", patrol_time: "11:30" });
  assert.equal((await db.getRecord(namedVisit.id)).payload.person, "فرد مرور اختبار");
  const secondPersonVisit = await db.save("bike_patrols", { bike: "دراجة 1", person: "فرد آخر", site: "معرض اختبار", patrol_date: "2026-11-19", patrol_time: "11:45" });
  assert.equal((await db.getRecord(secondPersonVisit.id)).payload.person, "فرد آخر");

  // Handover snapshots and report approvals remain linked to their records.
  const handover = await db.save("handovers", { sender: "مُسلّم", receiver: "مُستلم" });
  const history = await db.handoverHistory(handover.id);
  assert.equal(history.length, 1);
  assert.equal(history[0].snapshot.payload.sender, "مُسلّم");
  const approved = await db.approve({ title: "اختبار", data: [] });
  assert.ok(approved.id);
  assert.ok((await db.audit()).some(x => x.record_id === approved.id && x.action === "approve"));

  // Attachment and its audit entry are persisted together.
  const blob = new Blob(["test"], { type: "text/plain" });
  Object.defineProperty(blob, "name", { value: "test.txt" });
  const attachment = await db.saveAttachment(branch.id, blob);
  assert.equal((await db.attachments(branch.id)).some(x => x.id === attachment.id), true);
  assert.ok((await db.audit()).some(x => x.record_id === branch.id && x.action === "attachment"));
  const attachmentCountBeforeOrphan = (await db.attachments(branch.id)).length;
  await assert.rejects(db.saveAttachment("missing-record-for-attachment", blob), /السجل المرتبط بالمرفق غير موجود/);
  assert.equal((await db.attachments(branch.id)).length, attachmentCountBeforeOrphan);
  assert.equal((await db.attachments("missing-record-for-attachment")).length, 0);

  // Daily automatic snapshots are local, bounded, and include the saved records.
  const auto = await db.createAutoBackup();
  assert.equal(auto.created, false);
  assert.equal(auto.updated, true);
  const backups = await db.automaticBackups();
  assert.equal(backups.length, 1);
  assert.equal(backups[0].record_count, (await db.all()).length);
  const again = await db.createAutoBackup();
  assert.equal(again.created, false);
  assert.equal(again.updated, true);
  assert.equal((await db.automaticBackups()).length, 1);

  // Incident records can own photo/document attachments just like documents.
  const incident = await db.save("incidents", { incident_type: "أمني", description: "اختبار مرفق بلاغ" });
  const incidentAttachment = await db.saveAttachment(incident.id, blob);
  assert.equal((await db.attachments(incident.id)).some(x => x.id === incidentAttachment.id), true);

  // Backup restore must also accept more than five distinct bikes on one day.
  const tenBikeBackup = {
    app: "DEEB", format: 2,
    records: Array.from({ length: 10 }, (_, i) => ({
      id: "restore-bike-" + (i + 1),
      entity_type: "bike_patrols",
      payload: { bike: "دراجة " + (i + 1), patrol_date: "2026-11-20", patrol_time: "08:00" },
      created_at: "2026-11-20T08:00:00.000Z"
    })),
    audit_logs: []
  };
  await db.restore(tenBikeBackup);
  assert.equal((await db.all()).filter(x => x.entity_type === "bike_patrols").length, 10);

  // Daily shift formations must archive by their own work date and remain separate by shift.
  const masterPerson = await db.save("patrol_people", { name: "فرد أساسي للاختبار", employee_no: "ROSTER-01", status: "متاح" });
  const masterBike = await db.save("bikes", { number: "دراجة أساسية للاختبار", status: "جاهزة" });
  const yesterdayRoster = await db.save("daily_rosters", {
    work_date: "2026-11-21", shift: "صباحي", start_time: "07:00", end_time: "15:00",
    patrol_people_ids: [masterPerson.id], bike_ids: [masterBike.id]
  });
  const todayRoster = await db.save("daily_rosters", {
    work_date: "2026-11-22", shift: "مسائي", start_time: "15:00", end_time: "23:00",
    patrol_people_ids: [], bike_ids: []
  });
  assert.equal((await db.getRecord(yesterdayRoster.id)).payload.shift_key, "2026-11-21|صباحي");
  assert.equal((await db.getRecord(todayRoster.id)).payload.shift_key, "2026-11-22|مسائي");
  const archivedResult = await db.archivePastDays("2026-11-22");
  assert.ok(archivedResult.archived >= 1, "Previous-day operational records should archive");
  assert.equal((await db.all()).some(x => x.id === yesterdayRoster.id), false, "Yesterday's roster should leave active operations");
  assert.equal((await db.all({ archived: true })).some(x => x.id === yesterdayRoster.id), true, "Yesterday's roster should be available in archive");
  assert.equal((await db.all()).some(x => x.id === todayRoster.id), true, "Today's roster should remain active");
  assert.equal((await db.all()).some(x => x.id === masterPerson.id), true, "Master patrol people must remain active");
  assert.equal((await db.all()).some(x => x.id === masterBike.id), true, "Master bikes must remain active");
  const editedArchivedRoster = await db.save("daily_rosters", {
    work_date: "2026-11-21", shift: "صباحي", start_time: "07:00", end_time: "15:00",
    patrol_people_ids: [], bike_ids: [], edit_reason: "اختبار تعديل سجل مؤرشف"
  }, yesterdayRoster.id);
  assert.equal(editedArchivedRoster.is_archived, true, "Editing an archived shift must not unarchive it");
  assert.equal((await db.getRecord(yesterdayRoster.id)).payload.work_date, "2026-11-21", "Editing must preserve the original work date");

  // Imported attachment size metadata must be rebuilt from the actual restored Blob.
  const restoredAttachmentText = "actual attachment bytes";
  await db.restore({
    app: "DEEB", format: 2,
    records: [{ id: "restore-attachment-parent", entity_type: "incidents", payload: { description: "اختبار استعادة مرفق" } }],
    audit_logs: [],
    attachments: [{
      id: "restore-attachment-size", record_id: "restore-attachment-parent",
      name: "restored.txt", type: "text/plain", size: 1,
      data_url: "data:text/plain;base64," + Buffer.from(restoredAttachmentText).toString("base64")
    }]
  });
  const restoredAttachment = await db.getAttachment("restore-attachment-size");
  assert.equal(restoredAttachment.size, Buffer.byteLength(restoredAttachmentText), "Restored attachment size must match the actual Blob, not untrusted backup metadata");

  console.log("PASS: IndexedDB integration — branch CRUD/archive, dynamic bike patrols and backup restore, handover versions, report approval, attachments, and daily automatic backups.");
}

main().catch(error => {
  console.error("FAIL: IndexedDB integration", error);
  process.exitCode = 1;
});