-- DEEB19 acknowledged incremental pages.
-- A device can only commit the exact page boundary returned by its latest pull;
-- it cannot arbitrarily jump the cursor and silently skip records.

alter table public.deeb_sync_cursors
  add column if not exists pending_updated_at timestamptz,
  add column if not exists pending_record_id text;

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
  v_has_more boolean;
  v_after_updated timestamptz;
  v_after_id text;
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

  if v_cursor.pending_updated_at is null then
    if p_after_updated_at is distinct from v_cursor.last_updated_at
       or p_after_record_id is distinct from v_cursor.last_record_id then
      raise exception 'stale_sync_cursor' using errcode='40001';
    end if;
  end if;

  v_after_updated:=v_cursor.last_updated_at;
  v_after_id:=v_cursor.last_record_id;

  with page as (
    select r.*,row_number() over(order by r.updated_at,r.id) as sync_row_number
    from public.deeb_records r
    where r.org_id=v_org and public.deeb_can_access_branch(r.branch_id)
      and (v_after_updated is null or
        (r.updated_at,r.id)>(v_after_updated,coalesce(v_after_id,'')))
    order by r.updated_at,r.id limit v_limit+1
  ), selected as (
    select * from page where sync_row_number<=v_limit
  )
  select coalesce(jsonb_agg(to_jsonb(selected)-'sync_row_number'
      order by selected.updated_at,selected.id),'[]'::jsonb),
    count(*),max(updated_at),
    (array_agg(id order by updated_at desc,id desc))[1]
  into v_rows,v_count,v_last_updated,v_last_id from selected;

  if v_count>0 then
    select exists(select 1 from public.deeb_records r
      where r.org_id=v_org and public.deeb_can_access_branch(r.branch_id)
        and (r.updated_at,r.id)>(v_last_updated,v_last_id))
    into v_has_more;
    update public.deeb_sync_cursors set
      pending_updated_at=v_last_updated,
      pending_record_id=v_last_id,
      updated_at=now()
    where org_id=v_org and device_id=p_device_id;
  else
    v_has_more:=false;
  end if;

  return jsonb_build_object('records',v_rows,'count',v_count,
    'next_updated_at',case when v_count>0 then v_last_updated else v_cursor.last_updated_at end,
    'next_record_id',case when v_count>0 then v_last_id else v_cursor.last_record_id end,
    'has_more',v_has_more,'awaiting_ack',v_count>0);
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
  if not found or v_cursor.user_id<>v_user
     or v_cursor.pending_updated_at is distinct from p_updated_at
     or v_cursor.pending_record_id is distinct from p_record_id then
    raise exception 'cursor_ack_does_not_match_pending_page' using errcode='40001';
  end if;

  update public.deeb_sync_cursors set
    last_updated_at=p_updated_at,last_record_id=p_record_id,
    pending_updated_at=null,pending_record_id=null,updated_at=now()
  where org_id=v_org and device_id=p_device_id;

  return jsonb_build_object('ok',true,'updated_at',p_updated_at,'record_id',p_record_id);
end;
$$;

revoke all on function public.deeb_pull_records(text,timestamptz,text,integer) from public,anon;
revoke all on function public.deeb_advance_sync_cursor(text,timestamptz,text) from public,anon;
grant execute on function public.deeb_pull_records(text,timestamptz,text,integer) to authenticated;
grant execute on function public.deeb_advance_sync_cursor(text,timestamptz,text) to authenticated;
