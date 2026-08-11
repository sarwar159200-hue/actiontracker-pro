import { createClient } from "@supabase/supabase-js";

function required(name, value) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return String(value).trim();
}

export function getSupabasePublicServerClient() {
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } }
  );
}

export function getSupabaseAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SECRET_KEY");
  return createClient(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    String(key).trim(),
    { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } }
  );
}

export async function requireUser(request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return { error:"Missing login session", status:401 };

  const token = header.slice(7).trim();
  try {
    const client = getSupabasePublicServerClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) {
      return { error:`Invalid login session${error?.message ? `: ${error.message}` : ""}`, status:401 };
    }
    return { user:data.user };
  } catch (e) {
    return { error:`Supabase configuration error: ${e.message}`, status:500 };
  }
}

export async function getProfileAndPermissions(userId) {
  const admin = getSupabaseAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id,full_name,job_title,system_role,is_active,organization_id,must_change_password,user_permissions(*)")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return { admin, profile };
}

export async function requirePermission(request, permission) {
  const auth = await requireUser(request);
  if (auth.error) return auth;
  try {
    const { admin, profile } = await getProfileAndPermissions(auth.user.id);
    if (!profile || !profile.is_active) return { error:"Inactive or missing user profile", status:403 };
    if (profile.system_role === "super_admin") return { user:auth.user, profile, admin };

    const perms = Array.isArray(profile.user_permissions)
      ? profile.user_permissions[0]
      : profile.user_permissions;

    if (!perms?.[permission]) return { error:`Permission required: ${permission}`, status:403 };
    return { user:auth.user, profile, admin };
  } catch (e) {
    return { error:`Unable to read user profile: ${e.message}`, status:500 };
  }
}

export async function requireSuperAdmin(request) {
  const auth = await requireUser(request);
  if (auth.error) return auth;
  try {
    const { admin, profile } = await getProfileAndPermissions(auth.user.id);
    if (!profile || profile.system_role !== "super_admin" || !profile.is_active) {
      return { error:"Super Admin access required", status:403 };
    }
    return { user:auth.user, profile, admin };
  } catch (e) {
    return { error:`Unable to read user profile: ${e.message}`, status:500 };
  }
}
