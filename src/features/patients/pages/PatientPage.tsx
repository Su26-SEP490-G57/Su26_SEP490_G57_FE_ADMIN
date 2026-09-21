import { useMemo, useRef, useState, type MouseEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPatients, updateDietLevel, updatePodLock } from '../api/patientApi'
import { useRole } from '../../auth/hooks/useRole'
import { PatientDetailPanel, type VitalsQuickIntent } from '../components/PatientDetailPanel'
import { PatientFormModal } from '../components/PatientFormModal'
import { ImportPatientsModal } from '../components/ImportPatientsModal'
import { getOperationTypes } from '../api/patientApi'
import { HoldReasonModal } from '../components/HoldReasonModal'
import { PatientSearchBar } from '../components/PatientSearchBar'
import { NurseAssignmentCell } from '../components/NurseAssignmentCell'
import { AlertModal } from '../../../components/AlertModal'
import type { PatientListItem } from '../types'

const EMPTY_PATIENTS: PatientListItem[] = []
const DIET_LEVELS = [0, 1, 2, 3, 4] as const
type RiskLevel = 'red' | 'yellow' | 'green'

type PendingClinicalAction =
  | { type: 'pause'; patient: PatientListItem }
  | { type: 'diet-level-change'; patient: PatientListItem; dietLevel: number }

const RISK_COLUMNS: Record<
  RiskLevel,
  { label: string; headerClassName: string; cellBorder: string; indicatorColor: string }
