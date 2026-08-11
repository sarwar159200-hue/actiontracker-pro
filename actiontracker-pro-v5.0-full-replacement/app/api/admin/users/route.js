import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireSuperAdmin, getSupabaseAdminClient } from "../../../../lib/server-supabase";

function temporaryPassword() {
  return `M!r${crypto.randomBytes(8).toString("base64url")}9A`;
}

const allPerms = [
  "can_create_users","can_manage_users","can_create_projects","can_view_all_actions",
  "can_create_actions","can_assign_actions","can_reassign_actions","can_review_actions",
  "can_approve_actions","can_close_actions","can_reopen_actions","can_export_reports",
  "can_manage_box_storage","can_manage_settings"
];

const roleDefaults = {
  super_admin: allPerms,
  organization_admin: allPerms.filter(x=>!["can_manage_box_storage","can_manage_settings"].includes(x)),
  project_manager: ["can_view_all_actions","can_create_actions","can_assign_actions","can_reassign_actions","can_review_actions","can_approve_actions","can_close_actions","can_reopen_actions","can_export_reports"],
  department_manager: ["can_view_all_actions","can_create_actions","can_assign_actions","can_reassign_actions","can_review_actions","can_close_actions","can_export_reports"],
  team_leader: ["can_create_actions","can_assign_actions","can_reassign_actions","can_review_actions"],
  user: ["can_create_actions","can_assign_actions"],
  viewer: []
};

export async function GET(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return NextResponse.json({error:guard.error},{status:guard.status});

  const admin = guard.admin;
  const { data:authData, error:authError } = await admin.auth.admin.listUsers({ page:1, perPage:1000 });
  if (authError) return NextResponse.json({error:authError.message},{status:500});

  const { data:profiles, error:pError } = await admin
    .from("profiles")
    .select("id,full_name,job_title,system_role,is_active,must_change_password,user_permissions(*)");
  if (pError) return NextResponse.json({error:pError.message},{status:500});

  const map = Object.fromEntries((profiles||[]).map(p=>[p.id,p]));
  return NextResponse.json({
    users:(authData?.users||[]).map(u=>({
      id:u.id,email:u.email,created_at:u.created_at,last_sign_in_at:u.last_sign_in_at,
      ...map[u.id]
    }))
  });
}

export async function POST(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return NextResponse.json({error:guard.error},{status:guard.status});

  const body = await request.json();
  const full_name = String(body.full_name||"").trim();
  const email = String(body.email||"").trim().toLowerCase();
  const job_title = String(body.job_title||"").trim();
  const system_role = body.system_role || "user";
  if (!full_name || !email) return NextResponse.json({error:"Full name and email are required."},{status:400});

  const admin = getSupabaseAdminClient();
  const password = temporaryPassword();

  const { data:created, error:createError } = await admin.auth.admin.createUser({
    email,password,email_confirm:true,user_metadata:{full_name,job_title}
  });
  if (createError) return NextResponse.json({error:createError.message},{status:400});

  const userId = created.user.id;

  await admin.from("profiles").upsert({
    id:userId, full_name, job_title, system_role,
    organization_id:guard.profile.organization_id,
    is_active:true, must_change_password:true, updated_at:new Date().toISOString()
  });

  const selected = new Set([
    ...(roleDefaults[system_role]||[]),
    ...Object.keys(body.permissions||{}).filter(k=>body.permissions[k])
  ]);
  const permissionRow = { user_id:userId, updated_at:new Date().toISOString() };
  allPerms.forEach(k=>permissionRow[k]=selected.has(k));
  const { error:permError } = await admin.from("user_permissions").upsert(permissionRow,{onConflict:"user_id"});
  if (permError) return NextResponse.json({error:`User created, permissions failed: ${permError.message}`},{status:500});

  return NextResponse.json({
    ok:true,
    temporary_password:password,
    warning:"Shown once. Existing passwords cannot be retrieved."
  });
}
