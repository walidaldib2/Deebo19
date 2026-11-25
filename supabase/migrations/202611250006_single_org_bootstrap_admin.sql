-- DEEB19 first-admin bootstrap and controlled branch administration.
-- The first authenticated account can claim the empty singleton workspace once.

create or replace function public.deeb_bootstrap_organization(
  p_organization_name text,
  p_display_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_name text:=left(trim(coalesce(p_organization_name,'')),160);
  v_display text:=left(trim(coalesce(p_display_name,'')),120);
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  if v_name='' or v_display='' then raise exception 'invalid_bootstrap_details' using errcode='22023'; end if;

  perform pg_advisory_xact_lock(hashtext('deebo-singleton-organization-bootstrap'));
  if exists(select 1 from public.deeb_organizations) then
    raise exception 'organization_already_initialized' using errcode='23505';
  end if;
  if exists(select 1 from public.deeb_profiles where user_id=v_user) then
    raise exception 'user_already_has_profile' using errcode='23505';
  end if;

  insert into public.deeb_organizations(name,is_singleton)
  values(v_name,true) returning id into v_org;

  insert into public.deeb_profiles(user_id,org_id,display_name,role,is_active)
  values(v_user,v_org,v_display,'system_admin',true);

  return jsonb_build_object('ok',true,'org_id',v_org,'user_id',v_user,
    'role','system_admin','organization_name',v_name);
end;
$$;

create or replace function public.deeb_admin_upsert_branch(
  p_branch_id text,
  p_branch_name text,
  p_branch_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_role text;
  v_id text:=trim(coalesce(p_branch_id,''));
  v_name text:=left(trim(coalesce(p_branch_name,'')),180);
  v_code text:=nullif(left(trim(coalesce(p_branch_code,'')),80),'');
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  select org_id,role into v_org,v_role from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null or v_role not in ('system_admin','security_manager','department_manager') then
    raise exception 'branch_admin_permission_denied' using errcode='42501';
  end if;
  if v_id='' or v_name='' then raise exception 'invalid_branch_details' using errcode='22023'; end if;

  insert into public.deeb_branches(id,org_id,name,branch_code,is_active)
  values(v_id,v_org,v_name,v_code,true)
  on conflict(id) do update set name=excluded.name,branch_code=excluded.branch_code,
    is_active=true,updated_at=now()
  where public.deeb_branches.org_id=excluded.org_id;

  if not exists(select 1 from public.deeb_branches where id=v_id and org_id=v_org) then
    raise exception 'branch_id_belongs_to_another_organization' using errcode='42501';
  end if;
  return jsonb_build_object('ok',true,'branch_id',v_id,'org_id',v_org);
end;
$$;

create or replace function public.deeb_admin_assign_branch(
  p_user_id uuid,
  p_branch_id text,
  p_assigned boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid:=auth.uid();
  v_org uuid;
  v_role text;
  v_target_org uuid;
  v_target_role text;
begin
  if v_actor is null then raise exception 'authentication_required' using errcode='28000'; end if;
  select org_id,role into v_org,v_role from public.deeb_profiles
   where user_id=v_actor and is_active=true;
  if v_org is null or v_role not in ('system_admin','security_manager','department_manager') then
    raise exception 'branch_assignment_permission_denied' using errcode='42501';
  end if;
  select org_id,role into v_target_org,v_target_role from public.deeb_profiles
   where user_id=p_user_id and is_active=true;
  if v_target_org is distinct from v_org or v_target_role is null then
    raise exception 'target_user_not_in_organization' using errcode='42501';
  end if;
  if v_target_role not in ('supervisor','security_officer') then
    raise exception 'only_field_staff_receive_branch_assignments' using errcode='22023';
  end if;
  if not exists(select 1 from public.deeb_branches
    where id=p_branch_id and org_id=v_org and is_active=true) then
    raise exception 'branch_not_found' using errcode='22023';
  end if;

  if p_assigned then
    insert into public.deeb_branch_memberships(org_id,branch_id,user_id)
    values(v_org,p_branch_id,p_user_id)
    on conflict(branch_id,user_id) do nothing;
  else
    delete from public.deeb_branch_memberships
     where org_id=v_org and branch_id=p_branch_id and user_id=p_user_id;
  end if;
  return jsonb_build_object('ok',true,'user_id',p_user_id,
    'branch_id',p_branch_id,'assigned',p_assigned);
end;
$$;

revoke all on function public.deeb_bootstrap_organization(text,text) from public,anon;
revoke all on function public.deeb_admin_upsert_branch(text,text,text) from public,anon;
revoke all on function public.deeb_admin_assign_branch(uuid,text,boolean) from public,anon;
grant execute on function public.deeb_bootstrap_organization(text,text) to authenticated;
grant execute on function public.deeb_admin_upsert_branch(text,text,text) to authenticated;
grant execute on function public.deeb_admin_assign_branch(uuid,text,boolean) to authenticated;
