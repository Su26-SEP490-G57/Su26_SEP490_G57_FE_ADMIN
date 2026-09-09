import { useMemo, useRef, useState, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPatients, updateDietLevel, updatePodLock } from '../api/patientApi'
import { PatientDetailPanel } from '../components/PatientDetailPanel'
import { PatientFormModal } from '../components/PatientFormModal'
import { getOperationTypes } from '../api/patientApi'
import { HoldReasonModal } from '../components/HoldReasonModal'
import { PatientSearchBar } from '../components/PatientSearchBar'
import type { PatientListItem } from '../types'

const EMPTY_PATIENTS: PatientListItem[] = []
const DIET_LEVELS = [0, 1, 2, 3, 4] as const

type RiskLevel = 'red' | 'yellow' | 'green'

type PendingClinicalAction =
  | { type: 'pause'; patient: PatientListItem }
  | { type: 'diet-level-change'; patient: PatientListItem; dietLevel: number }

const RISK_COLUMNS: Record<
  RiskLevel,
  { label: string; headerClassName: string; cardClassName: string }
> = {
  red: {
    label: 'Nguy cơ cao',
    headerClassName: 'text-[#b91c1c]',
    cardClassName:
      'border-[#fca5a5] bg-[#fffbfb] text-[#a81c1c] hover:border-red-400 focus:ring-red-300',
  },
  yellow: {
    label: 'Cần theo dõi',
    headerClassName: 'text-[#ca8a04]',
    cardClassName:
      'border-[#fde047] bg-[#fffef0] text-[#854d0e] hover:border-yellow-400 focus:ring-yellow-300',
  },
  green: {
    label: 'Ổn định',
    headerClassName: 'text-[#15803d]',
    cardClassName:
      'border-[#86efac] bg-[#f0fdf4] text-[#166534] hover:border-green-400 focus:ring-green-300',
  },
}

function patientName(patient: PatientListItem) {
  return patient.fullName ?? patient.account?.fullName ?? patient.nameInitials ?? '--'
}

function levelKey(name?: string | null): RiskLevel | null {
  const normalizedName = (name ?? '').toLowerCase()

  if (normalizedName.includes('red') || normalizedName.includes('đỏ')) return 'red'
  if (normalizedName.includes('yellow') || normalizedName.includes('vàng')) return 'yellow'
  if (normalizedName.includes('green') || normalizedName.includes('xanh')) return 'green'

  return null
}

function isGreenPatientReadyToHide(patient: PatientListItem) {
  if (
    levelKey(patient.level?.name) !== 'green' ||
    patient.isLocked ||
    patient.currentDietLevel !== 4 ||
    !patient.lastAssessmentTime
  ) {
    return false
  }

  const lastAssessmentTime = new Date(patient.lastAssessmentTime)
  if (Number.isNaN(lastAssessmentTime.getTime())) return false

  const hoursSinceLastAssessment = (Date.now() - lastAssessmentTime.getTime()) / (1000 * 60 * 60)
  return hoursSinceLastAssessment > 24
}

