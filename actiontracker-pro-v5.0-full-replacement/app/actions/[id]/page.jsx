"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {authFetch} from "../../../lib/auth-fetch";

export default function ActionDetail(){
  const {id}=useParams();const [a,setA]=useState(null),[attachments,setAttachments]=useState([]);
  const [error,setError]=useState(""),[message,setMessage]=useState("");
  const [file,setFile]=useState(null),[revision,setRevision]=useState(""),[description,setDescription]=useState("");

  async function load(){
    try{
      const [r,f]=await Promise.all([authFetch(`/api/actions/${id}`),authFetch(`/api/actions/${id}/attachments`)]);
      const [j,fj]=await Promise.all([r.json(),f.json()]);
      if(!r.ok)throw new Error(j.error);if(!f.ok)throw new Error(fj.error);
      setA(j.action);setAttachments(fj.attachments||[])
    }catch(e){setError(e.message)}
  }
  useEffect(()=>{if(id)load()},[id]);

  async function update(patch){
    setError("");setMessage("");
    try{const r=await authFetch(`/api/actions/${id}`,{method:"PATCH",body:JSON.stringify(patch)});const j=await r.json();if(!r.ok)throw new Error(j.error);setMessage("Action updated.");load()}catch(e){setError(e.message)}
  }

  async function upload(e){
    e.preventDefault();if(!file)return;
    setError("");setMessage("");
    try{
      const fd=new FormData();fd.append("file",file);fd.append("revision",revision);fd.append("description",description);
      const r=await authFetch(`/api/actions/${id}/attachments`,{method:"POST",body:fd});const j=await r.json();if(!r.ok)throw new Error(j.error);
      setMessage(`Uploaded to Box folder ${j.folder?.name||a.action_number}.`);setFile(null);setRevision("");setDescription("");load()
    }catch(e){setError(e.message)}
  }

  if(!a)return <main className="admin-page"><Link className="back" href="/actions">← Actions</Link>{error||"Loading…"}</main>;

  return <main className="admin-page"><Link className="back" href="/actions">← Actions</Link>
    <div className="detail-head"><div><h1>{a.action_number}</h1><p>{a.title}</p></div><span className={`status-chip ${a.status}`}>{a.status}</span></div>
    {error&&<div className="notice error">{error}</div>}{message&&<div className="notice success">{message}</div>}

    <div className="detail-grid">
      <section className="admin-card"><h2>Action Details</h2>
        <dl><dt>Project</dt><dd>{a.project?.code} — {a.project?.name}</dd><dt>Owner</dt><dd>{a.assignee?.full_name||"Unassigned"}</dd><dt>Originator</dt><dd>{a.originator?.full_name||"—"}</dd><dt>Urgency</dt><dd>{a.urgency||a.priority}</dd><dt>Due Date</dt><dd>{a.current_due_date||"—"}</dd><dt>Priority</dt><dd>{a.priority}</dd><dt>Progress</dt><dd>{a.progress}%</dd></dl>
        <p>{a.description||"No description."}</p>
      </section>

      <section className="admin-card"><h2>Update Status</h2><div className="status-buttons">{["assigned","in_progress","under_review","completed","closed","on_hold"].map(s=><button key={s} onClick={()=>update({status:s})}>{s.replaceAll("_"," ")}</button>)}</div>
        <label>Progress %</label><input type="number" min="0" max="100" defaultValue={a.progress||0} onBlur={e=>update({progress:Number(e.target.value)})}/>
      </section>
    </div>

    <div className="attachment-grid">
      <section className="admin-card"><h2>Attach Additional File</h2><form onSubmit={upload}>
        <label>File</label><input type="file" onChange={e=>setFile(e.target.files?.[0]||null)} required/>
        <label>Revision</label><input value={revision} onChange={e=>setRevision(e.target.value)} placeholder="Rev A"/>
        <label>Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)}/>
        <button className="wide-primary">Upload to {a.action_number} Box Folder</button>
      </form></section>

      <section className="admin-card attachment-list-card"><h2>Action Files ({attachments.length})</h2>
        <table><thead><tr><th>File</th><th>Revision</th><th>Size</th><th>Uploaded</th><th>Review / Edit</th></tr></thead>
          <tbody>{attachments.map(x=><tr key={x.id}>
            <td>{x.file_name}</td><td>{x.revision||"—"}</td><td>{x.file_size_bytes?`${(x.file_size_bytes/1024/1024).toFixed(2)} MB`:"—"}</td>
            <td>{x.uploaded_at?new Date(x.uploaded_at).toLocaleString():"—"}</td>
            <td><Link className="small-action" href={`/actions/${id}/files/${x.id}`}>Open / Comment / New Version</Link></td>
          </tr>)}{!attachments.length&&<tr><td colSpan="5" className="empty">No attachments yet.</td></tr>}</tbody>
        </table>
      </section>
    </div>
  </main>
}
