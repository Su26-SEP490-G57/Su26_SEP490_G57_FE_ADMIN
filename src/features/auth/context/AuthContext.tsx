import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect } from 'react'
import { api } from '../../../lib/api'
import { tokenStorage, useAuthStore } from '../store/authStore'
import type { RefreshResponse } from '../types'

interface AuthContextValue {
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
    const { setAccessToken, setLoading, clearSession } = useAuthStore()

    useEffect(() => {
        // Khi app khởi động: kiểm tra refreshToken trong localStorage
        // Nếu có → thử refresh để lấy accessToken mới
        async function restoreSession() {
            const refreshToken = tokenStorage.getRefreshToken()

            if (!refreshToken) {
                setLoading(false)
                return
            }

            try {
                // TODO: xác nhận path /auth/refresh với BE
                const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken })
                setAccessToken(data.accessToken)
            } catch {
                // refreshToken hết hạn hoặc invalid → clear session
                clearSession()
            } finally {
                setLoading(false)
            }
        }

        restoreSession()
    }, [setAccessToken, setLoading, clearSession])

    function logout() {
        const refreshToken = tokenStorage.getRefreshToken()
        // Revoke the refresh token server-side; clear the local session regardless.
        if (refreshToken) {
            api.post('/auth/logout', { refreshToken }).catch(() => {})
        }
        clearSession()
    }

    return (
        <AuthContext.Provider value={{ logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
