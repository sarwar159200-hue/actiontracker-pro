import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../../lib/serverAuth';

export async function GET(request) {
  const access = await requireSuperAdmin(request);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
  const { data: permissions } = await supabaseAdmin.from('user_permissions').select('*');
  const pMap = new Map((profiles || []).map(p => [p.id, p]));
  const permMap = new Map((permissions || []).map(p => [p.user_id, p]));

  return NextResponse.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
      profile: pMap.get(u.id) || null,
      permissions: permMap.get(u.id) || null
    }))
  });
}

export async function POST(request) {
  const access = await requireSuperAdmin(request);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const fullName = String(body.full_name || '').trim();
  const role = body.system_role || 'user';
  if (!email || !fullName) return NextResponse.json({ error: 'Full name and email are required.' }, { status: 400 });

  // Invite is safer than administrators knowing users' passwords.
  const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://actiontracker-pro.vercel.app'}/reset-password`
  });
  if (inviteError) return NextResponse.json({ error: inviteError.message }, { status: 400 });

  const userId = invite?.user?.id;
  if (userId) {
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name: fullName,
      job_title: body.job_title || null,
      system_role: role,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    const permissions = body.permissions || {};
    await supabaseAdmin.from('user_permissions').upsert({
      user_id: userId,
      ...permissions,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  }

  return NextResponse.json({ ok: true, user_id: userId, message: 'Account invitation sent.' });
}
