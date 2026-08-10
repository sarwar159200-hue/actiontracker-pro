import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '../../../../lib/serverAuth';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return NextResponse.json({ error:auth.error }, { status:auth.status });
  try {
    const admin = getSupabaseAdmin();
    const { data:profile,error } = await admin.from('profiles').select('id,full_name,job_title,system_role,is_active').eq('id',auth.user.id).maybeSingle();
    if (error) return NextResponse.json({ error:error.message }, { status:500 });
    return NextResponse.json({ ok:true,user:{id:auth.user.id,email:auth.user.email},profile });
  } catch (e) {
    return NextResponse.json({ error:e.message }, { status:500 });
  }
}
