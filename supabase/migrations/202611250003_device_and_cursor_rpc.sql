-- DEEB19 authenticated device enrollment and monotonic sync cursor RPCs.
-- Requires migrations 001 and 002. No client may directly register devices or
-- write synchronization cursors.

drop policy if exists "deeb users register own devices" on public.deeb_devices;
drop policy if exists "deeb users update own devices" on public.deeb_devices;

create or replace function public.deeb_enroll_device(
  p_device_id text,
  p_device_name text,
  p_platform text default 'unknown',
  p_app_version text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_device public.deeb_devices%rowtype;
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  if coalesce(trim(p_device_id),'')='' or coalesce(trim(p_device_name),'')='' then
    raise exception 'invalid_device_details' using errcode='22023';
  end if;
  select org_id into v_org from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null then raise exception 'organization_access_denied' using errcode='42501'; end if;

  insert into public.deeb_devices
    (id,org_id,user_id,device_name,platform,app_version,last_seen_at)
  values
    (p_device_id,v_org,v_user,left(trim(p_device_name),120),
     left(coalesce(nullif(trim(p_platform),''),'unknown'),40),
     nullif(left(trim(coalesce(p_app_version,'')),40),''),now())
  on conflict (id) do nothing;

  select * into v_device from public.deeb_devices where id=p_device_id;
  if not found or v_device.org_id<>v_org or v_device.user_id<>v_user
     or v_device.revoked_at is not null then
    raise exception 'device_id_already_claimed_or_revoked' using errcode='42501';
  end if;

  update public.deeb_devices set
    device_name=left(trim(p_device_name),120),
    platform=left(coalesce(nullif(trim(p_platform),''),'unknown'),40),
    app_version=nullif(left(trim(coalesce(p_app_version,'')),40),''),
    last_seen_at=now()
  where id=p_device_id;

  return jsonb_build_object('ok',true,'device_id',p_device_id,'org_id',v_org,
    'user_id',v_user,'revoked',false);
end;
$$;

create or replace function public.deeb_touch_device(p_device_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_user uuid:=auth.uid(); v_org uuid;
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  select org_id into v_org from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null then raise exception 'organization_access_denied' using errcode='42501'; end if;
  update public.deeb_devices set last_seen_at=now()
   where id=p_device_id and org_id=v_org and user_id=v_user and revoked_at is null;
  return found;
end;
$$;

create or replace function public.deeb_advance_sync_cursor(
  p_device_id text,
  p_updated_at timestamptz,
  p_record_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_cursor public.deeb_sync_cursors%rowtype;
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  if p_updated_at is null or coalesce(p_record_id,'')='' then
    raise exception 'invalid_sync_cursor' using errcode='22023';
  end if;
  select org_id into v_org from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null then raise exception 'organization_access_denied' using errcode='42501'; end if;
  if not exists(select 1 from public.deeb_devices where id=p_device_id
    and org_id=v_org and user_id=v_user and revoked_at is null) then
    raise exception 'device_not_enrolled_or_revoked' using errcode='42501';
  end if;

  insert into public.deeb_sync_cursors
    (org_id,device_id,user_id,last_updated_at,last_record_id,updated_at)
  values(v_org,p_device_id,v_user,p_updated_at,p_record_id,now())
  on conflict(org_id,device_id) do update set
    last_updated_at=excluded.last_updated_at,
    last_record_id=excluded.last_record_id,
    updated_at=now()
  where public.deeb_sync_cursors.user_id=excluded.user_id
    and (public.deeb_sync_cursors.last_updated_at is null
      or (excluded.last_updated_at,excluded.last_record_id)>
         (public.deeb_sync_cursors.last_updated_at,
          coalesce(public.deeb_sync_cursors.last_record_id,'')));

  select * into v_cursor from public.deeb_sync_cursors
   where org_id=v_org and device_id=p_device_id;
  return jsonb_build_object('updated_at',v_cursor.last_updated_at,
    'record_id',v_cursor.last_record_id);
end;
$$;

revoke all on function public.deeb_enroll_device(text,text,text,text) from public,anon;
revoke all on function public.deeb_touch_device(text) from public,anon;
revoke all on function public.deeb_advance_sync_cursor(text,timestamptz,text) from public,anon;
grant execute on function public.deeb_enroll_device(text,text,text,text) to authenticated;
grant execute on function public.deeb_touch_device(text) to authenticated;
grant execute on function public.deeb_advance_sync_cursor(text,timestamptz,text) to authenticated;
