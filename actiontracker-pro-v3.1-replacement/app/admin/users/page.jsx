"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, RefreshCw, ShieldCheck } from 'lucide-react';
import { authFetch } from '../../../lib/clientAuth';

const ROLES = [
  ['super_admin','Super Admin'],['organization_admin','Organization Admin'],['project_manager','Project Manager'],
  ['department_manager','Department Manager'],['team_leader','Team Leader'],['user','User'],['viewer','Viewer']
];
const PERMS = [
  ['can_create_users','Create Users'],['can_manage_users','Manage Users'],['can_create_projects','Create Projects'],
  ['can_view_all_actions','View All Actions'],['can_create_actions','Create Actions'],['can_assign_actions','Assign Actions'],
  ['can_reassign_actions','Reassign Actions'],['can_review_actions','Review Actions'],['can_approve_actions','Approve Actions'],
  ['can_close_actions','Close Actions'],['can_reopen_actions','Reopen Actions'],['can_export_reports','Export Reports'],
  ['can_manage_box','Manage Box Storage'],['can_manage_settings','Manage Settings']
];

export default function UsersAdmin(){
  const router=useRouter();
  const [users,setUsers]=useState([]), [busy,setBusy]=useState(false), [msg,setMsg]=useState(''), [err,setErr]=useState('');
  const [form,setForm]=useState({full_name:'',email:'',job_title:'',system_role:'user',permissions:{}});

  async function load(){
    setBusy(true); setErr('');
    let r;
    try { r=await authFetch('/api/admin/users'); } catch(e) { setBusy(false); setErr(e.message); if(/sign in/i.test(e.message)) router.replace('/login'); return; }
    const d=await r.json();
    setBusy(false); if(!r.ok){setErr(d.error||'Unable to load users');return;} setUsers(d.users||[]);
  }
  useEffect(()=>{load()},[]);

  async function create(e){
    e.preventDefault(); setBusy(true); setErr(''); setMsg('');
    let r;
    try { r=await authFetch('/api/admin/users',{method:'POST',body:JSON.stringify(form)}); } catch(e) { setBusy(false); setErr(e.message); return; }
    const d=await r.json(); setBusy(false);
    if(!r.ok){setErr(d.error||'Unable to create user');return;}
    setMsg('Account invitation sent successfully.'); setForm({full_name:'',email:'',job_title:'',system_role:'user',permissions:{}}); load();
  }

  return <main className="admin-page">
    <div className="admin-page-head"><div><button className="back" onClick={()=>router.push('/')}><ArrowLeft size={16}/> Dashboard</button><h1>User & Authority Management</h1><p>Create accounts, assign authority levels and configure individual permissions.</p></div><button className="small-btn" onClick={load}><RefreshCw size={15}/> Refresh</button></div>

    <div className="admin-grid">
      <section className="panel admin-form-card"><div className="section-title"><UserPlus size={18}/><h2>Create New Account</h2></div>
        <form onSubmit={create}>
          <label>Full Name</label><input className="admin-input" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/>
          <label>Email Address</label><input className="admin-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          <label>Job Title</label><input className="admin-input" value={form.job_title} onChange={e=>setForm({...form,job_title:e.target.value})}/>
          <label>Authority Level</label><select className="admin-input" value={form.system_role} onChange={e=>setForm({...form,system_role:e.target.value})}>{ROLES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>
          <div className="permission-title"><ShieldCheck size={16}/> Custom Permissions</div>
          <div className="permission-grid">{PERMS.map(([k,l])=><label className="check" key={k}><input type="checkbox" checked={!!form.permissions[k]} onChange={e=>setForm({...form,permissions:{...form.permissions,[k]:e.target.checked}})}/><span>{l}</span></label>)}</div>
          {err&&<div className="alert error">{err}</div>}{msg&&<div className="alert success">{msg}</div>}
          <button className="primary" disabled={busy}>{busy?'Please wait...':'Create Account & Send Invite'}</button>
        </form>
      </section>

      <section className="panel admin-users-card"><div className="section-title"><h2>Existing Users ({users.length})</h2></div>
        <div className="user-list">{users.map(u=><div className="user-card" key={u.id}><div className="user-circle">{(u.profile?.full_name||u.email||'?').split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()}</div><div className="user-main"><strong>{u.profile?.full_name||u.email}</strong><span>{u.email}</span><small>{(u.profile?.system_role||'user').replaceAll('_',' ')} · {u.profile?.is_active===false?'Inactive':'Active'}</small></div><div className="user-meta"><span>{u.last_sign_in_at?`Last login ${new Date(u.last_sign_in_at).toLocaleDateString()}`:'Never logged in'}</span></div></div>)}</div>
      </section>
    </div>
  </main>
}
