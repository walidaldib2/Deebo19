-- DEEB19 authenticated, idempotent record synchronization RPCs.
-- Requires 202611250001_team_sync_foundation.sql.
-- Operational writes must pass through revision-checked RPCs, not direct table access.
drop policy if exists "deeb members insert permitted records" on public.deeb_records;
drop policy if exists "deeb members update permitted records" on public.deeb_records;

create or replace function public.deeb_apply_record_mutation(p_mutation jsonb)
returns jsonb language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_org uuid;
  v_role text;
  v_device text := p_mutation->>'device_id';
  v_org_input uuid := nullif(p_mutation->>'org_id','')::uuid;
  v_mid text := p_mutation->>'mutation_id';
  v_rid text := p_mutation->>'record_id';
  v_action text := p_mutation->>'action';
  v_branch text := nullif(p_mutation->>'branch_id','');
  v_record jsonb := p_mutation->'snapshot'->'record';
  v_audit jsonb := p_mutation->'snapshot'->'audit';
  v_current public.deeb_records%rowtype;
  v_base bigint := coalesce((p_mutation->>'base_revision')::bigint,0);
  v_result jsonb;
  v_revision bigint;
  v_exists boolean;
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  if coalesce(v_mid,'')='' or coalesce(v_rid,'')=''
     or coalesce(jsonb_typeof(v_record),'')<>'object'
     or coalesce(v_record->>'id','')<>v_rid
     or coalesce(v_record->>'entity_type','')=''
     or coalesce(nullif(v_record->>'branch_id',''),'')<>coalesce(v_branch,'') then
    raise exception 'invalid_mutation_envelope' using errcode='22023';
  end if;
  if coalesce(v_action,'') not in ('create','update','archive','unarchive','soft_delete','restore_deleted','handover_version') then
    raise exception 'unsupported_mutation_action' using errcode='22023';
  end if;

  select p.org_id,p.role into v_org,v_role from public.deeb_profiles p
  where p.user_id=v_user and p.is_active=true;
  if v_org is null or v_org<>v_org_input then
    raise exception 'organization_access_denied' using errcode='42501';
  end if;
  if not exists(select 1 from public.deeb_devices d where d.id=v_device
    and d.org_id=v_org and d.user_id=v_user and d.revoked_at is null) then
    raise exception 'device_not_enrolled_or_revoked' using errcode='42501';
  end if;
  if not public.deeb_can_access_branch(v_branch) then
    raise exception 'branch_access_denied' using errcode='42501';
  end if;
  if v_role='security_officer' and coalesce(v_record->>'entity_type','') not in
    ('daily_rosters','branch_patrols','bike_patrols','manager_rounds','incidents',
     'written_reports','absences','handovers','emergencies','tasks','memos') then
    raise exception 'role_action_denied' using errcode='42501';
  end if;

  -- Serialize retries of the same idempotency key before checking the receipt.
  perform pg_advisory_xact_lock(hashtextextended(v_org::text || ':' || v_mid,0));

  select result into v_result from public.deeb_sync_mutations
  where org_id=v_org and mutation_id=v_mid;
  if found then return v_result || jsonb_build_object('duplicate',true); end if;

  select * into v_current from public.deeb_records
  where org_id=v_org and id=v_rid for update;
  v_exists:=found;

  if v_action='create' then
    if v_exists then
      v_result:=jsonb_build_object('ok',false,'conflict',true,'mutation_id',v_mid,
        'record_id',v_rid,'base_revision',v_base,'server_revision',v_current.revision,
        'server_snapshot',to_jsonb(v_current));
    elsif v_base<>0 then
      raise exception 'invalid_create_revision' using errcode='22023';
    else
      insert into public.deeb_records
       (id,org_id,branch_id,entity_type,payload,status,is_archived,is_deleted,deleted_at,delete_reason,
        revision,created_by,updated_by,origin_device_id,last_mutation_id,client_updated_at,created_at,updated_at)
      values
       (v_rid,v_org,v_branch,v_record->>'entity_type',coalesce(v_record->'payload','{}'::jsonb),
        coalesce(v_record->>'status','active'),coalesce((v_record->>'is_archived')::boolean,false),
        coalesce((v_record->>'is_deleted')::boolean,false),nullif(v_record->>'deleted_at','')::timestamptz,
        nullif(v_record->>'delete_reason',''),1,v_user,v_user,v_device,v_mid,
        coalesce(nullif(p_mutation->>'local_updated_at','')::timestamptz,now()),now(),now());
      v_revision:=1;
      v_result:=jsonb_build_object('ok',true,'conflict',false,'mutation_id',v_mid,
        'record_id',v_rid,'server_revision',v_revision);
    end if;
  else
    if not v_exists then
      v_result:=jsonb_build_object('ok',false,'conflict',true,'mutation_id',v_mid,
        'record_id',v_rid,'base_revision',v_base,'server_revision',0,'server_snapshot',null);
    elsif v_current.revision<>v_base then
      v_result:=jsonb_build_object('ok',false,'conflict',true,'mutation_id',v_mid,
        'record_id',v_rid,'base_revision',v_base,'server_revision',v_current.revision,
        'server_snapshot',to_jsonb(v_current));
    else
      update public.deeb_records set
        branch_id=v_branch,entity_type=v_record->>'entity_type',
        payload=coalesce(v_record->'payload','{}'::jsonb),status=coalesce(v_record->>'status','active'),
        is_archived=coalesce((v_record->>'is_archived')::boolean,false),
        is_deleted=coalesce((v_record->>'is_deleted')::boolean,false),
        deleted_at=nullif(v_record->>'deleted_at','')::timestamptz,
        delete_reason=nullif(v_record->>'delete_reason',''),
        revision=revision+1,updated_by=v_user,origin_device_id=v_device,last_mutation_id=v_mid,
        client_updated_at=coalesce(nullif(p_mutation->>'local_updated_at','')::timestamptz,now()),
        updated_at=now()
      where org_id=v_org and id=v_rid returning revision into v_revision;
      v_result:=jsonb_build_object('ok',true,'conflict',false,'mutation_id',v_mid,
        'record_id',v_rid,'server_revision',v_revision);
    end if;
  end if;

  if v_action='handover_version' and not coalesce((v_result->>'conflict')::boolean,false) then
    if coalesce(jsonb_typeof(p_mutation->'snapshot'->'handover_version'),'')<>'object'
       or coalesce(p_mutation->'snapshot'->'handover_version'->>'id','')=''
       or coalesce(p_mutation->'snapshot'->'handover_version'->>'record_id','')<>v_rid
       or coalesce((p_mutation->'snapshot'->'handover_version'->>'version')::integer,0)<1
       or coalesce(jsonb_typeof(p_mutation->'snapshot'->'handover_version'->'snapshot'),'')<>'object' then
      raise exception 'invalid_handover_version' using errcode='22023';
    end if;
    insert into public.deeb_handover_versions
      (id,org_id,branch_id,record_id,version,snapshot,reason,actor_user_id,device_id,created_at)
    values
      (p_mutation->'snapshot'->'handover_version'->>'id',v_org,v_branch,v_rid,
       (p_mutation->'snapshot'->'handover_version'->>'version')::integer,
       p_mutation->'snapshot'->'handover_version'->'snapshot',
       coalesce(p_mutation->'snapshot'->'handover_version'->>'reason',''),
       v_user,v_device,
       coalesce(nullif(p_mutation->'snapshot'->'handover_version'->>'created_at','')::timestamptz,now()));
  end if;

  if coalesce((v_result->>'conflict')::boolean,false) then
    if v_exists then
      insert into public.deeb_sync_conflicts
       (org_id,branch_id,record_id,mutation_id,base_revision,server_revision,
        local_snapshot,server_snapshot,created_by)
      values(v_org,v_branch,v_rid,v_mid,v_base,v_current.revision,
        coalesce(p_mutation->'snapshot','{}'::jsonb),to_jsonb(v_current),v_user);
    end if;
  elsif jsonb_typeof(v_audit)='object' then
    insert into public.deeb_audit_logs
     (id,org_id,branch_id,record_id,action,old_data,new_data,reason,actor_user_id,device_id,created_at)
    values(coalesce(nullif(v_audit->>'id',''),v_mid),v_org,v_branch,v_rid,
      coalesce(v_audit->>'action',v_action),v_audit->'old_data',v_audit->'new_data',
      coalesce(v_audit->>'reason',''),v_user,v_device,
      coalesce(nullif(v_audit->>'created_at','')::timestamptz,now()))
    on conflict (id) do nothing;
  end if;

  insert into public.deeb_sync_mutations
   (org_id,mutation_id,device_id,actor_user_id,action,record_id,result)
  values(v_org,v_mid,v_device,v_user,v_action,v_rid,v_result);
  return v_result;
