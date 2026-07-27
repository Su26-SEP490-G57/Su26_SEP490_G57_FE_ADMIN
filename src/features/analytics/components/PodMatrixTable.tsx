import type { ReactNode } from 'react'

export interface PodMatrixRow {
  key: string
  label: string
  subLabel?: string
  cells: ReactNode[]
}

interface PodMatrixTableProps {
  rowHeader: string
  pods: number[]
  rows: PodMatrixRow[]
  currentPod?: number
}

// Grid primitive dùng chung cho cả RecoveryMatrixTab và EndOfDayAssessmentTab
// — hàng x cột POD. Chrome (màu nền header/body) copy từ bảng POD có sẵn
// trong HeadNurseDashboard.tsx.
export function PodMatrixTable({ rowHeader, pods, rows, currentPod }: PodMatrixTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
          <tr>
            <th className="p-2 text-left">{rowHeader}</th>
            {pods.map((pod) => (
              <th key={pod} className={`p-2 text-center ${pod === currentPod ? 'bg-blue-50' : ''}`}>
                POD{pod}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="p-2 text-left">
                <p className="font-medium text-slate-700">{row.label}</p>
                {row.subLabel && <p className="text-xs text-slate-400">{row.subLabel}</p>}
              </td>
              {row.cells.map((cell, index) => (
                <td key={pods[index] ?? index} className={`p-2 text-center ${pods[index] === currentPod ? 'bg-blue-50' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
