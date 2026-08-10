import { supabase } from './supabase';

export async function getFreshAccessToken() {
  let { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  let session = data?.session;
  if (!session) throw new Error('You are not signed in. Please sign in again.');

  const expiresAtMs = (session.expires_at || 0) * 1000;
  if (expiresAtMs && expiresAtMs - Date.now() < 60000) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw refreshed.error;
    session = refreshed.data?.session;
  }

  if (!session?.access_token) throw new Error('No access token is available. Please sign in again.');
  return session.access_token;
}

export async function authFetch(url, options = {}) {
  const token = await getFreshAccessToken();
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...options, headers, cache: 'no-store' });
}
