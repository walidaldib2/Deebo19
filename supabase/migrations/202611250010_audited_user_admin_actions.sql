-- Make role/account changes and their audit event one database transaction.
create or replace function public.deeb_admin_apply_user_action(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_action text,
  p_new_role text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor public.deeb_profiles%rowtype;
  v_target public.deeb_profiles%rowtype;
  v_new_role text:=coalesce(p_new_role,'');
  v_rank_actor integer;
  v_rank_target integer;
  v_rank_new integer;
  v_action text:=coalesce(p_action,'');
  v_stamp timestamptz:=now();
  v_devices integer:=0;
begin
  if p_actor_user_id is null or p_target_user_id is null
     or p_actor_user_id=p_target_user_id
     or v_action not in ('change_role','deactivate','reactivate') then
    raise exception 'invalid_user_admin_request' using errcode='22023';
  end if;

  select * into v_actor from public.deeb_profiles
   where user_id=p_actor_user_id and is_active=true for update;
  if not found or v_actor.role not in ('system_admin','security_manager','department_manager') then
    raise exception 'user_admin_permission_denied' using errcode='42501';
  end if;
  select * into v_target from public.deeb_profiles
   where user_id=p_target_user_id and org_id=v_actor.org_id for update;
  if not found then raise exception 'target_user_not_found_in_organization' using errcode='P0002'; end if;

  v_rank_actor:=case v_actor.role
    when 'system_admin' then 5 when 'security_manager' then 4
    when 'department_manager' then 3 else 0 end;
  v_rank_target:=case v_target.role
    when 'system_admin' then 5 when 'security_manager' then 4
    when 'department_manager' then 3 when 'supervisor' then 2
    when 'security_officer' then 1 else 99 end;
  if v_rank_target>=v_rank_actor then
    raise exception 'cannot_manage_equal_or_higher_role' using errcode='42501';
  end if;

  if v_action='change_role' then
    v_rank_new:=case v_new_role
      when 'security_manager' then 4 when 'department_manager' then 3
      when 'supervisor' then 2 when 'security_officer' then 1 else 0 end;
    if v_rank_new=0 or v_rank_new>=v_rank_actor then
      raise exception 'role_assignment_not_permitted' using errcode='42501';
    end if;
    update public.deeb_profiles set role=v_new_role,updated_at=v_stamp
     where user_id=p_target_user_id and org_id=v_actor.org_id;
    if v_new_role not in ('supervisor','security_officer') then
      delete from public.deeb_branch_memberships
       where org_id=v_actor.org_id and user_id=p_target_user_id;
    end if;
    insert into public.deeb_audit_logs
      (id,org_id,branch_id,record_id,action,old_data,new_data,reason,actor_user_id,device_id,created_at)
    values(gen_random_uuid()::text,v_actor.org_id,null,null,'user_role_changed',
      jsonb_build_object('user_id',p_target_user_id,'role',v_target.role,'is_active',v_target.is_active),
      jsonb_build_object('user_id',p_target_user_id,'role',v_new_role,'is_active',v_target.is_active),
      'تغيير صلاحية مستخدم',p_actor_user_id,null,v_stamp);
    return jsonb_build_object('ok',true,'user_id',p_target_user_id,'role',v_new_role);
  elsif v_action='deactivate' then
    update public.deeb_profiles set is_active=false,updated_at=v_stamp
     where user_id=p_target_user_id and org_id=v_actor.org_id;
    update public.deeb_devices set revoked_at=v_stamp
     where org_id=v_actor.org_id and user_id=p_target_user_id and revoked_at is null;
    get diagnostics v_devices = row_count;
    insert into public.deeb_audit_logs
      (id,org_id,branch_id,record_id,action,old_data,new_data,reason,actor_user_id,device_id,created_at)
    values(gen_random_uuid()::text,v_actor.org_id,null,null,'user_deactivated',
      jsonb_build_object('user_id',p_target_user_id,'role',v_target.role,'is_active',v_target.is_active),
      jsonb_build_object('user_id',p_target_user_id,'role',v_target.role,'is_active',false,'revoked_devices',v_devices),
      'تعطيل حساب مستخدم وإلغاء أجهزته',p_actor_user_id,null,v_stamp);
    return jsonb_build_object('ok',true,'user_id',p_target_user_id,'active',false,'devices_revoked',v_devices);
  else
    update public.deeb_profiles set is_active=true,updated_at=v_stamp
     where user_id=p_target_user_id and org_id=v_actor.org_id;
    insert into public.deeb_audit_logs
      (id,org_id,branch_id,record_id,action,old_data,new_data,reason,actor_user_id,device_id,created_at)
    values(gen_random_uuid()::text,v_actor.org_id,null,null,'user_reactivated',
      jsonb_build_object('user_id',p_target_user_id,'role',v_target.role,'is_active',v_target.is_active),
      jsonb_build_object('user_id',p_target_user_id,'role',v_target.role,'is_active',true,'requires_device_reenrollment',true),
      'إعادة تفعيل حساب مستخدم',p_actor_user_id,null,v_stamp);
    return jsonb_build_object('ok',true,'user_id',p_target_user_id,'active',true,'devices_require_reenrollment',true);
  end if;
end;
$$;

revoke all on function public.deeb_admin_apply_user_action(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.deeb_admin_apply_user_action(uuid,uuid,text,text) to service_role;
