"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {supabase} from "../../lib/supabase";

export default function Login(){
  const router=useRouter();
  const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState("");
  async function submit(e){
    e.preventDefault();setError("");
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error)return setError(error.message);
    router.replace("/");
  }
  async function reset(){
    setError("");
    if(!email)return setError("Enter your email address first.");
    const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});
    if(error)return setError(error.message);
    setError("Reset link sent. Check your email.");
  }
  return <main className="login"><div className="login-card">
    <img src="/miran-energy-logo.png" alt="Miran Energy"/>
    <h1>Action Tracker Pro</h1>
    <form onSubmit={submit}>
      <label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      {error&&<div className="notice">{error}</div>}
      <button className="wide-primary">Sign In</button>
    </form>
    <button className="link-button" onClick={reset}>Forgot Password?</button>
  </div></main>
}
