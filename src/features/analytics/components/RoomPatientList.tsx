import { groupPatientsByRoom } from '../../../lib/patientGrouping'
import type { PatientListItem } from '../../patients/types'
import { PatientAnalyticsCard } from './PatientAnalyticsCard'

interface RoomPatientListProps {
  patients: PatientListItem[]
  selectedCaseId: string | null
  onSelect: (patient: PatientListItem) => void
}

// Danh sách bệnh nhân gom theo phòng — mỗi phòng là 1 hàng cuộn ngang các
// PatientAnalyticsCard (chọn 1 để xem chi tiết bên dưới).
export function RoomPatientList({ patients, selectedCaseId, onSelect }: RoomPatientListProps) {
  const groups = groupPatientsByRoom(patients)

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.room}>
          <div className="mb-2 flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-700">Phòng {group.room}</h4>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {group.patients.length} người bệnh
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {group.patients.map((patient) => (
              <PatientAnalyticsCard
                key={patient.caseId}
                patient={patient}
                isSelected={patient.caseId === selectedCaseId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
