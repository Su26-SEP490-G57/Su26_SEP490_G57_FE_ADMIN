import axios from 'axios'
import { tokenStorage, useAuthStore } from '../features/auth/store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

// ---------------------------------------------------------------------------
// Interceptor 1 — Gán access token vào mọi request
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Interceptor 2 — Xử lý 401: refresh token rồi retry request gốc
// ---------------------------------------------------------------------------
let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Chỉ xử lý 401 và chưa retry
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Không refresh nếu chính request refresh bị 401 (refresh token hết hạn)
    if (originalRequest.url?.includes('/auth/refresh')) {
      useAuthStore.getState().clearSession()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      // Đang refresh — đưa request vào hàng chờ
      return new Promise((resolve) => {
        pendingRequests.push((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(api(originalRequest))
        })
      })
    }

    isRefreshing = true

    try {
      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token')

      // Gọi endpoint refresh — TODO: xác nhận path với BE
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
      const newAccessToken = data.accessToken

      useAuthStore.getState().setAccessToken(newAccessToken)

      // Giải phóng hàng chờ
      pendingRequests.forEach((cb) => cb(newAccessToken))
      pendingRequests = []

      // Retry request gốc với token mới
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch {
      useAuthStore.getState().clearSession()
      pendingRequests = []
      window.location.href = '/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)
