import { createClient } from '@supabase/supabase-js';

let adminClient = null;

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return adminClient;
}