> = {
  red: {
    label: 'Nguy cơ cao',
    headerClassName: 'text-red-700 font-bold',
    cellBorder: 'bg-red-50/40 border-red-100',
    indicatorColor: 'bg-red-500',
  },
  yellow: {
    label: 'Cần theo dõi',
    headerClassName: 'text-yellow-700 font-bold',
    cellBorder: 'bg-yellow-50/40 border-yellow-100',
    indicatorColor: 'bg-yellow-500',
  },
  green: {
    label: 'Ổn định',
    headerClassName: 'text-green-700 font-bold',
    cellBorder: 'bg-green-50/40 border-green-100',
    indicatorColor: 'bg-green-500',
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
  const role = useRole()
  const [isAddingPatient, setIsAddingPatient] = useState(false)
  const [isImportingPatients, setIsImportingPatients] = useState(false)
  const [selectedDetailPatient, setSelectedDetailPatient] = useState<PatientListItem | null>(null)
  const [vitalsIntent, setVitalsIntent] = useState<VitalsQuickIntent | null>(null)
  const [activeLevels, setActiveLevels] = useState<RiskLevel[]>(['red', 'yellow', 'green'])
  const [hoveredPatient, setHoveredPatient] = useState<PatientListItem | null>(null)
  const [pendingClinicalAction, setPendingClinicalAction] = useState<PendingClinicalAction | null>(
    null,
  )
  const [hoverPosition, setHoverPosition] = useState({ left: 0, top: 0 })
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorAlert, setErrorAlert] = useState<{ title: string; message: string } | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vitalsIntentCounter = useRef(0)

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
    setHoverPosition({ left: rect.left, top: rect.bottom + 2 })
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
      console.error('Unable to resume', error)
      window.alert('Không thể tiếp tục theo dõi mức ăn.')
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
      console.error('Action failed', error)

      // Extract error message from backend response
      let errorMessage = 'Lỗi cập nhật lâm sàng.'
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        }
      }

      setErrorAlert({
        title: 'Không thể cập nhật',
        message: errorMessage,
      })
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

  // Mở panel chi tiết ngay ở tab "Chỉ số" với form ghi nhận đã mở sẵn.
  // `token` luôn là giá trị MỚI (kể cả bấm lại trên đúng người bệnh đang mở)
  // để PatientDetailPanel biết đây là 1 yêu cầu mới cần áp dụng lại.
  function handleQuickVitals(patient: PatientListItem) {
    clearHoverTimer()
    setHoveredPatient(null)
    setSelectedDetailPatient(patient)
    vitalsIntentCounter.current += 1
    setVitalsIntent({ caseId: patient.caseId, token: vitalsIntentCounter.current })
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 relative">
      <div className="flex border-b border-slate-200 bg-white p-3 items-center justify-between shadow-sm z-30 w-full">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAddingPatient(true)}
            className="rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + Bệnh nhân mới
          </button>
          {role === 'head_nurse' && (
            <button
              type="button"
              onClick={() => setIsImportingPatients(true)}
              className="flex items-center gap-1.5 rounded border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              <span className="material-symbols-outlined text-[16px]">cloud_download</span>
              Nhập từ HIS
            </button>
          )}
          <div className="w-72">
            <PatientSearchBar
              patients={patients}
              onSelect={(patient) => {
                clearHoverTimer()
                setSelectedDetailPatient(patient)
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lọc rủi ro:
          </div>
          <div className="flex bg-slate-100 rounded p-0.5 border border-slate-200">
            {(['red', 'yellow', 'green'] as const).map((level) => {
              const active = activeLevels.includes(level)
              return (
                <button
                  key={level}
                  onClick={() =>
                    setActiveLevels((prev) =>
                      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
                    )
                  }
                  className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors ${
                    active
                      ? 'bg-white shadow-sm text-slate-800'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                      level === 'red'
                        ? 'bg-red-500'
                        : level === 'yellow'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    } ${!active && 'opacity-40'}`}
                  ></span>
                  {level === 'red' ? 'Nguy cơ' : level === 'yellow' ? 'Theo dõi' : 'Ổn định'}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-w-full p-4">
        <div className="inline-block min-w-full align-middle font-sans">
          <table className="min-w-full border-collapse border border-slate-200 bg-white text-xs">
            <thead className="sticky top-0 bg-white z-20 shadow-sm">
              <tr>
                <th
                  scope="col"
                  className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-left font-bold text-slate-600 uppercase tracking-widest w-32"
                >
                  Phòng
                </th>
                {visibleRiskColumns.map((level) => (
                  <th
                    key={level}
                    scope="col"
                    className={`border-b border-l border-slate-200 bg-slate-50 px-3 py-2 text-left uppercase tracking-widest ${RISK_COLUMNS[level].headerClassName}`}
                  >
                    {RISK_COLUMNS[level].label}
                  </th>
                ))}
                <th
                  scope="col"
                  className="border-b border-l border-slate-200 bg-slate-100 px-3 py-2 text-left font-bold text-slate-600 uppercase tracking-widest w-48"
                >
                  Điều dưỡng phụ trách
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {Object.values(roomMap).map(({ room, patients: roomPatients }, index) => {
                const isEven = index % 2 === 0
                return (
                  <tr key={room} className={isEven ? 'bg-white' : 'bg-[#fafafa]'}>
                    <td className="whitespace-nowrap px-3 py-2 align-top border-r border-slate-100">
                      <div className="font-bold text-slate-800 text-[13px]">{room}</div>
                      <div className="text-[11px] text-slate-400">{roomPatients.length} Ca</div>
                    </td>
                    {visibleRiskColumns.map((level) => {
                      const levelPatients = roomPatients.filter(
                        (p) => levelKey(p.level?.name) === level,
                      )
                      return (
                        <td
                          key={level}
                          className="px-2 py-2 align-top border-r border-slate-100 last:border-none"
                        >
                          <div className="flex flex-row flex-wrap gap-1.5">
                            {levelPatients.map((patient) => {
                              const baseClasses = `flex cursor-pointer p-1.5 min-w-[130px] flex-1 max-w-[200px] gap-2 group rounded-sm shadow-sm transition-all ${RISK_COLUMNS[level].cellBorder}`
                              const lockedClasses = patient.isLocked
                                ? level === 'red'
                                  ? 'bg-red-100 border-red-300 border-2'
                                  : level === 'yellow'
                                    ? 'bg-yellow-100 border-yellow-300 border-2'
                                    : 'bg-green-100 border-green-300 border-2'
                                : 'border border-transparent'

                              return (
                                <div
                                  key={patient.caseId}
                                  onClick={() => setSelectedDetailPatient(patient)}
                                  onMouseEnter={(event) => handleMouseEnter(event, patient)}
                                  onMouseLeave={scheduleHoverClose}
                                  className={`${baseClasses} ${lockedClasses}`}
                                >
                                  {patient.isLocked && (
                                    <span
                                      className="material-symbols-outlined text-slate-600 text-[14px]"
                                      title="Tạm dừng mức ăn"
                                    >
                                      lock
                                    </span>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-slate-800 text-[12px] truncate group-hover:text-blue-700">
                                      {patientName(patient)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-medium mt-0.5 w-full">
                                      <span>#{patient.caseId.slice(-4)}</span>
                                      <span className="text-slate-300">•</span>
                                      <span>POD {patient.currentPod}</span>
                                      <span className="text-slate-300">•</span>
                                      <span className="truncate">
                                        Mức ăn {patient.currentDietLevel}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            {levelPatients.length === 0 && (
                              <div className="text-[11px] text-slate-300 italic px-1 w-full">—</div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-3 py-2 align-top border-l border-slate-100">
                      <NurseAssignmentCell roomCode={room} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hoveredPatient && (
        <div
          className="fixed z-[9999] w-[220px] bg-white border border-slate-300 shadow-xl rounded pointer-events-auto"
          style={{ left: hoverPosition.left, top: hoverPosition.top }}
          onMouseEnter={clearHoverTimer}
          onMouseLeave={scheduleHoverClose}
        >
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800 truncate">
                {patientName(hoveredPatient)}
              </p>
              <span className="text-[10px] font-medium text-slate-400 ml-2">
                #{hoveredPatient.caseId}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 mt-1 truncate">
              {hoveredPatient.operationType?.name ?? 'Chưa phân loại'}
            </p>
          </div>
          <div className="p-2 flex items-center justify-between bg-white text-xs">
            <span className="text-slate-600 font-medium">Mức ăn:</span>
            <select
              value={hoveredPatient.currentDietLevel}
              disabled={isUpdating}
              onChange={(e) => requestDietLevelChange(hoveredPatient, Number(e.target.value))}
              className="border border-slate-200 bg-white rounded px-1.5 py-0.5 text-xs font-bold text-slate-800"
            >
              {DIET_LEVELS.map((dl) => (
                <option key={dl} value={dl}>
                  {dl}
                </option>
              ))}
            </select>
          </div>
          {(role === 'nurse' || role === 'head_nurse' || role === 'doctor') && (
            <div className="p-2 border-t border-slate-100 bg-white">
              <button
                onClick={() => handleQuickVitals(hoveredPatient)}
                className="flex w-full items-center justify-center gap-1 py-1 text-[11px] font-bold rounded transition-colors bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              >
                <span className="material-symbols-outlined text-[14px]">monitor_heart</span>
                Điền chỉ số sinh tồn
              </button>
            </div>
          )}
          <div className="p-2 border-t border-slate-100 bg-white">
            <button
              disabled={isUpdating}
              onClick={() => handleQuickToggle(hoveredPatient)}
              className={`w-full py-1 text-[11px] font-bold rounded transition-colors ${
                hoveredPatient.isLocked
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              {hoveredPatient.isLocked ? '▶ TIẾP TỤC ĐÁNH GIÁ' : '⏸ KHÓA MỨC ĂN (HOLD)'}
            </button>
          </div>
        </div>
      )}

      <PatientDetailPanel
        patient={selectedDetailPatient}
        onClose={() => {
          setSelectedDetailPatient(null)
          setVitalsIntent(null)
        }}
        vitalsIntent={vitalsIntent}
      />

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
      <ImportPatientsModal
        isOpen={isImportingPatients}
        onClose={() => setIsImportingPatients(false)}
        onImported={refetchPatients}
      />
      <AlertModal
        isOpen={!!errorAlert}
        title={errorAlert?.title ?? ''}
        message={errorAlert?.message ?? ''}
        onClose={() => setErrorAlert(null)}
      />
    </div>
  )
}
