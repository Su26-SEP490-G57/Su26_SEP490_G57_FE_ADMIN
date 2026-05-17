import { NavLink, Outlet } from 'react-router-dom'

export function MainLayout() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <h1>Admin</h1>
        <nav>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/users">Users</NavLink>
        </nav>
      </aside>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
