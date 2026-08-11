"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,CalendarDays,CheckCircle2,Circle,ListTodo,LayoutDashboard,UserRound,Calendar,BarChart3,
  FolderOpen,Users,Building2,Settings,Bell,Plus,Filter,LogOut
} from "lucide-react";
import {supabase} from "../lib/supabase";

const NAV=[
  ["/","Dashboard",LayoutDashboard],["/actions","Actions",ListTodo],["/my-actions","My Actions",UserRound],
  ["/calendar","Calendar",Calendar],["/reports","Reports",BarChart3],["/documents","Documents",FolderOpen],
  ["/admin/users","Users",Users],["/projects","Projects",Building2],["/settings","Settings",Settings]
];
function dd(v){if(!v)return null;const t=new Date();t.setHours(0,0,0,0);return Math.ceil((new Date(v+"T00:00:00")-t)/86400000)}
export default function Dashboard(){
  const router=useRouter();const [profile,setProfile]=useState(null),[actions,setActions]=useState([]),[ready,setReady]=useState(false),[active,setActive]=useState("overdue");
  useEffect(()=>{(async()=>{
    const {data:{session}}=await supabase.auth.getSession();if(!session){router.replace("/login");return}
    const [{data:p},{data:a}]=await Promise.all([
      supabase.from("profiles").select("full_name,system_role,must_change_password").eq("id",session.user.id).maybeSingle(),
      supabase.from("actions").select("id,action_number,title,priority,status,current_due_date").order("created_at",{ascending:false})
    ]);
    if(p?.must_change_password){router.replace("/reset-password");return}
    setProfile(p);setActions(a||[]);setReady(true)
  })()},[router]);
  const rows=useMemo(()=>actions.map(x=>({...x,days:dd(x.current_due_date)})),[actions]);
  const overdue=rows.filter(x=>!["closed","completed","cancelled"].includes(x.status)&&x.days!==null&&x.days<0);
  const due=rows.filter(x=>!["closed","completed","cancelled"].includes(x.status)&&x.days!==null&&x.days>=0&&x.days<=7);
  const open=rows.filter(x=>!["closed","completed","cancelled"].includes(x.status));
  const completed=rows.filter(x=>["closed","completed"].includes(x.status));
  const map={overdue,due,open,completed,total:rows};const shown=map[active]||rows;
  async function logout(){await supabase.auth.signOut();router.replace("/login")}
  if(!ready)return <div className="center">Loading…</div>;
  return <main className="shell"><aside className="sidebar">
    <img src="/miran-energy-logo.png" className="brand-img"/>
    <nav>{NAV.map(([href,name,Icon])=><Link href={href} key={href} className={href==="/"?"active":""}><Icon size={17}/>{name}</Link>)}</nav>
    <div className="side-footer"><div>{profile?.full_name||"User"}<small>{(profile?.system_role||"user").replaceAll("_"," ")}</small></div><button onClick={logout} className="logout-btn"><LogOut size={16}/> Logout</button></div>
  </aside><section className="main">
    <header><div><small>MIRAN ENERGY</small><h1>Action Tracker Pro</h1></div>
      <div className="header-actions"><button><Bell size={16}/></button><button><CalendarDays size={16}/>{new Date().toLocaleDateString("en-GB")}</button><button><Filter size={16}/>Filters</button><Link href="/actions" className="new"><Plus size={16}/>New Action</Link></div>
    </header>
    <div className="content">
      <div className="kpi-grid">
      {[["overdue","Overdue",overdue.length,"red",AlertCircle],["due","Due Soon",due.length,"amber",CalendarDays],["open","Open",open.length,"blue",Circle],["completed","Completed",completed.length,"green",CheckCircle2],["total","Total Actions",rows.length,"gray",ListTodo]].map(([k,l,v,c,I])=>
        <button key={k} className={`kpi ${active===k?"selected":""}`} onClick={()=>setActive(k)}><span className={c}><I/></span><div><small>{l}</small><strong>{v}</strong><em>{rows.length?Math.round(v/rows.length*100):0}% of total</em></div></button>)}
      </div>
      <section className="panel"><div className="panel-title"><strong>{active==="overdue"?"Overdue Actions":active==="due"?"Due Soon":active==="total"?"Total Actions":active[0].toUpperCase()+active.slice(1)} ({shown.length})</strong><Link href="/actions">View All</Link></div>
      <table><thead><tr><th>Action ID</th><th>Action</th><th>Due Date</th><th>Days</th><th>Priority</th><th>Status</th></tr></thead><tbody>
      {shown.length?shown.slice(0,8).map(a=><tr key={a.id}><td><Link href={`/actions/${a.id}`}>{a.action_number}</Link></td><td>{a.title}</td><td>{a.current_due_date||"—"}</td><td>{a.days===null?"—":Math.abs(a.days)}</td><td>{a.priority}</td><td>{a.status}</td></tr>):<tr><td colSpan="6" className="empty">No actions found.</td></tr>}
      </tbody></table></section>
      <div className="dash-grid"><section className="panel empty-box">Actions by Status<br/><span>{rows.length?"Live data loaded":"No action data yet"}</span></section><section className="panel empty-box">Actions by Priority<br/><span>{rows.length?"Live data loaded":"No priority data yet"}</span></section><section className="panel empty-box">Recent Completed Actions<br/><span>{completed.length?`${completed.length} completed`:"No completed actions yet"}</span></section><section className="panel empty-box">Completion Trend (Last 7 Days)</section></div>
    </div>
  </section></main>
}
