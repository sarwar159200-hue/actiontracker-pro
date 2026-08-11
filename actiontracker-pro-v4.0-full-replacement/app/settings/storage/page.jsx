"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {authFetch} from "../../../lib/auth-fetch";
export default function Storage(){
  const [result,setResult]=useState(null),[entries,setEntries]=useState([]),[error,setError]=useState(""),[name,setName]=useState("Action Tracker Test");
  async function test(){setError("");try{const r=await authFetch("/api/box/test");const j=await r.json();if(!r.ok)throw new Error(j.error);setResult(j.folder)}catch(e){setError(e.message)}}
  async function list(){setError("");try{const r=await authFetch("/api/box/folders");const j=await r.json();if(!r.ok)throw new Error(j.error);setEntries(j.entries||[])}catch(e){setError(e.message)}}
  async function create(){setError("");try{const r=await authFetch("/api/box/folders",{method:"POST",body:JSON.stringify({name})});const j=await r.json();if(!r.ok)throw new Error(j.error);setResult(j.folder);list()}catch(e){setError(e.message)}}
  useEffect(()=>{list()},[]);
  return <main className="admin-page"><Link className="back" href="/settings">← Settings</Link><h1>Box Storage Configuration</h1><p className="subtitle">Test the company Box connection and create a folder inside the configured root.</p>
  <div className="storage-grid"><section className="admin-card"><h2>Connection</h2><button className="wide-primary" onClick={test}>Test Box Connection</button>{result&&<div className="notice success">Connected: {result.name} ({result.id})</div>}{error&&<div className="notice error">{error}</div>}</section>
  <section className="admin-card"><h2>Create Folder in Box</h2><label>Folder Name</label><input value={name} onChange={e=>setName(e.target.value)}/><button className="wide-primary" onClick={create}>Create Box Folder</button></section>
  <section className="admin-card"><h2>Root Folder Contents</h2><button className="outline-btn" onClick={list}>Refresh</button><div className="box-items">{entries.map(e=><div key={e.id}><strong>{e.name}</strong><span>{e.type} · {e.id}</span></div>)}</div></section></div></main>
}
