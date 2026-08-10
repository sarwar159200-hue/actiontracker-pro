import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireSuperAdmin } from '../../../../lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const access = await requireSuperAdmin(request);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const admin = getSupabaseAdmin();
    const { data: { users }, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const [{ data: profiles, error: pErr }, { data: permissions, error: permErr }] = await Promise.all([
      admin.from('profiles').select('*'),
      admin.from('user_permissions').select('*')
    ]);
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    if (permErr) return NextResponse.json({ error: permErr.message }, { status: 500 });
    const pMap = new Map((profiles || []).map(p => [p.id, p]));
    const permMap = new Map((permissions || []).map(p => [p.user_id, p]));
    return NextResponse.json({ users: users.map(u => ({
      id:u.id,email:u.email,created_at:u.created_at,last_sign_in_at:u.last_sign_in_at,
      email_confirmed_at:u.email_confirmed_at,profile:pMap.get(u.id)||null,permissions:permMap.get(u.id)||null
    })) }, { headers:{'Cache-Control':'no-store'} });
  } catch (e) {
    return NextResponse.json({ error:e.message || 'Unable to load users.' }, { status:500 });
  }
}

export async function POST(request) {
  const access = await requireSuperAdmin(request);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  try {
    const admin = getSupabaseAdmin();
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const fullName = String(body.full_name || '').trim();
    const role = body.system_role || 'user';
    if (!email || !fullName) return NextResponse.json({ error:'Full name and email are required.' }, { status:400 });
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://actiontracker-pro.vercel.app').replace(/\/$/, '');
    const { data:invite, error:inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data:{ full_name:fullName }, redirectTo:`${siteUrl}/reset-password`
    });
    if (inviteError) return NextResponse.json({ error:inviteError.message }, { status:400 });
    const userId = invite?.user?.id;
    if (userId) {
      const { error:profileError } = await admin.from('profiles').upsert({
        id:userId,full_name:fullName,job_title:body.job_title||null,system_role:role,is_active:true,updated_at:new Date().toISOString()
      }, { onConflict:'id' });
      if (profileError) return NextResponse.json({ error:`Invitation sent, but profile update failed: ${profileError.message}` }, { status:500 });
      const { error:permError } = await admin.from('user_permissions').upsert({
        user_id:userId,...(body.permissions||{}),updated_at:new Date().toISOString()
      }, { onConflict:'user_id' });
      if (permError) return NextResponse.json({ error:`Invitation sent, but permissions update failed: ${permError.message}` }, { status:500 });
    }
    return NextResponse.json({ ok:true,user_id:userId,message:'Account invitation sent.' });
  } catch (e) {
    return NextResponse.json({ error:e.message || 'Unable to create user.' }, { status:500 });
  }
}
