import { NextResponse } from "next/server";
import { requireSuperAdmin } from "../../../../lib/server-supabase";

function missingEnv() {
  const names = ["BOX_CLIENT_ID","BOX_CLIENT_SECRET","BOX_ENTERPRISE_ID","BOX_ROOT_FOLDER_ID"];
  return names.filter(n => !process.env[n]);
}

export async function GET(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const missing = missingEnv();
  if (missing.length) {
    return NextResponse.json({
      error: `Missing Vercel variables: ${missing.join(", ")}`
    }, { status: 500 });
  }

  const form = new URLSearchParams();
  form.set("client_id", process.env.BOX_CLIENT_ID);
  form.set("client_secret", process.env.BOX_CLIENT_SECRET);
  form.set("grant_type", "client_credentials");
  form.set("box_subject_type", "enterprise");
  form.set("box_subject_id", process.env.BOX_ENTERPRISE_ID);

  let tokenResponse;
  try {
    tokenResponse = await fetch("https://api.box.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store"
    });
  } catch (e) {
    return NextResponse.json({ error: `Unable to contact Box: ${e.message}` }, { status: 502 });
  }

  const tokenText = await tokenResponse.text();
  let tokenJson = {};
  try { tokenJson = JSON.parse(tokenText); } catch {}

  if (!tokenResponse.ok || !tokenJson.access_token) {
    return NextResponse.json({
      error: tokenJson.error_description || tokenJson.error || `Box authentication failed (${tokenResponse.status})`,
      details: "Check Client ID, Client Secret, Enterprise ID, and Box app authorization."
    }, { status: 502 });
  }

  const folderRes = await fetch(
    `https://api.box.com/2.0/folders/${encodeURIComponent(process.env.BOX_ROOT_FOLDER_ID)}?fields=id,name,type,item_status`,
    {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      cache: "no-store"
    }
  );

  const folderText = await folderRes.text();
  let folder = {};
  try { folder = JSON.parse(folderText); } catch {}

  if (!folderRes.ok) {
    return NextResponse.json({
      error: folder.message || `Box root folder check failed (${folderRes.status})`,
      details: "Confirm the Box Service Account has Editor access to the configured root folder."
    }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    folder: {
      id: folder.id,
      name: folder.name,
      type: folder.type,
      status: folder.item_status
    }
  });
}
