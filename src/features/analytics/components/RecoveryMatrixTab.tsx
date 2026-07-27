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

// Tab "Ma tran hoi phuc" — cac moc hoi phuc (uong nuoc, an, an mem, trung
// tien, dai tien) theo tung POD, dung PodMatrixTable lam grid dung chung.
export function RecoveryMatrixTab({ matrix, isLoading, isError, onRetry, currentPod }: RecoveryMatrixTabProps) {
  if (isLoading) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
  }

  if (isError) {
    return (
      <AnalyticsEmptyState
        icon="error"
        headline="Khong the tai ma tran hoi phuc"
        subline="Co loi xay ra khi tai du lieu. Vui long thu lai."
        action={
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Thu lai
          </button>
        }
      />
    )
  }

  if (!matrix || matrix.milestones.length === 0) {
    return (
      <AnalyticsEmptyState
        icon="timeline"
        headline="Chua co du lieu hoi phuc"
        subline="Nguoi benh chua ghi nhan moc hoi phuc nao (uong nuoc, an, trung tien, dai tien)."
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
          <p className="text-slate-500">So lan muc RED</p>
          <p className="text-lg font-bold text-red-600">{matrix.summary.redCount}</p>
        </div>
        <div>
          <p className="text-slate-500">Tong so ngay POD</p>
          <p className="text-lg font-bold text-slate-800">{matrix.summary.totalPodDays ?? '--'}</p>
        </div>
        <div>
          <p className="text-slate-500">Hoan thanh ERAS</p>
          <p className="text-lg font-bold text-slate-800">{matrix.summary.erasCompleted ? 'Co' : 'Chua'}</p>
        </div>
        <div>
          <p className="text-slate-500">So lan giu POD</p>
          <p className="text-lg font-bold text-slate-800">{matrix.summary.holdCount}</p>
        </div>
      </div>

      <PodMatrixTable rowHeader="Moc hoi phuc" pods={pods} rows={rows} currentPod={currentPod} />
    </div>
  )
}
