const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
require("fake-indexeddb/auto");

global.window = global;
global.crypto = webcrypto;
global.DEEBNativePlugins = { FileExport: { saveFile: async () => ({ saved: true }) } };
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
// Seed a version-3 database before the app opens it, then verify the v4 upgrade is additive.
const legacyDbReady = new Promise((resolve, reject) => {
  const request = indexedDB.open("DEBOO16_LOCAL_DB", 3);
  request.onupgradeneeded = () => {
    const d = request.result;
    if (!d.objectStoreNames.contains("records")) {
      const store = d.createObjectStore("records", { keyPath: "id" });
      store.createIndex("entity_type", "entity_type", { unique: false });
      store.createIndex("created_at", "created_at", { unique: false });
    }
    if (!d.objectStoreNames.contains("audit_logs")) d.createObjectStore("audit_logs", { keyPath: "id" });
    if (!d.objectStoreNames.contains("approved_reports")) d.createObjectStore("approved_reports", { keyPath: "id" });
    if (!d.objectStoreNames.contains("handover_versions")) {
      const store = d.createObjectStore("handover_versions", { keyPath: "id" });
      store.createIndex("record_id", "record_id", { unique: false });
      store.createIndex("created_at", "created_at", { unique: false });
    }
    if (!d.objectStoreNames.contains("attachments")) {
      const store = d.createObjectStore("attachments", { keyPath: "id" });
      store.createIndex("record_id", "record_id", { unique: false });
    }
    if (!d.objectStoreNames.contains("automatic_backups")) d.createObjectStore("automatic_backups", { keyPath: "id" });
    request.transaction.objectStore("records").put({
      id: "legacy-before-sync-upgrade", entity_type: "branches",
      payload: { name: "سجل قديم يجب ألا يضيع" }, branch_id: null, status: "active",
      is_archived: false, is_deleted: false, created_at: "2026-11-01T00:00:00.000Z",
      updated_at: "2026-11-01T00:00:00.000Z", created_by: "local"
    });
  };
  request.onsuccess = () => { request.result.close(); resolve(); };
  request.onerror = () => reject(request.error);
});
require("./db.js");