end;
$$;

create or replace function public.deeb_pull_records(
  p_device_id text,p_after_updated_at timestamptz default null,
  p_after_record_id text default null,p_limit integer default 200
)
returns jsonb language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_rows jsonb;
  v_count integer;
  v_last_updated timestamptz;
  v_last_id text;
  v_has_more boolean;
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

  with page as (
    select r.*,row_number() over(order by r.updated_at,r.id) as sync_row_number
    from public.deeb_records r
    where r.org_id=v_org and public.deeb_can_access_branch(r.branch_id)
      and (p_after_updated_at is null or
        (r.updated_at,r.id)>(p_after_updated_at,coalesce(p_after_record_id,'')))
    order by r.updated_at,r.id limit v_limit+1
  ), selected as (
    select * from page where sync_row_number<=v_limit
  )
  select coalesce(jsonb_agg(to_jsonb(selected)-'sync_row_number'
      order by selected.updated_at,selected.id),'[]'::jsonb),
    count(*),max(updated_at),
    (array_agg(id order by updated_at desc,id desc))[1]
  into v_rows,v_count,v_last_updated,v_last_id from selected;

  select exists(select 1 from public.deeb_records r
    where r.org_id=v_org and public.deeb_can_access_branch(r.branch_id)
      and (p_after_updated_at is null or
        (r.updated_at,r.id)>(p_after_updated_at,coalesce(p_after_record_id,'')))
    order by r.updated_at,r.id offset v_limit limit 1)
  into v_has_more;

  return jsonb_build_object('records',v_rows,'count',v_count,
    'next_updated_at',v_last_updated,'next_record_id',v_last_id,'has_more',v_has_more);
end;
$$;

revoke all on function public.deeb_apply_record_mutation(jsonb) from public,anon;
revoke all on function public.deeb_pull_records(text,timestamptz,text,integer) from public,anon;
grant execute on function public.deeb_apply_record_mutation(jsonb) to authenticated;
grant execute on function public.deeb_pull_records(text,timestamptz,text,integer) to authenticated;
