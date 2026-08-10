import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabaseAdmin';

function getBearerToken(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
}

function getVerifierClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  if (!publicKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.');
  return createClient(url, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

export async function requireAuthenticatedUser(request) {
  const token = getBearerToken(request);
  if (!token) return { ok:false, status:401, error:'Missing access token. Please sign out and sign in again.' };

  try {
    const verifier = getVerifierClient();
    const { data, error } = await verifier.auth.getUser(token);
    if (error || !data?.user) {
      return { ok:false, status:401, error:'Invalid or expired session. Please sign out and sign in again.' };
    }
    return { ok:true, user:data.user, token };
  } catch (e) {
    return { ok:false, status:500, error:e.message || 'Authentication configuration error.' };
  }
}

export async function requireSuperAdmin(request) {
  const auth = await requireAuthenticatedUser(request);
  if (!auth.ok) return auth;

  try {
    const admin = getSupabaseAdmin();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id,full_name,system_role,is_active')
      .eq('id', auth.user.id)
      .maybeSingle();

    if (error) return { ok:false, status:500, error:`Unable to read user profile: ${error.message}` };
    if (!profile) return { ok:false, status:403, error:'Your profile was not found. Run the v3.1 Super Admin SQL and sign in again.' };
    if (!profile.is_active) return { ok:false, status:403, error:'Your Action Tracker account is inactive.' };
    if (profile.system_role !== 'super_admin') {
      return { ok:false, status:403, error:`Super Admin access required. Current role: ${profile.system_role || 'user'}.` };
    }
    return { ok:true, user:auth.user, profile, token:auth.token };
  } catch (e) {
    return { ok:false, status:500, error:e.message || 'Server authentication configuration error.' };
  }
}
