"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {Paperclip,Info} from "lucide-react";
import {authFetch} from "../../lib/auth-fetch";

const SLA={
  critical:{days:1,label:"Critical"},
  high:{days:3,label:"High"},
  medium:{days:7,label:"Medium"},
  low:{days:14,label:"Low"},
  routine:{days:30,label:"Routine"}
};

function calcDue(urgency){
  const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+SLA[urgency].days);return d.toISOString().slice(0,10)
}

export default function Actions(){
  const [actions,setActions]=useState([]),[projects,setProjects]=useState([]),[users,setUsers]=useState([]);
  const [error,setError]=useState(""),[message,setMessage]=useState(""),[creating,setCreating]=useState(false);
  const [files,setFiles]=useState([]);
  const [form,setForm]=useState({
    title:"",description:"",project_id:"",assigned_to:"",urgency:"medium",
    override_due_date:false,due_date:"",override_reason:""
  });

  const duePreview=useMemo(()=>form.override_due_date?form.due_date:calcDue(form.urgency),[form.urgency,form.override_due_date,form.due_date]);

  async function load(){
    try{
      const [a,p,u]=await Promise.all([authFetch("/api/actions"),authFetch("/api/projects"),authFetch("/api/users/options")]);
      const [aj,pj,uj]=await Promise.all([a.json(),p.json(),u.json()]);
      if(!a.ok)throw new Error(aj.error);if(!p.ok)throw new Error(pj.error);if(!u.ok)throw new Error(uj.error);
      setActions(aj.actions||[]);setProjects(pj.projects||[]);setUsers((uj.users||[]).filter(x=>x.is_active!==false))
    }catch(e){setError(e.message)}
  }
  useEffect(()=>{load()},[]);

  async function create(e){
    e.preventDefault();setCreating(true);setError("");setMessage("");
    try{
      const r=await authFetch("/api/actions",{method:"POST",body:JSON.stringify({...form,due_date:duePreview})});
      const j=await r.json();if(!r.ok)throw new Error(j.error);

      const uploadFailures=[];
      for(const file of files){
        const fd=new FormData();fd.append("file",file);
        const fr=await authFetch(`/api/actions/${j.action.id}/attachments`,{method:"POST",body:fd});
        const fj=await fr.json();
        if(!fr.ok)uploadFailures.push(`${file.name}: ${fj.error||"Upload failed"}`)
      }

      if(uploadFailures.length){
        setMessage(`Action ${j.action.action_number} created. Some attachments failed: ${uploadFailures.join(" | ")}`)
      }else{
        setMessage(`Action ${j.action.action_number} created. Due ${j.action.current_due_date}. ${files.length} attachment(s) saved to its Box action folder.`)
      }

      setForm({title:"",description:"",project_id:"",assigned_to:"",urgency:"medium",override_due_date:false,due_date:"",override_reason:""});
      setFiles([]);
      const input=document.getElementById("create-action-files");if(input)input.value="";
      load()
    }catch(e){setError(e.message)}
    finally{setCreating(false)}
  }

  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link>
    <h1>Actions</h1><p className="subtitle">Create, assign and manage actions using the corporate urgency SLA.</p>

    <div className="sla-banner"><Info size={16}/><div><strong>Default Due-Date SLA</strong><span>Critical 1 day · High 3 days · Medium 7 days · Low 14 days · Routine 30 days from assignment. Super Admin may override with a reason.</span></div></div>

    {error&&<div className="notice error">{error}</div>}{message&&<div className="notice success">{message}</div>}

    <div className="action-layout">
      <section className="admin-card"><h2>Create New Action</h2><form onSubmit={create}>
        <label>Action Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/>
        <label>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>

        <label>Project</label><select value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})} required>
          <option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
        </select>

        <label>Assign To</label><select value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
          <option value="">Assign to myself</option>{users.map(u=><option key={u.id} value={u.id}>{u.full_name} — {u.job_title||u.system_role}</option>)}
        </select>

        <label>Urgency</label><select value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})}>
          <option value="critical">Critical — due in 1 day</option><option value="high">High — due in 3 days</option>
          <option value="medium">Medium — due in 7 days</option><option value="low">Low — due in 14 days</option>
          <option value="routine">Routine — due in 30 days</option>
        </select>

        <div className="due-preview"><span>Calculated Due Date</span><strong>{duePreview}</strong></div>

        <label className="inline-check"><input type="checkbox" checked={form.override_due_date} onChange={e=>setForm({...form,override_due_date:e.target.checked})}/>Super Admin Due-Date Override</label>
        {form.override_due_date&&<>
          <label>Override Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/>
          <label>Override Reason</label><input value={form.override_reason} onChange={e=>setForm({...form,override_reason:e.target.value})} placeholder="Mandatory reason"/>
        </>}

        <label><Paperclip size={13}/> Attach File(s)</label>
        <input id="create-action-files" type="file" multiple onChange={e=>setFiles(Array.from(e.target.files||[]))}/>
        {!!files.length&&<div className="selected-files">{files.map(f=><span key={f.name}>{f.name}</span>)}</div>}

        <button className="wide-primary" disabled={creating}>{creating?"Creating & Uploading…":"Create, Assign & Save Attachments"}</button>
      </form></section>

      <section className="admin-card action-list-card"><h2>Action Register ({actions.length})</h2>
        <table><thead><tr><th>ID</th><th>Action</th><th>Project</th><th>Owner</th><th>Urgency</th><th>Due Date</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>{actions.map(a=><tr key={a.id}>
            <td><Link href={`/actions/${a.id}`}>{a.action_number}</Link></td><td>{a.title}</td><td>{a.project?.code||"—"}</td>
            <td>{a.assignee?.full_name||"Unassigned"}</td><td>{a.urgency||a.priority}</td><td>{a.current_due_date||"—"}</td><td>{a.priority}</td><td>{a.status}</td>
          </tr>)}</tbody>
        </table>
      </section>
    </div>
  </main>
}
