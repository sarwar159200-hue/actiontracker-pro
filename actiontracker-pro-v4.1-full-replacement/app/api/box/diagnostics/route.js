import { NextResponse } from "next/server";
import { requirePermission } from "../../../../lib/server-supabase";
import { boxConfigurationSummary, getBoxToken, boxGet } from "../../../../lib/box";

export async function GET(request){
  const guard=await requirePermission(request,"can_manage_box_storage");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  const config=boxConfigurationSummary(); const steps=[];
  try{
    steps.push({step:"Vercel variables",ok:true,detail:config});
    await getBoxToken();
    steps.push({step:"Box CCG token",ok:true,detail:`Authenticated with subject_type=${config.subject_type}`});
    const folderId=process.env.BOX_ROOT_FOLDER_ID;
    const folder=await boxGet(`/folders/${encodeURIComponent(folderId)}?fields=id,name,type,item_status,permissions`);
    steps.push({step:"Box root folder",ok:true,detail:{id:folder.id,name:folder.name,status:folder.item_status}});
    return NextResponse.json({ok:true,config,steps,folder});
  }catch(e){
    steps.push({step:"Failure",ok:false,detail:e.message});
    return NextResponse.json({ok:false,config,steps,error:e.message,guidance:[
      "BOX_CLIENT_ID and BOX_CLIENT_SECRET must come from the same Miran Action Tracker Pro Box application.",
      "For App Access Only CCG, leave BOX_SUBJECT_TYPE unset or set it to enterprise.",
      "BOX_ENTERPRISE_ID must be the Box Enterprise ID, not the root folder ID and not a developer token.",
      "After changing Box app access/scopes, save and re-authorize the application in Box Admin Console.",
      "The Box Service Account must have access to the Action Tracker Pro root folder."
    ]},{status:502});
  }
}
