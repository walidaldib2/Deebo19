import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const rank: Record<string, number> = {
  system_admin: 5,
  security_manager: 4,
  department_manager: 3,
  supervisor: 2,
  security_officer: 1,
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json(500, { error: "server_environment_not_configured" });

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json(401, { error: "authentication_required" });

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await caller.auth.getUser();
  if (authError || !authData.user) return json(401, { error: "invalid_session" });

  const { data: actor, error: actorError } = await admin.from("deeb_profiles")
    .select("user_id,org_id,role,is_active")
    .eq("user_id", authData.user.id).maybeSingle();
  if (actorError) return json(500, { error: "actor_lookup_failed" });
  if (!actor?.is_active || !["system_admin", "security_manager", "department_manager"].includes(actor.role)) {
    return json(403, { error: "user_admin_permission_denied" });
  }

  let body: { target_user_id?: string; action?: string; role?: string };
  try { body = await req.json(); } catch { return json(400, { error: "invalid_json" }); }
  const targetId = String(body.target_user_id ?? "").trim();
  const action = String(body.action ?? "");
  const newRole = String(body.role ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)
      || !["change_role", "deactivate", "reactivate"].includes(action)) {
    return json(400, { error: "invalid_user_admin_request" });
  }
  if (targetId === authData.user.id) return json(400, { error: "cannot_change_own_account" });

  const { data: target, error: targetError } = await admin.from("deeb_profiles")
    .select("user_id,org_id,role,is_active")
    .eq("user_id", targetId).eq("org_id", actor.org_id).maybeSingle();
  if (targetError) return json(500, { error: "target_lookup_failed" });
  if (!target) return json(404, { error: "target_user_not_found_in_organization" });
  if ((rank[target.role] ?? 99) >= rank[actor.role]) {
    return json(403, { error: "cannot_manage_equal_or_higher_role" });
  }

  if (action === "change_role") {
    if (!Object.prototype.hasOwnProperty.call(rank, newRole) || newRole === "system_admin" || rank[newRole] >= rank[actor.role]) {
      return json(403, { error: "role_assignment_not_permitted" });
    }
    const { error } = await admin.from("deeb_profiles").update({
      role: newRole,
      updated_at: new Date().toISOString(),
    }).eq("user_id", targetId).eq("org_id", actor.org_id);
    if (error) return json(500, { error: "role_update_failed" });
    if (!["supervisor", "security_officer"].includes(newRole)) {
      await admin.from("deeb_branch_memberships").delete().eq("org_id", actor.org_id).eq("user_id", targetId);
    }
    return json(200, { ok: true, user_id: targetId, role: newRole });
  }

  if (action === "deactivate") {
    const { error } = await admin.from("deeb_profiles").update({
      is_active: false,
      updated_at: new Date().toISOString(),
    }).eq("user_id", targetId).eq("org_id", actor.org_id);
    if (error) return json(500, { error: "deactivation_failed" });
    await admin.from("deeb_devices").update({ revoked_at: new Date().toISOString() })
      .eq("org_id", actor.org_id).eq("user_id", targetId).is("revoked_at", null);
    return json(200, { ok: true, user_id: targetId, active: false, devices_revoked: true });
  }

  const { error } = await admin.from("deeb_profiles").update({
    is_active: true,
    updated_at: new Date().toISOString(),
  }).eq("user_id", targetId).eq("org_id", actor.org_id);
  if (error) return json(500, { error: "reactivation_failed" });
  return json(200, { ok: true, user_id: targetId, active: true, devices_require_reenrollment: true });
});
