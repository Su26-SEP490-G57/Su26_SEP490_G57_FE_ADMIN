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

// Donut tuan thu — ve nhu <Doughnut cutout="75%"> nhung xu ly nhu 1 CAI DONG
// HO (meter), khong phai bieu do ty le: con so % lon duoc dat tuyet doi giua
// vong tron (ky thuat canh giua copy tu donut co san trong
// HeadNurseDashboard.tsx: parent relative + child absolute inset-0 flex-center).
export function ComplianceDonutChart({ overview, isLoading, isFetching, isError, onRetry }: ComplianceDonutChartProps) {
  const isEmpty = !overview || overview.total === 0
  const percent = overview ? Math.round(overview.complianceRate * 100) : 0

  return (
    <ChartCard
      title="Ty le tuan thu"
      subtitle="Nguoi benh tuan thu huong dan hau phau"
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyIcon="donut_large"
      emptyHeadline="Chua co du lieu tuan thu"
      emptySubline="Chua co so lieu tuan thu phu hop voi bo loc hien tai."
      skeletonClassName="h-64"
    >
      {overview && (
        <div className="flex flex-col items-center">
          <div className="relative mb-4 h-40 w-40">
            <Doughnut data={buildComplianceDonutData(overview)} options={buildComplianceDonutOptions()} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">{percent}%</span>
              <span className="text-[10px] text-slate-400">tuan thu</span>
            </div>
          </div>
          <div className="w-full space-y-1.5 px-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COMPLIANCE_COLORS.compliant }} />
                Tuan thu
              </div>
              <span className="font-medium text-slate-700">{overview.compliant}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COMPLIANCE_COLORS.nonCompliant }} />
                Khong tuan thu
              </div>
              <span className="font-medium text-slate-700">{overview.nonCompliant}</span>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
