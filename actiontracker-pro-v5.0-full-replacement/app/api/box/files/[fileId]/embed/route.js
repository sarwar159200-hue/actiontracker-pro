import { NextResponse } from "next/server";
import { requireUser } from "../../../../../../lib/server-supabase";
import { boxGet } from "../../../../../../lib/box";

export async function GET(request,{params}) {
  const auth=await requireUser(request);
  if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const {fileId}=await params;
  try{
    const file=await boxGet(`/files/${fileId}?fields=id,name,web_url,expiring_embed_link,file_version,permissions`);
    let embed=file.expiring_embed_link?.url||null;
    if(embed){
      const join=embed.includes("?")?"&":"?";
      embed=`${embed}${join}showDownload=true&showAnnotations=true`;
    }
    return NextResponse.json({file,embed_url:embed});
  }catch(e){return NextResponse.json({error:e.message},{status:502})}
}