export function PatientPage() {
  const [isAddingPatient, setIsAddingPatient] = useState(false)
  const [selectedDetailPatient, setSelectedDetailPatient] = useState<PatientListItem | null>(null)
  const [activeLevels, setActiveLevels] = useState<RiskLevel[]>(['red', 'yellow', 'green'])
  const [hoveredPatient, setHoveredPatient] = useState<PatientListItem | null>(null)
  const [pendingClinicalAction, setPendingClinicalAction] = useState<PendingClinicalAction | null>(
    null,
  )
  const [hoverPosition, setHoverPosition] = useState({ left: 0, top: 0 })
  const [isUpdating, setIsUpdating] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: response, refetch: refetchPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => getPatients({ limit: 9999 }),
  })
  const { data: operationTypes = [] } = useQuery({
    queryKey: ['operationTypes'],
    queryFn: getOperationTypes,
  })

  const patients = response?.data ?? EMPTY_PATIENTS
  const visibleRiskColumns = useMemo(
    () =>
      (Object.keys(RISK_COLUMNS) as RiskLevel[]).filter((level) => activeLevels.includes(level)),
    [activeLevels],
  )

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        const patientLevel = levelKey(patient.level?.name)

        if (patientLevel && !activeLevels.includes(patientLevel)) return false
        return !isGreenPatientReadyToHide(patient)
      }),
    [activeLevels, patients],
  )

  const roomMap = useMemo(
    () =>
      filteredPatients.reduce(
        (rooms, patient) => {
          const room = patient.roomBed?.split('/')[0] || 'Chưa phân phòng'
          const roomEntry = rooms[room] ?? { room, patients: [] }
          roomEntry.patients.push(patient)
          rooms[room] = roomEntry
          return rooms
        },
        {} as Record<string, { room: string; patients: PatientListItem[] }>,
      ),
    [filteredPatients],
  )

  function clearHoverTimer() {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  function handleMouseEnter(event: MouseEvent<HTMLElement>, patient: PatientListItem) {
    clearHoverTimer()
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverPosition({ left: rect.left, top: rect.bottom + 5 })
    setHoveredPatient(patient)
  }

  function scheduleHoverClose() {
    clearHoverTimer()
    hoverTimer.current = setTimeout(() => setHoveredPatient(null), 300)
  }

  async function handleResumeMonitoring(patient: PatientListItem) {
    setIsUpdating(true)

    try {
      await updatePodLock(patient.caseId, { isLocked: false })
      await refetchPatients()
      setHoveredPatient(null)
    } catch (error) {
      console.error('Unable to resume patient diet monitoring', error)
      window.alert('Không thể tiếp tục theo dõi mức ăn. Vui lòng thử lại.')
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleConfirmClinicalAction(reason: string) {
    if (!pendingClinicalAction) return

    setIsUpdating(true)

    try {
      if (pendingClinicalAction.type === 'pause') {
        await updatePodLock(pendingClinicalAction.patient.caseId, {
          isLocked: true,
          holdReason: reason,
        })
      } else {
        await updateDietLevel(
          pendingClinicalAction.patient.caseId,
          pendingClinicalAction.dietLevel,
          reason,
        )
      }

      await refetchPatients()
      setPendingClinicalAction(null)
      setHoveredPatient(null)
    } catch (error) {
      console.error('Unable to update patient clinical status', error)
      window.alert('Không thể cập nhật thông tin lâm sàng. Vui lòng thử lại.')
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  function handleQuickToggle(patient: PatientListItem) {
    if (patient.isLocked) {
      void handleResumeMonitoring(patient)
      return
    }

    clearHoverTimer()
    setPendingClinicalAction({ type: 'pause', patient })
  }

  function requestDietLevelChange(patient: PatientListItem, dietLevel: number) {
    if (dietLevel === patient.currentDietLevel) return

    clearHoverTimer()
    setPendingClinicalAction({ type: 'diet-level-change', patient, dietLevel })
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#f0f4f9] p-6 md:p-7">
      <div className="mb-6 flex flex-wrap items-center gap-3.5">
        <button
          type="button"
          onClick={() => setIsAddingPatient(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#1e62d4] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1852b5] active:scale-[0.98]"
        >
          <span>Thêm mới</span>
        </button>
        <div className="relative w-80">
          <PatientSearchBar
            patients={patients}
            onSelect={(patient) => {
              clearHoverTimer()
              setHoveredPatient(patient)
            }}
          />
        </div>
        <div className="ml-1 flex items-center gap-3.5">
          {(['red', 'yellow', 'green'] as const).map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                checked={activeLevels.includes(level)}
                onChange={() =>
                  setActiveLevels((previousLevels) =>
                    previousLevels.includes(level)
                      ? previousLevels.filter((currentLevel) => currentLevel !== level)
                      : [...previousLevels, level],
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-[#1e62d4]"
              />
              <span>{level === 'red' ? 'Đỏ' : level === 'yellow' ? 'Vàng' : 'Xanh'}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
              <th className="w-48 bg-white px-6 py-3.5 text-slate-500">Phòng</th>
              {visibleRiskColumns.map((level) => (
                <th
                  key={level}
                  className={`border-l border-slate-200 bg-white px-6 py-3.5 ${RISK_COLUMNS[level].headerClassName}`}
                >
                  {RISK_COLUMNS[level].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {Object.values(roomMap).map(({ room, patients: roomPatients }) => (
              <tr key={room} className="transition hover:bg-slate-50/40">
                <td className="align-top bg-white px-6 py-5 text-[15px] font-bold">
                  {room}
                  <div className="text-xs font-normal text-slate-500">
                    {roomPatients.length} bệnh nhân
                  </div>
                </td>
                {visibleRiskColumns.map((level) => (
                  <td key={level} className="align-middle border-l border-slate-200 px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      {roomPatients
                        .filter((patient) => levelKey(patient.level?.name) === level)
                        .map((patient) => (
                          <button
                            key={patient.caseId}
                            type="button"
                            onClick={() => setSelectedDetailPatient(patient)}
                            onMouseEnter={(event) => handleMouseEnter(event, patient)}
                            onMouseLeave={scheduleHoverClose}
                            className={`w-52 rounded-xl border px-4 py-4 text-center font-bold shadow-sm focus:outline-none focus:ring-2 ${RISK_COLUMNS[level].cardClassName}`}
                          >
                            {patientName(patient)}
                          </button>
                        ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HoldReasonModal
        patient={pendingClinicalAction?.patient ?? null}
        title={
          pendingClinicalAction?.type === 'diet-level-change'
            ? 'Xác nhận thay đổi mức ăn'
            : 'Tạm dừng theo dõi mức ăn'
        }
        description={
          pendingClinicalAction?.type === 'diet-level-change'
            ? `Xác nhận thay đổi từ Mức ${pendingClinicalAction.patient.currentDietLevel} sang Mức ${pendingClinicalAction.dietLevel} cho bệnh nhân`
            : 'Nhập lý do lâm sàng trước khi tạm dừng theo dõi bệnh nhân'
        }
        reasonLabel={
          pendingClinicalAction?.type === 'diet-level-change'
            ? 'Lý do thay đổi mức ăn'
            : 'Lý do tạm dừng'
        }
        reasonPlaceholder={
          pendingClinicalAction?.type === 'diet-level-change'
            ? 'Ví dụ: Bệnh nhân đã dung nạp tốt chế độ ăn hiện tại'
            : 'Ví dụ: Bệnh nhân chưa dung nạp tốt chế độ ăn hiện tại'
        }
        confirmText={
          pendingClinicalAction?.type === 'diet-level-change'
            ? 'Xác nhận thay đổi mức ăn'
            : 'Xác nhận tạm dừng'
        }
        isSubmitting={isUpdating}
        onConfirm={handleConfirmClinicalAction}
        onCancel={() => setPendingClinicalAction(null)}
      />

      <PatientFormModal
        isOpen={isAddingPatient}
        onClose={() => setIsAddingPatient(false)}
        onSaved={refetchPatients}
        operationTypes={operationTypes}
      />

      <PatientDetailPanel
        patient={selectedDetailPatient}
        onClose={() => setSelectedDetailPatient(null)}
      />

      {hoveredPatient && (
        <div
          className="fixed z-[9999] w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
          style={{ left: hoverPosition.left, top: hoverPosition.top }}
          onMouseEnter={clearHoverTimer}
          onMouseLeave={scheduleHoverClose}
        >
          <p className="text-sm font-bold text-slate-800">{patientName(hoveredPatient)}</p>
          <p className="mt-1 text-xs text-slate-500">Mã: {hoveredPatient.caseId}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleQuickToggle(hoveredPatient)}
              title={
                hoveredPatient.isLocked ? 'Tiếp tục theo dõi mức ăn' : 'Tạm dừng theo dõi mức ăn'
              }
              className={`rounded-md p-2 disabled:cursor-wait disabled:opacity-60 ${
                hoveredPatient.isLocked
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {hoveredPatient.isLocked ? 'play_arrow' : 'pause'}
              </span>
            </button>
            <label className="sr-only" htmlFor="diet-level-select">
              Mức ăn
            </label>
            <select
              id="diet-level-select"
              value={hoveredPatient.currentDietLevel}
              disabled={isUpdating}
              onChange={(event) =>
                requestDietLevelChange(hoveredPatient, Number(event.target.value))
              }
              className="flex-1 rounded-md border border-slate-300 bg-white p-1.5 text-xs text-slate-700 disabled:cursor-wait disabled:opacity-60"
            >
              {DIET_LEVELS.map((dietLevel) => (
                <option key={dietLevel} value={dietLevel}>
                  Mức {dietLevel}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </main>
  )
}
