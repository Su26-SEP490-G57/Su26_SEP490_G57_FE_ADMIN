import type { RecoveryMatrix } from '../types'
import { AnalyticsEmptyState } from './AnalyticsEmptyState'
import { PodMatrixTable } from './PodMatrixTable'

interface RecoveryMatrixTabProps {
  matrix: RecoveryMatrix | null | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  currentPod?: number
}

// Tab "Ma trận hồi phục" — các mốc hồi phục (uống nước, ăn, ăn mềm, trung
// tiện, đại tiện) theo từng POD, dùng PodMatrixTable làm grid dùng chung.
export function RecoveryMatrixTab({ matrix, isLoading, isError, onRetry, currentPod }: RecoveryMatrixTabProps) {
  if (isLoading) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
  }

  if (isError) {
    return (
      <AnalyticsEmptyState
        icon="error"
        headline="Không thể tải ma trận hồi phục"
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

  if (!matrix || matrix.milestones.length === 0) {
    return (
      <AnalyticsEmptyState
        icon="timeline"
        headline="Chưa có dữ liệu hồi phục"
        subline="Người bệnh chưa ghi nhận mốc hồi phục nào (uống nước, ăn, trung tiện, đại tiện)."
      />
    )
  }

  const pods = Array.from({ length: matrix.maxPod + 1 }, (_, i) => i)
  const rows = matrix.milestones.map((m) => ({
    key: m.key,
    label: m.label,
    subLabel: m.occurredAt ? new Date(m.occurredAt).toLocaleString('vi-VN') : undefined,
    cells: pods.map((pod) =>
      pod === m.pod ? <span className="mx-auto block h-2.5 w-2.5 rounded-full bg-slate-800" /> : null,
    ),
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-xs sm:grid-cols-4">
        <div>
          <p className="text-slate-500">Số lần mức RED</p>
          <p className="text-lg font-bold text-red-600">{matrix.summary.redCount}</p>
        </div>
        <div>
          <p className="text-slate-500">Tổng số ngày POD</p>
          <p className="text-lg font-bold text-slate-800">{matrix.summary.totalPodDays ?? '--'}</p>
        </div>
        <div>
          <p className="text-slate-500">Hoàn thành ERAS</p>
          <p className="text-lg font-bold text-slate-800">{matrix.summary.erasCompleted ? 'Có' : 'Chưa'}</p>
        </div>
        <div>
          <p className="text-slate-500">Số lần giữ POD</p>
          <p className="text-lg font-bold text-slate-800">{matrix.summary.holdCount}</p>
        </div>
      </div>

      <PodMatrixTable rowHeader="Mốc hồi phục" pods={pods} rows={rows} currentPod={currentPod} />
    </div>
  )
}
