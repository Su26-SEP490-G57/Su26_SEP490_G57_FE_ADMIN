import { NavLink, Outlet } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export function MainLayout() {
  return (
    <div className="grid min-h-svh" style={{ gridTemplateColumns: '260px 1fr' }}>
      <aside className="border-r border-gray-200 px-6 py-8">
        <h1 className="mb-8 text-2xl font-semibold text-gray-900">ShareXe Admin</h1>
        <nav className="flex flex-col gap-1">
          <NavLink
            to={ROUTES.DASHBOARD}
            end
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to={ROUTES.USERS}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            Users
          </NavLink>
        </nav>
      </aside>
      <main className="min-w-0 p-10">
        <Outlet />
      </main>
    </div>
  )
}
