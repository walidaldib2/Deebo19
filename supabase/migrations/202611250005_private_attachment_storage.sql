-- DEEB19 private attachment lifecycle.
-- Uses a private Supabase Storage bucket. Files are addressed by opaque IDs,
-- and only authenticated RPCs can reserve/finalize metadata rows.

alter table public.deeb_attachments
  add column if not exists upload_status text not null default 'pending'
    check (upload_status in ('pending','uploaded','failed')),
  add column if not exists uploaded_at timestamptz;

drop policy if exists "deeb members register attachments" on public.deeb_attachments;
drop policy if exists "deeb members read attachments" on public.deeb_attachments;

-- The bucket is private. Storage upload is allowed only after an authenticated
-- RPC has reserved the exact org/record/attachment path in deeb_attachments.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'deebo-private',
  'deebo-private',
  false,
  20971520,
  array[
    'image/jpeg','image/png','image/webp','application/pdf',
    'text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.deeb_prepare_attachment(
  p_attachment_id text,
  p_record_id text,
  p_device_id text,
  p_file_name text,
  p_mime_type text,
  p_size_bytes bigint,
  p_sha256 text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_branch text;
  v_path text;
  v_name text:=left(regexp_replace(coalesce(p_file_name,''),'[[:cntrl:]/\\\\]','','g'),240);
  v_mime text:=lower(coalesce(nullif(trim(p_mime_type),''),'application/octet-stream'));
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  if coalesce(trim(p_attachment_id),'')='' or coalesce(trim(p_record_id),'')=''
     or coalesce(trim(p_device_id),'')='' or v_name='' then
    raise exception 'invalid_attachment_details' using errcode='22023';
  end if;
  if p_size_bytes is null or p_size_bytes<1 or p_size_bytes>20971520 then
    raise exception 'attachment_size_out_of_range' using errcode='22023';
  end if;
  if v_mime not in (
    'image/jpeg','image/png','image/webp','application/pdf','text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) then raise exception 'attachment_type_not_allowed' using errcode='22023'; end if;
  if p_sha256 is not null and p_sha256 !~ '^[0-9a-fA-F]{64}$' then
    raise exception 'invalid_attachment_hash' using errcode='22023';
  end if;

  select org_id into v_org from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null then raise exception 'organization_access_denied' using errcode='42501'; end if;
  if not exists(select 1 from public.deeb_devices where id=p_device_id
    and org_id=v_org and user_id=v_user and revoked_at is null) then
    raise exception 'device_not_enrolled_or_revoked' using errcode='42501';
  end if;
  select r.branch_id into v_branch from public.deeb_records r
   where r.org_id=v_org and r.id=p_record_id;
  if not found or not public.deeb_can_access_branch(v_branch) then
    raise exception 'record_access_denied' using errcode='42501';
  end if;

  v_path:=v_org::text||'/'||p_record_id||'/'||p_attachment_id;
  insert into public.deeb_attachments
    (id,org_id,branch_id,record_id,storage_path,file_name,mime_type,size_bytes,
     sha256,uploaded_by,device_id,upload_status)
  values(p_attachment_id,v_org,v_branch,p_record_id,v_path,v_name,v_mime,
    p_size_bytes,lower(p_sha256),v_user,p_device_id,'pending')
  on conflict(id) do nothing;

  if not exists(select 1 from public.deeb_attachments a
    where a.id=p_attachment_id and a.org_id=v_org and a.record_id=p_record_id
      and a.uploaded_by=v_user and a.device_id=p_device_id and a.storage_path=v_path
      and a.upload_status='pending') then
    raise exception 'attachment_id_already_used' using errcode='23505';
  end if;

  return jsonb_build_object('ok',true,'bucket_id','deebo-private',
    'object_path',v_path,'attachment_id',p_attachment_id,
    'max_size_bytes',20971520,'upload_status','pending');
end;
$$;

create or replace function public.deeb_finalize_attachment(p_attachment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid:=auth.uid();
  v_org uuid;
  v_attachment public.deeb_attachments%rowtype;
begin
  if v_user is null then raise exception 'authentication_required' using errcode='28000'; end if;
  select org_id into v_org from public.deeb_profiles
   where user_id=v_user and is_active=true;
  if v_org is null then raise exception 'organization_access_denied' using errcode='42501'; end if;

  select * into v_attachment from public.deeb_attachments
   where id=p_attachment_id and org_id=v_org and uploaded_by=v_user
   for update;
  if not found then raise exception 'attachment_not_found' using errcode='42501'; end if;

  if not exists(select 1 from storage.objects o
    where o.bucket_id='deebo-private' and o.name=v_attachment.storage_path
      and coalesce((o.metadata->>'size')::bigint,-1)=v_attachment.size_bytes
      and lower(coalesce(o.metadata->>'mimetype',''))=lower(v_attachment.mime_type)) then
    raise exception 'attachment_object_missing_or_metadata_mismatch' using errcode='P0002';
  end if;

  update public.deeb_attachments set upload_status='uploaded',uploaded_at=now()
   where id=p_attachment_id and org_id=v_org;
  return jsonb_build_object('ok',true,'attachment_id',p_attachment_id,
    'bucket_id','deebo-private','object_path',v_attachment.storage_path,
    'upload_status','uploaded');
end;
$$;

create or replace function public.deeb_can_upload_attachment(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $
  select exists(
    select 1 from public.deeb_attachments a
    where a.storage_path=p_storage_path
      and a.org_id=public.deeb_current_org_id()
      and a.uploaded_by=auth.uid()
      and a.upload_status='pending'
      and public.deeb_can_access_branch(a.branch_id)
  )
$;

revoke all on function public.deeb_can_upload_attachment(text) from public,anon;
grant execute on function public.deeb_can_upload_attachment(text) to authenticated;

create policy "deeb upload reserved private attachments"
on storage.objects for insert to authenticated
with check (
  bucket_id='deebo-private'
  and public.deeb_can_upload_attachment(name)
);

create policy "deeb read uploaded private attachments"
on storage.objects for select to authenticated
using (
  bucket_id='deebo-private'
  and exists(
    select 1 from public.deeb_attachments a
    where a.storage_path=name
      and a.org_id=public.deeb_current_org_id()
      and a.upload_status='uploaded'
      and public.deeb_can_access_branch(a.branch_id)
  )
);

create policy "deeb read uploaded attachment metadata"
on public.deeb_attachments for select to authenticated
using (org_id=public.deeb_current_org_id()
  and upload_status='uploaded'
  and public.deeb_can_access_branch(branch_id));

revoke all on function public.deeb_prepare_attachment(text,text,text,text,text,bigint,text) from public,anon;
revoke all on function public.deeb_finalize_attachment(text) from public,anon;
grant execute on function public.deeb_prepare_attachment(text,text,text,text,text,bigint,text) to authenticated;
grant execute on function public.deeb_finalize_attachment(text) to authenticated;
