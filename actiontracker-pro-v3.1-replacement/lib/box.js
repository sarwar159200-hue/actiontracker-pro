const BOX_API = 'https://api.box.com/2.0';
const BOX_UPLOAD = 'https://upload.box.com/api/2.0';

export async function getBoxAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.BOX_CLIENT_ID || '',
    client_secret: process.env.BOX_CLIENT_SECRET || '',
    box_subject_type: 'enterprise',
    box_subject_id: process.env.BOX_ENTERPRISE_ID || ''
  });

  const response = await fetch('https://api.box.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error_description || data?.error || 'Box authentication failed');
  return data.access_token;
}

export async function boxFetch(path, options = {}) {
  const token = await getBoxAccessToken();
  const response = await fetch(`${BOX_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.message || data?.error || `Box API error ${response.status}`);
  return data;
}

export async function listFolderItems(folderId) {
  return boxFetch(`/folders/${folderId}/items?limit=1000&fields=id,name,type`);
}

export async function ensureFolder(parentId, name) {
  const current = await listFolderItems(parentId);
  const match = current?.entries?.find(x => x.type === 'folder' && x.name.toLowerCase() === name.toLowerCase());
  if (match) return match;
  return boxFetch('/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent: { id: String(parentId) } })
  });
}

export async function uploadSmallFile(folderId, file) {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Files above 50 MB require Box chunked upload. This starter currently supports direct uploads up to 50 MB.');
  }
  const token = await getBoxAccessToken();
  const form = new FormData();
  form.append('attributes', JSON.stringify({ name: file.name, parent: { id: String(folderId) } }));
  form.append('file', file, file.name);

  const response = await fetch(`${BOX_UPLOAD}/files/content`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Box upload failed');
  return data?.entries?.[0];
}
