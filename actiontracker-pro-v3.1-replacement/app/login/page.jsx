"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("Sarwar.khalid@miranenergy.com");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({data}) => {
      if (data?.session) router.replace("/");
    });
  }, [router]);

  async function signIn(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setError(error.message);
    router.replace("/");
  }

  async function sendReset(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setBusy(false);
    if (error) return setError(error.message);
    setMessage("Password reset email sent. Open the secure link in your email to choose a new password.");
  }

  return (
    <main className="login-shell">
      <section className="login-hero">
        <img src="/miran-energy-logo.png" className="hero-logo" alt="Miran Energy"/>
        <div>
          <div className="eyebrow">MIRAN ENERGY</div>
          <h1>Action Tracker Pro</h1>
          <p>Professional action, accountability, follow-up and closeout management.</p>
        </div>
        <div className="security-box">
          <ShieldCheck size={22}/>
          <div><strong>Controlled Access</strong><span>Authorized project personnel only.</span></div>
        </div>
      </section>

      <section className="login-side">
        <div className="login-card">
          <img src="/miran-energy-logo.png" className="mobile-logo" alt="Miran Energy"/>
          <h2>{forgot ? "Reset Password" : "Welcome Back"}</h2>
          <p>{forgot ? "Enter your registered email address." : "Sign in to Action Tracker Pro."}</p>

          <form onSubmit={forgot ? sendReset : signIn}>
            <label>Email Address</label>
            <div className="field"><Mail size={18}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>

            {!forgot && <>
              <label>Password</label>
              <div className="field"><LockKeyhole size={18}/><input type={show ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} required />
                <button type="button" className="eye" onClick={()=>setShow(!show)}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
              </div>
            </>}

            {error && <div className="alert error">{error}</div>}
            {message && <div className="alert success">{message}</div>}

            <button className="primary" disabled={busy}>{busy ? "Please wait..." : forgot ? "Send Reset Link" : "Sign In"}</button>
          </form>

          <button className="forgot" onClick={()=>{setForgot(!forgot);setError("");setMessage("");}}>
            {forgot ? "Back to Sign In" : "Forgot Password?"}
          </button>
        </div>
      </section>
    </main>
  );
}
