"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {authFetch} from "../../../lib/auth-fetch";

export default function Storage(){
  const [diag,setDiag]=useState(null),[entries,setEntries]=useState([]),[error,setError]=useState(""),[name,setName]=useState("Action Tracker Test"),[busy,setBusy]=useState(false);

  async function diagnose(){
    setBusy(true);setError("");setDiag(null);
    try{const r=await authFetch("/api/box/diagnostics");const j=await r.json();setDiag(j);if(!r.ok)throw new Error(j.error);await list()}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  async function list(){try{const r=await authFetch("/api/box/folders");const j=await r.json();if(!r.ok)throw new Error(j.error);setEntries(j.entries||[])}catch(e){setError(e.message)}}
  async function create(){setError("");try{const r=await authFetch("/api/box/folders",{method:"POST",body:JSON.stringify({name})});const j=await r.json();if(!r.ok)throw new Error(j.error);await list()}catch(e){setError(e.message)}}
  useEffect(()=>{list()},[]);

  return <main className="admin-page"><Link className="back" href="/settings">← Settings</Link><h1>Box Storage Configuration</h1><p className="subtitle">Diagnose CCG authentication, root-folder visibility and write access.</p>
    <div className="storage-grid">
      <section className="admin-card"><h2>Connection & Diagnostics</h2><button className="wide-primary" onClick={diagnose} disabled={busy}>{busy?"Testing…":"Test Box Connection"}</button>
        {error&&<div className="notice error">{error}</div>}
        {diag&&<div className="diag-list">{(diag.steps||[]).map((s,i)=><div key={i} className={s.ok?"diag-ok":"diag-bad"}><strong>{s.ok?"✓":"✕"} {s.step}</strong><pre>{typeof s.detail==="string"?s.detail:JSON.stringify(s.detail,null,2)}</pre></div>)}{diag.likely_cause&&<div className="diag-help"><strong>Likely cause:</strong> {diag.likely_cause}</div>}</div>}
      </section>

      <section className="admin-card"><h2>Create Folder in Box</h2><label>Folder Name</label><input value={name} onChange={e=>setName(e.target.value)}/><button className="wide-primary" onClick={create}>Create Box Folder</button></section>

      <section className="admin-card"><h2>Root Folder Contents</h2><button className="outline-btn" onClick={list}>Refresh</button><div className="box-items">{entries.map(e=><div key={e.id}><strong>{e.name}</strong><span>{e.type} · {e.id}</span></div>)}</div></section>
    </div>

    <section className="admin-card box-fix-card"><h2>Important: current Box error</h2>
      <p>If the diagnostic still says <strong>client credentials are invalid</strong>, the website code has reached Box correctly. Box itself is rejecting authentication. Replace the Client ID and freshly fetched Client Secret from the same Box app, confirm the Enterprise ID, save the Box app, re-authorize it, then redeploy Vercel.</p>
    </section>
  </main>
}
