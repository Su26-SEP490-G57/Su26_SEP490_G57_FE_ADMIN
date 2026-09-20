import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLatestAssessment } from '../api/patientApi'
import type { PatientListItem } from '../types'

interface PatientDetailPanelProps {
  patient: PatientListItem | null
  onClose: () => void
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string
  value: ReactNode
  className?: string
}) {
  return (
    <div className={`border-b border-slate-100 py-3 ${className}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <div className="mt-1 font-medium text-slate-800">{value ?? '--'}</div>
    </div>
  )
}

export function PatientDetailPanel({ patient, onClose }: PatientDetailPanelProps) {
  const { data: latestAssessment } = useQuery({
    queryKey: ['latestAssessment', patient?.caseId],
    queryFn: () => getLatestAssessment(patient!.caseId),
    enabled: !!patient,
  })

  if (!patient) return null

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[450px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Hồ sơ bệnh nhân</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Profile Header */}
          <div className="mb-6 flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
              {patient.fullName?.charAt(0) ?? '?'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {patient.fullName ?? patient.account?.fullName}
              </h3>
              <p className="text-sm text-slate-500">Mã: {patient.caseId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailField label="Tuổi" value={patient.age} />
            <DetailField label="Giới tính" value={patient.gender} />
            <DetailField label="Chiều cao" value={`${patient.height ?? '--'} cm`} />
            <DetailField label="Cân nặng" value={`${patient.weight ?? '--'} kg`} />
            <DetailField label="BMI" value={patient.bmi} />
          </div>

          {/* Thông tin điều trị */}
          <div className="mt-8">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Thông tin điều trị
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <DetailField
                label="Ngày phẫu thuật"
                value={
                  patient.surgeryDate
                    ? new Date(patient.surgeryDate).toLocaleDateString('vi-VN')
                    : '--'
                }
              />
              <DetailField label="POD hiện tại" value={`POD ${patient.currentPod ?? '--'}`} />
              <DetailField label="Buồng/giường" value={patient.roomBed ?? '--'} />
              <DetailField label="Mức ăn hiện tại" value={`Mức ${patient.currentDietLevel}`} />
              <DetailField
                label="Loại phẫu thuật"
                value={patient.operationType?.name ?? '--'}
                className="col-span-2"
              />
              <DetailField label="Phương pháp mổ" value={patient.method ?? '--'} />
              <DetailField
                label="Có miệng nối tiêu hoá"
                value={patient.hasGiAnastomosis ? 'Có' : 'Không'}
              />
            </div>
            <DetailField
              label="Chẩn đoán"
              value={patient.diagnosis ?? '--'}
              className="col-span-2 mt-0"
            />
          </div>

          {/* Đánh giá gần nhất */}
          {latestAssessment && (
            <div className="mt-8 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Tóm tắt đánh giá
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-slate-500">Mức độ cảnh báo (Triage):</p>
                <p
                  className={`font-extrabold ${latestAssessment.triageLevel === 'RED' ? 'text-red-600' : latestAssessment.triageLevel === 'YELLOW' ? 'text-yellow-600' : 'text-green-600'}`}
                >
                  {latestAssessment.triageLevel}
                </p>
              </div>
              <button className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-semibold underline">
                Xem tất cả đánh giá
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t p-4 flex gap-2">
          <button className="flex-1 rounded-lg bg-slate-100 py-2.5 font-semibold text-slate-700 hover:bg-slate-200">
            Thêm ghi chú
          </button>
          <button className="flex-1 rounded-lg bg-green-600 py-2.5 font-semibold text-white hover:bg-green-700">
            Tiếp tục theo dõi
          </button>
        </div>
      </div>
    </div>
  )
}
