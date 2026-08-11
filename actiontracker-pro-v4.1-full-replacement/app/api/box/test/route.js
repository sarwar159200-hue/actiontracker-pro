import { NextResponse } from "next/server";
import { requirePermission } from "../../../../lib/server-supabase";
import { boxGet } from "../../../../lib/box";

export async function GET(request){
  const guard=await requirePermission(request,"can_manage_box_storage");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  try{
    const id=process.env.BOX_ROOT_FOLDER_ID;
    if(!id)throw new Error("Missing BOX_ROOT_FOLDER_ID");
    const folder=await boxGet(`/folders/${encodeURIComponent(id)}?fields=id,name,type,item_status`);
    return NextResponse.json({ok:true,folder});
  }catch(e){
    return NextResponse.json({error:e.message},{status:502});
  }
}
