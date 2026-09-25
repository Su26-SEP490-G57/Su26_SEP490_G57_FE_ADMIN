import { useState } from 'react'
import { patientName } from '../../../lib/patientDisplay'
import { RoleGuard } from '../../auth/components/RoleGuard'
import { PatientInfoForm } from '../../patients/components/PatientInfoForm'
import type { PatientListItem } from '../../patients/types'
import { TreatmentOrderFormModal } from '../../treatment-orders/components/TreatmentOrderFormModal'
import { CARE_LEVEL_LABELS } from '../../treatment-orders/types'

interface OverviewTabProps {
  patient: PatientListItem
}

// Tab "Tổng quan" — banner mức chăm sóc (nổi bật, kèm CTA tạo chỉ định điều
// trị cho bác sĩ) phía trên, thẻ thông tin chung dạng lưới icon phía dưới —
// nhân viên y tế sửa trực tiếp trên thẻ (PatientInfoForm).
export function OverviewTab({ patient }: OverviewTabProps) {
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false)

  const level = patient.activeCareLevel ?? null
  const levelLabel = level ? CARE_LEVEL_LABELS[level] : 'Chưa chỉ định'

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
        <PatientInfoForm key={patient.caseId} patient={patient} />
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
