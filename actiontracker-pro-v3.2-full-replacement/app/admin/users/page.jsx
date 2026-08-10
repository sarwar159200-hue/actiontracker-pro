"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, UserPlus, ShieldCheck } from "lucide-react";
import { authFetch } from "../../../lib/auth-fetch";

const PERMS = [
  ["can_create_users","Create Users"],["can_manage_users","Manage Users"],
  ["can_create_projects","Create Projects"],["can_view_all_actions","View All Actions"],
  ["can_create_actions","Create Actions"],["can_assign_actions","Assign Actions"],
  ["can_reassign_actions","Reassign Actions"],["can_review_actions","Review Actions"],
  ["can_approve_actions","Approve Actions"],["can_close_actions","Close Actions"],
  ["can_reopen_actions","Reopen Actions"],["can_export_reports","Export Reports"],
  ["can_manage_box_storage","Manage Box Storage"],["can_manage_settings","Manage Settings"]
];

const roles = [
  ["super_admin","Super Admin"],["organization_admin","Organization Admin"],
  ["project_manager","Project Manager"],["department_manager","Department Manager"],
  ["team_leader","Team Leader"],["user","User"],["viewer","Viewer"]
];

export default function UsersPage(){
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [form,setForm]=useState({
    full_name:"",email:"",job_title:"",system_role:"user",permissions:{}
  });

  async function load(){
    setLoading(true); setError("");
    try{
      const r=await authFetch("/api/admin/users");
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||"Unable to load users");
      setUsers(j.users||[]);
    }catch(e){setError(e.message)}
    finally{setLoading(false)}
  }

  useEffect(()=>{load()},[]);

  async function submit(e){
    e.preventDefault(); setError(""); setMessage("");
    try{
      const r=await authFetch("/api/admin/users",{
        method:"POST",
        body:JSON.stringify(form)
      });
      const j=await r.json();
      if(!r.ok) throw new Error(j.error||"Unable to create account");
      setMessage(j.message||"Invitation sent.");
      setForm({full_name:"",email:"",job_title:"",system_role:"user",permissions:{}});
      await load();
    }catch(e){setError(e.message)}
  }

  function toggle(key){
    setForm(f=>({...f,permissions:{...f.permissions,[key]:!f.permissions[key]}}));
  }

  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <div className="page-title-row">
      <div><h1>User & Authority Management</h1><p>Create accounts, assign authority levels and configure individual permissions.</p></div>
      <button className="outline-btn" onClick={load}><RefreshCw size={15}/> Refresh</button>
    </div>

    <div className="admin-grid">
      <section className="admin-card">
        <h2><UserPlus size={17}/> Create New Account</h2>
        <form onSubmit={submit}>
          <label>Full Name</label><input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/>
          <label>Email Address</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          <label>Job Title</label><input value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})}/>
          <label>Authority Level</label>
          <select value={form.system_role} onChange={e=>setForm({...form,system_role:e.target.value})}>
            {roles.map(([v,l])=><option value={v} key={v}>{l}</option>)}
          </select>

          <h3><ShieldCheck size={15}/> Custom Permissions</h3>
          <div className="permission-grid">
            {PERMS.map(([key,label])=><label className="perm" key={key}>
              <input type="checkbox" checked={!!form.permissions[key]} onChange={()=>toggle(key)}/>{label}
            </label>)}
          </div>

          {error&&<div className="notice error">{error}</div>}
          {message&&<div className="notice success">{message}</div>}
          <button className="wide-primary">Create Account & Send Invite</button>
        </form>
      </section>

      <section className="admin-card users-card">
        <h2>Existing Users ({users.length})</h2>
        {loading?<p>Loading users…</p>:users.length===0?<div className="empty-big">No users returned.</div>:
        <div className="user-table-wrap"><table><thead><tr><th>Name</th><th>Job Title</th><th>Authority</th><th>Status</th></tr></thead>
        <tbody>{users.map(u=><tr key={u.id}><td>{u.full_name}</td><td>{u.job_title||"—"}</td><td>{String(u.system_role).replaceAll("_"," ")}</td><td>{u.is_active?"Active":"Inactive"}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  </main>
}
