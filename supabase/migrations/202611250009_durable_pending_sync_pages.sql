-- Preserve the exact page payload while awaiting acknowledgement.
-- A retry after a dropped connection must replay identical bytes and boundary.
alter table public.deeb_sync_cursors
  add column if not exists pending_page jsonb;
alter table public.deeb_sync_aux_cursors
  add column if not exists pending_page jsonb;

create or replace function public.deeb_pull_records(
  p_device_id text,p_after_updated_at timestamptz default null,
  p_after_record_id text default null,p_limit integer default 200
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
  v_rows jsonb;
  v_count integer;
  v_last_updated timestamptz;
  v_last_id text;
  v_has_more boolean:=false;
  v_response jsonb;
  v_limit integer:=greatest(1,least(coalesce(p_limit,200),500));
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  select org_id into v_org from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null then raise exception 'organization_access_denied' using errcode='42501'; end if;
  if not exists(select 1 from public.deeb_devices where id=p_device_id
    and org_id=v_org and user_id=v_user and revoked_at is null) then
    raise exception 'device_not_enrolled_or_revoked' using errcode='42501';
  end if;

  insert into public.deeb_sync_cursors(org_id,device_id,user_id)
  values(v_org,p_device_id,v_user)
  on conflict(org_id,device_id) do nothing;
  select * into v_cursor from public.deeb_sync_cursors
   where org_id=v_org and device_id=p_device_id for update;

  if v_cursor.user_id<>v_user
     or p_after_updated_at is distinct from v_cursor.last_updated_at
     or p_after_record_id is distinct from v_cursor.last_record_id then
    raise exception 'stale_sync_cursor' using errcode='40001';
  end if;

  if v_cursor.pending_page is not null then
    return v_cursor.pending_page;
  end if;

  with page as (
    select r.*,row_number() over(order by r.updated_at,r.id) as rn
    from public.deeb_records r
    where r.org_id=v_org and public.deeb_can_access_branch(r.branch_id)
      and (v_cursor.last_updated_at is null or
        (r.updated_at,r.id)>(v_cursor.last_updated_at,coalesce(v_cursor.last_record_id,'')))
    order by r.updated_at,r.id limit v_limit+1
  ), selected as (
    select * from page where rn<=v_limit
  )
  select coalesce(jsonb_agg(to_jsonb(selected)-'rn' order by selected.updated_at,selected.id),'[]'::jsonb),
    count(*),max(updated_at),
    (array_agg(id order by updated_at desc,id desc))[1],
    exists(select 1 from page where rn>v_limit)
  into v_rows,v_count,v_last_updated,v_last_id,v_has_more
  from selected;

  v_response:=jsonb_build_object(
    'records',v_rows,'count',v_count,
    'next_updated_at',case when v_count>0 then v_last_updated else v_cursor.last_updated_at end,
    'next_record_id',case when v_count>0 then v_last_id else v_cursor.last_record_id end,
    'has_more',v_has_more,'awaiting_ack',v_count>0
  );
  if v_count>0 then
    update public.deeb_sync_cursors set
      pending_updated_at=v_last_updated,pending_record_id=v_last_id,
      pending_page=v_response,updated_at=now()
    where org_id=v_org and device_id=p_device_id;
  end if;
  return v_response;
end;
$$;

create or replace function public.deeb_advance_sync_cursor(
  p_device_id text,p_updated_at timestamptz,p_record_id text
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
  select * into v_cursor from public.deeb_sync_cursors
   where org_id=v_org and device_id=p_device_id for update;
  if not found or v_cursor.user_id<>v_user or v_cursor.pending_page is null
     or v_cursor.pending_updated_at is distinct from p_updated_at
     or v_cursor.pending_record_id is distinct from p_record_id then
    raise exception 'cursor_ack_does_not_match_pending_page' using errcode='40001';
  end if;
  update public.deeb_sync_cursors set
    last_updated_at=p_updated_at,last_record_id=p_record_id,
    pending_updated_at=null,pending_record_id=null,pending_page=null,updated_at=now()
  where org_id=v_org and device_id=p_device_id;
  return jsonb_build_object('ok',true,'updated_at',p_updated_at,'record_id',p_record_id);
end;
$$;

create or replace function public.deeb_pull_auxiliary(
  p_device_id text,p_after_created_at timestamptz default null,
  p_after_item_id text default null,p_limit integer default 200
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_cursor public.deeb_sync_aux_cursors%rowtype;
  v_items jsonb;
  v_count integer;
  v_last_created timestamptz;
  v_last_id text;
  v_has_more boolean:=false;
  v_response jsonb;
  v_limit integer:=greatest(1,least(coalesce(p_limit,200),500));
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  select org_id into v_org from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null then raise exception 'organization_access_denied' using errcode='42501'; end if;
  if not exists(select 1 from public.deeb_devices where id=p_device_id
    and org_id=v_org and user_id=v_user and revoked_at is null) then
    raise exception 'device_not_enrolled_or_revoked' using errcode='42501';
  end if;
  insert into public.deeb_sync_aux_cursors(org_id,device_id,user_id)
  values(v_org,p_device_id,v_user)
  on conflict(org_id,device_id) do nothing;
  select * into v_cursor from public.deeb_sync_aux_cursors
   where org_id=v_org and device_id=p_device_id for update;

  if v_cursor.user_id<>v_user
     or p_after_created_at is distinct from v_cursor.last_created_at
     or p_after_item_id is distinct from v_cursor.last_item_id then
    raise exception 'stale_aux_sync_cursor' using errcode='40001';
  end if;
  if v_cursor.pending_page is not null then
    return v_cursor.pending_page;
  end if;

  with feed as (
    select 'audit'::text as kind,a.id,a.created_at,to_jsonb(a) as payload
      from public.deeb_audit_logs a
      where a.org_id=v_org and public.deeb_can_access_branch(a.branch_id)
    union all
    select 'approved_report',r.id,r.created_at,to_jsonb(r)
      from public.deeb_approved_reports r
      where r.org_id=v_org and public.deeb_can_access_branch(r.branch_id)
    union all
    select 'handover_version',h.id,h.created_at,to_jsonb(h)
      from public.deeb_handover_versions h
      where h.org_id=v_org and public.deeb_can_access_branch(h.branch_id)
    union all
    select 'attachment',a.id,a.created_at,to_jsonb(a)
      from public.deeb_attachments a
      where a.org_id=v_org and a.upload_status='uploaded'
        and public.deeb_can_access_branch(a.branch_id)
  ), page as (
    select f.*,f.kind||':'||f.id as cursor_id,
      row_number() over(order by f.created_at,f.kind,f.id) as rn
    from feed f
    where v_cursor.last_created_at is null
       or (f.created_at,f.kind||':'||f.id)>
          (v_cursor.last_created_at,coalesce(v_cursor.last_item_id,''))
    order by f.created_at,f.kind,f.id
    limit v_limit+1
  ), selected as (
    select * from page where rn<=v_limit
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'kind',kind,'id',id,'created_at',created_at,'payload',payload)
      order by created_at,kind,id),'[]'::jsonb),
    count(*),max(created_at),
    (array_agg(cursor_id order by created_at desc,cursor_id desc))[1],
    exists(select 1 from page where rn>v_limit)
  into v_items,v_count,v_last_created,v_last_id,v_has_more from selected;

  v_response:=jsonb_build_object('items',v_items,'count',v_count,
    'next_created_at',case when v_count>0 then v_last_created else v_cursor.last_created_at end,
    'next_item_id',case when v_count>0 then v_last_id else v_cursor.last_item_id end,
    'has_more',v_has_more,'awaiting_ack',v_count>0);
  if v_count>0 then
    update public.deeb_sync_aux_cursors set
      pending_created_at=v_last_created,pending_item_id=v_last_id,
      pending_page=v_response,updated_at=now()
    where org_id=v_org and device_id=p_device_id;
  end if;
  return v_response;
end;
$$;

create or replace function public.deeb_advance_aux_cursor(
  p_device_id text,p_created_at timestamptz,p_item_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_cursor public.deeb_sync_aux_cursors%rowtype;
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  select org_id into v_org from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null then raise exception 'organization_access_denied' using errcode='42501'; end if;
  if not exists(select 1 from public.deeb_devices where id=p_device_id
    and org_id=v_org and user_id=v_user and revoked_at is null) then
    raise exception 'device_not_enrolled_or_revoked' using errcode='42501';
  end if;
  select * into v_cursor from public.deeb_sync_aux_cursors
   where org_id=v_org and device_id=p_device_id for update;
  if not found or v_cursor.user_id<>v_user or v_cursor.pending_page is null
     or v_cursor.pending_created_at is distinct from p_created_at
     or v_cursor.pending_item_id is distinct from p_item_id then
    raise exception 'aux_cursor_ack_does_not_match_pending_page' using errcode='40001';
  end if;
  update public.deeb_sync_aux_cursors set
    last_created_at=p_created_at,last_item_id=p_item_id,
    pending_created_at=null,pending_item_id=null,pending_page=null,updated_at=now()
  where org_id=v_org and device_id=p_device_id;
  return jsonb_build_object('ok',true,'created_at',p_created_at,'item_id',p_item_id);
end;
$$;

revoke all on function public.deeb_pull_records(text,timestamptz,text,integer) from public,anon;
revoke all on function public.deeb_advance_sync_cursor(text,timestamptz,text) from public,anon;
revoke all on function public.deeb_pull_auxiliary(text,timestamptz,text,integer) from public,anon;
revoke all on function public.deeb_advance_aux_cursor(text,timestamptz,text) from public,anon;
grant execute on function public.deeb_pull_records(text,timestamptz,text,integer) to authenticated;
grant execute on function public.deeb_advance_sync_cursor(text,timestamptz,text) to authenticated;
grant execute on function public.deeb_pull_auxiliary(text,timestamptz,text,integer) to authenticated;
grant execute on function public.deeb_advance_aux_cursor(text,timestamptz,text) to authenticated;
