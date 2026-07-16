import { type PropsWithChildren, useEffect } from 'react'
import { api } from '../../../lib/api'
import { AuthContext } from '../context/AuthContext'
import { useAuthStore, tokenStorage } from '../store/authStore'
import type { RefreshResponse } from '../types'

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

  return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>
}
