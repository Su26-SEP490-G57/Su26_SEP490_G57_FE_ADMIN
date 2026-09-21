import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '../../../constants/routes'
import type { UserRole } from '../../../layouts/main-layout/nav-config'
import { useRole } from '../hooks/useRole'

interface RoleGuardProps {
  roles: UserRole[]
  // Không truyền children → dùng như route wrapper (render <Outlet />) và điều
  // hướng đi nơi khác nếu vai trò không khớp.
  children?: ReactNode
  // Có truyền fallback → dùng như "cổng" inline cho 1 nút/1 tab: không điều
  // hướng, chỉ render fallback (thường là null) khi vai trò không khớp.
  fallback?: ReactNode
  redirectTo?: string
}

// RoleGuard dùng được 2 kiểu:
//   <RoleGuard roles={['doctor']}><Outlet /></RoleGuard>   (bọc route)
//   <RoleGuard roles={['nurse']} fallback={null}>...</RoleGuard>  (gate inline)
export function RoleGuard({
  roles,
  children,
  fallback,
  redirectTo = ROUTES.DASHBOARD,
}: RoleGuardProps) {
  const role = useRole()
  const location = useLocation()
  const allowed = role !== null && roles.includes(role)

  if (allowed) {
    return <>{children ?? <Outlet />}</>
  }

  // fallback được truyền (kể cả null) → chế độ inline, không điều hướng.
  if (fallback !== undefined) {
    return <>{fallback}</>
  }

  return <Navigate to={redirectTo} state={{ from: location }} replace />
}