async function main() {
  await legacyDbReady;
  const db = global.DebooDB;
  assert.ok(db, "Database API should initialize");
  const legacyRecord = await db.getRecord("legacy-before-sync-upgrade");
  assert.equal(legacyRecord?.payload?.name, "سجل قديم يجب ألا يضيع", "Version-3 records must survive the additive version-4 upgrade");
  const upgraded = await new Promise((resolve, reject) => {
    const request = indexedDB.open("DEBOO16_LOCAL_DB");
    request.onsuccess = () => { const d = request.result; const info = { version: d.version, stores: [...d.objectStoreNames] }; d.close(); resolve(info); };
    request.onerror = () => reject(request.error);
  });
  assert.equal(upgraded.version, 4, "Sync foundation must use IndexedDB schema version 4");
  for (const store of ["records", "audit_logs", "approved_reports", "handover_versions", "attachments", "automatic_backups", "sync_state", "sync_outbox", "sync_conflicts"]) {
    assert.ok(upgraded.stores.includes(store), "Database upgrade must preserve/create store " + store);
  }

  // Version 4 is additive: legacy operational stores remain present and local mode stays the default.
  const localStatus = await db.syncStatus();
  assert.equal(localStatus.mode, "local", "Fresh installs must remain in local-only mode");
  assert.equal(localStatus.pending, 0);
  const deviceA = await db.deviceIdentity();
  const deviceB = await db.deviceIdentity();
  assert.equal(deviceA.device_id, deviceB.device_id, "Device identity must persist across calls");
  assert.ok(deviceA.device_id, "Every installation must have a stable device identifier");
  await assert.rejects(
    () => db.enqueueSyncMutation({ record_id: "local-only", entity_type: "branches", action: "create" }),
    /الوضع الفردي المحلي/
  );

  // Team mode queue is durable, ordered, retryable, idempotent, and separate from local-only behavior.
  await db.setTeamContext({ org_id: "org-qa", user_id: "user-qa", display_name: "اختبار" });
  const queued = await db.enqueueSyncMutation({
    mutation_id: "mutation-qa-001", record_id: "record-qa-001", entity_type: "branches",
    action: "create", branch_id: "branch-qa", base_revision: 0,
    snapshot: { name: "فرع مزامنة اختبار" }
  });
  const duplicateQueue = await db.enqueueSyncMutation({
    mutation_id: "mutation-qa-001", record_id: "record-qa-001", entity_type: "branches",
    action: "create", snapshot: { name: "نسخة مكررة لا تستبدل الأصل" }
  });
  assert.equal(duplicateQueue.snapshot.name, "فرع مزامنة اختبار", "Replayed mutation IDs must not overwrite the original queued mutation");
  assert.equal(queued.device_id, deviceA.device_id);
  assert.equal(queued.org_id, "org-qa");
  assert.equal((await db.pendingSyncMutations()).filter(x => x.mutation_id === queued.mutation_id).length, 1);
  const retried = await db.retrySyncMutation(queued.mutation_id, "انقطاع اتصال تجريبي");
  assert.equal(retried.attempts, 1);
  assert.ok(retried.next_attempt_at > new Date().toISOString(), "Retry must use backoff instead of a tight loop");
  const acknowledged = await db.markSyncMutationSynced(queued.mutation_id, 2);
  assert.equal(acknowledged.status, "synced");
  assert.equal(acknowledged.server_revision, 2);
  const conflictedMutation = await db.enqueueSyncMutation({
    mutation_id: "mutation-qa-002", record_id: "record-qa-002", entity_type: "incidents",
    action: "create", snapshot: { description: "تعديل محلي متعارض" }
  });
  const conflict = await db.addSyncConflict({
    record_id: "record-qa-002", mutation_id: conflictedMutation.mutation_id, base_revision: 1,
    server_revision: 2, local_snapshot: { description: "محلي" }, server_snapshot: { description: "سحابي" }
  });
  assert.equal(conflict.status, "open");
  assert.equal((await db.pendingSyncMutations()).some(x => x.mutation_id === conflictedMutation.mutation_id), false,
    "Conflicted mutations must pause instead of retrying forever");
  const resolved = await db.resolveSyncConflict(conflict.id, {
    choice: "keep_local", snapshot: { description: "نسخة محلية بعد المراجعة" }
  });
  assert.equal(resolved.status, "resolved");
  const requeued = (await db.pendingSyncMutations()).find(x => x.mutation_id === conflictedMutation.mutation_id);
  assert.equal(requeued.base_revision, 2, "Manual keep-local resolution must rebase on the latest server revision");
  assert.equal(requeued.snapshot.description, "نسخة محلية بعد المراجعة");
  await db.setSyncCursor({ updated_at: "2026-11-25T00:00:00.000Z", id: "cursor-qa" });
  assert.equal((await db.syncCursor()).id, "cursor-qa");

  // Normal record writes now enter the outbox in the same IndexedDB transaction.
  const teamBranch = await db.save("branches", { name: "فرع حفظ جماعي", code: "TEAM-QA" });
  let queuedRecord = (await db.pendingSyncMutations()).find(x => x.record_id === teamBranch.id);
  assert.ok(queuedRecord, "Saving a record in team mode must enqueue it automatically");
  assert.equal(queuedRecord.action, "create");
  assert.equal(queuedRecord.snapshot.record.payload.name, "فرع حفظ جماعي");
  await db.archive(teamBranch.id);
  queuedRecord = (await db.pendingSyncMutations()).find(x => x.record_id === teamBranch.id && x.action === "archive");
  assert.ok(queuedRecord, "Archiving a record must also enqueue automatically");
  await db.unarchive(teamBranch.id);
  assert.ok((await db.pendingSyncMutations()).some(x => x.record_id === teamBranch.id && x.action === "unarchive"));

  const teamBikeVisit = await db.save("bike_patrols", {
    bike: "دراجة مزامنة", person: "فرد اختبار", site: "موقع اختبار",
    patrol_date: "2026-11-25", patrol_time: "12:00"
  });
  await db.softDelete(teamBikeVisit.id);
  assert.ok((await db.pendingSyncMutations()).some(x => x.record_id === teamBikeVisit.id && x.action === "soft_delete"));
  await db.restoreDeleted(teamBikeVisit.id);
  assert.ok((await db.pendingSyncMutations()).some(x => x.record_id === teamBikeVisit.id && x.action === "restore_deleted"));

  const teamHandover = await db.save("handovers", { sender: "تسليم جماعي", receiver: "استلام جماعي" });
  const queuedHandover = (await db.pendingSyncMutations()).find(x => x.record_id === teamHandover.id && x.action === "handover_version");
  assert.ok(queuedHandover, "Handover record and immutable version must be represented by a queued sync mutation");
  assert.ok(queuedHandover.snapshot.handover_version?.snapshot?.payload?.sender === "تسليم جماعي");

  const teamAttachmentBlob = new Blob(["team attachment"], { type: "text/plain" });
  Object.defineProperty(teamAttachmentBlob, "name", { value: "team.txt" });
  const teamAttachment = await db.saveAttachment(teamBranch.id, teamAttachmentBlob);
  assert.ok((await db.pendingSyncMutations()).some(x => x.action === "attachment" && x.snapshot.attachment.id === teamAttachment.id),
    "Attachment metadata must be queued while the binary remains safely in IndexedDB");

  const teamApproved = await db.approve({ title: "اعتماد جماعي", branch_id: "branch-qa", data: [] });
  assert.ok((await db.pendingSyncMutations()).some(x => x.action === "approve" && x.snapshot.approved_report.id === teamApproved.id),
    "Approved report snapshots must be queued as append-only mutations");

  const teamOldRoster = await db.save("daily_rosters", {
    work_date: "2026-11-20", shift: "اختبار جماعي", start_time: "07:00", end_time: "15:00",
    patrol_people_ids: [], bike_ids: []
  });
  await db.archivePastDays("2026-11-25");
  assert.ok((await db.pendingSyncMutations()).some(x => x.action === "archive" && x.record_id === teamOldRoster.id),
    "Automatic shift archiving must also enter the outbox");

  const localSwitch = await db.clearTeamContext();
  assert.equal(localSwitch.mode, "local");
  assert.equal((await db.syncStatus()).synced, 1, "Switching back to local mode must retain sync history");
  const pendingBeforeLocalSave = (await db.syncStatus()).pending;
  await db.save("branches", { name: "فرع فردي بعد فصل المزامنة", code: "LOCAL-QA" });
  assert.equal((await db.syncStatus()).pending, pendingBeforeLocalSave, "Local-only writes must not enter the team outbox");

  // Backup restore must validate bike patrol_date, not the time-only patrol_time field.
  await db.restore({app:"DEEB",format:2,records:[{id:"bike-restore-check",entity_type:"bike_patrols",payload:{bike:"دراجة اختبار",patrol_date:"2026-11-18",patrol_time:"09:35"},created_at:"2026-11-18T09:35:00.000Z"}],audit_logs:[]});
  assert.ok((await db.all()).some(x=>x.id==="bike-restore-check"), "A valid HH:mm motorcycle visit should restore successfully");

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

  // Soft-deleted motorcycle visits must be recoverable until the 30-day retention expires.
  const recoverableVisit = await db.save("bike_patrols", {
    bike: "دراجة استعادة اختبار", person: "فرد اختبار", site: "موقع اختبار",
    patrol_date: "2026-11-20", patrol_time: "12:00"
  });
  await db.softDelete(recoverableVisit.id);
  assert.equal((await db.all()).some(x => x.id === recoverableVisit.id), false, "Soft-deleted visits must leave active operations");
  assert.equal((await db.all({ deleted: true })).some(x => x.id === recoverableVisit.id), true, "Soft-deleted visits must appear in their recovery list");
  await db.restoreDeleted(recoverableVisit.id);
  assert.equal((await db.all()).some(x => x.id === recoverableVisit.id), true, "Restored visits must return to active operations");
  assert.equal((await db.all({ deleted: true })).some(x => x.id === recoverableVisit.id), false, "Restored visits must leave the deleted list");

  const expiredVisit = await db.save("bike_patrols", {
    bike: "دراجة انتهاء اختبار", person: "فرد اختبار", site: "موقع اختبار",
    patrol_date: "2026-11-20", patrol_time: "12:30"
  });
  await db.softDelete(expiredVisit.id);
  const expiredCount = await db.purgeExpiredDeleted(new Date(Date.now() + 31 * 24 * 60 * 60 * 1000));
  assert.ok(expiredCount >= 1, "Expired soft-deleted visits must be purged after the retention window");
  assert.equal(await db.getRecord(expiredVisit.id), null, "Purged visits must no longer exist in the records store");
  assert.ok((await db.audit()).some(x => x.record_id === expiredVisit.id && x.action === "permanent_delete"), "Permanent expiry must remain visible in the audit log");

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

  // Full external backup round-trip must preserve records, audit, approved reports,
  // handover versions, and attachment bytes—not only attachment metadata.
  const fullBackup = await db.backup();
  assert.ok(fullBackup.attachments.some(x => x.id === incidentAttachment.id && x.data_url.startsWith("data:text/plain;base64,")));
  await db.restore(fullBackup);
  assert.ok((await db.getRecord(incident.id))?.payload?.description === "اختبار مرفق بلاغ");
  assert.ok((await db.attachments(incident.id)).some(x => x.id === incidentAttachment.id));
  assert.ok((await db.getAttachment(incidentAttachment.id))?.blob?.size > 0);
  assert.ok((await db.approvedReports()).some(x => x.id === approved.id));
  assert.equal((await db.handoverHistory(handover.id)).length, 1);

  // A malformed backup must be rejected before any current records are cleared.
  const beforeInvalidRestore = (await db.all()).length;
  await assert.rejects(
    () => db.restore({ app: "DEEB", format: 2, records: [{ id: "broken", entity_type: "branches", payload: [] }], audit_logs: [] }),
    /سجل غير صالح/
  );
  assert.equal((await db.all()).length, beforeInvalidRestore, "Invalid backup must not mutate current records");

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

  console.log("PASS: IndexedDB integration — branch CRUD/archive, dynamic bike patrols and backup restore, handover versions, report approval, attachments, and daily automatic backups.");
}

main().catch(error => {
  console.error("FAIL: IndexedDB integration", error);
  process.exitCode = 1;
});