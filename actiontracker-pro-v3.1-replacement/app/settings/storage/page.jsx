"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Database, FolderCheck, TestTube2 } from 'lucide-react';
import { authFetch } from '../../../lib/clientAuth';

export default function StorageSettings(){
  const router=useRouter(); const [result,setResult]=useState(null), [busy,setBusy]=useState(false);
  async function test(){setBusy(true);setResult(null);try{const r=await authFetch('/api/box/test');const d=await r.json();setResult({ok:r.ok,...d});}catch(e){setResult({ok:false,error:e.message});}finally{setBusy(false);}}
  return <main className="admin-page">
    <div className="admin-page-head"><div><button className="back" onClick={()=>router.push('/')}><ArrowLeft size={16}/> Dashboard</button><h1>Box Storage Configuration</h1><p>Action Tracker Pro stores file metadata in Supabase while the actual documents remain in your company Box.</p></div></div>
    <div className="storage-grid">
      <section className="panel storage-card"><Database size={24}/><h2>Required Vercel Variables</h2><pre>BOX_CLIENT_ID\nBOX_CLIENT_SECRET\nBOX_ENTERPRISE_ID\nBOX_ROOT_FOLDER_ID\nSUPABASE_SERVICE_ROLE_KEY\nNEXT_PUBLIC_SITE_URL</pre><p>Keep Box credentials and the Supabase service role key server-side only.</p></section>
      <section className="panel storage-card"><FolderCheck size={24}/><h2>Recommended Box Root</h2><pre>Action Tracker Pro\n  └── Projects\n      └── [Project Code]\n          └── Actions\n              └── [Action Number]</pre><p>The system can later create these folders automatically as projects and actions are created.</p></section>
      <section className="panel storage-card"><TestTube2 size={24}/><h2>Connection Test</h2><p>After completing the Box Developer Console and Vercel environment variables, test access to the configured root folder.</p><button className="primary" onClick={test} disabled={busy}>{busy?'Testing...':'Test Box Connection'}</button>{result&&<div className={`alert ${result.ok?'success':'error'}`}>{result.ok?`Connected to Box folder: ${result.folder?.name} (ID ${result.folder?.id})`:result.error}</div>}</section>
    </div>
  </main>
}
