import { NextResponse } from "next/server";
import { requireUser, requirePermission, getSupabaseAdminClient } from "../../../lib/server-supabase";

export async function GET(request){
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const admin=getSupabaseAdminClient();
  const url=new URL(request.url);
  const mine=url.searchParams.get("mine")==="1";
  let q=admin.from("actions").select(`
    id,action_number,title,description,priority,status,progress,original_due_date,current_due_date,
    actual_completion_date,created_at,project_id,originator_id,assigned_to,
    project:projects(name,code),
    assignee:profiles!actions_assigned_to_fkey(full_name)
  `).order("created_at",{ascending:false});
  if(mine)q=q.eq("assigned_to",auth.user.id);
  const {data,error}=await q;
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({actions:data||[]});
}

export async function POST(request){
  const guard=await requirePermission(request,"can_create_actions");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  const body=await request.json();
  if(!body.title||!body.project_id)return NextResponse.json({error:"Title and project are required."},{status:400});
  if(!guard.profile.organization_id)return NextResponse.json({error:"Your profile is not linked to an organization."},{status:400});

  const {data,error}=await guard.admin.from("actions").insert({
    organization_id:guard.profile.organization_id,
    project_id:body.project_id,
    action_number:"PENDING",
    title:body.title.trim(),
    description:body.description||null,
    originator_id:guard.user.id,
    assigned_to:body.assigned_to||guard.user.id,
    priority:body.priority||"medium",
    status:body.assigned_to?"assigned":"open",
    progress:0,
    original_due_date:body.due_date||null,
    current_due_date:body.due_date||null,
    source_type:body.source_type||"Manual",
    created_by:guard.user.id
  }).select().single();
  if(error)return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true,action:data});
}
