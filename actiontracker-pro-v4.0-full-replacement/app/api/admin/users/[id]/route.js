import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireSuperAdmin, getSupabaseAdminClient } from "../../../../../lib/server-supabase";

function generateTemporaryPassword() {
  return `M!r${crypto.randomBytes(8).toString("base64url")}7Z`;
}

export async function PATCH(request,{params}) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return NextResponse.json({error:guard.error},{status:guard.status});
  const { id } = await params;
  const body = await request.json();
  const admin = getSupabaseAdminClient();

  if (body.action === "reset_temporary_password") {
    const temporaryPassword = generateTemporaryPassword();
    const { error } = await admin.auth.admin.updateUserById(id,{password:temporaryPassword});
    if (error) return NextResponse.json({error:error.message},{status:400});
    await admin.from("profiles").update({must_change_password:true,updated_at:new Date().toISOString()}).eq("id",id);
    return NextResponse.json({
      ok:true,
      temporary_password:temporaryPassword,
      warning:"Shown once only. Existing passwords are never readable."
    });
  }

  if (body.action === "set_active") {
    const active = !!body.is_active;
    await admin.from("profiles").update({is_active:active,updated_at:new Date().toISOString()}).eq("id",id);
    return NextResponse.json({ok:true});
  }

  return NextResponse.json({error:"Unsupported action"},{status:400});
}
