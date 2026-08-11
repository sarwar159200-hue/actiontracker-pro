"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {RefreshCw,Copy,KeyRound,UserPlus,UserX,RotateCcw} from "lucide-react";
import {authFetch} from "../../../lib/auth-fetch";

const roles=[["super_admin","Super Admin"],["organization_admin","Organization Admin"],["project_manager","Project Manager"],["department_manager","Department Manager"],["team_leader","Team Leader"],["user","User"],["viewer","Viewer"]];
const perms=[["can_create_users","Create Users"],["can_manage_users","Manage Users"],["can_create_projects","Create Projects"],["can_view_all_actions","View All Actions"],["can_create_actions","Create Actions"],["can_assign_actions","Assign Actions"],["can_reassign_actions","Reassign Actions"],["can_review_actions","Review Actions"],["can_approve_actions","Approve Actions"],["can_close_actions","Close Actions"],["can_reopen_actions","Reopen Actions"],["can_export_reports","Export Reports"],["can_manage_box_storage","Manage Box Storage"],["can_manage_settings","Manage Settings"]];

export default function UsersPage(){
  const [users,setUsers]=useState([]),[error,setError]=useState(""),[message,setMessage]=useState(""),[temp,setTemp]=useState("");
  const [form,setForm]=useState({full_name:"",email:"",job_title:"",system_role:"user",permissions:{}});

  async function load(){setError("");try{const r=await authFetch("/api/admin/users");const j=await r.json();if(!r.ok)throw new Error(j.error);setUsers(j.users||[])}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[]);

  async function create(e){
    e.preventDefault();setError("");setMessage("");setTemp("");
    try{
      const r=await authFetch("/api/admin/users",{method:"POST",body:JSON.stringify(form)});
      const j=await r.json();if(!r.ok)throw new Error(j.error);
      setTemp(j.temporary_password);setMessage("Account created. Copy the temporary password now.");
      setForm({full_name:"",email:"",job_title:"",system_role:"user",permissions:{}});load()
    }catch(e){setError(e.message)}
  }

  async function userAction(id,action){
    if(action==="remove"&&!confirm("Remove this user from active access? Their historical actions will be preserved."))return;
    setError("");setMessage("");setTemp("");
    try{
      const r=await authFetch(`/api/admin/users/${id}`,{method:"PATCH",body:JSON.stringify({action})});
      const j=await r.json();if(!r.ok)throw new Error(j.error);
      if(j.temporary_password)setTemp(j.temporary_password);
      setMessage(j.message||"User updated.");load()
    }catch(e){setError(e.message)}
  }

  function toggle(k){setForm(f=>({...f,permissions:{...f.permissions,[k]:!f.permissions[k]}}))}

  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link>
    <div className="page-title-row"><div><h1>User & Authority Management</h1><p>Create accounts, assign permissions, reset temporary passwords, remove or restore users.</p></div><button className="outline-btn" onClick={load}><RefreshCw size={15}/>Refresh</button></div>

    {temp&&<div className="temp-password"><strong>Temporary Password</strong><code>{temp}</code><button onClick={()=>navigator.clipboard.writeText(temp)}><Copy size={14}/>Copy</button><span>Shown only now. Existing passwords are never readable.</span></div>}
    {error&&<div className="notice error">{error}</div>}
    {message&&<div className="notice success">{message}</div>}

    <div className="admin-grid">
      <section className="admin-card"><h2><UserPlus size={16}/>Create New Account</h2><form onSubmit={create}>
        <label>Full Name</label><input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/>
        <label>Email Address</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
        <label>Job Title</label><input value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})}/>
        <label>Authority Level</label><select value={form.system_role} onChange={e=>setForm({...form,system_role:e.target.value})}>{roles.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
        <h3>Custom Permissions</h3>
        <div className="permission-grid">{perms.map(([k,l])=><label className="perm" key={k}><input type="checkbox" checked={!!form.permissions[k]} onChange={()=>toggle(k)}/>{l}</label>)}</div>
        <button className="wide-primary">Create Account & Generate Temporary Password</button>
      </form></section>

      <section className="admin-card users-card"><h2>Existing Users ({users.length})</h2>
        <div className="user-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Job Title</th><th>Authority</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
          <tbody>{users.map(u=><tr key={u.id}>
            <td>{u.full_name||"—"}</td><td>{u.email}</td><td>{u.job_title||"—"}</td><td>{String(u.system_role||"user").replaceAll("_"," ")}</td>
            <td>{u.is_active?"Active":"Removed"}</td><td>{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleString():"Never"}</td>
            <td><div className="user-action-buttons">
              <button className="small-action" onClick={()=>userAction(u.id,"reset_temporary_password")}><KeyRound size={12}/>Temp Password</button>
              {u.is_active
                ? <button className="small-action danger-btn" onClick={()=>userAction(u.id,"remove")}><UserX size={12}/>Remove</button>
                : <button className="small-action restore-btn" onClick={()=>userAction(u.id,"restore")}><RotateCcw size={12}/>Restore</button>}
            </div></td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </div>
  </main>
}
