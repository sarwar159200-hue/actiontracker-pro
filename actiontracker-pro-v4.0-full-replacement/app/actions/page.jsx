"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {authFetch} from "../../lib/auth-fetch";

export default function Actions(){
  const [actions,setActions]=useState([]),[projects,setProjects]=useState([]),[users,setUsers]=useState([]),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [form,setForm]=useState({title:"",description:"",project_id:"",assigned_to:"",due_date:"",priority:"medium"});
  async function load(){
    setError("");
    try{
      const [a,p,u]=await Promise.all([authFetch("/api/actions"),authFetch("/api/projects"),authFetch("/api/users/options")]);
      const [aj,pj,uj]=await Promise.all([a.json(),p.json(),u.json()]);
      if(!a.ok)throw new Error(aj.error);if(!p.ok)throw new Error(pj.error);if(!u.ok)throw new Error(uj.error);
      setActions(aj.actions||[]);setProjects(pj.projects||[]);setUsers(uj.users||[]);
    }catch(e){setError(e.message)}
  }
  useEffect(()=>{load()},[]);
  async function create(e){e.preventDefault();setError("");setMessage("");try{const r=await authFetch("/api/actions",{method:"POST",body:JSON.stringify(form)});const j=await r.json();if(!r.ok)throw new Error(j.error);setMessage(`Action ${j.action.action_number} created.`);setForm({title:"",description:"",project_id:"",assigned_to:"",due_date:"",priority:"medium"});load()}catch(e){setError(e.message)}}
  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link><h1>Actions</h1><p className="subtitle">Create, assign and manage project actions.</p>
    <div className="action-layout"><section className="admin-card"><h2>Create New Action</h2><form onSubmit={create}>
      <label>Action Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
      <label>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
      <label>Project</label><select value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})} required><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
      <label>Assign To</label><select value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}><option value="">Assign to myself</option>{users.map(u=><option key={u.id} value={u.id}>{u.full_name} — {u.job_title||u.system_role}</option>)}</select>
      <label>Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/>
      <label>Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
      {error&&<div className="notice error">{error}</div>}{message&&<div className="notice success">{message}</div>}<button className="wide-primary">Create & Assign Action</button>
    </form></section>
    <section className="admin-card action-list-card"><h2>Action Register ({actions.length})</h2><table><thead><tr><th>ID</th><th>Action</th><th>Project</th><th>Owner</th><th>Due Date</th><th>Priority</th><th>Status</th></tr></thead>
    <tbody>{actions.map(a=><tr key={a.id}><td><Link href={`/actions/${a.id}`}>{a.action_number}</Link></td><td>{a.title}</td><td>{a.project?.code||"—"}</td><td>{a.assignee?.full_name||"Unassigned"}</td><td>{a.current_due_date||"—"}</td><td>{a.priority}</td><td>{a.status}</td></tr>)}</tbody></table></section></div>
  </main>
}
