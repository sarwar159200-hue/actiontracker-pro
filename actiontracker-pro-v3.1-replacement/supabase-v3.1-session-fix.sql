-- ACTION TRACKER PRO v3.1 - Super Admin repair
insert into public.profiles (id,full_name,system_role,is_active,created_at,updated_at)
select id,'Sarwar Khalid','super_admin',true,now(),now()
from auth.users
where lower(email)=lower('Sarwar.khalid@miranenergy.com')
on conflict (id) do update set full_name='Sarwar Khalid',system_role='super_admin',is_active=true,updated_at=now();

insert into public.user_permissions (
  user_id,can_create_users,can_manage_users,can_create_projects,can_view_all_actions,
  can_create_actions,can_assign_actions,can_reassign_actions,can_review_actions,
  can_approve_actions,can_close_actions,can_reopen_actions,can_export_reports,
  can_manage_box,can_manage_settings,updated_at
)
select id,true,true,true,true,true,true,true,true,true,true,true,true,true,true,now()
from auth.users
where lower(email)=lower('Sarwar.khalid@miranenergy.com')
on conflict (user_id) do update set
  can_create_users=true,can_manage_users=true,can_create_projects=true,can_view_all_actions=true,
  can_create_actions=true,can_assign_actions=true,can_reassign_actions=true,can_review_actions=true,
  can_approve_actions=true,can_close_actions=true,can_reopen_actions=true,can_export_reports=true,
  can_manage_box=true,can_manage_settings=true,updated_at=now();

select u.email,p.full_name,p.system_role,p.is_active,up.*
from auth.users u
left join public.profiles p on p.id=u.id
left join public.user_permissions up on up.user_id=u.id
where lower(u.email)=lower('Sarwar.khalid@miranenergy.com');
