import { levelClasses, levelKey } from '../../../lib/levelColor'
import { formatLastAssessment, patientName } from '../../../lib/patientDisplay'
import type { PatientListItem } from '../../patients/types'

interface PatientAnalyticsCardProps {
  patient: PatientListItem
  isSelected: boolean
  onSelect: (patient: PatientListItem) => void
}

// Thẻ chế độ đọc-quyền/chỉ để chọn (không có dropdown đổi POD, không có nút
// pause/lock hay lưu trữ — những action đó thuộc PatientPage, không thuộc
// phạm vi trang thống kê). Đây là CÁCH DUY NHẤT để chọn bệnh nhân cho toàn
// bộ panel chi tiết bên dưới nên root phải là <button> thật sự (không phải
// <div onClick>) để điều hướng được bằng bàn phím.
export function PatientAnalyticsCard({ patient, isSelected, onSelect }: PatientAnalyticsCardProps) {
  const level = levelKey(patient.level?.name)
  const classes = levelClasses(level)

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(patient)}
      className={`w-44 flex-shrink-0 rounded-lg p-3 text-left transition-all ${
        isSelected
          ? 'border border-blue-600 bg-blue-600 text-white shadow-lg'
          : `border-l-[4px] ${classes.borderLeft} border-y border-r border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-lg`
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${classes.dot}`} />
        <span
          className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-white/90' : classes.text}`}
        >
          POD {patient.currentPod} · {patient.operationType?.name ?? 'N/A'}
        </span>
      </div>

      <p
        className={`mt-1.5 truncate text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}
      >
        {patientName(patient)}
      </p>
      <p className={`truncate text-[10px] ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>
        Mã: {patient.caseId}
      </p>

      <div
        className={`mt-1.5 flex items-center gap-1 border-t pt-1.5 ${isSelected ? 'border-white/20' : 'border-slate-200/50'}`}
      >
        <span
          className={`material-symbols-outlined text-[12px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}
        >
          schedule
        </span>
        <span
          className={`text-[9px] font-medium ${isSelected ? 'text-white/80' : 'text-slate-500'}`}
        >
          {formatLastAssessment(patient.lastAssessmentTime)}
        </span>
      </div>
    </button>
  )
}
