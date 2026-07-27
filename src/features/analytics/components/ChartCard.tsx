import type { ReactNode } from 'react'
import { AnalyticsEmptyState } from './AnalyticsEmptyState'

interface ChartCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  // Lan tai dau tien (chua co du lieu cu de hien) — hien skeleton, KHONG phai
  // spinner overlay, de tranh layout jump.
  isLoading?: boolean
  // Dang refetch nen (co du lieu cu de hien) — giu nguyen content cu, lam mo
  // nhe (opacity-60), khong flash skeleton.
  isFetching?: boolean
  isError?: boolean
  onRetry?: () => void
  isEmpty?: boolean
  emptyIcon?: string
  emptyHeadline?: string
  emptySubline?: string
  // Chieu cao skeleton phai khop voi content that su de khong bi giat layout.
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
  emptyHeadline = 'Chua co du lieu',
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
          headline="Khong the tai du lieu"
          subline="Co loi xay ra khi tai bieu do. Vui long thu lai."
          action={
            onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Thu lai
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
