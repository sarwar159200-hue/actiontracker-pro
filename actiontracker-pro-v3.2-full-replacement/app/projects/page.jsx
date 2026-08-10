import Link from "next/link";

export default function Page(){
  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <div className="placeholder-card">
      <h1>Projects</h1>
      <p>Super Admin and authorized users will create and manage projects here.</p>
    </div>
  </main>
}
