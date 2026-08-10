import Link from "next/link";

export default function Page(){
  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <div className="placeholder-card">
      <h1>Documents</h1>
      <p>This page will provide the Box-backed document view and action attachment browser.</p>
    </div>
  </main>
}
