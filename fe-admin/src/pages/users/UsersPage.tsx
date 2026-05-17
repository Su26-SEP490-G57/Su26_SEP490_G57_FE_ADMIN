import { Link } from 'react-router-dom'

export function UsersPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Management</p>
      <h2>Users</h2>
      <p>This page is ready for user list queries.</p>
      <Link to="/">Back to dashboard</Link>
    </section>
  )
}
