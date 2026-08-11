import { NextResponse } from "next/server";
import { requirePermission } from "../../../../lib/server-supabase";
import { boxConfigurationSummary, getBoxToken, boxGet } from "../../../../lib/box";

export async function GET(request){
  const guard=await requirePermission(request,"can_manage_box_storage");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});

  const config=boxConfigurationSummary();
  const steps=[{step:"Vercel variables",ok:true,detail:config}];

  try{
    await getBoxToken();
    steps.push({step:"Box CCG token",ok:true,detail:`Authenticated using ${config.subject_type} subject.`});

    const folder=await boxGet(`/folders/${process.env.BOX_ROOT_FOLDER_ID}?fields=id,name,type,item_status`);
    steps.push({step:"Root folder access",ok:true,detail:{id:folder.id,name:folder.name,status:folder.item_status}});
    return NextResponse.json({ok:true,steps,folder});
  }catch(e){
    const msg=e.message||"Box connection failed.";
    let likely="Unknown Box authentication issue.";
    if(msg.toLowerCase().includes("credentials")){
      likely="Client ID / Client Secret mismatch, stale secret, wrong Box app, or Box app not re-authorized after configuration changes.";
    } else if(msg.toLowerCase().includes("access_denied")){
      likely="Box app authorization / subject permission issue.";
    } else if(msg.toLowerCase().includes("not found")){
      likely="CCG token succeeded, but the configured root folder is not visible to the Box Service Account.";
    }
    steps.push({step:"Failure",ok:false,detail:msg});
    return NextResponse.json({ok:false,error:msg,likely_cause:likely,steps},{
      status:502
    });
  }
}
