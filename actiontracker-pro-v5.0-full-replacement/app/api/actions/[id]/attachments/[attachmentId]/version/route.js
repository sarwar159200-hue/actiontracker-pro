import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdminClient } from "../../../../../../../lib/server-supabase";
import { uploadNewVersionToBox, boxGet } from "../../../../../../../lib/box";

export async function POST(request,{params}) {
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});

  const {id,attachmentId}=await params;
  const admin=getSupabaseAdminClient();

  const {data:a,error:aErr}=await admin.from("actions")
    .select("id,originator_id,assigned_to,reviewer_id,approver_id")
    .eq("id",id).single();
  if(aErr)return NextResponse.json({error:aErr.message},{status:404});

  const {data:p}=await admin.from("profiles").select("system_role,is_active").eq("id",auth.user.id).maybeSingle();
  const related=[a.originator_id,a.assigned_to,a.reviewer_id,a.approver_id].includes(auth.user.id);
  if(!p?.is_active || (p.system_role!=="super_admin"&&!related)) {
    return NextResponse.json({error:"Not authorized."},{status:403});
  }

  const {data:meta,error:mErr}=await admin.from("action_attachments")
    .select("*").eq("id",attachmentId).eq("action_id",id).single();
  if(mErr)return NextResponse.json({error:mErr.message},{status:404});

  const form=await request.formData();
  const file=form.get("file");
  if(!file || typeof file==="string")return NextResponse.json({error:"Choose a file."},{status:400});
  if(file.size>50*1024*1024)return NextResponse.json({error:"New versions above 50 MB require chunked upload."},{status:413});

  try{
    await uploadNewVersionToBox({fileId:meta.box_file_id,file,fileName:meta.file_name});
    const info=await boxGet(`/files/${meta.box_file_id}?fields=id,name,size,web_url,file_version`);
    const revision=String(form.get("revision")||"").trim()||meta.revision;
    await admin.from("action_attachments").update({
      file_size_bytes:info.size||file.size,
      box_file_version_id:info.file_version?.id||meta.box_file_version_id,
      box_web_url:info.web_url||meta.box_web_url,
      revision,
      uploaded_at:new Date().toISOString(),
      uploaded_by:auth.user.id
    }).eq("id",attachmentId);
    return NextResponse.json({ok:true,file_version_id:info.file_version?.id||null});
  }catch(e){return NextResponse.json({error:e.message},{status:502})}
}
