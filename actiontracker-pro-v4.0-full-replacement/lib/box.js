function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export async function getBoxToken() {
  const form = new URLSearchParams();
  form.set("client_id", required("BOX_CLIENT_ID"));
  form.set("client_secret", required("BOX_CLIENT_SECRET"));
  form.set("grant_type", "client_credentials");
  form.set("box_subject_type", "enterprise");
  form.set("box_subject_id", required("BOX_ENTERPRISE_ID"));

  const r = await fetch("https://api.box.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store"
  });
  const text = await r.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!r.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Box authentication failed (${r.status})`);
  }
  return data.access_token;
}

export async function boxGet(path) {
  const token = await getBoxToken();
  const r = await fetch(`https://api.box.com/2.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  const text = await r.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!r.ok) throw new Error(data.message || `Box API failed (${r.status})`);
  return data;
}

export async function boxPost(path, payload) {
  const token = await getBoxToken();
  const r = await fetch(`https://api.box.com/2.0${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  const text = await r.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  if (!r.ok) throw new Error(data.message || `Box API failed (${r.status})`);
  return data;
}
