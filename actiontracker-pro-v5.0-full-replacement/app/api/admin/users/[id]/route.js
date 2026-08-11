import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireSuperAdmin, getSupabaseAdminClient } from "../../../../../lib/server-supabase";

function tempPassword() {
  return `M!r${crypto.randomBytes(8).toString("base64url")}7Z`;
}

export async function PATCH(request,{params}) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return NextResponse.json({error:guard.error},{status:guard.status});
  const {id} = await params;
  const body = await request.json();
  const admin = getSupabaseAdminClient();

  if (id === guard.user.id && body.action === "remove") {
    return NextResponse.json({error:"You cannot remove your own Super Admin account."},{status:400});
  }

  if (body.action === "reset_temporary_password") {
    const password = tempPassword();
    const {error} = await admin.auth.admin.updateUserById(id,{password});
    if (error) return NextResponse.json({error:error.message},{status:400});
    await admin.from("profiles").update({must_change_password:true,updated_at:new Date().toISOString()}).eq("id",id);
    return NextResponse.json({ok:true,temporary_password:password});
  }

  if (body.action === "remove") {
    // Professional removal = disable/ban, preserve action history and audit trail.
    const {error:banError} = await admin.auth.admin.updateUserById(id,{ban_duration:"876000h"});
    if (banError) return NextResponse.json({error:banError.message},{status:400});
    await admin.from("profiles").update({is_active:false,updated_at:new Date().toISOString()}).eq("id",id);
    return NextResponse.json({ok:true,message:"User removed from active access. Historical actions are preserved."});
  }

  if (body.action === "restore") {
    const {error:restoreError} = await admin.auth.admin.updateUserById(id,{ban_duration:"none"});
    if (restoreError) return NextResponse.json({error:restoreError.message},{status:400});
    await admin.from("profiles").update({is_active:true,updated_at:new Date().toISOString()}).eq("id",id);
    return NextResponse.json({ok:true,message:"User restored."});
  }

  return NextResponse.json({error:"Unsupported action."},{status:400});
}
