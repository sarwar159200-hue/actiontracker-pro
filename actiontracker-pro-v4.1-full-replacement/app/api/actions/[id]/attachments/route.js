import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdminClient } from "../../../../../lib/server-supabase";
import { ensureActionFolder, uploadSmallFileToBox, boxGet } from "../../../../../lib/box";

async function getActionAndAuthorize(userId,actionId){
  const admin=getSupabaseAdminClient();
  const {data:profile,error:pError}=await admin.from("profiles").select("id,system_role,is_active").eq("id",userId).maybeSingle();
  if(pError||!profile?.is_active)throw new Error("Unable to verify user profile.");
  const {data:action,error}=await admin.from("actions").select(`id,action_number,project_id,originator_id,assigned_to,reviewer_id,approver_id,project:projects(code,name)`).eq("id",actionId).single();
  if(error)throw new Error(error.message);
  const related=[action.originator_id,action.assigned_to,action.reviewer_id,action.approver_id].includes(userId);
  if(profile.system_role!=="super_admin"&&!related)throw new Error("You are not authorized to access attachments for this action.");
  return {admin,action};
}

export async function GET(request,{params}){
  const auth=await requireUser(request); if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  try{
    const {admin}=await getActionAndAuthorize(auth.user.id,id);
    const {data,error}=await admin.from("action_attachments").select("id,file_name,original_file_name,file_extension,mime_type,file_size_bytes,box_file_id,box_folder_id,box_file_version_id,box_web_url,revision,description,uploaded_at,uploaded_by").eq("action_id",id).eq("is_deleted",false).order("uploaded_at",{ascending:false});
    if(error)throw new Error(error.message); return NextResponse.json({attachments:data||[]});
  }catch(e){return NextResponse.json({error:e.message},{status:403})}
}

export async function POST(request,{params}){
  const auth=await requireUser(request); if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const {id}=await params;
  try{
    const {admin,action}=await getActionAndAuthorize(auth.user.id,id);
    const form=await request.formData(); const file=form.get("file"); const revision=String(form.get("revision")||"").trim(); const description=String(form.get("description")||"").trim();
    if(!file||typeof file==="string")return NextResponse.json({error:"Choose a file to upload."},{status:400});
    if(file.size>50*1024*1024)return NextResponse.json({error:"Direct upload supports files up to 50MB. Larger files require Box chunked upload."},{status:413});
    const folder=await ensureActionFolder({projectCode:action.project?.code||"GENERAL",actionNumber:action.action_number});
    const uploaded=await uploadSmallFileToBox({file,fileName:file.name,parentId:folder.id});
    const info=await boxGet(`/files/${encodeURIComponent(uploaded.id)}?fields=id,name,extension,size,web_url,file_version`);
    const {data:meta,error}=await admin.from("action_attachments").insert({action_id:id,file_name:info.name,original_file_name:file.name,file_extension:info.extension||null,mime_type:file.type||null,file_size_bytes:info.size||file.size||null,box_file_id:info.id,box_folder_id:folder.id,box_file_version_id:info.file_version?.id||null,box_web_url:info.web_url||null,revision:revision||null,description:description||null,uploaded_by:auth.user.id}).select().single();
    if(error)throw new Error(`File uploaded to Box, metadata save failed: ${error.message}`);
    return NextResponse.json({ok:true,attachment:meta,folder:{id:folder.id,name:folder.name}});
  }catch(e){return NextResponse.json({error:e.message},{status:500})}
}
