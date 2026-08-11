"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {authFetch} from "../../lib/auth-fetch";
export default function Documents(){
  const [entries,setEntries]=useState([]),[error,setError]=useState("");
  useEffect(()=>{(async()=>{try{const r=await authFetch("/api/box/folders");const j=await r.json();if(!r.ok)throw new Error(j.error);setEntries(j.entries||[])}catch(e){setError(e.message)}})()},[]);
  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link><h1>Documents</h1><p className="subtitle">Live view of the configured Action Tracker Pro Box root folder.</p>{error&&<div className="notice error">{error}</div>}
  <section className="admin-card full-card"><table><thead><tr><th>Name</th><th>Type</th><th>Box ID</th><th>Modified</th></tr></thead><tbody>{entries.map(e=><tr key={e.id}><td>{e.name}</td><td>{e.type}</td><td>{e.id}</td><td>{e.modified_at?new Date(e.modified_at).toLocaleString():"—"}</td></tr>)}</tbody></table></section></main>
}
