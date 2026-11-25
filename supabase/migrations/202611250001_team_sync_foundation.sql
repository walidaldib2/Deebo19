-- DEEBO team-mode foundation
-- Apply only to a new Supabase project after reviewing docs/TEAM_SYNC_FOUNDATION.md.
-- This creates the first single-company workspace schema; it does not migrate local device data.

create extension if not exists pgcrypto;

create table if not exists public.deeb_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  is_singleton boolean not null default true unique check (is_singleton)
);

create table if not exists public.deeb_profiles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  display_name text not null,
  role text not null check (role in ('system_admin','security_manager','department_manager','supervisor','security_officer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deeb_branches (
  id text primary key,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  name text not null,
  branch_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, id),
  unique (org_id, branch_code)
);

create table if not exists public.deeb_branch_memberships (
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  branch_id text not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (branch_id, user_id),
  foreign key (org_id, branch_id) references public.deeb_branches(org_id, id) on delete restrict
);

create table if not exists public.deeb_devices (
  id text primary key,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  device_name text not null,
  platform text not null default 'unknown',
  app_version text,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.deeb_records (
  id text primary key,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  branch_id text,
  entity_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  is_archived boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  delete_reason text,
  revision bigint not null default 1 check (revision > 0),
  created_by uuid references auth.users(id) on delete restrict,
  updated_by uuid references auth.users(id) on delete restrict,
  origin_device_id text references public.deeb_devices(id) on delete restrict,
  last_mutation_id text,
  client_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (org_id, branch_id) references public.deeb_branches(org_id, id) on delete restrict,
  unique (org_id, id),
  unique (org_id, last_mutation_id)
);

create index if not exists deeb_records_org_type_updated_idx
  on public.deeb_records (org_id, entity_type, updated_at desc);
create index if not exists deeb_records_org_branch_type_idx
  on public.deeb_records (org_id, branch_id, entity_type);
create index if not exists deeb_records_org_sync_idx
  on public.deeb_records (org_id, updated_at, id);

create table if not exists public.deeb_audit_logs (
  id text primary key,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  branch_id text,
  record_id text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  reason text not null default '',
  actor_user_id uuid references auth.users(id) on delete restrict,
  device_id text references public.deeb_devices(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (org_id, branch_id) references public.deeb_branches(org_id, id) on delete restrict
);
create index if not exists deeb_audit_org_created_idx
  on public.deeb_audit_logs (org_id, created_at desc, id);

create table if not exists public.deeb_approved_reports (
  id text primary key,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  branch_id text,
  title text not null default 'تقرير DEEBO',
  snapshot jsonb not null,
  actor_user_id uuid references auth.users(id) on delete restrict,
  device_id text references public.deeb_devices(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (org_id, branch_id) references public.deeb_branches(org_id, id) on delete restrict
);

create table if not exists public.deeb_handover_versions (
  id text primary key,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  branch_id text,
  record_id text not null,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  reason text not null default '',
  actor_user_id uuid references auth.users(id) on delete restrict,
  device_id text references public.deeb_devices(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (org_id, branch_id) references public.deeb_branches(org_id, id) on delete restrict,
  foreign key (org_id, record_id) references public.deeb_records(org_id, id) on delete restrict,
  unique (record_id, version)
);

create table if not exists public.deeb_attachments (
  id text primary key,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  branch_id text,
  record_id text not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text,
  uploaded_by uuid references auth.users(id) on delete restrict,
  device_id text references public.deeb_devices(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (org_id, branch_id) references public.deeb_branches(org_id, id) on delete restrict,
  foreign key (org_id, record_id) references public.deeb_records(org_id, id) on delete restrict,
  unique (org_id, storage_path)
);

create table if not exists public.deeb_sync_conflicts (
  id text primary key default gen_random_uuid()::text,
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  branch_id text,
  record_id text not null,
  mutation_id text not null,
  base_revision bigint not null,
  server_revision bigint not null,
  local_snapshot jsonb not null,
  server_snapshot jsonb not null,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolution jsonb,
  created_by uuid references auth.users(id) on delete restrict,
  resolved_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  foreign key (org_id, branch_id) references public.deeb_branches(org_id, id) on delete restrict,
  foreign key (org_id, record_id) references public.deeb_records(org_id, id) on delete restrict
);

-- These helpers are SECURITY DEFINER to avoid recursive RLS evaluation.
create or replace function public.deeb_current_org_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select p.org_id
  from public.deeb_profiles p
  where p.user_id = auth.uid() and p.is_active = true
  limit 1
$$;

create or replace function public.deeb_is_org_manager()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.deeb_profiles p
    where p.user_id = auth.uid()
      and p.is_active = true
      and p.role in ('system_admin','security_manager','department_manager')
  )
$$;

create or replace function public.deeb_can_access_branch(target_branch text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select case
    when target_branch is null then public.deeb_is_org_manager()
    when public.deeb_is_org_manager() then true
    else exists (
      select 1 from public.deeb_branch_memberships m
      join public.deeb_profiles p on p.user_id = m.user_id and p.org_id = m.org_id
      where m.user_id = auth.uid()
        and m.org_id = public.deeb_current_org_id()
        and m.branch_id = target_branch
        and p.is_active = true
    )
  end
$$;

alter table public.deeb_organizations enable row level security;
alter table public.deeb_profiles enable row level security;
alter table public.deeb_branches enable row level security;
alter table public.deeb_branch_memberships enable row level security;
alter table public.deeb_devices enable row level security;
alter table public.deeb_records enable row level security;
alter table public.deeb_audit_logs enable row level security;
alter table public.deeb_approved_reports enable row level security;
alter table public.deeb_handover_versions enable row level security;
alter table public.deeb_attachments enable row level security;
alter table public.deeb_sync_conflicts enable row level security;

create policy "deeb organization members read own organization"
on public.deeb_organizations for select to authenticated
using (id = public.deeb_current_org_id());

create policy "deeb users read permitted profiles"
on public.deeb_profiles for select to authenticated
using (org_id = public.deeb_current_org_id()
  and (user_id = auth.uid() or public.deeb_is_org_manager()));

-- Profile role/status changes are intentionally not exposed through direct
-- table updates. A later admin RPC will validate who may invite, deactivate,
-- or change roles without allowing a manager to elevate their own account.

create policy "deeb members read permitted branches"
on public.deeb_branches for select to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_can_access_branch(id));

create policy "deeb managers manage branches"
on public.deeb_branches for all to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_is_org_manager())
with check (org_id = public.deeb_current_org_id() and public.deeb_is_org_manager());

create policy "deeb members read branch assignments"
on public.deeb_branch_memberships for select to authenticated
using (org_id = public.deeb_current_org_id()
  and (user_id = auth.uid() or public.deeb_is_org_manager()));

create policy "deeb managers manage branch assignments"
on public.deeb_branch_memberships for all to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_is_org_manager())
with check (org_id = public.deeb_current_org_id() and public.deeb_is_org_manager());

create policy "deeb users read own devices"
on public.deeb_devices for select to authenticated
using (org_id = public.deeb_current_org_id()
  and (user_id = auth.uid() or public.deeb_is_org_manager()));

create policy "deeb users register own devices"
on public.deeb_devices for insert to authenticated
with check (org_id = public.deeb_current_org_id() and user_id = auth.uid());

create policy "deeb users update own devices"
on public.deeb_devices for update to authenticated
using (org_id = public.deeb_current_org_id() and user_id = auth.uid() and revoked_at is null)
with check (org_id = public.deeb_current_org_id() and user_id = auth.uid());

create policy "deeb users read permitted records"
on public.deeb_records for select to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_can_access_branch(branch_id));

create policy "deeb members insert permitted records"
on public.deeb_records for insert to authenticated
with check (org_id = public.deeb_current_org_id()
  and public.deeb_can_access_branch(branch_id)
  and created_by = auth.uid()
  and updated_by = auth.uid());

create policy "deeb members update permitted records"
on public.deeb_records for update to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_can_access_branch(branch_id))
with check (org_id = public.deeb_current_org_id()
  and public.deeb_can_access_branch(branch_id)
  and updated_by = auth.uid());

