import { supabase } from "./supabase";

export async function authFetch(url, options = {}) {
  // Refresh if needed so API calls do not use an expired browser JWT.
  let { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);

  let session = sessionData?.session;

  if (!session) {
    throw new Error("You are signed out. Please sign in again.");
  }

  const expiresAt = (session.expires_at || 0) * 1000;
  if (expiresAt && expiresAt - Date.now() < 60_000) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) throw new Error(refreshed.error.message);
    session = refreshed.data.session;
  }

  if (!session?.access_token) {
    throw new Error("No valid access token. Please sign in again.");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${session.access_token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...options, headers, cache: "no-store" });
}
