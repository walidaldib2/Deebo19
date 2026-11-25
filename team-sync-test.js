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
  } else if (path.includes("/auth/v1/logout")) {
    data = {};
  } else {
    throw new Error("Unexpected test request: " + path);
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

  await db.save("daily_rosters", { branch_id: "branch-1", work_date: "2026-11-25", note: "تعديل" }, created.id);
  const conflicted = await sync.syncNow();
  assert.equal(conflicted.pushed.conflicts, 1, "Stale server revision should be retained as a conflict");
  assert.equal((await db.syncStatus()).open_conflicts, 1);
  assert.ok(calls.some(x => x.path.includes("/rpc/deeb_enroll_device")));
  assert.ok(calls.some(x => x.path.includes("/rpc/deeb_apply_record_mutation")));
  await sync.signOut();
  assert.equal((await sync.status()).signedIn, false);
  console.log("DEEB19 team sync tests passed");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
