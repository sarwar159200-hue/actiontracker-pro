import { supabaseAdmin } from './supabaseAdmin';

export async function requireSuperAdmin(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { ok: false, status: 401, error: 'Missing access token' };

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) return { ok: false, status: 401, error: 'Invalid session' };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id,full_name,system_role,is_active')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.is_active || profile.system_role !== 'super_admin') {
    return { ok: false, status: 403, error: 'Super Admin access required' };
  }
  return { ok: true, user: userData.user, profile };
}
