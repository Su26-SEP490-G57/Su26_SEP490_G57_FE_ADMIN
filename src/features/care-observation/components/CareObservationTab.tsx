import { useState } from 'react'
import { translateError } from '../../../lib/errorTranslator'
import { AnalyticsEmptyState } from '../../analytics/components/AnalyticsEmptyState'
import { careLevelLabel } from '../../treatment-orders/types'
import { useSubmitCareObservation } from '../api/careObservation'
import type { CareObservationItem, CareObservationSheet } from '../types'

interface CareObservationTabProps {
  caseId: string
  sheet: CareObservationSheet | null | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10'

function buildInitialValues(items: CareObservationItem[]): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, item.value]))
}

// Tab "Phiếu theo dõi chăm sóc" — nội dung inline (không phải modal).
// Render checklist của phiếu được tự động giao theo mức chăm sóc bác sĩ chỉ định.
export function CareObservationTab({
  caseId,
  sheet,
  isLoading,
  isError,
  onRetry,
}: CareObservationTabProps) {
  const submitMutation = useSubmitCareObservation()
  const [values, setValues] = useState<Record<string, string>>({})
  const [note, setNote] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loadedSheetId, setLoadedSheetId] = useState<number | null>(null)

  // Nạp giá trị đã ghi nhận gần nhất khi ĐỔI phiếu (điều chỉnh state ngay
  // trong render — cách React khuyến nghị thay cho setState trong useEffect).
  if (sheet && sheet.id !== loadedSheetId) {
    setLoadedSheetId(sheet.id)
    setValues(buildInitialValues(sheet.items))
    setNote('')
    setSubmitError('')
    setSubmitted(false)
  }

  if (isLoading) {
    return <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
  }

  if (isError) {
    return (
      <AnalyticsEmptyState
        icon="error"
        headline="Không thể tải phiếu theo dõi"
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

  if (!sheet) {
    return (
      <AnalyticsEmptyState
        icon="assignment"
        headline="Chưa có phiếu theo dõi nào được giao"
        subline="Phiếu theo dõi được tự động giao khi bác sĩ tạo chỉ định điều trị với mức chăm sóc."
      />
    )
  }

  function setValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sheet) return
    setSubmitError('')
    setSubmitted(false)
    try {
      await submitMutation.mutateAsync({
        sheetId: sheet.id,
        caseId,
        entries: values,
        note: note.trim() || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(translateError(err, 'Có lỗi xảy ra khi lưu phiếu theo dõi'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{sheet.sheetType}</h4>
          <p className="text-xs text-slate-500">
            Mức chăm sóc khi giao phiếu: {careLevelLabel(sheet.careLevel)}
            {sheet.isComplete && ' · Đã hoàn thành'}
          </p>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
          <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
          <p>{submitError}</p>
        </div>
      )}

      {submitted && !submitError && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-medium text-green-700">
          <span className="material-symbols-outlined shrink-0 text-[16px]">check_circle</span>
          <p>Đã lưu phiếu theo dõi.</p>
        </div>
      )}

      {sheet.items.length === 0 ? (
        <AnalyticsEmptyState
          icon="checklist"
          headline="Phiếu theo dõi chưa có mục nào"
          subline="Mẫu phiếu theo dõi đang trống — liên hệ quản trị viên để cập nhật nội dung."
        />
      ) : (
        <div className="space-y-4 rounded-lg border border-slate-200 p-4">
          {sheet.items.map((item) => (
            <div key={item.id} className="space-y-1.5">
              {item.inputType === 'checkbox' ? (
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={values[item.id] === 'true'}
                    onChange={(e) => setValue(item.id, e.target.checked ? 'true' : 'false')}
                    className="h-4 w-4 rounded border-slate-300 text-[#00459a] focus:ring-[#00459a]"
                  />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </label>
              ) : (
                <>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </label>
                  {item.inputType === 'select' ? (
                    <select
                      value={values[item.id] ?? ''}
                      onChange={(e) => setValue(item.id, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">-- Chọn --</option>
                      {(item.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={item.inputType === 'number' ? 'number' : 'text'}
                      value={values[item.id] ?? ''}
                      onChange={(e) => setValue(item.id, e.target.value)}
                      className={inputClass}
                    />
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Ghi chú</label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú thêm (nếu có)"
          className={inputClass}
        />
      </div>

      <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Người theo dõi và thời điểm ghi nhận do hệ thống tự động lưu theo tài khoản đang đăng nhập.
      </p>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={submitMutation.isPending || sheet.items.length === 0}
          className="flex items-center gap-1 rounded-xl bg-[#00459a] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20 disabled:opacity-50"
        >
          {submitMutation.isPending ? 'Đang lưu...' : 'Lưu / Hoàn thành'}
        </button>
      </div>
    </form>
  )
}