create policy "deeb members read audit history"
on public.deeb_audit_logs for select to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_can_access_branch(branch_id));

create policy "deeb members append audit history"
on public.deeb_audit_logs for insert to authenticated
with check (org_id = public.deeb_current_org_id()
  and public.deeb_can_access_branch(branch_id)
  and actor_user_id = auth.uid());

create policy "deeb members read approved reports"
on public.deeb_approved_reports for select to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_can_access_branch(branch_id));

create policy "deeb members create approved reports"
on public.deeb_approved_reports for insert to authenticated
with check (org_id = public.deeb_current_org_id()
  and public.deeb_can_access_branch(branch_id)
  and actor_user_id = auth.uid());

create policy "deeb members read handover versions"
on public.deeb_handover_versions for select to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_can_access_branch(branch_id));

create policy "deeb members append handover versions"
on public.deeb_handover_versions for insert to authenticated
with check (org_id = public.deeb_current_org_id()
  and public.deeb_can_access_branch(branch_id)
  and actor_user_id = auth.uid());

create policy "deeb members read attachments"
on public.deeb_attachments for select to authenticated
using (org_id = public.deeb_current_org_id() and public.deeb_can_access_branch(branch_id));

create policy "deeb members register attachments"
on public.deeb_attachments for insert to authenticated
with check (org_id = public.deeb_current_org_id()
  and public.deeb_can_access_branch(branch_id)
  and uploaded_by = auth.uid());

create policy "deeb members read sync conflicts"
on public.deeb_sync_conflicts for select to authenticated
using (org_id = public.deeb_current_org_id()
  and (public.deeb_is_org_manager() or public.deeb_can_access_branch(branch_id)));

create policy "deeb members create sync conflicts"
on public.deeb_sync_conflicts for insert to authenticated
with check (org_id = public.deeb_current_org_id()
  and public.deeb_can_access_branch(branch_id)
  and created_by = auth.uid());

-- No UPDATE/DELETE policies are intentionally provided for audit logs,
-- approved snapshots, and handover versions. Sync RPCs will be added in a
-- later migration after the mutation and conflict contracts are tested.
