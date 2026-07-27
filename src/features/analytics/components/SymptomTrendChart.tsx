import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import type { SymptomTrend } from '../types'
import { buildSymptomTrendChartData, buildSymptomTrendChartOptions, SYMPTOM_COLORS, SYMPTOM_LABELS } from '../chartConfig'
import { ChartCard } from './ChartCard'

interface SymptomTrendChartProps {
  trend: SymptomTrend | null | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  onRetry: () => void
}

// Bieu do xu huong trieu chung — stacked area (5 sub-score cong lai bang
// tong diem cua khao sat). Legend la HTML/Tailwind rieng ben duoi (khong
// dung legend cua Chart.js) de dong bo voi quy uoc hien co cua
// HeadNurseDashboard.tsx. Co nut "Xem dang bang" doi canvas sang bang HTML
// cung so lieu (yeu cau boi WARN contrast cua bang mau khi validate).
export function SymptomTrendChart({ trend, isLoading, isFetching, isError, onRetry }: SymptomTrendChartProps) {
  const [showTable, setShowTable] = useState(false)

  const isEmpty = !trend || trend.pods.length === 0

  return (
    <ChartCard
      title="Bieu do xu huong trieu chung"
      subtitle="Diem trung binh theo tung POD (0-10)"
      isLoading={isLoading}
      isFetching={isFetching}
      isError={isError}
      onRetry={onRetry}
      isEmpty={isEmpty}
      emptyIcon="show_chart"
      emptyHeadline="Chua co du lieu trieu chung"
      emptySubline="Chua co khao sat trieu chung nao phu hop voi bo loc hien tai."
      skeletonClassName="h-64"
      actions={
        !isEmpty && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            {showTable ? 'Xem dang bieu do' : 'Xem dang bang'}
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
                  <th className="p-2 text-left">Trieu chung</th>
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
                      <span className="mr-2 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: SYMPTOM_COLORS[s.key] }} />
                      {s.label}
                    </td>
                    {s.data.map((value, index) => (
                      <td key={trend.pods[index] ?? index} className="p-2 text-center text-slate-600">
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
              <Line data={buildSymptomTrendChartData(trend)} options={buildSymptomTrendChartOptions()} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {trend.series.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SYMPTOM_COLORS[s.key] }} />
                  {SYMPTOM_LABELS[s.key]}
                </div>
              ))}
            </div>
          </>
        ))}
    </ChartCard>
  )
}
