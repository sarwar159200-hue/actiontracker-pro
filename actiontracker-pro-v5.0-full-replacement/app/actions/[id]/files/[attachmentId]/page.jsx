"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {authFetch} from "../../../../../lib/auth-fetch";

export default function FileReview(){
  const {id,attachmentId}=useParams();
  const [attachment,setAttachment]=useState(null),[embed,setEmbed]=useState(""),[comments,setComments]=useState([]);
  const [comment,setComment]=useState(""),[versionFile,setVersionFile]=useState(null),[revision,setRevision]=useState("");
  const [error,setError]=useState(""),[message,setMessage]=useState("");

  async function load(){
    try{
      const ar=await authFetch(`/api/actions/${id}/attachments`);const aj=await ar.json();if(!ar.ok)throw new Error(aj.error);
      const a=(aj.attachments||[]).find(x=>String(x.id)===String(attachmentId));if(!a)throw new Error("Attachment not found.");setAttachment(a);setRevision(a.revision||"");

      const [er,cr]=await Promise.all([authFetch(`/api/box/files/${a.box_file_id}/embed`),authFetch(`/api/box/files/${a.box_file_id}/comments`)]);
      const [ej,cj]=await Promise.all([er.json(),cr.json()]);if(!er.ok)throw new Error(ej.error);if(!cr.ok)throw new Error(cj.error);
      setEmbed(ej.embed_url||"");setComments(cj.comments||[])
    }catch(e){setError(e.message)}
  }
  useEffect(()=>{if(id&&attachmentId)load()},[id,attachmentId]);

  async function addComment(e){
    e.preventDefault();if(!comment.trim())return;
    try{const r=await authFetch(`/api/box/files/${attachment.box_file_id}/comments`,{method:"POST",body:JSON.stringify({message:comment})});const j=await r.json();if(!r.ok)throw new Error(j.error);setComment("");setMessage("Comment added.");load()}catch(e){setError(e.message)}
  }

  async function newVersion(e){
    e.preventDefault();if(!versionFile)return;
    setError("");setMessage("");
    try{
      const fd=new FormData();fd.append("file",versionFile);fd.append("revision",revision);
      const r=await authFetch(`/api/actions/${id}/attachments/${attachmentId}/version`,{method:"POST",body:fd});const j=await r.json();if(!r.ok)throw new Error(j.error);
      setMessage("New file version uploaded to the same Box file.");setVersionFile(null);load()
    }catch(e){setError(e.message)}
  }

  return <main className="file-review-page">
    <div className="file-review-top"><div><Link className="back" href={`/actions/${id}`}>← Action</Link><h1>{attachment?.file_name||"File Review"}</h1></div>
      {attachment?.box_web_url&&<a className="box-open" href={attachment.box_web_url} target="_blank" rel="noreferrer">Open / Edit in Box</a>}
    </div>

    {error&&<div className="notice error">{error}</div>}{message&&<div className="notice success">{message}</div>}

    <div className="file-review-grid">
      <section className="preview-card">{embed?<iframe src={embed} title="Box file preview" className="box-preview-frame" allowFullScreen/>:<div className="preview-placeholder">Box preview becomes available when Box authentication is connected.</div>}</section>
      <aside className="comments-card">
        <h2>File Review</h2>
        <div className="annotation-note"><strong>Review in Program</strong><p>Use Box preview annotations for supported PDFs/images. Add formal file comments below. For editable Office/CAD content, use Open / Edit in Box or upload a revised version back to the same Box file.</p></div>

        <form onSubmit={addComment}><label>Comment</label><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add review comment..."/><button className="wide-primary">Add Comment</button></form>

        <div className="comment-list">{comments.map(c=><div className="comment-item" key={c.id}><strong>{c.created_by?.name||"Box User"}</strong><span>{c.created_at?new Date(c.created_at).toLocaleString():""}</span><p>{c.message}</p></div>)}{!comments.length&&<p className="muted">No comments yet.</p>}</div>

        <hr/>
        <h2>Upload New Version</h2>
        <form onSubmit={newVersion}><label>Revised File</label><input type="file" onChange={e=>setVersionFile(e.target.files?.[0]||null)} required/><label>Revision</label><input value={revision} onChange={e=>setRevision(e.target.value)} placeholder="Rev B"/><button className="wide-primary">Upload New Version</button></form>
      </aside>
    </div>
  </main>
}
