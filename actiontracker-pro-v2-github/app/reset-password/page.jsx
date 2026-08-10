"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage(){
  const router = useRouter();
  const [ready,setReady]=useState(false), [password,setPassword]=useState(""), [confirm,setConfirm]=useState("");
  const [error,setError]=useState(""), [done,setDone]=useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setReady(!!data?.session));
    const {data} = supabase.auth.onAuthStateChange((event)=>{
      if(event==="PASSWORD_RECOVERY" || event==="SIGNED_IN") setReady(true);
    });
    return ()=>data.subscription.unsubscribe();
  },[]);

  async function submit(e){
    e.preventDefault(); setError("");
    if(password.length<10) return setError("Use at least 10 characters.");
    if(password!==confirm) return setError("Passwords do not match.");
    const {error}=await supabase.auth.updateUser({password});
    if(error) return setError(error.message);
    setDone(true); setTimeout(()=>router.replace("/"),1200);
  }

  return <main className="reset-shell"><div className="reset-card">
    <img src="/miran-energy-logo.svg" alt="Miran Energy"/>
    <h1>Set a New Password</h1>
    <p>Choose a new password for your Action Tracker Pro account.</p>
    {!ready && !done && <div className="alert error">Open this page from the password-reset link sent to your email.</div>}
    {done ? <div className="alert success">Password updated successfully. Redirecting…</div> :
    <form onSubmit={submit}>
      <label>New Password</label><div className="field"><LockKeyhole size={18}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
      <label>Confirm Password</label><div className="field"><LockKeyhole size={18}/><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></div>
      {error && <div className="alert error">{error}</div>}
      <button className="primary" disabled={!ready}>Update Password</button>
    </form>}
  </div></main>
}
