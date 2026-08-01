import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import type { SymptomTrend } from '../types'
import {
  buildSymptomTrendChartData,
  buildSymptomTrendChartOptions,
  SYMPTOM_COLORS,
  SYMPTOM_LABELS,
} from '../chartConfig'
import { ChartCard } from './ChartCard'

interface SymptomTrendChartProps {
  trend: SymptomTrend | null | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  onRetry: () => void
}

// Biểu đồ xu hướng triệu chứng — stacked area (5 sub-score cộng lại bằng
// tổng điểm của khảo sát). Legend là HTML/Tailwind riêng bên dưới (không
// dùng legend của Chart.js) để đồng bộ với quy ước hiện có của
// HeadNurseDashboard.tsx. Có nút "Xem dạng bảng" đổi canvas sang bảng HTML
// cùng số liệu (yêu cầu bởi WARN contrast của bảng màu khi validate).
export function SymptomTrendChart({
  trend,
  isLoading,
  isFetching,
  isError,
  onRetry,
}: SymptomTrendChartProps) {
  const [showTable, setShowTable] = useState(false)

  const isEmpty = !trend || trend.pods.length === 0

  return (
    <ChartCard
      title="Biểu đồ xu hướng triệu chứng"
      subtitle="Điểm trung bình theo từng POD (0-10)"
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyIcon="show_chart"
      emptyHeadline="Chưa có dữ liệu triệu chứng"
      emptySubline="Chưa có khảo sát triệu chứng nào phù hợp với bộ lọc hiện tại."
      skeletonClassName="h-64"
      actions={
        !isEmpty && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {showTable ? 'Xem dạng biểu đồ' : 'Xem dạng bảng'}
          </button>
        )
      }
    >
      {trend &&
        (showTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="p-2 text-left">Triệu chứng</th>
                  {trend.pods.map((pod) => (
                    <th key={pod} className="p-2 text-center">
                      POD{pod}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trend.series.map((s) => (
                  <tr key={s.key}>
                    <td className="p-2 text-left font-medium text-slate-700">
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ backgroundColor: SYMPTOM_COLORS[s.key] }}
                      />
                      {s.label}
                    </td>
                    {s.data.map((value, index) => (
                      <td
                        key={trend.pods[index] ?? index}
                        className="p-2 text-center text-slate-600"
                      >
                        {value ?? '--'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="h-64">
              <Line
                data={buildSymptomTrendChartData(trend)}
                options={buildSymptomTrendChartOptions()}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {trend.series.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: SYMPTOM_COLORS[s.key] }}
                  />
                  {SYMPTOM_LABELS[s.key]}
                </div>
              ))}
            </div>
          </>
        ))}
    </ChartCard>
  )
}
