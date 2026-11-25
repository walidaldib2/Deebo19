/* DEEB19 team sync client. No service-role secret is ever used here. */
(() => {
  "use strict";
  const AUTH_DB = "DEEB19_TEAM_AUTH";
  const AUTH_STORE = "session";
  const CONFIG_KEY = "DEEB19_TEAM_CONFIG";
  let syncLock = null;

  function config() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || "null"); }
    catch { return null; }
  }
  function normalizeConfig(input) {
    const url = String(input?.url || "").trim().replace(/\/+$/, "");
    const anonKey = String(input?.anonKey || "").trim();
    if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(url) || !anonKey) {
      throw new Error("أدخل رابط مشروع Supabase ومفتاح anon/public الصحيح.");
    }
    return { url, anonKey };
  }
  function saveConfig(input) {
    const value = normalizeConfig(input);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(value));
    return { url: value.url, configured: true };
  }
  function authDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(AUTH_DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(AUTH_STORE)) req.result.createObjectStore(AUTH_STORE, { keyPath: "key" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("تعذر فتح مخزن جلسة الفريق."));
    });
  }
  async function readSession() {
    const db = await authDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(AUTH_STORE, "readonly").objectStore(AUTH_STORE).get("active");
      req.onsuccess = () => resolve(req.result?.value || null);
      req.onerror = () => reject(req.error);
    });
  }
  async function writeSession(value) {
    const db = await authDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUTH_STORE, "readwrite");
      if (value) tx.objectStore(AUTH_STORE).put({ key: "active", value });
      else tx.objectStore(AUTH_STORE).delete("active");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error("تعذر حفظ جلسة الفريق."));
      tx.onabort = () => reject(tx.error || new Error("تم إلغاء حفظ جلسة الفريق."));
    });
  }
  async function request(path, options = {}, token = null) {
    const cfg = config();
    if (!cfg) throw new Error("إعداد الاتصال بالسيرفر غير مكتمل.");
    const headers = {
      apikey: cfg.anonKey,
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(cfg.url + path, { ...options, headers });
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
    if (!response.ok) {
      const message = data?.msg || data?.message || data?.error_description || data?.error || raw || ("HTTP " + response.status);
      const error = new Error(String(message).slice(0, 500));
      error.status = response.status;
      error.code = data?.code || null;
      throw error;
    }
    return data;
  }
  async function refreshSession(session) {
    const cfg = config();
    const data = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    const next = { ...session, ...data, saved_at: Date.now() };
    await writeSession(next);
    return next;
  }
  async function activeSession(force = false) {
    let session = await readSession();
    if (!session?.access_token || !session?.refresh_token) throw new Error("سجّل الدخول إلى إدارة DEEB19 أولًا.");
    if (force || (session.expires_at && session.expires_at * 1000 < Date.now() + 90000)) {
      session = await refreshSession(session);
    }
    return session;
  }
  async function signIn(email, password) {
    const cfg = config();
    if (!cfg) throw new Error("يجب إعداد رابط Supabase ومفتاح anon/public أولًا.");
    const data = await request("/auth/v1/token?grant_type=password", {
      method: "POST", body: JSON.stringify({ email: String(email || "").trim(), password: String(password || "") })
    });
    await writeSession({ ...data, saved_at: Date.now() });
    const user = await currentUser(data.access_token);
    return { user, expires_at: data.expires_at };
  }
  async function currentUser(token = null) {
    const session = token ? null : await activeSession();
    return request("/auth/v1/user", { method: "GET" }, token || session.access_token);
  }
  async function signOut() {
    try {
      const session = await readSession();
      if (session?.access_token) await request("/auth/v1/logout", { method: "POST" }, session.access_token);
    } finally {
      await writeSession(null);
      if (window.DebooDB) await window.DebooDB.clearTeamContext();
    }
  }
  async function rpc(name, args, token) {
    return request("/rest/v1/rpc/" + encodeURIComponent(name), {
      method: "POST", body: JSON.stringify(args)
    }, token);
  }
  async function enroll(session, profile, device) {
    const result = await rpc("deeb_enroll_device", {
      p_device_id: device.device_id,
      p_device_name: (navigator.userAgent || "DEEB19 device").slice(0, 120),
      p_platform: /android/i.test(navigator.userAgent) ? "android" : "web",
      p_app_version: "DEEB19-team"
    }, session.access_token);
    if (!result?.ok) throw new Error("تعذر تسجيل هذا الجهاز لدى الإدارة.");
    return result;
  }
  async function pushRecord(mutation, token) {
    const result = await rpc("deeb_apply_record_mutation", { p_mutation: mutation }, token);
    if (result?.conflict) {
      await window.DebooDB.addSyncConflict({
        record_id: mutation.record_id, mutation_id: mutation.mutation_id,
        base_revision: result.base_revision || mutation.base_revision,
        server_revision: result.server_revision || 0,
        local_snapshot: mutation.snapshot, server_snapshot: result.server_snapshot || null
      });
      return { conflict: true };
    }
    if (!result?.ok) throw new Error("لم يؤكد السيرفر حفظ السجل.");
    await window.DebooDB.markSyncMutationSynced(mutation.mutation_id, result.server_revision || null);
    await window.DebooDB.setRecordServerRevision(mutation.record_id, result.server_revision || 1);
    return { synced: true };
  }
  async function pushApprovedReport(mutation, token) {
    const result = await rpc("deeb_apply_append_mutation", { p_mutation: mutation }, token);
    if (!result?.ok) throw new Error("لم يؤكد السيرفر اعتماد التقرير.");
    await window.DebooDB.markSyncMutationSynced(mutation.mutation_id, null);
    return { synced: true };
  }
  async function sha256(blob) {
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
  }
  async function pushAttachment(mutation, token) {
    const item = mutation.snapshot?.attachment;
    if (!item?.id || !item.record_id) throw new Error("بيانات المرفق المحلي غير مكتملة.");
    const local = await window.DebooDB.getAttachment(item.id);
    if (!local?.blob) throw new Error("ملف المرفق غير موجود على هذا الجهاز؛ لم يتم تأكيد مزامنته.");
    const hash = await sha256(local.blob);
    const prepared = await rpc("deeb_prepare_attachment", {
      p_attachment_id: item.id, p_record_id: item.record_id,
      p_device_id: mutation.device_id, p_file_name: item.name || "attachment",
      p_mime_type: item.type || "application/octet-stream",
      p_size_bytes: Number(item.size || local.size), p_sha256: hash
    }, token);
    if (!prepared?.ok || !prepared.object_path) throw new Error("لم يتم حجز مسار آمن للمرفق.");
    if (prepared.upload_status !== "uploaded") {
      const cfg = config();
      const uploadUrl = cfg.url + "/storage/v1/object/" +
        encodeURIComponent(prepared.bucket_id) + "/" +
        prepared.object_path.split("/").map(encodeURIComponent).join("/");
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          apikey: cfg.anonKey,
          Authorization: "Bearer " + token,
          "Content-Type": item.type || "application/octet-stream",
          "x-upsert": "false"
        },
        body: local.blob
      });
      if (!response.ok) {
        const body = await response.text();
        if (!(response.status === 409 || /already exists/i.test(body))) {
          throw new Error("فشل رفع المرفق: " + body.slice(0, 300));
        }
      }
      await rpc("deeb_finalize_attachment", { p_attachment_id: item.id, p_audit: mutation.snapshot?.audit || null }, token);
    }
    await window.DebooDB.markSyncMutationSynced(mutation.mutation_id, null);
    return { synced: true, attachment: true };
  }
  async function pushPending(session, userId) {
    const pending = await window.DebooDB.pendingSyncMutations(100);
    const result = { sent: 0, conflicts: 0, failed: 0, blocked_other_user: 0 };
    for (const row of pending) {
      if (row.user_id !== userId) { result.blocked_other_user++; continue; }
      const envelope = {
        mutation_id: row.mutation_id, record_id: row.record_id,
        action: row.action, branch_id: row.branch_id || null,
        org_id: row.org_id, user_id: row.user_id, device_id: row.device_id,
        base_revision: row.base_revision || 0, local_updated_at: row.local_updated_at,
        schema_version: row.schema_version || 4, snapshot: row.snapshot
      };
      try {
        let outcome;
        if (["create", "update", "archive", "unarchive", "soft_delete", "restore_deleted", "handover_version"].includes(row.action)) {
          outcome = await pushRecord(envelope, session.access_token);
        } else if (row.action === "approve") {
          outcome = await pushApprovedReport(envelope, session.access_token);
        } else if (row.action === "attachment") {
          outcome = await pushAttachment(envelope, session.access_token);
        } else {
          throw new Error("نوع عملية المزامنة غير مدعوم: " + row.action);
        }
        if (outcome.conflict) result.conflicts++;
        else result.sent++;
      } catch (error) {
        await window.DebooDB.retrySyncMutation(row.mutation_id, error);
        result.failed++;
        if (error.status === 401 || error.status === 403) break;
      }
    }
    return result;
  }
  async function pullPages(session, device) {
    let cursor = await window.DebooDB.syncCursor();
    const result = { pages: 0, records: 0, skipped_local: 0 };
    for (let page = 0; page < 20; page++) {
      const data = await rpc("deeb_pull_records", {
        p_device_id: device.device_id,
        p_after_updated_at: cursor?.updated_at || null,
        p_after_record_id: cursor?.record_id || null,
        p_limit: 200
      }, session.access_token);
      const rows = Array.isArray(data?.records) ? data.records : [];
      if (!rows.length) break;
      const applied = await window.DebooDB.applyRemoteSyncPage(rows);
      result.pages++; result.records += applied.applied; result.skipped_local += applied.skipped_local;
      const updatedAt = data.next_updated_at;
      const recordId = data.next_record_id;
      if (!updatedAt || !recordId || !data.awaiting_ack) {
        throw new Error("استجابة صفحة المزامنة لا تحتوي على نقطة تأكيد صالحة.");
      }
      await rpc("deeb_advance_sync_cursor", {
        p_device_id: device.device_id, p_updated_at: updatedAt, p_record_id: recordId
      }, session.access_token);
      cursor = { updated_at: updatedAt, record_id: recordId };
      await window.DebooDB.setSyncCursor(cursor);
      if (!data.has_more) break;
    }
    return result;
  }
  async function bootstrapOrganization(organizationName, displayName) {
    const session = await activeSession();
    const result = await rpc("deeb_bootstrap_organization", {
      p_organization_name: String(organizationName || "").trim(),
      p_display_name: String(displayName || "").trim()
    }, session.access_token);
    if (!result?.ok || !result.org_id) throw new Error("تعذر إنشاء إدارة DEEB19 الأولى.");
    return result;
  }
  async function syncNow() {
    if (syncLock) return syncLock;
    syncLock = (async () => {
      const cfg = config();
      if (!cfg) throw new Error("لم يتم إعداد اتصال الإدارة بعد.");
      const session = await activeSession();
      const user = await currentUser(session.access_token);
      const profile = await request(
        "/rest/v1/deeb_profiles?select=user_id,org_id,display_name,role,is_active&user_id=eq." +
        encodeURIComponent(user.id) + "&limit=1",
        { method: "GET" }, session.access_token
      );
      if (!Array.isArray(profile) || !profile[0]?.is_active) throw new Error("حسابك غير مفعل داخل إدارة DEEB19.");
      const team = await window.DebooDB.setTeamContext({
        org_id: profile[0].org_id, user_id: user.id, display_name: profile[0].display_name
      });
      const device = await window.DebooDB.deviceIdentity();
      await enroll(session, profile[0], device);
      await rpc("deeb_touch_device", { p_device_id: device.device_id }, session.access_token);
      const pushed = await pushPending(session, user.id);
      const pulled = await pullPages(session, device);
      return { ok: true, mode: team.mode, pushed, pulled, status: await window.DebooDB.syncStatus() };
    })();
    try { return await syncLock; }
    finally { syncLock = null; }
  }
  function status() {
    return { configured: !!config(), signedIn: !!readSession, url: config()?.url || null };
  }
  window.DEEBTeamSync = {
    configure: saveConfig, signIn, signOut, currentUser, bootstrapOrganization, syncNow,
    status: async () => ({ configured: !!config(), signedIn: !!(await readSession()), url: config()?.url || null })
  };
  window.addEventListener("online", () => {
    if (config()) window.DebooDB?.getTeamContext?.().then(ctx => {
      if (ctx?.mode === "team") syncNow().catch(error => console.warn("DEEB19 sync:", error));
    });
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && config()) window.DebooDB?.getTeamContext?.().then(ctx => {
      if (ctx?.mode === "team") syncNow().catch(error => console.warn("DEEB19 sync:", error));
    });
  });
})();
