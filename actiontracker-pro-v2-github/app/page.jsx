"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, CalendarDays, CheckCircle2, Circle, ClipboardList, Filter,
  ListTodo, Search, LayoutDashboard, UserRound, Calendar, BarChart3,
  FolderOpen, Users, Building2, Settings, LogOut, Bell, Plus, ChevronDown
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, LineChart, Line, CartesianGrid
} from "recharts";
import { supabase } from "../lib/supabase";

const CLOSED = ["closed","completed","cancelled"];

function diffDays(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dateStr+"T00:00:00");
  return Math.ceil((due - today)/86400000);
}
function titleCase(s="") { return s.replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase()); }
function initials(s="") { return s.split(/\s+/).filter(Boolean).map(x=>x[0]).join("").slice(0,2).toUpperCase(); }
function dateFmt(v) {
  if(!v) return "—";
  return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(v+"T00:00:00"));
}

export default function Dashboard(){
  const router = useRouter();
  const [profile,setProfile]=useState(null);
  const [actions,setActions]=useState([]);
  const [ready,setReady]=useState(false);
  const [active,setActive]=useState("overdue");
  const [search,setSearch]=useState("");

  useEffect(()=>{
    let alive=true;
    async function init(){
      const {data:{session}} = await supabase.auth.getSession();
      if(!session){ router.replace("/login"); return; }

      const [pRes,aRes] = await Promise.all([
        supabase.from("profiles").select("id,full_name,job_title,system_role,is_active").eq("id",session.user.id).maybeSingle(),
        supabase.from("actions").select(`
          id,action_number,title,priority,status,current_due_date,actual_completion_date,created_at,
          assigned:profiles!actions_assigned_to_fkey(full_name)
        `).order("created_at",{ascending:false})
      ]);

      if(!alive) return;
      setProfile(pRes.data || {full_name:session.user.email,system_role:"user"});
      if(!aRes.error && aRes.data){
        setActions(aRes.data.map(x=>({
          id:x.id, action_number:x.action_number, title:x.title,
          priority:titleCase(x.priority||"medium"), status:x.status||"open",
          due_date:x.current_due_date, completed_at:x.actual_completion_date,
          owner:x.assigned?.full_name||"Unassigned", created_at:x.created_at
        })));
      }
      setReady(true);
    }
    init();
    const {data:listener}=supabase.auth.onAuthStateChange((event)=>{
      if(event==="SIGNED_OUT") router.replace("/login");
    });
    return ()=>{alive=false;listener.subscription.unsubscribe();}
  },[router]);

  const rows=useMemo(()=>actions.map(a=>({...a,days:diffDays(a.due_date)})),[actions]);
  const overdue=rows.filter(a=>!CLOSED.includes(a.status)&&a.days!==null&&a.days<0);
  const dueSoon=rows.filter(a=>!CLOSED.includes(a.status)&&a.days!==null&&a.days>=0&&a.days<=7);
  const open=rows.filter(a=>!CLOSED.includes(a.status));
  const completed=rows.filter(a=>["closed","completed"].includes(a.status));
  const total=rows.length;
  const views={overdue,dueSoon,open,completed,total:rows};

  const filtered=(views[active]||rows).filter(a=>{
    const q=search.trim().toLowerCase();
    return !q || [a.action_number,a.title,a.owner,a.priority,a.status].some(v=>String(v||"").toLowerCase().includes(q));
  }).sort((a,b)=>(a.due_date||"9999").localeCompare(b.due_date||"9999"));

  const cards=[
    ["overdue","Overdue",overdue.length,"red",AlertCircle],
    ["dueSoon","Due Soon",dueSoon.length,"amber",CalendarDays],
    ["open","Open",open.length,"blue",Circle],
    ["completed","Completed",completed.length,"green",CheckCircle2],
    ["total","Total Actions",total,"gray",ListTodo]
  ];

  const statusData=[
    {name:"Open",value:open.length,fill:"#3b82f6"},
    {name:"Overdue",value:overdue.length,fill:"#ef4444"},
    {name:"Due Soon",value:dueSoon.length,fill:"#f59e0b"},
    {name:"Completed",value:completed.length,fill:"#22c55e"}
  ];
  const priorityData=["High","Medium","Low"].map(name=>({name,value:rows.filter(a=>a.priority===name).length}));
  const trend=Array.from({length:7},(_,idx)=>{
    const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(6-idx));
    const iso=d.toISOString().slice(0,10);
    return {date:d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"}),value:completed.filter(a=>a.completed_at===iso).length};
  });

  async function logout(){ await supabase.auth.signOut(); router.replace("/login"); }

  if(!ready) return <div className="loader"><img src="/miran-energy-logo.svg" alt="Miran Energy"/><span>Loading Action Tracker Pro…</span></div>;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="side-brand"><img src="/miran-energy-logo.svg" alt="Miran Energy"/></div>
      <nav>
        {[
          ["Dashboard",LayoutDashboard],["Actions",ListTodo],["My Actions",UserRound],["Calendar",Calendar],
          ["Reports",BarChart3],["Documents",FolderOpen],["Users",Users],["Projects",Building2],["Settings",Settings]
        ].map(([name,Icon],i)=><button key={name} className={i===0?"nav-active":""}><Icon size={18}/><span>{name}</span></button>)}
      </nav>
      <div className="side-user">
        <div className="avatar big">{initials(profile?.full_name)}</div>
        <div className="user-copy"><strong>{profile?.full_name}</strong><span>{titleCase(profile?.system_role||"user")}</span></div>
        <button className="logout" onClick={logout}><LogOut size={17}/></button>
      </div>
    </aside>

    <section className="main">
      <header className="topbar">
        <div><div className="kicker">MIRAN ENERGY</div><h1>Action Tracker Pro</h1></div>
        <div className="top-actions">
          {profile?.system_role==="super_admin" && <span className="admin-tag">Super Admin</span>}
          <button className="icon-btn"><Bell size={18}/></button>
          <button className="small-btn"><CalendarDays size={16}/>{new Date().toLocaleDateString("en-GB")}</button>
          <button className="small-btn"><Filter size={16}/> Filters</button>
          <button className="primary-small"><Plus size={16}/> New Action</button>
        </div>
      </header>

      <div className="content">
        <div className="kpis">
          {cards.map(([key,label,value,color,Icon])=><button key={key} className={`kpi ${active===key?"selected":""}`} onClick={()=>setActive(key)}>
            <div className={`kpi-icon ${color}`}><Icon size={21}/></div>
            <div><span className={`kpi-label ${color}`}>{label}</span><strong>{value}</strong><small>{total?Math.round(value/total*100):0}% of total</small></div>
          </button>)}
        </div>

        <section className="panel table-panel">
          <div className="panel-head">
            <h2>{active==="overdue"?"Overdue Actions":active==="dueSoon"?"Due Soon (Next 7 Days)":cards.find(x=>x[0]===active)?.[1]} ({filtered.length})</h2>
            <div className="tools">
              <div className="search"><Search size={15}/><input placeholder="Search actions..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <button className="sort">Due Date (Earliest) <ChevronDown size={14}/></button>
              <button className="viewall" onClick={()=>setActive("total")}>View All</button>
            </div>
          </div>
          <div className="table-wrap"><table>
            <thead><tr><th>Action ID</th><th>Action</th><th>Owner</th><th>Due Date</th><th>{active==="overdue"?"Days Overdue":"Days Left"}</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan="7" className="empty">No actions found.</td></tr>:
              filtered.map(a=><tr key={a.id}>
                <td><button className="link">{a.action_number}</button></td>
                <td>{a.title}</td>
                <td><span className="owner"><span className="avatar">{initials(a.owner)}</span>{a.owner}</span></td>
                <td className={a.days<0?"danger":""}>{dateFmt(a.due_date)}</td>
                <td className={a.days<0?"danger":""}>{a.days===null?"—":a.days<0?`${Math.abs(a.days)} days`:`${a.days} days`}</td>
                <td><span className={`badge ${a.priority.toLowerCase()}`}>{a.priority}</span></td>
                <td><span className="status">{titleCase(a.status)}</span></td>
              </tr>)}
            </tbody>
          </table></div>
        </section>

        <div className="grid2">
          <section className="panel chart"><h3>Actions by Status</h3>
            {total===0?<div className="chart-empty">No action data yet</div>:<div className="donut-layout">
              <div className="donut"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82}>{statusData.map((x,i)=><Cell key={i} fill={x.fill}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{total}</strong><span>Total</span></div></div>
              <div className="legend">{statusData.map(x=><div key={x.name}><i style={{background:x.fill}}></i><span>{x.name}</span><strong>{x.value}</strong></div>)}</div>
            </div>}
          </section>

          <section className="panel chart"><h3>Actions by Priority</h3>
            {total===0?<div className="chart-empty">No priority data yet</div>:<ResponsiveContainer width="100%" height={230}><BarChart data={priorityData} layout="vertical" margin={{left:15,right:25}}><XAxis type="number" allowDecimals={false}/><YAxis dataKey="name" type="category" width={70}/><Tooltip/><Bar dataKey="value" fill="#3b82f6" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>}
          </section>

          <section className="panel chart"><h3>Recent Completed Actions</h3>
            {completed.length===0?<div className="chart-empty">No completed actions yet</div>:<div className="recent">{completed.slice(0,5).map(a=><div key={a.id}><CheckCircle2 size={15}/><button className="link">{a.action_number}</button><span>{a.title}</span><small>{dateFmt(a.completed_at)}</small></div>)}</div>}
          </section>

          <section className="panel chart"><h3>Completion Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={230}><LineChart data={trend} margin={{left:5,right:20,top:8}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="value" stroke="#22a55b" strokeWidth={3}/></LineChart></ResponsiveContainer>
          </section>
        </div>
      </div>
    </section>
  </main>
}
