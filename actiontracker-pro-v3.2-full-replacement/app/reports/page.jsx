import Link from "next/link";

export default function Page(){
  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <div className="placeholder-card">
      <h1>Reports</h1>
      <p>Management reports, KPI summaries, Excel exports and PDF reports will be available here.</p>
    </div>
  </main>
}
