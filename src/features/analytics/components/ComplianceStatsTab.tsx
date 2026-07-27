import type { ComplianceStats } from '../types'
import { AnalyticsEmptyState } from './AnalyticsEmptyState'

interface ComplianceStatsTabProps {
  stats: ComplianceStats | null | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const CHECKLIST_ITEMS: { key: keyof ComplianceStats['checklist']; label: string }[] = [
  { key: 'viewedPodGuide', label: 'Da xem huong dan POD' },
  { key: 'viewedHealthEducation', label: 'Da xem giao duc suc khoe' },
  { key: 'completedAssessment', label: 'Da hoan thanh danh gia' },
]

const COUNTER_ITEMS: { key: keyof ComplianceStats['counters']; label: string }[] = [
  { key: 'completedAssessments', label: 'So danh gia da hoan thanh' },
  { key: 'reminderCount', label: 'So lan nhac nho' },
  { key: 'appAccessCount', label: 'So lan truy cap ung dung' },
]

// Tab "Tuan thu" — checklist (co/khong) + cac bo dem hanh vi cua benh nhan.
export function ComplianceStatsTab({ stats, isLoading, isError, onRetry }: ComplianceStatsTabProps) {
  if (isLoading) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
  }

  if (isError) {
    return (
      <AnalyticsEmptyState
        icon="error"
        headline="Khong the tai du lieu tuan thu"
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

  if (!stats) {
    return (
      <AnalyticsEmptyState
        icon="fact_check"
        headline="Chua co du lieu tuan thu"
        subline="Nguoi benh chua co hoat dong tuan thu nao duoc ghi nhan tren ung dung."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-lg bg-slate-50 p-4">
        <h5 className="mb-3 text-xs font-bold uppercase text-slate-500">Checklist</h5>
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const done = stats.checklist[item.key]
            return (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                <span className={`material-symbols-outlined text-[18px] ${done ? 'text-green-600' : 'text-slate-300'}`}>
                  {done ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className={done ? 'text-slate-700' : 'text-slate-400'}>{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-4">
        <h5 className="mb-3 text-xs font-bold uppercase text-slate-500">So lieu</h5>
        <div className="space-y-2">
          {COUNTER_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-bold text-slate-800">{stats.counters[item.key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
