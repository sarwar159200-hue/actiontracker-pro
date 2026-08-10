import Link from "next/link";

export default function Page(){
  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <div className="placeholder-card">
      <h1>My Actions</h1>
      <p>This page will show actions assigned to the logged-in user, due soon items and overdue items.</p>
    </div>
  </main>
}
