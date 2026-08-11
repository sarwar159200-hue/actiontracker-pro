import { supabase } from "./supabase";

export async function currentSession() {
  let { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  let session = data?.session;
  if (!session) throw new Error("You are signed out.");
  const expiresAt=(session.expires_at||0)*1000;
  if(expiresAt && expiresAt-Date.now()<60000){
    const refreshed=await supabase.auth.refreshSession();
    if(refreshed.error)throw refreshed.error;
    session=refreshed.data.session;
  }
  return session;
}
