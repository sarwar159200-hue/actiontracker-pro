import { NextResponse } from "next/server";
import { requireUser, requirePermission, getSupabaseAdminClient } from "../../../../lib/server-supabase";

export async function GET(request,{params}){
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  const admin=getSupabaseAdminClient();
  const {data,error}=await admin.from("actions").select(`
    *,
    project:projects(name,code),
    assignee:profiles!actions_assigned_to_fkey(id,full_name,job_title),
    originator:profiles!actions_originator_id_fkey(id,full_name,job_title),
    action_comments(id,comment_text,created_at,user_id),
    action_attachments(id,file_name,revision,description,box_file_id,box_folder_id,box_web_url,uploaded_at,uploaded_by)
  `).eq("id",id).single();
  if(error)return NextResponse.json({error:error.message},{status:404});
  return NextResponse.json({action:data});
}

export async function PATCH(request,{params}){
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  const body=await request.json();
  const admin=getSupabaseAdminClient();

  const {data:action,error:readError}=await admin.from("actions")
    .select("id,originator_id,assigned_to,reviewer_id,approver_id,status")
    .eq("id",id).single();
  if(readError)return NextResponse.json({error:readError.message},{status:404});

  const {profile}=await (async()=>{ 
    const {getProfileAndPermissions}=await import("../../../../lib/server-supabase");
    return getProfileAndPermissions(auth.user.id);
  })();

  const superAdmin=profile?.system_role==="super_admin";
  const related=[action.originator_id,action.assigned_to,action.reviewer_id,action.approver_id].includes(auth.user.id);
  if(!superAdmin && !related)return NextResponse.json({error:"You are not authorized to update this action."},{status:403});

  const allowed={};
  ["status","progress","current_due_date","assigned_to","reviewer_id","approver_id","closeout_comment"].forEach(k=>{
    if(body[k]!==undefined)allowed[k]=body[k];
  });
  if(body.status==="closed"){
    allowed.closed_at=new Date().toISOString();
    allowed.closed_by=auth.user.id;
    allowed.actual_completion_date=new Date().toISOString().slice(0,10);
    allowed.progress=100;
  }

  const {data,error}=await admin.from("actions").update(allowed).eq("id",id).select().single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true,action:data});
}
