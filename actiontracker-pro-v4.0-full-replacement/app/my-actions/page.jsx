"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {authFetch} from "../../lib/auth-fetch";
export default function MyActions(){
  const [actions,setActions]=useState([]),[error,setError]=useState("");
  useEffect(()=>{(async()=>{try{const r=await authFetch("/api/actions?mine=1");const j=await r.json();if(!r.ok)throw new Error(j.error);setActions(j.actions||[])}catch(e){setError(e.message)}})()},[]);
  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link><h1>My Actions</h1><p className="subtitle">Actions currently assigned to you.</p>{error&&<div className="notice error">{error}</div>}
  <section className="admin-card full-card"><table><thead><tr><th>ID</th><th>Action</th><th>Project</th><th>Due</th><th>Priority</th><th>Status</th></tr></thead><tbody>{actions.map(a=><tr key={a.id}><td><Link href={`/actions/${a.id}`}>{a.action_number}</Link></td><td>{a.title}</td><td>{a.project?.code||"—"}</td><td>{a.current_due_date||"—"}</td><td>{a.priority}</td><td>{a.status}</td></tr>)}</tbody></table></section></main>
}
