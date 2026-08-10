import { NextResponse } from "next/server";
import { requireSuperAdmin, getSupabaseAdminClient } from "../../../../lib/server-supabase";

const DEFAULTS = {
  super_admin: {
    can_create_users:true, can_manage_users:true, can_create_projects:true,
    can_view_all_actions:true, can_create_actions:true, can_assign_actions:true,
    can_reassign_actions:true, can_review_actions:true, can_approve_actions:true,
    can_close_actions:true, can_reopen_actions:true, can_export_reports:true,
    can_manage_box_storage:true, can_manage_settings:true
  },
  organization_admin: {
    can_create_users:true, can_manage_users:true, can_create_projects:true,
    can_view_all_actions:true, can_create_actions:true, can_assign_actions:true,
    can_reassign_actions:true, can_review_actions:true, can_approve_actions:true,
    can_close_actions:true, can_reopen_actions:true, can_export_reports:true,
    can_manage_box_storage:false, can_manage_settings:false
  },
  project_manager: {
    can_create_users:false, can_manage_users:false, can_create_projects:false,
    can_view_all_actions:true, can_create_actions:true, can_assign_actions:true,
    can_reassign_actions:true, can_review_actions:true, can_approve_actions:true,
    can_close_actions:true, can_reopen_actions:true, can_export_reports:true,
    can_manage_box_storage:false, can_manage_settings:false
  },
  user: {
    can_create_users:false, can_manage_users:false, can_create_projects:false,
    can_view_all_actions:false, can_create_actions:true, can_assign_actions:true,
    can_reassign_actions:false, can_review_actions:false, can_approve_actions:false,
    can_close_actions:false, can_reopen_actions:false, can_export_reports:false,
    can_manage_box_storage:false, can_manage_settings:false
  },
  viewer: {
    can_create_users:false, can_manage_users:false, can_create_projects:false,
    can_view_all_actions:false, can_create_actions:false, can_assign_actions:false,
    can_reassign_actions:false, can_review_actions:false, can_approve_actions:false,
    can_close_actions:false, can_reopen_actions:false, can_export_reports:false,
    can_manage_box_storage:false, can_manage_settings:false
  }
};

export async function GET(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const admin = guard.admin;
  const { data, error } = await admin
    .from("profiles")
    .select("id,full_name,job_title,system_role,is_active,created_at,user_permissions(*)")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data || [] });
}

export async function POST(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const body = await request.json();
  const full_name = String(body.full_name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const job_title = String(body.job_title || "").trim();
  const system_role = body.system_role || "user";
  const custom = body.permissions || {};

  if (!full_name || !email) {
    return NextResponse.json({ error: "Full name and email are required." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, job_title },
      redirectTo: `${siteUrl}/reset-password`
    });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 });
  }

  const userId = inviteData?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Invitation created but no user ID was returned." }, { status: 500 });
  }

  // Ensure profile exists and role is correct.
  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    full_name,
    job_title,
    system_role,
    is_active: true,
    updated_at: new Date().toISOString()
  });

  if (profileError) {
    return NextResponse.json({ error: `User invited, but profile setup failed: ${profileError.message}` }, { status: 500 });
  }

  const permissions = { ...(DEFAULTS[system_role] || DEFAULTS.user), ...custom };

  const { error: permissionError } = await admin.from("user_permissions").upsert({
    user_id: userId,
    ...permissions,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });

  if (permissionError) {
    return NextResponse.json({ error: `User invited, but permissions failed: ${permissionError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: `Invitation sent to ${email}.`,
    user_id: userId
  });
}
