import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../lib/serverAuth';
import { ensureFolder } from '../../../../lib/box';

export async function POST(request) {
  const access = await requireSuperAdmin(request);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const body = await request.json();
  const parentId = body.parent_id || process.env.BOX_ROOT_FOLDER_ID;
  const name = String(body.name || '').trim();
  if (!parentId || !name) return NextResponse.json({ error: 'parent_id/root folder and name are required.' }, { status: 400 });
  try {
    const folder = await ensureFolder(parentId, name);
    return NextResponse.json({ ok: true, folder });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
