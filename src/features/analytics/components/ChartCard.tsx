import type { ReactNode } from 'react'
import { AnalyticsEmptyState } from './AnalyticsEmptyState'

interface ChartCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  // Lần tải đầu tiên (chưa có dữ liệu cũ để hiện) — hiện skeleton, KHÔNG phải
  // spinner overlay, để tránh layout jump.
  isLoading?: boolean
  // Đang refetch nền (có dữ liệu cũ để hiện) — giữ nguyên content cũ, làm mờ
  // nhẹ (opacity-60), không flash skeleton.
  isFetching?: boolean
  isError?: boolean
  onRetry?: () => void
  isEmpty?: boolean
  emptyIcon?: string
  emptyHeadline?: string
  emptySubline?: string
  // Chiều cao skeleton phải khớp với content thật sự để không bị giật layout.
  skeletonClassName?: string
  className?: string
  children: ReactNode
}

export function ChartCard({
  title,
  subtitle,
  actions,
  isLoading = false,
  isFetching = false,
  isError = false,
  onRetry,
  isEmpty = false,
  emptyIcon = 'bar_chart',
  emptyHeadline = 'Chưa có dữ liệu',
  emptySubline,
  skeletonClassName = 'h-64',
  className = '',
  children,
}: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {isLoading ? (
        <div className={`w-full animate-pulse rounded-lg bg-slate-100 ${skeletonClassName}`} />
      ) : isError ? (
        <AnalyticsEmptyState
          icon="error"
          headline="Không thể tải dữ liệu"
          subline="Có lỗi xảy ra khi tải biểu đồ. Vui lòng thử lại."
          action={
            onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Thử lại
              </button>
            )
          }
        />
      ) : isEmpty ? (
        <AnalyticsEmptyState icon={emptyIcon} headline={emptyHeadline} subline={emptySubline} />
      ) : (
        <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>{children}</div>
      )}
    </div>
  )
}
