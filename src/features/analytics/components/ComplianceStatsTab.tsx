import type { ComplianceStats } from '../types'
import { AnalyticsEmptyState } from './AnalyticsEmptyState'

interface ComplianceStatsTabProps {
  stats: ComplianceStats | null | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const CHECKLIST_ITEMS: { key: keyof ComplianceStats['checklist']; label: string }[] = [
  { key: 'viewedPodGuide', label: 'Đã xem hướng dẫn POD' },
  { key: 'viewedHealthEducation', label: 'Đã xem giáo dục sức khỏe' },
  { key: 'completedAssessment', label: 'Đã hoàn thành đánh giá' },
]

const COUNTER_ITEMS: { key: keyof ComplianceStats['counters']; label: string }[] = [
  { key: 'completedAssessments', label: 'Số đánh giá đã hoàn thành' },
  { key: 'reminderCount', label: 'Số lần nhắc nhở' },
  { key: 'appAccessCount', label: 'Số lần truy cập ứng dụng' },
]

// Tab "Tuân thủ" — checklist (có/không) + các bộ đếm hành vi của bệnh nhân.
export function ComplianceStatsTab({
  stats,
  isLoading,
  isError,
  onRetry,
}: ComplianceStatsTabProps) {
  if (isLoading) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
  }

  if (isError) {
    return (
      <AnalyticsEmptyState
        icon="error"
        headline="Không thể tải dữ liệu tuân thủ"
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

  if (!stats) {
    return (
      <AnalyticsEmptyState
        icon="fact_check"
        headline="Chưa có dữ liệu tuân thủ"
        subline="Người bệnh chưa có hoạt động tuân thủ nào được ghi nhận trên ứng dụng."
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
                <span
                  className={`material-symbols-outlined text-[18px] ${done ? 'text-green-600' : 'text-slate-300'}`}
                >
                  {done ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <span className={done ? 'text-slate-700' : 'text-slate-400'}>{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg bg-slate-50 p-4">
        <h5 className="mb-3 text-xs font-bold uppercase text-slate-500">Số liệu</h5>
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
