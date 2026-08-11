"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {authFetch} from "../../../lib/auth-fetch";

export default function ActionDetail(){
  const {id}=useParams();const [a,setA]=useState(null),[error,setError]=useState(""),[message,setMessage]=useState("");
  async function load(){try{const r=await authFetch(`/api/actions/${id}`);const j=await r.json();if(!r.ok)throw new Error(j.error);setA(j.action)}catch(e){setError(e.message)}}
  useEffect(()=>{if(id)load()},[id]);
  async function update(patch){setError("");setMessage("");try{const r=await authFetch(`/api/actions/${id}`,{method:"PATCH",body:JSON.stringify(patch)});const j=await r.json();if(!r.ok)throw new Error(j.error);setMessage("Action updated.");load()}catch(e){setError(e.message)}}
  if(!a)return <main className="admin-page"><Link className="back" href="/actions">← Actions</Link>{error||"Loading…"}</main>;
  return <main className="admin-page"><Link className="back" href="/actions">← Actions</Link><div className="detail-head"><div><h1>{a.action_number}</h1><p>{a.title}</p></div><span className={`status-chip ${a.status}`}>{a.status}</span></div>
    <div className="detail-grid"><section className="admin-card"><h2>Action Details</h2><dl><dt>Project</dt><dd>{a.project?.code} — {a.project?.name}</dd><dt>Owner</dt><dd>{a.assignee?.full_name||"Unassigned"}</dd><dt>Originator</dt><dd>{a.originator?.full_name||"—"}</dd><dt>Due Date</dt><dd>{a.current_due_date||"—"}</dd><dt>Priority</dt><dd>{a.priority}</dd><dt>Progress</dt><dd>{a.progress}%</dd></dl><p>{a.description||"No description."}</p></section>
    <section className="admin-card"><h2>Update Status</h2><div className="status-buttons">{["open","assigned","in_progress","under_review","completed","closed","on_hold"].map(s=><button key={s} onClick={()=>update({status:s})}>{s.replaceAll("_"," ")}</button>)}</div>
    <label>Progress %</label><input type="number" min="0" max="100" defaultValue={a.progress||0} onBlur={e=>update({progress:Number(e.target.value)})}/>
    {error&&<div className="notice error">{error}</div>}{message&&<div className="notice success">{message}</div>}</section></div>
  </main>
}
