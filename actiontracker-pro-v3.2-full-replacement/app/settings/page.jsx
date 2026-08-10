import Link from "next/link";

export default function Page(){
  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <div className="placeholder-card">
      <h1>Settings</h1>
      <p>System configuration, notification rules and Box storage settings will be managed here.</p>
    </div>
  </main>
}
