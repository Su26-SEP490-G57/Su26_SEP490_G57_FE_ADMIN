import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { analyticsKeys } from '../api/analytics'

const STATISTICS_SOCKET_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/statistics`

interface AssessmentSubmittedEvent {
  caseId?: string
}

// Lắng nghe socket.io namespace '/statistics' (backend: StatisticsGateway) để
// invalidate các query của trang Thống kê dữ liệu ngay khi có khảo sát mới
// được nộp, thay vì chờ người dùng F5. Chỉ mở kết nối khi AnalyticsPage đang
// mount (trang này đã bị chặn theo role head_nurse ở nav-config.ts).
export function useAnalyticsRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = io(STATISTICS_SOCKET_URL, { transports: ['websocket'] })

    socket.on('assessment.submitted', (payload: AssessmentSubmittedEvent) => {
      // Ward-wide: bất kỳ khảo sát nào cũng có thể đổi biểu đồ xu hướng/tuân
      // thủ tổng quan.
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.overviews() })

      // analyticsKeys.patient(caseId) gom cả 3 tab (recovery/compliance/
      // assessment) của 1 bệnh nhân - xem comment ở analytics.ts.
      if (payload?.caseId) {
        void queryClient.invalidateQueries({ queryKey: analyticsKeys.patient(payload.caseId) })
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [queryClient])
}
