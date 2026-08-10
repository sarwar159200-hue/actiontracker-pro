import Link from "next/link";

export default function Page(){
  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <div className="placeholder-card">
      <h1>Calendar</h1>
      <p>Action due dates, planned reviews and closeout dates will be shown here.</p>
    </div>
  </main>
}
