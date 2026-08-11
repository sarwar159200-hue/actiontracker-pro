import { NextResponse } from "next/server";
import { requireUser, getSupabaseAdminClient } from "../../../../lib/server-supabase";
export async function GET(request){
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const admin=getSupabaseAdminClient();
  const {data,error}=await admin.from("profiles").select("id,full_name,job_title,system_role,is_active").eq("is_active",true).order("full_name");
  if(error)return NextResponse.json({error:error.message},{status:500});
  return NextResponse.json({users:data||[]});
}
