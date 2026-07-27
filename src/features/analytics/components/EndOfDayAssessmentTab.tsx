import type { AssessmentMatrix } from '../types'
import { AnalyticsEmptyState } from './AnalyticsEmptyState'
import { PodMatrixTable } from './PodMatrixTable'

interface EndOfDayAssessmentTabProps {
  matrix: AssessmentMatrix | null | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  currentPod?: number
}

// Tab "Đánh giá cuối ngày" — bảng câu hỏi x POD. Ô điểm là SỐ THUẦN, KHÔNG
// tô màu nền theo mức độ (tránh nhầm lẫn điểm từng câu với màu triage tổng
// thể của bệnh nhân).
export function EndOfDayAssessmentTab({ matrix, isLoading, isError, onRetry, currentPod }: EndOfDayAssessmentTabProps) {
  if (isLoading) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
  }

  if (isError) {
    return (
      <AnalyticsEmptyState
        icon="error"
        headline="Không thể tải bảng đánh giá"
        subline="Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại."
        action={
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Thử lại
          </button>
        }
      />
    )
  }

  if (!matrix || matrix.questions.length === 0) {
    return (
      <AnalyticsEmptyState
        icon="assignment"
        headline="Chưa có đánh giá cuối ngày"
        subline="Người bệnh chưa thực hiện khảo sát đánh giá cuối ngày nào."
      />
    )
  }

  const pods = Array.from({ length: matrix.maxPod + 1 }, (_, i) => i)
  const rows = matrix.questions.map((q) => ({
    key: String(q.questionId),
    label: q.questionText,
    cells: pods.map((pod) => {
      const cell = q.cells.find((c) => c.pod === pod)
      return <span className="text-slate-700">{cell?.score ?? '--'}</span>
    }),
  }))

  return <PodMatrixTable rowHeader="Câu hỏi" pods={pods} rows={rows} currentPod={currentPod} />
}
