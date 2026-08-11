import { NextResponse } from "next/server";
import { requirePermission } from "../../../../lib/server-supabase";
import { boxGet, boxPost } from "../../../../lib/box";

export async function GET(request){
  const guard=await requirePermission(request,"can_manage_box_storage");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  try{
    const id=process.env.BOX_ROOT_FOLDER_ID;
    const data=await boxGet(`/folders/${id}/items?limit=100&fields=id,name,type,modified_at,size`);
    return NextResponse.json({entries:data.entries||[]});
  }catch(e){return NextResponse.json({error:e.message},{status:502})}
}

export async function POST(request){
  const guard=await requirePermission(request,"can_manage_box_storage");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  const body=await request.json();
  if(!String(body.name||"").trim())return NextResponse.json({error:"Folder name required."},{status:400});
  try{
    const folder=await boxPost("/folders",{name:String(body.name).trim(),parent:{id:String(process.env.BOX_ROOT_FOLDER_ID)}});
    return NextResponse.json({ok:true,folder});
  }catch(e){return NextResponse.json({error:e.message},{status:502})}
}
