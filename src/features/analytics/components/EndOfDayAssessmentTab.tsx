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

// Tab "Danh gia cuoi ngay" — bang cau hoi x POD. O diem la SO THUAN, KHONG
// to mau nen theo muc do (tranh nham lan diem tung cau voi mau triage tong
// the cua benh nhan).
export function EndOfDayAssessmentTab({ matrix, isLoading, isError, onRetry, currentPod }: EndOfDayAssessmentTabProps) {
  if (isLoading) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
  }

  if (isError) {
    return (
      <AnalyticsEmptyState
        icon="error"
        headline="Khong the tai bang danh gia"
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

  if (!matrix || matrix.questions.length === 0) {
    return (
      <AnalyticsEmptyState
        icon="assignment"
        headline="Chua co danh gia cuoi ngay"
        subline="Nguoi benh chua thuc hien khao sat danh gia cuoi ngay nao."
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

  return <PodMatrixTable rowHeader="Cau hoi" pods={pods} rows={rows} currentPod={currentPod} />
}
