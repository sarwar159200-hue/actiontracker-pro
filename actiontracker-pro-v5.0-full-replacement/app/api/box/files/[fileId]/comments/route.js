import { NextResponse } from "next/server";
import { requireUser } from "../../../../../../lib/server-supabase";
import { boxGet, boxPost } from "../../../../../../lib/box";

export async function GET(request,{params}) {
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const {fileId}=await params;
  try{
    const data=await boxGet(`/files/${fileId}/comments?limit=100`);
    return NextResponse.json({comments:data.entries||[]});
  }catch(e){return NextResponse.json({error:e.message},{status:502})}
}

export async function POST(request,{params}) {
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const {fileId}=await params;
  const body=await request.json();
  if(!String(body.message||"").trim())return NextResponse.json({error:"Comment is required."},{status:400});
  try{
    const comment=await boxPost("/comments",{message:String(body.message).trim(),item:{type:"file",id:String(fileId)}});
    return NextResponse.json({ok:true,comment});
  }catch(e){return NextResponse.json({error:e.message},{status:502})}
}
