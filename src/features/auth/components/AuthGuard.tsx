import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '../../../constants/routes'
import { useAuth } from '../context/AuthContext'

export function AuthGuard() {
    const { user, isLoading } = useAuth()
    const location = useLocation()

    // Chờ Firebase xác định auth state trước
    if (isLoading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        )
    }

    // Chưa login → redirect về login, lưu lại trang đang cố vào
    if (!user) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
    }

    return <Outlet />
}
