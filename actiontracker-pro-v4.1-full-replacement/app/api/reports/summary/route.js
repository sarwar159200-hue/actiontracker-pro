import { NextResponse } from "next/server";
import { requirePermission } from "../../../../lib/server-supabase";

export async function GET(request){
  const guard=await requirePermission(request,"can_export_reports");
  if(guard.error)return NextResponse.json({error:guard.error},{status:guard.status});
  const {data,error}=await guard.admin.from("actions").select("id,status,priority,current_due_date,created_at,actual_completion_date");
  if(error)return NextResponse.json({error:error.message},{status:500});
  const today=new Date();today.setHours(0,0,0,0);
  const overdue=(data||[]).filter(a=>!["closed","completed","cancelled"].includes(a.status)&&a.current_due_date&&new Date(a.current_due_date+"T00:00:00")<today).length;
  const completed=(data||[]).filter(a=>["closed","completed"].includes(a.status)).length;
  return NextResponse.json({
    total:(data||[]).length,
    open:(data||[]).filter(a=>!["closed","completed","cancelled"].includes(a.status)).length,
    completed,overdue,
    critical:(data||[]).filter(a=>a.priority==="critical").length,
    high:(data||[]).filter(a=>a.priority==="high").length
  });
}
