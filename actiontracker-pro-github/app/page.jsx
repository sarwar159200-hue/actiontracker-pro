"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Filter,
  ListTodo,
  Search
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { supabase } from "../lib/supabase";

const sampleActions = [
  { id:"1", action_number:"ACT-1008", title:"Update vendor risk assessment", owner:"Amit Singh", due_date:"2026-08-02", priority:"High", status:"open", completed_at:null },
  { id:"2", action_number:"ACT-1003", title:"Review access control matrix", owner:"Neha Patel", due_date:"2026-08-04", priority:"High", status:"open", completed_at:null },
  { id:"3", action_number:"ACT-1001", title:"Complete security awareness training", owner:"Rahul Kumar", due_date:"2026-08-06", priority:"Medium", status:"open", completed_at:null },
  { id:"4", action_number:"ACT-0997", title:"Implement MFA for all users", owner:"Pooja Shah", due_date:"2026-08-07", priority:"High", status:"open", completed_at:null },
  { id:"5", action_number:"ACT-0992", title:"Backup validation and restore test", owner:"Vikram Gupta", due_date:"2026-08-08", priority:"Medium", status:"open", completed_at:null },
  { id:"6", action_number:"ACT-1012", title:"Update data retention policy", owner:"Amit Singh", due_date:"2026-08-10", priority:"Medium", status:"open", completed_at:null },
  { id:"7", action_number:"ACT-1015", title:"Review third-party contracts", owner:"Neha Patel", due_date:"2026-08-11", priority:"High", status:"open", completed_at:null },
  { id:"8", action_number:"ACT-1017", title:"Patch critical vulnerabilities", owner:"Rahul Kumar", due_date:"2026-08-13", priority:"High", status:"open", completed_at:null },
  { id:"9", action_number:"ACT-1019", title:"Review incident response plan", owner:"Pooja Shah", due_date:"2026-08-14", priority:"Medium", status:"open", completed_at:null },
  { id:"10", action_number:"ACT-1021", title:"Conduct backup verification", owner:"Vikram Gupta", due_date:"2026-08-15", priority:"Low", status:"open", completed_at:null },
  { id:"11", action_number:"ACT-0988", title:"User access recertification", owner:"Amit Singh", due_date:"2026-08-01", priority:"Medium", status:"closed", completed_at:"2026-08-07" },
  { id:"12", action_number:"ACT-0985", title:"Close audit findings", owner:"Neha Patel", due_date:"2026-07-31", priority:"Low", status:"closed", completed_at:"2026-08-06" }
];

function daysDiff(dateStr) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const due = new Date(dateStr + "T00:00:00");
  return Math.ceil((due - today) / 86400000);
}

function initials(name="") {
  return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
}

function titleCase(s="") {
  return s.replaceAll("_"," ").replace(/\b\w/g, m=>m.toUpperCase());
}

