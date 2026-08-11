"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../../lib/supabase";
export default function Reset(){
  const router=useRouter();const [p,setP]=useState(""),[c,setC]=useState(""),[m,setM]=useState("");
  async function submit(e){e.preventDefault();setM("");if(p.length<10)return setM("Use at least 10 characters.");if(p!==c)return setM("Passwords do not match.");
    const {error}=await supabase.auth.updateUser({password:p});if(error)return setM(error.message);
    const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.from("profiles").update({must_change_password:false,updated_at:new Date().toISOString()}).eq("id",user.id);
    setM("Password updated.");setTimeout(()=>router.replace("/"),900)}
  return <main className="login"><div className="login-card"><img src="/miran-energy-logo.png" alt="Miran Energy"/><h1>Set New Password</h1><p>Temporary passwords must be changed before using the system.</p><form onSubmit={submit}><label>New Password</label><input type="password" value={p} onChange={e=>setP(e.target.value)} required/><label>Confirm Password</label><input type="password" value={c} onChange={e=>setC(e.target.value)} required/>{m&&<div className="notice">{m}</div>}<button className="wide-primary">Update Password</button></form></div></main>}
