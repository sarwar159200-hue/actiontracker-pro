-- ACTION TRACKER PRO v3.2
-- Run in Supabase SQL Editor.

-- Ensure permissions table exists.
create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
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
  can_manage_box_storage boolean not null default false,
  can_manage_settings boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure requested account is Super Admin.
update public.profiles p
set full_name='Sarwar Khalid',
    system_role='super_admin',
    is_active=true,
    updated_at=now()
from auth.users u
where p.id=u.id
  and lower(u.email)=lower('Sarwar.khalid@miranenergy.com');

insert into public.user_permissions (
  user_id,
  can_create_users,can_manage_users,can_create_projects,can_view_all_actions,
  can_create_actions,can_assign_actions,can_reassign_actions,can_review_actions,
  can_approve_actions,can_close_actions,can_reopen_actions,can_export_reports,
  can_manage_box_storage,can_manage_settings
)
select
  u.id,
  true,true,true,true,
  true,true,true,true,
  true,true,true,true,
  true,true
from auth.users u
where lower(u.email)=lower('Sarwar.khalid@miranenergy.com')
on conflict (user_id) do update set
  can_create_users=true,
  can_manage_users=true,
  can_create_projects=true,
  can_view_all_actions=true,
  can_create_actions=true,
  can_assign_actions=true,
  can_reassign_actions=true,
  can_review_actions=true,
  can_approve_actions=true,
  can_close_actions=true,
  can_reopen_actions=true,
  can_export_reports=true,
  can_manage_box_storage=true,
  can_manage_settings=true,
  updated_at=now();

alter table public.user_permissions enable row level security;

drop policy if exists "permissions_self_or_admin_read" on public.user_permissions;
create policy "permissions_self_or_admin_read"
on public.user_permissions for select to authenticated
using (user_id=auth.uid() or public.is_super_admin());

drop policy if exists "permissions_admin_all" on public.user_permissions;
create policy "permissions_admin_all"
on public.user_permissions for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- Verification:
select
  u.email,
  p.full_name,
  p.system_role,
  p.is_active,
  up.*
from auth.users u
join public.profiles p on p.id=u.id
left join public.user_permissions up on up.user_id=u.id
where lower(u.email)=lower('Sarwar.khalid@miranenergy.com');
