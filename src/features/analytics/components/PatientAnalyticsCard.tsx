import { levelClasses, levelKey } from '../../../lib/levelColor'
import { formatLastAssessment, patientName } from '../../../lib/patientDisplay'
import type { PatientListItem } from '../../patients/types'

interface PatientAnalyticsCardProps {
  patient: PatientListItem
  isSelected: boolean
  onSelect: (patient: PatientListItem) => void
}

// The che doc-quyen/chi de chon (khong co dropdown doi POD, khong co nut
// pause/lock hay luu tru — nhung action do thuoc PatientPage, khong thuoc
// pham vi trang thong ke). Day la CACH DUY NHAT de chon benh nhan cho toan
// bo panel chi tiet ben duoi nen root phai la <button> that su (khong phai
// <div onClick>) de dieu huong duoc bang ban phim.
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
        <span className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-white/90' : classes.text}`}>
          POD {patient.currentPod} · {patient.operationType?.name ?? 'N/A'}
        </span>
      </div>

      <p className={`mt-1.5 truncate text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
        {patientName(patient)}
      </p>
      <p className={`truncate text-[10px] ${isSelected ? 'text-white/70' : 'text-slate-500'}`}>Ma: {patient.caseId}</p>

      <div className={`mt-1.5 flex items-center gap-1 border-t pt-1.5 ${isSelected ? 'border-white/20' : 'border-slate-200/50'}`}>
        <span className={`material-symbols-outlined text-[12px] ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>schedule</span>
        <span className={`text-[9px] font-medium ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
          {formatLastAssessment(patient.lastAssessmentTime)}
        </span>
      </div>
    </button>
  )
}
