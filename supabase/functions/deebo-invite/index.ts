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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return json(500, { error: "server_environment_not_configured" });
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json(401, { error: "authentication_required" });
  }

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await caller.auth.getUser();
  if (authError || !authData.user) return json(401, { error: "invalid_session" });

  const { data: actor, error: actorError } = await admin
    .from("deeb_profiles")
    .select("user_id,org_id,role,is_active")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (actorError) return json(500, { error: "actor_lookup_failed" });
  if (!actor?.is_active || !["system_admin", "security_manager", "department_manager"].includes(actor.role)) {
    return json(403, { error: "invite_permission_denied" });
  }

  let body: {
    email?: string;
    display_name?: string;
    role?: string;
    branch_ids?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const displayName = String(body.display_name ?? "").trim().slice(0, 120);
  const role = String(body.role ?? "");
  const branchIds = Array.isArray(body.branch_ids)
    ? [...new Set(body.branch_ids.map((x) => String(x).trim()).filter(Boolean))]
    : [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName) {
    return json(400, { error: "invalid_invitation_details" });
  }

  const allowedByActor: Record<string, string[]> = {
    system_admin: ["security_manager", "department_manager", "supervisor", "security_officer"],
    security_manager: ["department_manager", "supervisor", "security_officer"],
    department_manager: ["supervisor", "security_officer"],
  };
  if (!allowedByActor[actor.role]?.includes(role)) {
    return json(403, { error: "role_assignment_not_permitted" });
  }
  if (branchIds.length > 100 || (["supervisor", "security_officer"].includes(role) === false && branchIds.length)) {
    return json(400, { error: "invalid_branch_assignments" });
  }

  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName },
  });
  if (inviteError || !invitation.user) {
    return json(400, { error: inviteError?.message ?? "invitation_failed" });
  }

  const newUserId = invitation.user.id;
  const { error: profileError } = await admin.from("deeb_profiles").insert({
    user_id: newUserId,
    org_id: actor.org_id,
    display_name: displayName,
    role,
    is_active: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(newUserId);
    return json(500, { error: "profile_creation_failed_invitation_rolled_back" });
  }

  if (branchIds.length) {
    const { data: branches, error: branchLookupError } = await admin
      .from("deeb_branches")
      .select("id")
      .eq("org_id", actor.org_id)
      .eq("is_active", true)
      .in("id", branchIds);
    if (branchLookupError || (branches?.length ?? 0) !== branchIds.length) {
      await admin.from("deeb_profiles").delete().eq("user_id", newUserId);
      await admin.auth.admin.deleteUser(newUserId);
      return json(400, { error: "one_or_more_branches_not_found_invitation_rolled_back" });
    }
    const memberships = branchIds.map((branch_id) => ({
      org_id: actor.org_id,
      branch_id,
      user_id: newUserId,
    }));
    const { error: membershipError } = await admin
      .from("deeb_branch_memberships")
      .insert(memberships);
    if (membershipError) {
      await admin.from("deeb_profiles").delete().eq("user_id", newUserId);
      await admin.auth.admin.deleteUser(newUserId);
      return json(500, { error: "branch_assignment_failed_invitation_rolled_back" });
    }
  }

  const { error: auditError } = await admin.from("deeb_audit_logs").insert({
    id: crypto.randomUUID(),
    org_id: actor.org_id,
    branch_id: null,
    record_id: null,
    action: "user_invited",
    old_data: null,
    new_data: { user_id: newUserId, email, display_name: displayName, role, branch_ids: branchIds },
    reason: "دعوة مستخدم جديد إلى إدارة DEEB19",
    actor_user_id: authData.user.id,
    device_id: null,
    created_at: new Date().toISOString(),
  });
  if (auditError) {
    if (branchIds.length) {
      await admin.from("deeb_branch_memberships").delete().eq("org_id", actor.org_id).eq("user_id", newUserId);
    }
    await admin.from("deeb_profiles").delete().eq("user_id", newUserId).eq("org_id", actor.org_id);
    await admin.auth.admin.deleteUser(newUserId);
    return json(500, { error: "invitation_audit_failed_invitation_rolled_back" });
  }

  return json(200, {
    ok: true,
    invited_user_id: newUserId,
    role,
    assigned_branches: branchIds.length,
  });
});
