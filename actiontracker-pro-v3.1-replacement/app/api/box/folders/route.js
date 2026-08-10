import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../lib/serverAuth';
import { ensureFolder } from '../../../../lib/box';
export const dynamic = 'force-dynamic';
export async function POST(request) {
  const access = await requireSuperAdmin(request);
  if (!access.ok) return NextResponse.json({ error:access.error }, { status:access.status });
  try {
    const body = await request.json();
    const parentId = String(body.parent_id || process.env.BOX_ROOT_FOLDER_ID || '').trim();
    const name = String(body.name || '').trim();
    if (!parentId || !name) return NextResponse.json({ error:'parent_id and name are required.' }, { status:400 });
    const folder = await ensureFolder(parentId,name);
    return NextResponse.json({ ok:true,folder });
  } catch (e) {
    return NextResponse.json({ error:e.message || 'Unable to create Box folder.' }, { status:500 });
  }
}
