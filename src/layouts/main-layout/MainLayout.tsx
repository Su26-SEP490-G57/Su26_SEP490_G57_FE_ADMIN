import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { useAuthStore } from '../../features/auth/store/authStore'
import { DEV_ROLE, NAV_ITEMS } from './nav-config'

export function MainLayout() {
  const { logout } = useAuth()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(DEV_ROLE))

  // Tìm item khớp với route hiện tại
  const currentItem = NAV_ITEMS.find((item) => item.path === location.pathname)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f0f4f8]">
      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <aside className={`flex flex-shrink-0 flex-col bg-[#0f172a] text-slate-300 z-50 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
              <span className="material-symbols-outlined text-[24px]">add_box</span>
            </div>
            {!collapsed && (
              <div className="leading-tight overflow-hidden">
                <h1 className="text-lg font-bold uppercase tracking-tight text-white">ERAS</h1>
                <p className="text-xs text-slate-400">HẬU PHẪU</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {visibleNavItems.map((item) => (
            <div key={item.path}>
              {item.dividerBefore && !collapsed && (
                <div className="px-4 pb-2 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.dividerBefore}
                  </span>
                </div>
              )}
              <NavLink
                to={item.path}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''
                  } ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-[#1e293b]'}`
                }
              >
                <div className="relative flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.badge && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-slate-700 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white"
            title={collapsed ? 'Đăng xuất' : undefined}
          >
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">logout</span>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main area                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="z-40 flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {currentItem && (
                <span className="material-symbols-outlined text-[22px] text-blue-600">
                  {currentItem.icon}
                </span>
              )}
              <h2 className="text-lg font-semibold text-slate-800">
                {currentItem?.label ?? 'Dashboard tổng quan'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined text-[22px] text-slate-500">notifications</span>
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-red-500" />
              </div>
              <span className="material-symbols-outlined text-[22px] text-slate-500">calendar_today</span>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">
                  {user?.displayName ?? user?.email ?? 'Nhân viên'}
                </p>
                <p className="text-xs text-slate-500">
                  {DEV_ROLE === 'head_nurse' ? 'Điều dưỡng trưởng' : 'Quản trị viên'}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-blue-100 text-sm font-bold text-blue-700">
                {(user?.displayName ?? user?.email ?? 'N')[0].toUpperCase()}
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
