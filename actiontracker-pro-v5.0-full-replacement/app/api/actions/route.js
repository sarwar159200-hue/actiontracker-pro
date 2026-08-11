import { NextResponse } from "next/server";
import { requireUser, requirePermission, getSupabaseAdminClient } from "../../../lib/server-supabase";
import { dueDateForUrgency, URGENCY_SLA } from "../../../lib/action-sla";

export async function GET(request) {
  const auth = await requireUser(request);
  if (auth.error) return NextResponse.json({error:auth.error},{status:auth.status});

  const admin = getSupabaseAdminClient();
  const url = new URL(request.url);
  const mine = url.searchParams.get("mine")==="1";

  let q = admin.from("actions").select(`
    id,action_number,title,description,priority,urgency,status,progress,
    assigned_at,original_due_date,current_due_date,due_date_override,due_date_override_reason,
    actual_completion_date,created_at,project_id,originator_id,assigned_to,
    project:projects(name,code),
    assignee:profiles!actions_assigned_to_fkey(id,full_name,job_title)
  `).order("created_at",{ascending:false});

  if (mine) q = q.eq("assigned_to",auth.user.id);

  const {data,error} = await q;
  if (error) return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({actions:data||[],sla:URGENCY_SLA});
}

export async function POST(request) {
  const guard = await requirePermission(request,"can_create_actions");
  if (guard.error) return NextResponse.json({error:guard.error},{status:guard.status});

  const body = await request.json();
  if (!body.title || !body.project_id) {
    return NextResponse.json({error:"Action title and project are required."},{status:400});
  }

  const urgency = body.urgency || "medium";
  if (!URGENCY_SLA[urgency]) return NextResponse.json({error:"Invalid urgency level."},{status:400});

  const assignedAt = new Date().toISOString();
  const assignedDate = assignedAt.slice(0,10);
  let dueDate = dueDateForUrgency(urgency,assignedDate);
  let override = false;
  let overrideReason = null;

  if (body.override_due_date) {
    if (guard.profile.system_role !== "super_admin") {
      return NextResponse.json({error:"Only Super Admin can override the urgency SLA due date."},{status:403});
    }
    if (!body.due_date || !String(body.override_reason||"").trim()) {
      return NextResponse.json({error:"Override due date and override reason are required."},{status:400});
    }
    dueDate = body.due_date;
    override = true;
    overrideReason = String(body.override_reason).trim();
  }

  const priority = urgency === "routine" ? "low" : urgency;

  const {data,error} = await guard.admin.from("actions").insert({
    organization_id:guard.profile.organization_id,
    project_id:body.project_id,
    action_number:"PENDING",
    title:String(body.title).trim(),
    description:body.description||null,
    originator_id:guard.user.id,
    assigned_to:body.assigned_to||guard.user.id,
    assigned_at:assignedAt,
    priority,
    urgency,
    status:"assigned",
    progress:0,
    original_due_date:dueDate,
    current_due_date:dueDate,
    due_date_override:override,
    due_date_override_reason:overrideReason,
    source_type:body.source_type||"Manual",
    created_by:guard.user.id
  }).select().single();

  if (error) return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({ok:true,action:data,sla:URGENCY_SLA[urgency]});
}
