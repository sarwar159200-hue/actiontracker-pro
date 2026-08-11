"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {authFetch} from "../../lib/auth-fetch";

export default function Projects(){
  const [projects,setProjects]=useState([]),[error,setError]=useState(""),[message,setMessage]=useState("");
  const [form,setForm]=useState({name:"",code:"",description:"",start_date:"",finish_date:""});
  async function load(){try{const r=await authFetch("/api/projects");const j=await r.json();if(!r.ok)throw new Error(j.error);setProjects(j.projects||[])}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[]);
  async function create(e){e.preventDefault();setError("");setMessage("");try{const r=await authFetch("/api/projects",{method:"POST",body:JSON.stringify(form)});const j=await r.json();if(!r.ok)throw new Error(j.error);setMessage("Project created.");setForm({name:"",code:"",description:"",start_date:"",finish_date:""});load()}catch(e){setError(e.message)}}
  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link><h1>Projects</h1><p className="subtitle">Create and manage Action Tracker Pro projects.</p>
  <div className="admin-grid"><section className="admin-card"><h2>Create Project</h2><form onSubmit={create}>
    <label>Project Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
    <label>Project Code</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} required/>
    <label>Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
    <label>Start Date</label><input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/>
    <label>Finish Date</label><input type="date" value={form.finish_date} onChange={e=>setForm({...form,finish_date:e.target.value})}/>
    {error&&<div className="notice error">{error}</div>}{message&&<div className="notice success">{message}</div>}<button className="wide-primary">Create Project</button>
  </form></section>
  <section className="admin-card users-card"><h2>Existing Projects ({projects.length})</h2><table><thead><tr><th>Code</th><th>Project</th><th>Status</th><th>Start</th><th>Finish</th><th>Box Folder</th></tr></thead>
  <tbody>{projects.map(p=><tr key={p.id}><td>{p.code}</td><td>{p.name}</td><td>{p.status}</td><td>{p.start_date||"—"}</td><td>{p.finish_date||"—"}</td><td>{p.box_folder_id||"Not created"}</td></tr>)}</tbody></table></section></div></main>
}
