import Link from "next/link";

export default function Page(){
  return <main className="admin-page">
    <Link className="back" href="/">← Dashboard</Link>
    <div className="placeholder-card">
      <h1>Actions</h1>
      <p>The full action register and Create/Edit Action workflow will be built here.</p>
    </div>
  </main>
}
