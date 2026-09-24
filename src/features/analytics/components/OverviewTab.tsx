import { useState } from 'react'
import { patientName } from '../../../lib/patientDisplay'
import { RoleGuard } from '../../auth/components/RoleGuard'
import type { PatientListItem } from '../../patients/types'
import { TreatmentOrderFormModal } from '../../treatment-orders/components/TreatmentOrderFormModal'
import { CARE_LEVEL_LABELS } from '../../treatment-orders/types'

interface OverviewTabProps {
  patient: PatientListItem
}

function formatDate(value?: string | null): string {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface InfoField {
  icon: string
  label: string
  value: string
}

function InfoFieldCard({ icon, label, value }: InfoField) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800" title={value}>
          {value}
        </p>
      </div>
    </div>
  )
}

// Tab "Tổng quan" — banner mức chăm sóc (nổi bật, kèm CTA tạo chỉ định điều
// trị cho bác sĩ) phía trên, thẻ thông tin chung dạng lưới icon phía dưới.
export function OverviewTab({ patient }: OverviewTabProps) {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)

  const level = patient.activeCareLevel ?? null
  const levelLabel = level ? CARE_LEVEL_LABELS[level] : 'Chưa chỉ định'

  const fields: InfoField[] = [
    { icon: 'badge', label: 'Mã người bệnh', value: patient.caseId },
    { icon: 'person', label: 'Họ và tên', value: patientName(patient) },
    { icon: 'cake', label: 'Tuổi', value: patient.age ? `${patient.age}` : '--' },
    { icon: 'wc', label: 'Giới tính', value: patient.gender || '--' },
    { icon: 'event', label: 'Ngày phẫu thuật', value: formatDate(patient.surgeryDate) },
    {
      icon: 'medical_services',
      label: 'Loại phẫu thuật',
      value: patient.operationType?.name ?? '--',
    },
    { icon: 'stethoscope', label: 'Chẩn đoán', value: patient.diagnosis || '--' },
    { icon: 'bed', label: 'Phòng / Giường', value: patient.roomBed || '--' },
    { icon: 'timeline', label: 'POD hiện tại', value: `POD ${patient.currentPod}` },
  ]

  return (
    <div className="space-y-5">
      {/* Banner mức chăm sóc — CỐ TÌNH không dùng lib/levelColor.ts (đỏ/vàng/
          xanh, badge nguy cơ ERAS ở header panel) vì đây là khái niệm khác. */}
      <div
        className={`flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
          level ? 'border-[#00459a]/20 bg-[#00459a]/[0.04]' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
              level ? 'bg-[#00459a] text-white' : 'bg-slate-200 text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">health_and_safety</span>
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Mức chăm sóc hiện tại
            </p>
            <p className={`text-xl font-extrabold ${level ? 'text-[#00459a]' : 'text-slate-400'}`}>
              {levelLabel}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Do bác sĩ chỉ định qua Phiếu theo dõi điều trị — khác với mức độ nguy cơ
              (Đỏ/Vàng/Xanh)
            </p>
          </div>
        </div>

        <RoleGuard roles={['doctor']} fallback={null}>
          <button
            type="button"
            onClick={() => setIsOrderFormOpen(true)}
            className="flex items-center justify-center gap-1.5 self-start rounded-xl bg-[#00459a] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20 sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm phiếu theo dõi điều trị
          </button>
        </RoleGuard>
      </div>

      {/* Thông tin chung */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h5 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <span className="material-symbols-outlined text-[16px]">info</span>
          Thông tin chung
        </h5>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <InfoFieldCard key={field.label} {...field} />
          ))}
        </div>
      </div>

      {/* Chỉ mount khi mở → state (lỗi submit, lựa chọn mức chăm sóc) luôn sạch. */}
      {isOrderFormOpen && (
        <TreatmentOrderFormModal
          isOpen={isOrderFormOpen}
          onClose={() => setIsOrderFormOpen(false)}
          caseId={patient.caseId}
          patientName={patientName(patient)}
        />
      )}
    </div>
  )
}
