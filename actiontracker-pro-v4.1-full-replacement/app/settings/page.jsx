import Link from "next/link";
export default function Settings(){
  return <main className="admin-page"><Link className="back" href="/">← Dashboard</Link><h1>Settings</h1><p className="subtitle">System configuration and integration controls.</p>
  <div className="settings-grid"><Link className="settings-card" href="/settings/storage"><strong>Box Storage</strong><span>Test connection, list root folder and create folders.</span></Link><Link className="settings-card" href="/admin/users"><strong>User & Authority</strong><span>Create users, view emails and reset temporary passwords.</span></Link></div></main>
}
