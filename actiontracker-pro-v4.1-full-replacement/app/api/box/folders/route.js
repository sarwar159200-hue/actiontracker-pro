import { NextResponse } from "next/server";
import { requirePermission } from "../../../../lib/server-supabase";
import { boxGet, boxPost } from "../../../../lib/box";

export async function GET(request){
  const guard=await requirePermission(request,"can_manage_box_storage");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  try{
    const id=process.env.BOX_ROOT_FOLDER_ID;
    const data=await boxGet(`/folders/${encodeURIComponent(id)}/items?limit=100&fields=id,name,type,modified_at,size`);
    return NextResponse.json({ok:true,entries:data.entries||[]});
  }catch(e){return NextResponse.json({error:e.message},{status:502})}
}

export async function POST(request){
  const guard=await requirePermission(request,"can_manage_box_storage");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  try{
    const body=await request.json();
    const name=String(body.name||"").trim();
    if(!name)return NextResponse.json({error:"Folder name is required."},{status:400});
    const parentId=body.parent_id||process.env.BOX_ROOT_FOLDER_ID;
    const folder=await boxPost("/folders",{name,parent:{id:String(parentId)}});
    return NextResponse.json({ok:true,folder});
  }catch(e){return NextResponse.json({error:e.message},{status:502})}
}
