"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../../lib/supabase";
export default function Reset(){
  const router=useRouter();const [p,setP]=useState(""),[c,setC]=useState(""),[m,setM]=useState("");
  async function submit(e){e.preventDefault();if(p!==c)return setM("Passwords do not match.");
    const {error}=await supabase.auth.updateUser({password:p});if(error)return setM(error.message);setM("Password updated.");setTimeout(()=>router.replace("/"),1000)}
  return <main className="login"><div className="login-card"><img src="/miran-energy-logo.png" alt="Miran Energy"/><h1>New Password</h1>
  <form onSubmit={submit}><label>New Password</label><input type="password" value={p} onChange={e=>setP(e.target.value)} required/>
  <label>Confirm Password</label><input type="password" value={c} onChange={e=>setC(e.target.value)} required/>{m&&<div className="notice">{m}</div>}<button className="wide-primary">Update Password</button></form></div></main>}
