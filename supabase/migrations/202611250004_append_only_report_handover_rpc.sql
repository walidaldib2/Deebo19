-- DEEB19 immutable approved-report and handover-version append RPC.
-- Attachment metadata is intentionally excluded until private Storage upload verification exists.

-- Keep append-only history writes behind trusted RPC validation.
drop policy if exists "deeb members append audit history" on public.deeb_audit_logs;
drop policy if exists "deeb members create approved reports" on public.deeb_approved_reports;
drop policy if exists "deeb members append handover versions" on public.deeb_handover_versions;
drop policy if exists "deeb members create sync conflicts" on public.deeb_sync_conflicts;

create or replace function public.deeb_apply_append_mutation(p_mutation jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_role text;
  v_device text:=p_mutation->>'device_id';
  v_org_input uuid:=nullif(p_mutation->>'org_id','')::uuid;
  v_mid text:=p_mutation->>'mutation_id';
  v_action text:=p_mutation->>'action';
  v_branch text:=nullif(p_mutation->>'branch_id','');
  v_snapshot jsonb:=p_mutation->'snapshot';
  v_audit jsonb:=p_mutation->'snapshot'->'audit';
  v_item jsonb;
  v_record_id text;
  v_result jsonb;
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  if coalesce(v_mid,'')='' then raise exception 'invalid_mutation_envelope' using errcode='22023'; end if;
  if coalesce(v_action,'') <> 'approve' then
    raise exception 'unsupported_append_action' using errcode='22023';
  end if;
  select org_id,role into v_org,v_role from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null or v_org<>v_org_input then
    raise exception 'organization_access_denied' using errcode='42501';
  end if;
  if not exists(select 1 from public.deeb_devices where id=v_device
    and org_id=v_org and user_id=v_user and revoked_at is null) then
    raise exception 'device_not_enrolled_or_revoked' using errcode='42501';
  end if;
  if not public.deeb_can_access_branch(v_branch) then
    raise exception 'branch_access_denied' using errcode='42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_org::text || ':' || v_mid,0));
  select result into v_result from public.deeb_sync_mutations
   where org_id=v_org and mutation_id=v_mid;
  if found then return v_result || jsonb_build_object('duplicate',true); end if;

  if v_action='approve' then
    if v_role not in ('system_admin','security_manager','department_manager','supervisor') then
      raise exception 'approval_permission_denied' using errcode='42501';
    end if;
    v_item:=v_snapshot->'approved_report';
    if coalesce(v_item->>'id','')='' or jsonb_typeof(v_item->'snapshot') is null then
      raise exception 'invalid_approved_report' using errcode='22023';
    end if;
    if coalesce(nullif(v_item->'snapshot'->>'branch_id',''),'')<>coalesce(v_branch,'') then
      raise exception 'report_branch_mismatch' using errcode='22023';
    end if;
    insert into public.deeb_approved_reports
      (id,org_id,branch_id,title,snapshot,actor_user_id,device_id,created_at)
    values(v_item->>'id',v_org,v_branch,coalesce(v_item->>'title','تقرير DEEBO'),
      v_item->'snapshot',v_user,v_device,
      coalesce(nullif(v_item->>'created_at','')::timestamptz,now()));
    v_record_id:=v_item->>'id';
  else
    v_item:=v_snapshot->'handover_version';
    if coalesce(v_item->>'id','')='' or coalesce(v_item->>'record_id','')=''
       or coalesce((v_item->>'version')::integer,0)<1
       or jsonb_typeof(v_item->'snapshot')<>'object' then
      raise exception 'invalid_handover_version' using errcode='22023';
    end if;
    v_record_id:=v_item->>'record_id';
    if not exists(select 1 from public.deeb_records r
      where r.org_id=v_org and r.id=v_record_id and r.branch_id is not distinct from v_branch) then
      raise exception 'handover_parent_not_found' using errcode='22023';
    end if;
    insert into public.deeb_handover_versions
      (id,org_id,branch_id,record_id,version,snapshot,reason,actor_user_id,device_id,created_at)
    values(v_item->>'id',v_org,v_branch,v_record_id,(v_item->>'version')::integer,
      v_item->'snapshot',coalesce(v_item->>'reason',''),v_user,v_device,
      coalesce(nullif(v_item->>'created_at','')::timestamptz,now()));
  end if;

  if jsonb_typeof(v_audit)='object' then
    insert into public.deeb_audit_logs
      (id,org_id,branch_id,record_id,action,old_data,new_data,reason,actor_user_id,device_id,created_at)
    values(coalesce(nullif(v_audit->>'id',''),v_mid),v_org,v_branch,v_record_id,
      coalesce(v_audit->>'action',v_action),v_audit->'old_data',v_audit->'new_data',
      coalesce(v_audit->>'reason',''),v_user,v_device,
      coalesce(nullif(v_audit->>'created_at','')::timestamptz,now()))
    on conflict(id) do nothing;
  end if;

  v_result:=jsonb_build_object('ok',true,'conflict',false,'mutation_id',v_mid,
    'action',v_action,'item_id',v_item->>'id','record_id',v_record_id);
  insert into public.deeb_sync_mutations
    (org_id,mutation_id,device_id,actor_user_id,action,record_id,result)
  values(v_org,v_mid,v_device,v_user,v_action,v_record_id,v_result);
  return v_result;
end;
$$;

revoke all on function public.deeb_apply_append_mutation(jsonb) from public,anon;
grant execute on function public.deeb_apply_append_mutation(jsonb) to authenticated;