export default function Home() {
  const [actions, setActions] = useState(sampleActions);
  const [activeView, setActiveView] = useState("overdue");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("actions")
        .select(`
          id,
          action_number,
          title,
          priority,
          status,
          current_due_date,
          actual_completion_date,
          assigned:profiles!actions_assigned_to_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setActions(data.map(a => ({
          id: a.id,
          action_number: a.action_number,
          title: a.title,
          owner: a.assigned?.full_name || "Unassigned",
          due_date: a.current_due_date,
          priority: titleCase(a.priority || "medium"),
          status: a.status,
          completed_at: a.actual_completion_date
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  const computed = useMemo(() => {
    return actions.map(a => ({...a, days: a.due_date ? daysDiff(a.due_date) : null}));
  }, [actions]);

  const overdue = computed.filter(a => a.status !== "closed" && a.status !== "completed" && a.days < 0);
  const dueSoon = computed.filter(a => a.status !== "closed" && a.status !== "completed" && a.days >= 0 && a.days <= 7);
  const open = computed.filter(a => !["closed","completed","cancelled"].includes(a.status));
  const completed = computed.filter(a => ["closed","completed"].includes(a.status));
  const total = computed.length;

  const lists = {
    overdue,
    dueSoon,
    open,
    completed,
    total: computed
  };

  const filtered = (lists[activeView] || computed).filter(a => {
    const q = query.toLowerCase();
    return !q || [a.action_number, a.title, a.owner, a.priority, a.status]
      .some(v => String(v || "").toLowerCase().includes(q));
  });

  const statusData = [
    { name:"Open", value: open.length },
    { name:"Overdue", value: overdue.length },
    { name:"Due Soon", value: dueSoon.length },
    { name:"Completed", value: completed.length }
  ];

  const priorityData = ["High","Medium","Low"].map(p => ({
    name:p, value: computed.filter(a => a.priority === p).length
  }));

  const completionTrend = [1,2,3,4,5,6,7].map((d,i)=>({
    day:`D${d}`,
    value: Math.max(0, completed.length - 6 + i * 2)
  }));

  const cards = [
    { key:"overdue", label:"Overdue", value:overdue.length, icon:<AlertCircle size={24}/>, cls:"red" },
    { key:"dueSoon", label:"Due Soon", value:dueSoon.length, icon:<CalendarDays size={24}/>, cls:"amber" },
    { key:"open", label:"Open", value:open.length, icon:<Circle size={24}/>, cls:"blue" },
    { key:"completed", label:"Completed", value:completed.length, icon:<CheckCircle2 size={24}/>, cls:"green" },
    { key:"total", label:"Total Actions", value:total, icon:<ListTodo size={24}/>, cls:"gray" }
  ];

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><ClipboardList size={22}/> <strong>Action Tracker Pro</strong></div>
        <div className="top-actions">
          <span className="date-pill"><CalendarDays size={16}/> {new Date().toLocaleDateString()}</span>
          <button className="btn"><Filter size={16}/> Filters</button>
        </div>
      </header>

      <section className="content">
        <div className="kpi-grid">
          {cards.map(c => (
            <button
              key={c.key}
              className={`kpi ${activeView===c.key ? "selected" : ""}`}
              onClick={() => setActiveView(c.key)}
            >
              <div className={`icon-wrap ${c.cls}`}>{c.icon}</div>
              <div>
                <div className={`kpi-label ${c.cls}`}>{c.label}</div>
                <div className="kpi-value">{c.value}</div>
                <div className="kpi-sub">{total ? Math.round((c.value/total)*100) : 0}% of total</div>
              </div>
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>{cards.find(c=>c.key===activeView)?.label || "Actions"} ({filtered.length})</h2>
              <p>Click any KPI card above to display its full action list.</p>
            </div>
            <div className="search">
              <Search size={16}/>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search actions..." />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Action ID</th>
                  <th>Action</th>
                  <th>Owner</th>
                  <th>Due Date</th>
                  <th>{activeView==="overdue" ? "Days Overdue" : "Days Left"}</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="7">Loading from Supabase…</td></tr>}
                {!loading && filtered.length===0 && <tr><td colSpan="7">No actions found.</td></tr>}
                {!loading && filtered.map(a => (
                  <tr key={a.id}>
                    <td><button className="link-btn" onClick={()=>alert(`Open detail page for ${a.action_number}`)}>{a.action_number}</button></td>
                    <td>{a.title}</td>
                    <td><span className="owner"><span className="avatar">{initials(a.owner)}</span>{a.owner}</span></td>
                    <td className={a.days < 0 ? "danger-text" : ""}>{a.due_date || "—"}</td>
                    <td className={a.days < 0 ? "danger-text" : ""}>
                      {a.days === null ? "—" : a.days < 0 ? `${Math.abs(a.days)} days` : `${a.days} days`}
                    </td>
                    <td><span className={`badge ${String(a.priority).toLowerCase()}`}>{a.priority}</span></td>
                    <td><span className="status-badge">{titleCase(a.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dash-grid">
          <div className="panel chart-panel">
            <h3>Actions by Status</h3>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                    {statusData.map((_, i)=><Cell key={i} fill={["#3b82f6","#ef4444","#f59e0b","#22c55e"][i]}/>)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel chart-panel">
            <h3>Actions by Priority</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData} layout="vertical" margin={{left:20,right:20}}>
                <XAxis type="number"/>
                <YAxis dataKey="name" type="category" width={80}/>
                <Tooltip/>
                <Bar dataKey="value" fill="#3b82f6"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel chart-panel">
            <h3>Recent Completed Actions</h3>
            <div className="recent-list">
              {completed.slice(0,5).map(a => (
                <div key={a.id} className="recent-item">
                  <CheckCircle2 size={16}/>
                  <button className="link-btn" onClick={()=>setActiveView("completed")}>{a.action_number}</button>
                  <span>{a.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel chart-panel">
            <h3>Completion Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completionTrend} margin={{left:10,right:20}}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="day"/>
                <YAxis/>
                <Tooltip/>
                <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </main>
  );
}
