// Empty-state dùng chung: icon + tiêu đề + dòng phụ, dùng cho mọi nơi trong
// trang Thống kê dữ liệu cần báo "chưa có dữ liệu" (tab recovery/compliance/
// assessment, danh sách bệnh nhân rỗng, chưa chọn bệnh nhân, ...).
interface AnalyticsEmptyStateProps {
  icon: string
  headline: string
  subline?: string
  action?: React.ReactNode
  className?: string
}

export function AnalyticsEmptyState({
  icon,
  headline,
  subline,
  action,
  className = '',
}: AnalyticsEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 py-10 text-center ${className}`}
    >
      <div className="rounded-full bg-slate-100 p-4">
        <span className="material-symbols-outlined text-[32px] text-slate-400">{icon}</span>
      </div>
      <p className="text-sm font-medium text-slate-600">{headline}</p>
      {subline && <p className="max-w-xs text-xs text-slate-400">{subline}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
