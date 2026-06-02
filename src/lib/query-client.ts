import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { AxiosError, HttpStatusCode } from 'axios'

// Hàm xử lý lỗi tập trung
const handleGlobalError = (error: unknown) => {
  if (error instanceof AxiosError) {
    if (error.status === HttpStatusCode.TooManyRequests) {
      // TODO: Hiển thị thông báo khi bị giới hạn rate limit (Toast "Quá nhiều yêu cầu")
      return
    }
    // Chặn lỗi 4XX — để component tự xử lý riêng nếu cần
    if (error.status && error.status >= 400 && error.status < 500) return
  }
  // TODO: Hiển thị thông báo lỗi hệ thống chung (Toast "Đã có lỗi xảy ra")
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleGlobalError }),
  mutationCache: new MutationCache({ onError: handleGlobalError }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // admin dashboard, không muốn auto refetch khi switch tab
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Không retry lỗi phía client (4XX)
        if (error instanceof AxiosError && error.status && error.status >= 400 && error.status < 500) {
          return false
        }
        // Retry tối đa 3 lần cho lỗi server/network
        return failureCount < 3
      },
      // Exponential backoff: lần 1 đợi 1s, lần 2 đợi 2s, tối đa 3s
      retryDelay: (attempt) => Math.min(attempt * 1000, 3000),
    },
    // Mutation (POST, PUT, PATCH, DELETE) không retry — tránh duplicate data
    mutations: {
      retry: false,
    },
  },
})
