-- ============================================================
-- ACTION TRACKER PRO v4.0 MIGRATION
-- Run after the previous foundation SQL.
-- ============================================================

-- 1. Profiles: force-change-password flag
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- 2. Ensure permissions columns exist
create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_permissions
  add column if not exists can_create_users boolean not null default false,
  add column if not exists can_manage_users boolean not null default false,
  add column if not exists can_create_projects boolean not null default false,
  add column if not exists can_view_all_actions boolean not null default false,
  add column if not exists can_create_actions boolean not null default true,
  add column if not exists can_assign_actions boolean not null default false,
  add column if not exists can_reassign_actions boolean not null default false,
  add column if not exists can_review_actions boolean not null default false,
  add column if not exists can_approve_actions boolean not null default false,
  add column if not exists can_close_actions boolean not null default false,
  add column if not exists can_reopen_actions boolean not null default false,
  add column if not exists can_export_reports boolean not null default false,
  add column if not exists can_manage_box_storage boolean not null default false,
  add column if not exists can_manage_settings boolean not null default false;

-- 3. Default Miran Energy organization if no org exists
insert into public.organizations(name,code,is_active,created_at,updated_at)
values('Miran Energy','MIR',true,now(),now())
on conflict (code) do update set name=excluded.name,is_active=true,updated_at=now();

-- 4. Link Super Admin to Miran Energy organization
update public.profiles p
set organization_id=o.id,
    full_name='Sarwar Khalid',
    system_role='super_admin',
    is_active=true,
    must_change_password=false,
    updated_at=now()
from public.organizations o, auth.users u
where o.code='MIR'
  and p.id=u.id
  and lower(u.email)=lower('Sarwar.khalid@miranenergy.com');

-- 5. Give Super Admin all permissions
insert into public.user_permissions(
  user_id,can_create_users,can_manage_users,can_create_projects,can_view_all_actions,
  can_create_actions,can_assign_actions,can_reassign_actions,can_review_actions,
  can_approve_actions,can_close_actions,can_reopen_actions,can_export_reports,
  can_manage_box_storage,can_manage_settings,updated_at
)
select u.id,true,true,true,true,true,true,true,true,true,true,true,true,true,true,now()
from auth.users u where lower(u.email)=lower('Sarwar.khalid@miranenergy.com')
on conflict(user_id) do update set
  can_create_users=true,can_manage_users=true,can_create_projects=true,can_view_all_actions=true,
  can_create_actions=true,can_assign_actions=true,can_reassign_actions=true,can_review_actions=true,
  can_approve_actions=true,can_close_actions=true,can_reopen_actions=true,can_export_reports=true,
  can_manage_box_storage=true,can_manage_settings=true,updated_at=now();

-- 6. Action numbering sequence
create sequence if not exists public.action_number_seq start 1;

create or replace function public.set_action_number()
returns trigger
language plpgsql
as $$
declare
  project_code text;
begin
  if new.action_number is null or new.action_number='' or new.action_number='PENDING' then
    select coalesce(code,'GEN') into project_code from public.projects where id=new.project_id;
    new.action_number :=
      'MIR-' || upper(coalesce(project_code,'GEN')) || '-ACT-' ||
      to_char(current_date,'YYYY') || '-' ||
      lpad(nextval('public.action_number_seq')::text,6,'0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_action_number on public.actions;
create trigger trg_set_action_number
before insert on public.actions
for each row execute function public.set_action_number();

-- 7. Allow user to clear own must_change_password after reset
drop policy if exists "profiles_update_self_or_super_admin" on public.profiles;
create policy "profiles_update_self_or_super_admin"
on public.profiles for update to authenticated
using (id=auth.uid() or public.is_super_admin())
with check (id=auth.uid() or public.is_super_admin());

-- 8. Verification
select
  u.email,p.full_name,p.system_role,p.organization_id,p.must_change_password,
  up.can_create_users,up.can_create_actions,up.can_create_projects,
  up.can_export_reports,up.can_manage_box_storage
from auth.users u
join public.profiles p on p.id=u.id
left join public.user_permissions up on up.user_id=u.id
where lower(u.email)=lower('Sarwar.khalid@miranenergy.com');
