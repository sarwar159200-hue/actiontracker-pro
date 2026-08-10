-- ACTION TRACKER PRO v3 - fine-grained user permissions
create table if not exists public.user_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  can_create_users boolean not null default false,
  can_manage_users boolean not null default false,
  can_create_projects boolean not null default false,
  can_view_all_actions boolean not null default false,
  can_create_actions boolean not null default true,
  can_assign_actions boolean not null default false,
  can_reassign_actions boolean not null default false,
  can_review_actions boolean not null default false,
  can_approve_actions boolean not null default false,
  can_close_actions boolean not null default false,
  can_reopen_actions boolean not null default false,
  can_export_reports boolean not null default false,
  can_manage_box boolean not null default false,
  can_manage_settings boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_permissions enable row level security;
drop policy if exists "user_permissions_select" on public.user_permissions;
create policy "user_permissions_select" on public.user_permissions for select to authenticated
using (user_id=auth.uid() or public.is_super_admin());
drop policy if exists "user_permissions_admin_all" on public.user_permissions;
create policy "user_permissions_admin_all" on public.user_permissions for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

-- Ensure Sarwar has all permissions.
insert into public.user_permissions (
  user_id,can_create_users,can_manage_users,can_create_projects,can_view_all_actions,
  can_create_actions,can_assign_actions,can_reassign_actions,can_review_actions,
  can_approve_actions,can_close_actions,can_reopen_actions,can_export_reports,
  can_manage_box,can_manage_settings
)
select id,true,true,true,true,true,true,true,true,true,true,true,true,true,true
from public.profiles where system_role='super_admin'
on conflict (user_id) do update set
  can_create_users=true,can_manage_users=true,can_create_projects=true,can_view_all_actions=true,
  can_create_actions=true,can_assign_actions=true,can_reassign_actions=true,can_review_actions=true,
  can_approve_actions=true,can_close_actions=true,can_reopen_actions=true,can_export_reports=true,
  can_manage_box=true,can_manage_settings=true,updated_at=now();
