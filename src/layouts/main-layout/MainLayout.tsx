import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { useAuthStore } from '../../features/auth/store/authStore'
import { DEV_ROLE, NAV_ITEMS } from './nav-config'

export function MainLayout() {
  const { logout } = useAuth()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(DEV_ROLE)
  )

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-[#fbf8ff] text-[#1a1b22]">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-y-auto border-r border-[#c2c6d5] bg-[#fbf8ff] py-4 px-2 shadow-sm">
        {/* Brand */}
        <div className="mb-8 px-4">
          <h1 className="text-xl font-bold text-[#00459a]">Hospital Branch Central</h1>
          <p className="text-xs font-medium text-[#424753]">Clinical Unit A</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-lg px-4 py-2 text-xs font-semibold tracking-wider transition-colors ${isActive
                  ? 'border-r-4 border-[#00459a] bg-[#005cc8]/10 text-[#00459a]'
                  : 'text-[#424753] hover:bg-[#e8e7f1]'
                }`
              }
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="mt-auto border-t border-[#c2c6d5] pt-4">
          <button
            onClick={() => alert('EMERGENCY RESPONSE PROTOCOL ACTIVATED.')}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ba1a1a] px-4 py-3 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">emergency_share</span>
            Emergency Response
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-lg px-4 py-2 text-xs font-semibold text-[#424753] transition-colors hover:bg-[#e8e7f1]"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main area                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="ml-64 flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#c2c6d5] bg-[#fbf8ff]/80 px-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold text-[#00459a]">POMS</span>
            <div className="relative w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#424753]">
                search
              </span>
              <input
                type="text"
                placeholder="Search patients or directives..."
                className="w-full rounded-full border border-[#c2c6d5] bg-[#f4f2fd] py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00459a]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-6 lg:flex">
              {['Directives', 'Protocol', 'Directory'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-xs font-semibold tracking-wider text-[#424753] transition-colors hover:text-[#00459a]"
                >
                  {link}
                </a>
              ))}
            </nav>

            <div className="h-8 w-px bg-[#c2c6d5]" />

            <div className="flex items-center gap-3">
              <button className="rounded-full p-2 text-[#424753] transition-colors hover:bg-[#e8e7f1]">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
              </button>
              <button className="rounded-full p-2 text-[#424753] transition-colors hover:bg-[#e8e7f1]">
                <span className="material-symbols-outlined text-[22px]">dark_mode</span>
              </button>

              <div className="flex items-center gap-2 pl-4">
                <div className="text-right">
                  <p className="text-xs font-bold text-[#1a1b22]">
                    {user?.displayName ?? user?.email ?? 'Staff'}
                  </p>
                  <p className="text-[10px] uppercase tracking-tight text-[#424753]">
                    {DEV_ROLE === 'nurse'
                      ? 'Nurse'
                      : DEV_ROLE === 'head_nurse'
                        ? 'Head Nurse'
                        : 'Administrator'}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c2c6d5] bg-[#d8e2ff] text-sm font-bold text-[#00459a]">
                  {(user?.displayName ?? user?.email ?? 'S')[0].toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
