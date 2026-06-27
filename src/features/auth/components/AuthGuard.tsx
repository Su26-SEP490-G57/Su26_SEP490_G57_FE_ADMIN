import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '../../../constants/routes'
import { useAuthStore } from '../store/authStore'

export function AuthGuard() {
    const { accessToken, isLoading } = useAuthStore()
    const location = useLocation()

    if (isLoading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        )
    }

    if (!accessToken) {
        // return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
    }

    return <Outlet />
}
