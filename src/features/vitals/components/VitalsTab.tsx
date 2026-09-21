import { useEffect, useState } from 'react'
import { AnalyticsEmptyState } from '../../analytics/components/AnalyticsEmptyState'
import { RoleGuard } from '../../auth/components/RoleGuard'
import type { PaginatedVitalSigns } from '../types'
import { VitalsInlineForm } from './VitalsInlineForm'

interface VitalsTabProps {
  caseId: string
  patientName: string
  history: PaginatedVitalSigns | null | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  // Mở sẵn form ghi nhận ngay khi vào tab — dùng cho lối tắt "Điền chỉ số
  // sinh tồn" ở danh sách người bệnh. `onAutoOpenConsumed` báo cho parent biết
  // đã xử lý xong ý định này (để không tự mở lại form ở lần vào tab sau).
  autoOpenForm?: boolean
  onAutoOpenConsumed?: () => void
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Tab "Chỉ số" — lịch sử đo (mới nhất trước) + nút ghi nhận (chỉ điều dưỡng).
export function VitalsTab({
  caseId,
  patientName,
  history,
  isLoading,
  isError,
  onRetry,
  autoOpenForm = false,
  onAutoOpenConsumed,
}: VitalsTabProps) {
  // `autoOpenForm` chỉ đọc 1 LẦN làm state khởi tạo (không phải effect) — mở
  // sẵn form ngay từ lần mount đầu, không tự mở lại nếu prop đổi sau đó.
  const [isFormOpen, setIsFormOpen] = useState(autoOpenForm)

  // Không cập nhật state CỦA CHÍNH component này ở đây (tránh cascading
  // render) — effect chỉ báo cho parent biết đã "tiêu thụ" ý định auto-open,
  // để parent tắt cờ đi và không tự mở lại ở lần mount sau của tab này.
  useEffect(() => {
    if (autoOpenForm) onAutoOpenConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenForm])

  const records = history?.data ?? []

  return (
    <div className="space-y-4">
      {/* Form ghi nhận NẰM NGAY TRÊN ĐẦU tab (không phải dialog che màn hình)
          khi mở — ẩn nút "Ghi nhận chỉ số" trong lúc form đang mở để đỡ trùng
          lặp hành động. */}
      {isFormOpen ? (
        <VitalsInlineForm
          key={caseId}
          caseId={caseId}
          patientName={patientName}
          onClose={() => setIsFormOpen(false)}
        />
      ) : (
        // Khớp với quyền ghi ở backend: POST /vital-signs cho phép Nurse,
        // Head_Nurse VÀ Doctor (không chỉ điều dưỡng) — xem plan SEP490-421.
        <RoleGuard roles={['nurse', 'head_nurse', 'doctor']} fallback={null}>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1 rounded-xl bg-[#00459a] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Ghi nhận chỉ số
          </button>
        </RoleGuard>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Lịch sử chỉ số sinh tồn</h4>
          <p className="text-xs text-slate-500">
            Người ghi và thời điểm ghi do hệ thống tự động lưu.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 w-full animate-pulse rounded-lg bg-slate-100" />
      ) : isError ? (
        <AnalyticsEmptyState
          icon="error"
          headline="Không thể tải lịch sử chỉ số"
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
      ) : records.length === 0 ? (
        <AnalyticsEmptyState
          icon="monitor_heart"
          headline="Chưa có chỉ số nào được ghi nhận"
          subline="Chỉ số sinh tồn của người bệnh sẽ hiển thị ở đây sau lần đo đầu tiên."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Thời điểm</th>
                <th className="px-4 py-3">Mạch</th>
                <th className="px-4 py-3">Huyết áp</th>
                <th className="px-4 py-3">Nhiệt độ</th>
                <th className="px-4 py-3">Nhịp thở</th>
                <th className="px-4 py-3">SpO₂</th>
                <th className="px-4 py-3">Người ghi</th>
                <th className="px-4 py-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.vitalSignId} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {formatDateTime(record.recordedAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{record.pulseBpm} lần/phút</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {record.bloodPressureSystolic}/{record.bloodPressureDiastolic} mmHg
                  </td>
                  <td className="px-4 py-3 text-slate-700">{record.temperatureCelsius} °C</td>
                  <td className="px-4 py-3 text-slate-700">{record.respiratoryRate} lần/phút</td>
                  <td className="px-4 py-3 text-slate-700">{record.spo2Percent}%</td>
                  <td className="px-4 py-3 text-slate-500">{record.recordedByName ?? '--'}</td>
                  <td className="px-4 py-3 text-slate-500">{record.note || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
