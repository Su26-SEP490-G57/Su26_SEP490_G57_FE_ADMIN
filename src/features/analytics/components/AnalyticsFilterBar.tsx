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

// Thanh loc cho trang Thong ke du lieu: o tim kiem thu hep danh sach (KHONG
// phai PatientSearchBar — do la o chon nhanh 1 benh nhan, job khac) + 2 select
// loc theo loai phau thuat / phong.
//
// O tim kiem giu state gõ CUC BO va debounce 300ms truoc khi bao len parent —
// khong duoc lift raw onChange keystroke thang len state cha, vi codebase nay
// tung gap loi mat focus khi go tieng Viet (IME) do re-render tu parent
// (xem comment dau file PatientSearchBar.tsx).
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
          placeholder="Tim benh nhan, ma, chan doan..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm"
        />
      </div>

      <select
        value={operationTypeId ?? ''}
        onChange={(e) => onOperationTypeChange(e.target.value ? Number(e.target.value) : undefined)}
        className={SELECT_CLASSNAME}
      >
        <option value="">Loai phau thuat</option>
        {operationTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name}
          </option>
        ))}
      </select>

      <select value={room ?? ''} onChange={(e) => onRoomChange(e.target.value || undefined)} className={SELECT_CLASSNAME}>
        <option value="">Phong</option>
        {rooms.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  )
}
