"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {authFetch} from "../../lib/auth-fetch";
export default function Reports(){
  const [s,setS]=useState(null),[error,setError]=useState("");
  useEffect(()=>{(async()=>{try{const r=await authFetch("/api/reports/summary");const j=await r.json();if(!r.ok)throw new Error(j.error);setS(j)}catch(e){setError(e.message)}})()},[]);
  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link><h1>Reports</h1><p className="subtitle">Live management summary from the action register.</p>{error&&<div className="notice error">{error}</div>}
  {s&&<div className="report-kpis">{[["Total Actions",s.total],["Open",s.open],["Overdue",s.overdue],["Completed",s.completed],["Critical",s.critical],["High Priority",s.high]].map(([l,v])=><div className="report-card" key={l}><span>{l}</span><strong>{v}</strong></div>)}</div>}
  <section className="admin-card full-card"><h2>Reporting Capability</h2><p>This page now reads live data. Excel/PDF export and discipline/project filtering can be added next.</p></section></main>
}
