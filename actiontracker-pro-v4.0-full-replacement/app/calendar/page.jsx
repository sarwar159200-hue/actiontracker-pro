"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {authFetch} from "../../lib/auth-fetch";
export default function CalendarPage(){
  const [actions,setActions]=useState([]),[error,setError]=useState("");
  useEffect(()=>{(async()=>{try{const r=await authFetch("/api/actions");const j=await r.json();if(!r.ok)throw new Error(j.error);setActions(j.actions||[])}catch(e){setError(e.message)}})()},[]);
  const grouped=useMemo(()=>Object.groupBy?Object.groupBy(actions.filter(a=>a.current_due_date),a=>a.current_due_date):actions.filter(a=>a.current_due_date).reduce((m,a)=>((m[a.current_due_date]??=[]).push(a),m),{}),[actions]);
  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link><h1>Calendar</h1><p className="subtitle">Upcoming action due dates.</p>{error&&<div className="notice error">{error}</div>}
  <div className="calendar-list">{Object.keys(grouped).sort().map(d=><section className="admin-card" key={d}><h2>{d}</h2>{grouped[d].map(a=><div className="calendar-item" key={a.id}><Link href={`/actions/${a.id}`}>{a.action_number}</Link><span>{a.title}</span><em>{a.status}</em></div>)}</section>)}</div></main>
}
