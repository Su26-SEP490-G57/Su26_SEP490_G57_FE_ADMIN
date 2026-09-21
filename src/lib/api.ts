import axios from 'axios'
import { tokenStorage, useAuthStore } from '../features/auth/store/authStore'

// Cờ tuỳ chọn cho 1 request cụ thể: bỏ qua hành vi "reload cứng về /login"
// của interceptor 401 bên dưới (dùng cho lần refresh âm thầm lúc khởi động app).
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean
  }
}

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

    // Không refresh nếu chính request refresh bị 401 (refresh token hết hạn).
    // `skipAuthRedirect` đánh dấu lần refresh ÂM THẦM lúc khởi động app
    // (AuthProvider.restoreSession) — nơi này TỰ xử lý lỗi (clearSession, không
    // điều hướng) nên KHÔNG được ép reload cứng ở đây. Nếu ép reload, một
    // refreshToken cũ/hỏng còn sót trong localStorage có thể khiến trang bị
    // reload đúng lúc người dùng vừa bấm đăng nhập, xoá mất phiên đăng nhập
    // mới toanh — nhìn như "bấm đăng nhập lại quay về trang đăng nhập".
    if (originalRequest.url?.includes('/auth/refresh')) {
      if (!originalRequest.skipAuthRedirect) {
        useAuthStore.getState().clearSession()
        window.location.href = '/login'
      }
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
