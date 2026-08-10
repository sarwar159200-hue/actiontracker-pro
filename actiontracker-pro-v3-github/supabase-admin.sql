-- ACTION TRACKER PRO - SUPER ADMIN FOUNDATION
-- Create the Supabase Auth user first, then run this SQL.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id,full_name,system_role,is_active,created_at,updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    'user',
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Promote the requested account to Super Admin.
insert into public.profiles (id,full_name,system_role,is_active,created_at,updated_at)
select id,'Sarwar Khalid','super_admin',true,now(),now()
from auth.users
where lower(email)=lower('Sarwar.khalid@miranenergy.com')
on conflict (id) do update set
  full_name='Sarwar Khalid',
  system_role='super_admin',
  is_active=true,
  updated_at=now();

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.profiles
    where id=auth.uid() and system_role='super_admin' and is_active=true
  );
$$;

alter table public.profiles enable row level security;
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
using (id=auth.uid() or public.is_super_admin());
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update to authenticated
using (id=auth.uid() or public.is_super_admin())
with check (id=auth.uid() or public.is_super_admin());

alter table public.actions enable row level security;
drop policy if exists "actions_select" on public.actions;
create policy "actions_select" on public.actions for select to authenticated
using (
  public.is_super_admin()
  or originator_id=auth.uid()
  or assigned_to=auth.uid()
  or reviewer_id=auth.uid()
  or approver_id=auth.uid()
  or exists(
    select 1 from public.project_members pm
    where pm.project_id=actions.project_id
      and pm.user_id=auth.uid()
      and pm.can_view_all_actions=true
  )
);
drop policy if exists "actions_insert" on public.actions;
create policy "actions_insert" on public.actions for insert to authenticated
with check (
  public.is_super_admin()
  or created_by=auth.uid()
  or originator_id=auth.uid()
  or exists(
    select 1 from public.project_members pm
    where pm.project_id=actions.project_id
      and pm.user_id=auth.uid()
      and pm.can_create_actions=true
  )
);
drop policy if exists "actions_update" on public.actions;
create policy "actions_update" on public.actions for update to authenticated
using (
  public.is_super_admin()
  or assigned_to=auth.uid()
  or originator_id=auth.uid()
  or reviewer_id=auth.uid()
  or approver_id=auth.uid()
);
drop policy if exists "actions_delete_admin" on public.actions;
create policy "actions_delete_admin" on public.actions for delete to authenticated
using (public.is_super_admin());

alter table public.projects enable row level security;
drop policy if exists "projects_select" on public.projects;
create policy "projects_select" on public.projects for select to authenticated
using (
  public.is_super_admin()
  or exists(select 1 from public.project_members pm where pm.project_id=projects.id and pm.user_id=auth.uid())
);
drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

alter table public.project_members enable row level security;
drop policy if exists "project_members_select" on public.project_members;
create policy "project_members_select" on public.project_members for select to authenticated
using (user_id=auth.uid() or public.is_super_admin());
drop policy if exists "project_members_admin_all" on public.project_members;
create policy "project_members_admin_all" on public.project_members for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

-- BOX METADATA ONLY. Actual documents remain in Box.
alter table public.action_attachments enable row level security;
drop policy if exists "attachments_select" on public.action_attachments;
create policy "attachments_select" on public.action_attachments for select to authenticated
using (
  public.is_super_admin()
  or exists(
    select 1 from public.actions a
    where a.id=action_attachments.action_id
      and (a.originator_id=auth.uid() or a.assigned_to=auth.uid() or a.reviewer_id=auth.uid() or a.approver_id=auth.uid())
  )
);
drop policy if exists "attachments_insert" on public.action_attachments;
create policy "attachments_insert" on public.action_attachments for insert to authenticated
with check (public.is_super_admin() or uploaded_by=auth.uid());
drop policy if exists "attachments_admin_all" on public.action_attachments;
create policy "attachments_admin_all" on public.action_attachments for all to authenticated
using (public.is_super_admin()) with check (public.is_super_admin());

select u.email,p.full_name,p.system_role,p.is_active
from auth.users u left join public.profiles p on p.id=u.id
where lower(u.email)=lower('Sarwar.khalid@miranenergy.com');
