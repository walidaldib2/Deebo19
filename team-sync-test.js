const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
require("fake-indexeddb/auto");

global.window = global;
global.crypto = webcrypto;
global.navigator = { userAgent: "DEEB19 test device", onLine: true };
global.localStorage = (() => {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key) };
})();
global.document = { hidden: false, addEventListener() {} };
global.addEventListener = () => {};
global.DEEBNativePlugins = { FileExport: { saveFile: async () => ({ saved: true }) } };

const user = { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.test" };
const org = "22222222-2222-4222-8222-222222222222";
let recordApplyCount = 0;
let auxiliaryPullCount = 0;
let preparedAttachmentPath = null;
const calls = [];
global.fetch = async (url, options = {}) => {
  const path = String(url);
  calls.push({ path, method: options.method || "GET" });
  let data = {};
  if (path.includes("/auth/v1/token?grant_type=password")) {
    data = { access_token: "access-test", refresh_token: "refresh-test",
      expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user };
  } else if (path.endsWith("/auth/v1/user")) {
    data = user;
  } else if (path.includes("/rest/v1/deeb_profiles")) {
    data = [{ user_id: user.id, org_id: org, display_name: "مدير اختبار",
      role: "system_admin", is_active: true }];
  } else if (path.includes("/rest/v1/rpc/deeb_bootstrap_organization")) {
    data = { ok: true, org_id: org, role: "system_admin" };
  } else if (path.includes("/rest/v1/rpc/deeb_enroll_device")) {
    data = { ok: true, device_id: "test-device" };
  } else if (path.includes("/rest/v1/rpc/deeb_touch_device")) {
    data = true;
  } else if (path.includes("/rest/v1/rpc/deeb_apply_record_mutation")) {
    recordApplyCount++;
    if (recordApplyCount === 1) data = { ok: true, conflict: false, server_revision: 1 };
    else data = { ok: false, conflict: true, base_revision: 1, server_revision: 2,
      server_snapshot: { id: "record-1", revision: 2, entity_type: "daily_rosters" } };
  } else if (path.includes("/rest/v1/rpc/deeb_pull_records")) {
    data = { records: [], count: 0, has_more: false, awaiting_ack: false };
  } else if (path.includes("/rest/v1/rpc/deeb_advance_sync_cursor")) {
    data = { ok: true };
  } else if (path.includes("/rest/v1/rpc/deeb_pull_auxiliary")) {
    auxiliaryPullCount++;
    if (auxiliaryPullCount === 1) {
      data = {
        items: [{ kind: "audit", id: "audit-remote-1", created_at: "2026-11-25T10:00:00.000Z",
          payload: { id: "audit-remote-1", org_id: org, record_id: "remote-record",
            action: "create", reason: "اختبار مزامنة", created_at: "2026-11-25T10:00:00.000Z" } }],
        count: 1, next_created_at: "2026-11-25T10:00:00.000Z",
        next_item_id: "audit:audit-remote-1", has_more: false, awaiting_ack: true
      };
    } else if (auxiliaryPullCount === 2) {
      data = {
        items: [{ kind: "attachment", id: "attachment-remote-1", created_at: "2026-11-25T10:01:00.000Z",
          payload: { id: "attachment-remote-1", org_id: org, record_id: "remote-record",
            storage_path: org + "/remote-record/attachment-remote-1", file_name: "remote.txt",
            mime_type: "text/plain", size_bytes: 11, created_at: "2026-11-25T10:01:00.000Z" } }],
        count: 1, next_created_at: "2026-11-25T10:01:00.000Z",
        next_item_id: "attachment:attachment-remote-1", has_more: false, awaiting_ack: true
      };
    } else data = { items: [], count: 0, has_more: false, awaiting_ack: false };
  } else if (path.includes("/rest/v1/rpc/deeb_advance_aux_cursor")) {
    data = { ok: true };
  } else if (path.includes("/rest/v1/rpc/deeb_prepare_attachment")) {
    const args = JSON.parse(options.body);
    preparedAttachmentPath = org + "/" + args.p_record_id + "/" + args.p_attachment_id;
    data = { ok: true, bucket_id: "deebo-private", object_path: preparedAttachmentPath,
      attachment_id: args.p_attachment_id, upload_status: "pending" };
  } else if (path.includes("/rest/v1/rpc/deeb_finalize_attachment")) {
    data = { ok: true, upload_status: "uploaded" };
  } else if (path.includes("/auth/v1/logout")) {
    data = {};
  } else {
    throw new Error("Unexpected test request: " + path);
  }
  if (path.includes("/storage/v1/object/authenticated/deebo-private/")) {
    return new Response(new Blob(["remote file"], { type: "text/plain" }), { status: 200 });
  }
  if (path.includes("/storage/v1/object/deebo-private/") && options.method === "POST") {
    return new Response(JSON.stringify({ Key: preparedAttachmentPath }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify(data), {
    status: 200, headers: { "Content-Type": "application/json" }
  });
};

require("./db.js");
require("./team-sync.js");

(async () => {
  const db = global.DebooDB;
  const sync = global.DEEBTeamSync;
  assert.ok(db && sync, "Local database and team sync module should load");
  assert.throws(() => sync.configure({ url: "not-a-url", anonKey: "x" }), /رابط مشروع Supabase/);
  sync.configure({ url: "https://deebo-test.supabase.co", anonKey: "public-anon-key" });
  const login = await sync.signIn(user.email, "test-password");
  assert.equal(login.user.id, user.id);
  const boot = await sync.bootstrapOrganization("إدارة اختبار", "مدير اختبار");
  assert.equal(boot.org_id, org);

  const firstSync = await sync.syncNow();
  assert.equal(firstSync.ok, true);
  assert.equal(firstSync.mode, "team");
  assert.equal((await db.getTeamContext()).org_id, org);

  const created = await db.save("daily_rosters", { branch_id: "branch-1", work_date: "2026-11-25" });
  const sent = await sync.syncNow();
  assert.equal(sent.pushed.sent, 1, "A local queued record should be sent and acknowledged");
  assert.equal((await db.getRecord(created.id)).server_revision, 1);
  assert.equal((await db.syncStatus()).pending, 0);
  const remoteAttachment = await db.getAttachment("attachment-remote-1");
  assert.equal(remoteAttachment.blob.size, 11, "Remote private attachment bytes should be downloaded and persisted before cursor acknowledgement");

  await db.saveAttachment(created.id, new File(["local file"], "local.txt", { type: "text/plain" }));
  const attachmentSync = await sync.syncNow();
  assert.equal(attachmentSync.pushed.sent, 1, "Local attachment metadata and bytes should upload before acknowledgement");
  assert.ok(calls.some(x => x.path.includes("/storage/v1/object/deebo-private/") && x.method === "POST"));
  assert.equal((await db.syncStatus()).pending, 0);

  await db.save("daily_rosters", { branch_id: "branch-1", work_date: "2026-11-25", note: "تعديل" }, created.id);
  const conflicted = await sync.syncNow();
  assert.equal(conflicted.pushed.conflicts, 1, "Stale server revision should be retained as a conflict");
  assert.equal((await db.syncStatus()).open_conflicts, 1);
  assert.ok(calls.some(x => x.path.includes("/rpc/deeb_enroll_device")));
  assert.ok(calls.some(x => x.path.includes("/rpc/deeb_apply_record_mutation")));
  assert.ok(calls.some(x => x.path.includes("/rpc/deeb_pull_auxiliary")));
  assert.equal((await db.audit()).some(x => x.id === "audit-remote-1"), true, "Remote audit rows should be persisted locally before cursor acknowledgement");
  await sync.signOut();
  assert.equal((await sync.status()).signedIn, false);
  console.log("DEEB19 team sync tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
