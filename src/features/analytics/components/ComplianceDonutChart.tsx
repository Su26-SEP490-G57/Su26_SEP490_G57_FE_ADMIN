import { Doughnut } from 'react-chartjs-2'
import type { ComplianceOverview } from '../types'
import { buildComplianceDonutData, buildComplianceDonutOptions, COMPLIANCE_COLORS } from '../chartConfig'
import { ChartCard } from './ChartCard'

interface ComplianceDonutChartProps {
  overview: ComplianceOverview | null | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  onRetry: () => void
}

// Donut tuân thủ — vẽ như <Doughnut cutout="75%"> nhưng xử lý như 1 CÁI ĐỒNG
// HỒ (meter), không phải biểu đồ tỷ lệ: con số % lớn được đặt tuyệt đối giữa
// vòng tròn (kỹ thuật canh giữa copy từ donut có sẵn trong
// HeadNurseDashboard.tsx: parent relative + child absolute inset-0 flex-center).
export function ComplianceDonutChart({ overview, isLoading, isFetching, isError, onRetry }: ComplianceDonutChartProps) {
  const isEmpty = !overview || overview.total === 0
  const percent = overview ? Math.round(overview.complianceRate * 100) : 0

  return (
    <ChartCard
      title="Tỷ lệ tuân thủ"
      subtitle="Người bệnh tuân thủ hướng dẫn hậu phẫu"
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyIcon="donut_large"
      emptyHeadline="Chưa có dữ liệu tuân thủ"
      emptySubline="Chưa có số liệu tuân thủ phù hợp với bộ lọc hiện tại."
      skeletonClassName="h-64"
    >
      {overview && (
        <div className="flex flex-col items-center">
          <div className="relative mb-4 h-40 w-40">
            <Doughnut data={buildComplianceDonutData(overview)} options={buildComplianceDonutOptions()} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">{percent}%</span>
              <span className="text-[10px] text-slate-400">tuân thủ</span>
            </div>
          </div>
          <div className="w-full space-y-1.5 px-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COMPLIANCE_COLORS.compliant }} />
                Tuân thủ
              </div>
              <span className="font-medium text-slate-700">{overview.compliant}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COMPLIANCE_COLORS.nonCompliant }} />
                Không tuân thủ
              </div>
              <span className="font-medium text-slate-700">{overview.nonCompliant}</span>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
