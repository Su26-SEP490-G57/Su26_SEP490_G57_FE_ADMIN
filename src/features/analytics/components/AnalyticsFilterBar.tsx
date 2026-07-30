import { useEffect, useState } from 'react'
import type { OperationType } from '../../patients/types'

interface AnalyticsFilterBarProps {
  operationTypes: OperationType[]
  operationTypeId: number | undefined
  onOperationTypeChange: (id: number | undefined) => void
  rooms: string[]
  room: string | undefined
  onRoomChange: (room: string | undefined) => void
  onSearchChange: (value: string) => void
}

const SELECT_CLASSNAME =
  'bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap'

const DEBOUNCE_MS = 300

// Thanh lọc cho trang Thống kê dữ liệu: ô tìm kiếm thu hẹp danh sách (KHÔNG
// phải PatientSearchBar — đó là ô chọn nhanh 1 bệnh nhân, job khác) + 2 select
// lọc theo loại phẫu thuật / phòng.
//
// Ô tìm kiếm giữ state gõ CỤC BỘ và debounce 300ms trước khi báo lên parent —
// không được lift raw onChange keystroke thẳng lên state cha, vì codebase này
// từng gặp lỗi mất focus khi gõ tiếng Việt (IME) do re-render từ parent
// (xem comment đầu file PatientSearchBar.tsx).
export function AnalyticsFilterBar({
  operationTypes,
  operationTypeId,
  onOperationTypeChange,
  rooms,
  room,
  onRoomChange,
  onSearchChange,
}: AnalyticsFilterBarProps) {
  const [rawSearch, setRawSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(rawSearch), DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSearch])

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-64">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">
          search
        </span>
        <input
          type="text"
          value={rawSearch}
          onChange={(e) => setRawSearch(e.target.value)}
          placeholder="Tìm bệnh nhân, mã, chẩn đoán..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm"
        />
      </div>

      <select
        value={operationTypeId ?? ''}
        onChange={(e) => onOperationTypeChange(e.target.value ? Number(e.target.value) : undefined)}
        className={SELECT_CLASSNAME}
      >
        <option value="">Loại phẫu thuật</option>
        {operationTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>

      <select
        value={room ?? ''}
        onChange={(e) => onRoomChange(e.target.value || undefined)}
        className={SELECT_CLASSNAME}
      >
        <option value="">Phòng</option>
        {rooms.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  )
}
