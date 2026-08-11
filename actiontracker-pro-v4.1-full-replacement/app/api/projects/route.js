import { NextResponse } from "next/server";
import { requireUser, requirePermission, getSupabaseAdminClient } from "../../../lib/server-supabase";

export async function GET(request){
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const admin=getSupabaseAdminClient();
  const {data,error}=await admin.from("projects").select("id,name,code,status,start_date,finish_date,box_folder_id,created_at").order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({projects:data||[]});
}

export async function POST(request){
  const guard=await requirePermission(request,"can_create_projects");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  const body=await request.json();
  if(!body.name||!body.code)return NextResponse.json({error:"Project name and code are required."},{status:400});
  const organization_id=guard.profile.organization_id;
  if(!organization_id)return NextResponse.json({error:"Your profile is not linked to an organization."},{status:400});
  const {data,error}=await guard.admin.from("projects").insert({
    organization_id,name:body.name.trim(),code:body.code.trim().toUpperCase(),description:body.description||null,
    status:"active",start_date:body.start_date||null,finish_date:body.finish_date||null,created_by:guard.user.id
  }).select().single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true,project:data});
}
