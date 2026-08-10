import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../../../lib/serverAuth';

export async function PATCH(request, { params }) {
  const access = await requireSuperAdmin(request);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const { id } = await params;
  const body = await request.json();

  const profilePatch = {};
  for (const key of ['full_name','job_title','system_role','is_active']) {
    if (body[key] !== undefined) profilePatch[key] = body[key];
  }
  if (Object.keys(profilePatch).length) {
    profilePatch.updated_at = new Date().toISOString();
    const { error } = await supabaseAdmin.from('profiles').update(profilePatch).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (body.permissions) {
    const { error } = await supabaseAdmin.from('user_permissions').upsert({
      user_id: id,
      ...body.permissions,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
