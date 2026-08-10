import { createClient } from "@supabase/supabase-js";

function required(name, value) {
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getSupabasePublicServerClient() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const publishable = required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return createClient(url, publishable, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export function getSupabaseAdminClient() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);

  // v3.2 supports the recommended new key name first,
  // with the old environment name as a fallback.
  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY. Add your sb_secret_... key in Vercel."
    );
  }

  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export async function requireUser(request) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) {
    return { error: "Missing login session", status: 401 };
  }

  const token = header.slice(7).trim();
  if (!token) return { error: "Missing login session", status: 401 };

  try {
    const publicClient = getSupabasePublicServerClient();
    const { data, error } = await publicClient.auth.getUser(token);

    if (error || !data?.user) {
      return {
        error: `Invalid login session${error?.message ? `: ${error.message}` : ""}`,
        status: 401
      };
    }
    return { user: data.user };
  } catch (e) {
    return { error: `Supabase configuration error: ${e.message}`, status: 500 };
  }
}

export async function requireSuperAdmin(request) {
  const auth = await requireUser(request);
  if (auth.error) return auth;

  try {
    const admin = getSupabaseAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id,full_name,system_role,is_active")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (error) {
      return { error: `Unable to read user profile: ${error.message}`, status: 500 };
    }

    if (!profile || profile.system_role !== "super_admin" || profile.is_active !== true) {
      return { error: "Super Admin access required", status: 403 };
    }

    return { user: auth.user, profile, admin };
  } catch (e) {
    return { error: `Unable to read user profile: ${e.message}`, status: 500 };
  }
}
