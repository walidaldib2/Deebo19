-- Acknowledged incremental feed for audit history, approved reports,
-- handover versions, and private attachment metadata.
create table if not exists public.deeb_sync_aux_cursors (
  org_id uuid not null references public.deeb_organizations(id) on delete restrict,
  device_id text not null references public.deeb_devices(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  last_created_at timestamptz,
  last_item_id text,
  pending_created_at timestamptz,
  pending_item_id text,
  updated_at timestamptz not null default now(),
  primary key(org_id,device_id)
);
alter table public.deeb_sync_aux_cursors enable row level security;

create or replace function public.deeb_pull_auxiliary(
  p_device_id text,
  p_after_created_at timestamptz default null,
  p_after_item_id text default null,
  p_limit integer default 200
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

  if v_cursor.pending_created_at is null and
     (p_after_created_at is distinct from v_cursor.last_created_at
      or p_after_item_id is distinct from v_cursor.last_item_id) then
    raise exception 'stale_aux_sync_cursor' using errcode='40001';
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
    select f.*,row_number() over(order by f.created_at,f.id) as rn
    from feed f
    where v_cursor.last_created_at is null
       or (f.created_at,f.id)>(v_cursor.last_created_at,coalesce(v_cursor.last_item_id,''))
    order by f.created_at,f.id
    limit v_limit+1
  ), selected as (
    select * from page where rn<=v_limit
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'kind',kind,'id',id,'created_at',created_at,'payload',payload)
      order by created_at,id),'[]'::jsonb),
    count(*),max(created_at),
    (array_agg(id order by created_at desc,id desc))[1]
  into v_items,v_count,v_last_created,v_last_id from selected;

  if v_count>0 then
    select exists(select 1 from page where rn>v_limit) into v_has_more;
    update public.deeb_sync_aux_cursors set
      pending_created_at=v_last_created,pending_item_id=v_last_id,updated_at=now()
    where org_id=v_org and device_id=p_device_id;
  end if;

  return jsonb_build_object('items',v_items,'count',v_count,
    'next_created_at',case when v_count>0 then v_last_created else v_cursor.last_created_at end,
    'next_item_id',case when v_count>0 then v_last_id else v_cursor.last_item_id end,
    'has_more',v_has_more,'awaiting_ack',v_count>0);
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
  if not found or v_cursor.user_id<>v_user
     or v_cursor.pending_created_at is distinct from p_created_at
     or v_cursor.pending_item_id is distinct from p_item_id then
    raise exception 'aux_cursor_ack_does_not_match_pending_page' using errcode='40001';
  end if;
  update public.deeb_sync_aux_cursors set
    last_created_at=p_created_at,last_item_id=p_item_id,
    pending_created_at=null,pending_item_id=null,updated_at=now()
  where org_id=v_org and device_id=p_device_id;
  return jsonb_build_object('ok',true,'created_at',p_created_at,'item_id',p_item_id);
end;
$$;

revoke all on function public.deeb_pull_auxiliary(text,timestamptz,text,integer) from public,anon;
revoke all on function public.deeb_advance_aux_cursor(text,timestamptz,text) from public,anon;
grant execute on function public.deeb_pull_auxiliary(text,timestamptz,text,integer) to authenticated;
grant execute on function public.deeb_advance_aux_cursor(text,timestamptz,text) to authenticated;
