import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { useRole } from '../../features/auth/hooks/useRole'
import { useAuthStore } from '../../features/auth/store/authStore'
import { HeaderProvider, useHeaderContext } from './HeaderContext'
import { NAV_ITEMS, ROLE_LABELS } from './nav-config'

export function MainLayout() {
  return (
    <HeaderProvider>
      <MainLayoutContent />
    </HeaderProvider>
  )
}

function MainLayoutContent() {
  const { logout } = useAuth()
  const { userProfile } = useAuthStore()
  const navigate = useNavigate()
  const { actions } = useHeaderContext()
  const role = useRole()

  const visibleNavItems = NAV_ITEMS.filter((item) => role !== null && item.roles.includes(role))

  // Hiện tại không thực sự cần currentItem cho Title nữa vì Tab đang active đã thể hiện điều đó
  // const currentItem = NAV_ITEMS.find((item) => item.path === location.pathname)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f4f8]">
      {/* ------------------------------------------------------------------ */}
      {/* Top Header Layout                                                 */}
      {/* ------------------------------------------------------------------ */}
      <header className="z-40 w-full flex-shrink-0 bg-white border-b border-slate-200">
        {/* Row 1: Brand & User Profile */}
        <div className="flex h-14 items-center justify-between px-6 border-b border-slate-100">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white">
              <span className="material-symbols-outlined text-[20px]">add_box</span>
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-extrabold uppercase tracking-tight text-slate-800">
                ERAS
              </h1>
              <p className="text-[10px] uppercase font-bold text-slate-400">Hậu Phẫu</p>
            </div>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-slate-800">
                {userProfile?.fullName ?? userProfile?.username ?? 'Nhân viên'}
              </p>
              <p className="text-xs font-medium text-slate-500">
                {role ? ROLE_LABELS[role] : '--'}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-blue-50 text-sm font-bold text-blue-700">
              {(userProfile?.fullName ?? userProfile?.username ?? 'N')[0].toUpperCase()}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="flex flex-shrink-0 items-center justify-center p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">logout</span>
            </button>
          </div>
        </div>

        {/* Row 2: Navigation Tabs & Dynamic Page Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 bg-slate-50/50 pt-2 sm:pt-0">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `group flex flex-shrink-0 items-center gap-2 px-1 py-3 text-sm font-medium transition-all relative ${
                    isActive ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`material-symbols-outlined text-[20px] transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                    {item.badge && (
                      <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}

                    {/* Active Bottom Indicator */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-blue-600" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Context Actions (Injected via HeaderContext from child pages) */}
          {actions && (
            <div className="flex flex-shrink-0 items-center gap-3 py-2 sm:pl-4 sm:border-l sm:border-slate-200">
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Main Content Area                                                 */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
