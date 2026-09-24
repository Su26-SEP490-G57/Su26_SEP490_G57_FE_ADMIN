import { Navigate } from 'react-router-dom'
import { ROUTES } from '../../../constants/routes'
import { useRole } from '../hooks/useRole'
import { useAuthStore } from '../store/authStore'

/**
 * Component redirect user về trang mặc định theo role của họ
 * - ADMIN → /audit-logs
 * - Các role khác → /patients
 */
export function RoleBasedRedirect() {
  const role = useRole()
  const isLoading = useAuthStore((s) => s.isLoading)

  // Đợi cho đến khi auth store load xong
  if (isLoading || role === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (role === 'admin') {
    return <Navigate to={ROUTES.AUDIT_LOGS} replace />
  }

  return <Navigate to={ROUTES.PATIENTS} replace />
}
