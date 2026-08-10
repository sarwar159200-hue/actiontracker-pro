import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '../../../../lib/serverAuth';
import { boxFetch } from '../../../../lib/box';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const access = await requireSuperAdmin(request);
  if (!access.ok) return NextResponse.json({ error:access.error }, { status:access.status });
  const folderId = process.env.BOX_ROOT_FOLDER_ID;
  if (!folderId) return NextResponse.json({ error:'BOX_ROOT_FOLDER_ID is not configured.' }, { status:400 });
  try {
    const folder = await boxFetch(`/folders/${folderId}?fields=id,name,owned_by,path_collection`);
    return NextResponse.json({ ok:true,folder }, { headers:{'Cache-Control':'no-store'} });
  } catch (e) {
    return NextResponse.json({ error:e.message }, { status:500 });
  }
}
