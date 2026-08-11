-- ============================================================
-- ACTION TRACKER PRO v5.0
-- Urgency SLA + attachments + professional user removal support
-- ============================================================

-- ACTION SLA FIELDS
alter table public.actions
  add column if not exists urgency text not null default 'medium',
  add column if not exists assigned_at timestamptz not null default now(),
  add column if not exists due_date_override boolean not null default false,
  add column if not exists due_date_override_reason text;

-- URGENCY VALIDATION
alter table public.actions
  drop constraint if exists actions_urgency_check;

alter table public.actions
  add constraint actions_urgency_check
  check (urgency in ('critical','high','medium','low','routine'));

-- ATTACHMENT COMPATIBILITY
alter table public.action_attachments
  add column if not exists original_file_name text,
  add column if not exists file_extension text,
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists box_file_id text,
  add column if not exists box_folder_id text,
  add column if not exists box_file_version_id text,
  add column if not exists box_web_url text,
  add column if not exists revision text,
  add column if not exists description text,
  add column if not exists uploaded_by uuid references public.profiles(id) on delete set null,
  add column if not exists uploaded_at timestamptz not null default now(),
  add column if not exists is_deleted boolean not null default false;

create index if not exists idx_actions_urgency_v5 on public.actions(urgency);
create index if not exists idx_actions_due_date_v5 on public.actions(current_due_date);
create index if not exists idx_actions_status_v5 on public.actions(status);
create index if not exists idx_action_attachments_action_v5 on public.action_attachments(action_id);
create index if not exists idx_action_attachments_box_v5 on public.action_attachments(box_file_id);

-- SUPER ADMIN REMAINS FULL AUTHORITY
update public.profiles p
set full_name='Sarwar Khalid',
    system_role='super_admin',
    is_active=true,
    organization_id=o.id,
    updated_at=now()
from public.organizations o, auth.users u
where p.id=u.id
  and o.code='MIR'
  and lower(u.email)=lower('Sarwar.khalid@miranenergy.com');

insert into public.user_permissions(
  user_id,can_create_users,can_manage_users,can_create_projects,can_view_all_actions,
  can_create_actions,can_assign_actions,can_reassign_actions,can_review_actions,
  can_approve_actions,can_close_actions,can_reopen_actions,can_export_reports,
  can_manage_box_storage,can_manage_settings,updated_at
)
select u.id,true,true,true,true,true,true,true,true,true,true,true,true,true,true,now()
from auth.users u
where lower(u.email)=lower('Sarwar.khalid@miranenergy.com')
on conflict(user_id) do update set
  can_create_users=true,can_manage_users=true,can_create_projects=true,can_view_all_actions=true,
  can_create_actions=true,can_assign_actions=true,can_reassign_actions=true,can_review_actions=true,
  can_approve_actions=true,can_close_actions=true,can_reopen_actions=true,can_export_reports=true,
  can_manage_box_storage=true,can_manage_settings=true,updated_at=now();

-- ATTACHMENT RLS
alter table public.action_attachments enable row level security;

drop policy if exists "attachments_select_authorized" on public.action_attachments;
create policy "attachments_select_authorized"
on public.action_attachments for select to authenticated
using (
  public.is_super_admin()
  or exists(
    select 1 from public.actions a
    where a.id=action_attachments.action_id
      and (
        a.originator_id=auth.uid()
        or a.assigned_to=auth.uid()
        or a.reviewer_id=auth.uid()
        or a.approver_id=auth.uid()
      )
  )
);

drop policy if exists "attachments_insert_authorized" on public.action_attachments;
create policy "attachments_insert_authorized"
on public.action_attachments for insert to authenticated
with check(public.is_super_admin() or uploaded_by=auth.uid());

-- Verification
select
  u.email,p.full_name,p.system_role,p.is_active,
  up.can_manage_users,up.can_create_actions,up.can_export_reports,up.can_manage_box_storage
from auth.users u
join public.profiles p on p.id=u.id
left join public.user_permissions up on up.user_id=u.id
where lower(u.email)=lower('Sarwar.khalid@miranenergy.com');
