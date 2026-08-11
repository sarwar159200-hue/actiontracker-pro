alter table public.action_attachments
  add column if not exists original_file_name text,
  add column if not exists file_extension text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists box_file_id text,
  add column if not exists box_folder_id text,
  add column if not exists box_file_version_id text,
  add column if not exists box_web_url text,
  add column if not exists box_shared_link text,
  add column if not exists revision text,
  add column if not exists description text,
  add column if not exists uploaded_by uuid references public.profiles(id) on delete set null,
  add column if not exists uploaded_at timestamptz not null default now(),
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;
create index if not exists idx_action_attachments_action_v41 on public.action_attachments(action_id);
create index if not exists idx_action_attachments_box_file_v41 on public.action_attachments(box_file_id);
alter table public.action_attachments enable row level security;
drop policy if exists "attachments_select_authorized" on public.action_attachments;
create policy "attachments_select_authorized" on public.action_attachments for select to authenticated using (public.is_super_admin() or exists (select 1 from public.actions a where a.id=action_attachments.action_id and (a.originator_id=auth.uid() or a.assigned_to=auth.uid() or a.reviewer_id=auth.uid() or a.approver_id=auth.uid())));
drop policy if exists "attachments_insert_authorized" on public.action_attachments;
create policy "attachments_insert_authorized" on public.action_attachments for insert to authenticated with check (public.is_super_admin() or uploaded_by=auth.uid());
select column_name,data_type from information_schema.columns where table_schema='public' and table_name='action_attachments' order by ordinal_position;
