const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
require("fake-indexeddb/auto");

global.window = global;
global.crypto = webcrypto;
require("./db.js");

async function main() {
  const db = global.DebooDB;
  assert.ok(db, "Database API should initialize");

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

  // Bike rule: repeat visits by the same bike are allowed; a sixth distinct bike is rejected.
  for (let i = 1; i <= 5; i++) {
    await db.save("bike_patrols", { bike: "دراجة " + i, patrol_date: "2026-11-19", patrol_time: "10:0" + i });
  }
  await db.save("bike_patrols", { bike: "دراجة 1", patrol_date: "2026-11-19", patrol_time: "11:00" });
  await assert.rejects(
    db.save("bike_patrols", { bike: "دراجة 6", patrol_date: "2026-11-19", patrol_time: "12:00" }),
    /خمس دراجات مختلفة/
  );
  assert.equal((await db.all()).filter(x => x.entity_type === "bike_patrols").length, 6);

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

  console.log("PASS: IndexedDB integration — branch create/read/edit, archive/restore, bike limits, handover versions, report approval, attachments, and daily automatic backups.");
}

main().catch(error => {
  console.error("FAIL: IndexedDB integration", error);
  process.exitCode = 1;
});
