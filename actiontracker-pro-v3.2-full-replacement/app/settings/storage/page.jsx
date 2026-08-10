"use client";
import { useState } from "react";
import Link from "next/link";
import { Database, FolderCheck, PlugZap } from "lucide-react";
import { authFetch } from "../../../lib/auth-fetch";

export default function StoragePage(){
  const [busy,setBusy]=useState(false),[result,setResult]=useState(null),[error,setError]=useState("");

  async function test(){
    setBusy(true);setError("");setResult(null);
    try{
      const r=await authFetch("/api/box/test");
      const j=await r.json();
      if(!r.ok) throw new Error([j.error,j.details].filter(Boolean).join(" — "));
      setResult(j.folder);
    }catch(e){setError(e.message)}
    finally{setBusy(false)}
  }

  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <h1>Box Storage Configuration</h1>
    <p className="subtitle">Supabase stores file metadata while the actual documents remain in your company Box.</p>

    <div className="storage-grid">
      <section className="admin-card">
        <Database size={20} className="blue-text"/>
        <h2>Required Vercel Variables</h2>
        <pre>BOX_CLIENT_ID{"\n"}BOX_CLIENT_SECRET{"\n"}BOX_ENTERPRISE_ID{"\n"}BOX_ROOT_FOLDER_ID{"\n"}SUPABASE_SECRET_KEY{"\n"}NEXT_PUBLIC_SITE_URL</pre>
        <small>Keep Box credentials and the Supabase secret key server-side only.</small>
      </section>

      <section className="admin-card">
        <FolderCheck size={20} className="blue-text"/>
        <h2>Recommended Box Root</h2>
        <pre>Action Tracker Pro{"\n"}└── Projects{"\n"}    └── [Project Code]{"\n"}        └── Actions{"\n"}            └── [Action Number]</pre>
        <small>Subfolders can be created automatically as projects and actions are created.</small>
      </section>

      <section className="admin-card">
        <PlugZap size={20} className="blue-text"/>
        <h2>Connection Test</h2>
        <p>Tests your login authorization first, then Box authentication, then the configured root folder.</p>
        <button className="wide-primary" onClick={test} disabled={busy}>{busy?"Testing…":"Test Box Connection"}</button>
        {error&&<div className="notice error">{error}</div>}
        {result&&<div className="notice success"><strong>Connected.</strong><br/>Folder: {result.name}<br/>ID: {result.id}</div>}
      </section>
    </div>
  </main>
}
