"use client";

import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,CalendarDays,CheckCircle2,Circle,ListTodo,LayoutDashboard,UserRound,Calendar,
  BarChart3,FolderOpen,Users,Building2,Settings,Bell,Plus,Filter,LogOut,Search
} from "lucide-react";
import {
  PieChart,Pie,Cell,ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,
  LineChart,Line,CartesianGrid
} from "recharts";
import {supabase} from "../lib/supabase";

const NAV=[
  ["/","Dashboard",LayoutDashboard],["/actions","Actions",ListTodo],["/my-actions","My Actions",UserRound],
  ["/calendar","Calendar",Calendar],["/reports","Reports",BarChart3],["/documents","Documents",FolderOpen],
  ["/admin/users","Users",Users],["/projects","Projects",Building2],["/settings","Settings",Settings]
];

function diffDays(dateStr){
  if(!dateStr)return null;
  const t=new Date();t.setHours(0,0,0,0);
  return Math.ceil((new Date(dateStr+"T00:00:00")-t)/86400000)
}
function title(s=""){return String(s).replaceAll("_"," ").replace(/\b\w/g,m=>m.toUpperCase())}

export default function Dashboard(){
  const router=useRouter();
  const [profile,setProfile]=useState(null);
  const [rows,setRows]=useState([]);
  const [ready,setReady]=useState(false);
  const [active,setActive]=useState("overdue");
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [project,setProject]=useState("all");
  const [priority,setPriority]=useState("all");
  const [status,setStatus]=useState("all");
  const [owner,setOwner]=useState("all");
  const [query,setQuery]=useState("");

  useEffect(()=>{(async()=>{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session){router.replace("/login");return}

    const [{data:p},{data:a,error}]=await Promise.all([
      supabase.from("profiles").select("full_name,system_role,must_change_password").eq("id",session.user.id).maybeSingle(),
      supabase.from("actions").select(`
        id,action_number,title,priority,urgency,status,current_due_date,actual_completion_date,
        project:projects(id,name,code),
        assignee:profiles!actions_assigned_to_fkey(id,full_name)
      `).order("created_at",{ascending:false})
    ]);

    if(p?.must_change_password){router.replace("/reset-password");return}
    setProfile(p);
    setRows((a||[]).map(x=>({...x,days:diffDays(x.current_due_date)})));
    setReady(true);
  })()},[router]);

  const projects=useMemo(()=>Array.from(new Map(rows.filter(x=>x.project).map(x=>[x.project.id,x.project])).values()),[rows]);
  const owners=useMemo(()=>Array.from(new Map(rows.filter(x=>x.assignee).map(x=>[x.assignee.id,x.assignee])).values()),[rows]);

  const base=useMemo(()=>rows.filter(x=>{
    if(project!=="all" && x.project?.id!==project)return false;
    if(priority!=="all" && x.priority!==priority)return false;
    if(status!=="all" && x.status!==status)return false;
    if(owner!=="all" && x.assignee?.id!==owner)return false;
    const q=query.trim().toLowerCase();
    if(q && ![x.action_number,x.title,x.project?.code,x.project?.name,x.assignee?.full_name].some(v=>String(v||"").toLowerCase().includes(q)))return false;
    return true;
  }),[rows,project,priority,status,owner,query]);

  const overdue=base.filter(x=>!["closed","completed","cancelled"].includes(x.status)&&x.days!==null&&x.days<0);
  const dueSoon=base.filter(x=>!["closed","completed","cancelled"].includes(x.status)&&x.days!==null&&x.days>=0&&x.days<=7);
  const open=base.filter(x=>!["closed","completed","cancelled"].includes(x.status));
  const completed=base.filter(x=>["closed","completed"].includes(x.status));
  const views={overdue,dueSoon,open,completed,total:base};
  const shown=views[active]||base;

  const statusData=[
    {name:"Open",value:open.length,fill:"#3b82f6"},
    {name:"Overdue",value:overdue.length,fill:"#ef4444"},
    {name:"Due Soon",value:dueSoon.length,fill:"#f59e0b"},
    {name:"Completed",value:completed.length,fill:"#22c55e"}
  ];

  const priorityData=["critical","high","medium","low"].map(p=>({
    name:title(p),value:base.filter(x=>x.priority===p).length
  }));

  const trend=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(6-i));
    const iso=d.toISOString().slice(0,10);
    return {date:d.toLocaleDateString("en-GB",{day:"2-digit",month:"short"}),value:completed.filter(x=>x.actual_completion_date===iso).length}
  });

  async function logout(){await supabase.auth.signOut();router.replace("/login")}

  if(!ready)return <div className="center">Loading…</div>;

  const cards=[
    ["overdue","Overdue",overdue.length,"red",AlertCircle],
    ["dueSoon","Due Soon",dueSoon.length,"amber",CalendarDays],
    ["open","Open",open.length,"blue",Circle],
    ["completed","Completed",completed.length,"green",CheckCircle2],
    ["total","Total Actions",base.length,"gray",ListTodo]
  ];

  return <main className="shell">
    <aside className="sidebar">
      <img src="/miran-energy-logo.png" className="brand-img"/>
      <nav>{NAV.map(([href,name,Icon])=><Link href={href} key={href} className={href==="/"?"active":""}><Icon size={17}/>{name}</Link>)}</nav>
      <div className="side-footer">
        <div>{profile?.full_name||"User"}<small>{title(profile?.system_role||"user")}</small></div>
        <button className="logout-btn" onClick={logout}><LogOut size={15}/>Logout</button>
      </div>
    </aside>

    <section className="main">
      <header>
        <div><small>MIRAN ENERGY</small><h1>Action Tracker Pro</h1></div>
        <div className="header-actions">
          <button><Bell size={16}/></button>
          <button><CalendarDays size={16}/>{new Date().toLocaleDateString("en-GB")}</button>
          <button onClick={()=>setFiltersOpen(!filtersOpen)}><Filter size={16}/>Filters</button>
          <Link href="/actions" className="new"><Plus size={16}/>New Action</Link>
        </div>
      </header>

      <div className="content">
        {filtersOpen&&<section className="dashboard-filters">
          <div className="dash-search"><Search size={15}/><input placeholder="Search actions..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
          <select value={project} onChange={e=>setProject(e.target.value)}><option value="all">All Projects</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select>
          <select value={owner} onChange={e=>setOwner(e.target.value)}><option value="all">All Owners</option>{owners.map(o=><option key={o.id} value={o.id}>{o.full_name}</option>)}</select>
          <select value={priority} onChange={e=>setPriority(e.target.value)}><option value="all">All Priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
          <select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All Statuses</option><option value="open">Open</option><option value="assigned">Assigned</option><option value="in_progress">In Progress</option><option value="under_review">Under Review</option><option value="completed">Completed</option><option value="closed">Closed</option><option value="on_hold">On Hold</option></select>
          <button className="outline-btn" onClick={()=>{setProject("all");setOwner("all");setPriority("all");setStatus("all");setQuery("")}}>Clear</button>
        </section>}

        <div className="kpi-grid">
          {cards.map(([k,l,v,c,I])=><button key={k} className={`kpi ${active===k?"selected":""}`} onClick={()=>setActive(k)}>
            <span className={c}><I/></span><div><small>{l}</small><strong>{v}</strong><em>{base.length?Math.round(v/base.length*100):0}% of filtered</em></div>
          </button>)}
        </div>

        <section className="panel">
          <div className="panel-title">
            <strong>{active==="overdue"?"Overdue Actions":active==="dueSoon"?"Due Soon (Next 7 Days)":active==="total"?"Total Actions":title(active)} ({shown.length})</strong>
            <Link href="/actions">View All</Link>
          </div>
          <table><thead><tr><th>Action ID</th><th>Action</th><th>Project</th><th>Owner</th><th>Due Date</th><th>Days</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>{shown.length?shown.slice(0,10).map(a=><tr key={a.id}>
              <td><Link href={`/actions/${a.id}`}>{a.action_number}</Link></td>
              <td>{a.title}</td><td>{a.project?.code||"—"}</td><td>{a.assignee?.full_name||"—"}</td>
              <td>{a.current_due_date||"—"}</td><td>{a.days===null?"—":a.days<0?`${Math.abs(a.days)} overdue`:`${a.days} left`}</td>
              <td>{title(a.priority)}</td><td>{title(a.status)}</td>
            </tr>):<tr><td colSpan="8" className="empty">No actions found.</td></tr>}</tbody>
          </table>
        </section>

        <div className="dash-grid">
          <section className="panel chart-panel"><h3>Actions by Status</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82}>{statusData.map((x,i)=><Cell key={i} fill={x.fill}/>)}</Pie><Tooltip/></PieChart>
            </ResponsiveContainer>
          </section>

          <section className="panel chart-panel"><h3>Actions by Priority</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityData} layout="vertical" margin={{left:10,right:20}}><XAxis type="number" allowDecimals={false}/><YAxis dataKey="name" type="category" width={70}/><Tooltip/><Bar dataKey="value" fill="#3b82f6" radius={[0,4,4,0]}/></BarChart>
            </ResponsiveContainer>
          </section>

          <section className="panel chart-panel"><h3>Recent Completed Actions</h3>
            <div className="recent-list">{completed.slice(0,6).map(a=><div key={a.id}><Link href={`/actions/${a.id}`}>{a.action_number}</Link><span>{a.title}</span><small>{a.actual_completion_date||"—"}</small></div>)}{!completed.length&&<div className="empty-chart">No completed actions yet</div>}</div>
          </section>

          <section className="panel chart-panel"><h3>Completion Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="value" stroke="#22a55b" strokeWidth={3}/></LineChart>
            </ResponsiveContainer>
          </section>
        </div>
      </div>
    </section>
  </main>
}
