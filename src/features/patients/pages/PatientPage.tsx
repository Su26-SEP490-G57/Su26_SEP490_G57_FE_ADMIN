/* eslint-disable react-hooks/set-state-in-effect */
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import {
  archivePatient,
  deletePatient,
  getAssessmentDetail,
  getLatestAssessment,
  getOperationTypes,
  getPatients,
  updatePatient,
  updatePodLevel,
  updatePodLock
} from '../api/patientApi'
import { PatientFormModal } from '../components/PatientFormModal'
import { PatientSearchBar } from '../components/PatientSearchBar'
import type {
  AssessmentDetailResponse,
  LatestAssessmentResponse,
  OperationType,
  PatientListItem,
  UpdatePatientPayload,
} from '../types'

function displayValue<T>(value: T | null | undefined) {
  return value ?? '--'
}

// Tên hiển thị của bệnh nhân: ưu tiên fullName của tài khoản liên kết.
function patientName(p: { account?: { fullName?: string | null } | null; nameInitials?: string | null }) {
  return p.account?.fullName ?? p.nameInitials ?? '--'
}

// Một ô thông tin trong panel chi tiết: nhãn nhỏ màu xám, giá trị in đậm.
function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-bold text-slate-800">{value}</p>
    </div>
  )
}

// Chuẩn hoá tên mức độ từ BE (Red/Yellow/Green hoặc Đỏ/Vàng/Xanh) về một key style.
function levelKey(name?: string | null): 'red' | 'yellow' | 'green' | null {
  const n = (name ?? '').toLowerCase()
  if (n.includes('red') || n.includes('đỏ')) return 'red'
  if (n.includes('yellow') || n.includes('vàng')) return 'yellow'
  if (n.includes('green') || n.includes('xanh')) return 'green'
  return null
}

// Format thời gian đánh giá gần nhất
function formatLastAssessment(datetime?: string | null): string {
  if (!datetime) return 'Chưa đánh giá'

  const now = new Date()
  const assessed = new Date(datetime)
  const diffMs = now.getTime() - assessed.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngày trước`
}

// Check if patient is critical and overdue (RED level + > 2 hours since last assessment)
function isCriticalOverdue(patient: PatientListItem): boolean {
  // Only for RED level patients
  const level = levelKey(patient.level?.name)
  if (level !== 'red') return false

  if (!patient.lastAssessmentTime) return false

  const now = new Date()
  const lastAssessment = new Date(patient.lastAssessmentTime)
  const diffHours = (now.getTime() - lastAssessment.getTime()) / (1000 * 60 * 60)

  return diffHours > 2
}

export function PatientPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null)
  const [pausingPatient, setPausingPatient] = useState<PatientListItem | null>(null)
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())

  // Edit state for inline editing in detail modal
  const [editedPatient, setEditedPatient] = useState<Partial<PatientListItem>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const [operationTypeId, setOperationTypeId] = useState<number | undefined>()
  const [level, setLevel] = useState<string | undefined>()

  const [, setLatestAssessment] = useState<LatestAssessmentResponse | null>(null)
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetailResponse | null>(null)

  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [holdReason, setHoldReason] = useState('')
  const [savingPodLock, setSavingPodLock] = useState(false)
  const [saving, setSaving] = useState(false)

  // POD dropdown state
  const [showPodDropdown, setShowPodDropdown] = useState<string | null>(null) // caseId of patient with open dropdown

  // Modal thêm/sửa + dialog xoá
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientListItem | null>(null)
  const [deletingPatient, setDeletingPatient] = useState<PatientListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function loadPatients() {
      const response = await getPatients({
        operationTypeId,
        level,
        limit: 9999,
      })

      setPatients(response.data)
    }

    loadPatients()
  }, [operationTypeId, level])

  useEffect(() => {
    async function loadOperationTypes() {
      const data = await getOperationTypes()
      setOperationTypes(data)
    }

    loadOperationTypes()
  }, [])

  useEffect(() => {
    if (!selectedPatient) {
      setLatestAssessment(null)
      setAssessmentDetail(null)
      return
    }

    const patientDetail = selectedPatient

    async function loadAssessment() {
      setLatestAssessment(null)
      setAssessmentDetail(null)
      try {
        const latest = await getLatestAssessment(patientDetail.caseId)

        // Nếu không có đánh giá (404 đã được handle trong API function)
        if (!latest) {
          setLatestAssessment(null)
          setAssessmentDetail(null)
          return
        }

        setLatestAssessment(latest)

        const detail = await getAssessmentDetail(latest.assessmentId)

        setAssessmentDetail(detail)
      } catch (error) {
        // Chỉ log lỗi thật sự (không phải 404)
        console.error('Error loading assessment:', error)
      }
    }

    loadAssessment()
  }, [selectedPatient])

  // Click outside to close POD dropdown
  useEffect(() => {
    if (!showPodDropdown) return

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('.pod-dropdown-container')) {
        setShowPodDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showPodDropdown])

  // Reset edit state when modal opens/closes
  useEffect(() => {
    if (selectedPatient) {
      setEditedPatient({})
      setHasChanges(false)
    }
  }, [selectedPatient])

  function getAnswer(questionText: string) {
    return (
      assessmentDetail?.details.find((item) => item.questionText === questionText)?.optionText ??
      '--'
    )
  }

  async function reloadPatients() {
    const response = await getPatients({
      operationTypeId,
      level,
      limit: 9999,
    })

    setPatients(response.data)

    return response.data
  }

  async function handleQuickToggle(patientItem: PatientListItem) {
    if (!patientItem) return

    try {
      await updatePodLock(patientItem.caseId, {
        isLocked: !patientItem.isLocked,
        holdReason: patientItem.isLocked ? undefined : holdReason.trim(),
      })

      const list = await reloadPatients()
      const updated = list.find((p) => p.caseId === patientItem.caseId)

      setSelectedPatient(updated ?? null)
    } catch (error) {
      console.error(error)
    }
  }

  function openPodLockModal() {
    setHoldReason('')
    setShowHoldDialog(true)
  }

  async function handleConfirmPodLock() {
    const targetPatient = pausingPatient || selectedPatient
    if (!targetPatient) return

    if (!holdReason.trim()) {
      alert('Vui lòng nhập lý do giữ POD')
      return
    }

    try {
      setSavingPodLock(true)

      await updatePodLock(targetPatient.caseId, {
        isLocked: true,
        holdReason,
      })

      setShowHoldDialog(false)
      setHoldReason('')
      setPausingPatient(null)

      const list = await reloadPatients()
      const updated = list.find((p) => p.caseId === targetPatient.caseId)

      if (selectedPatient?.caseId === targetPatient.caseId) {
        setSelectedPatient(updated ?? null)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSavingPodLock(false)
    }
  }

  async function handleResumePod() {
    if (!selectedPatient) return

    try {
      setSavingPodLock(true)

      await updatePodLock(selectedPatient.caseId, {
        isLocked: false,
      })

      const list = await reloadPatients()
      const updated = list.find((p) => p.caseId === selectedPatient.caseId)

      setSelectedPatient(updated ?? null)
    } catch (error) {
      console.error(error)
    } finally {
      setSavingPodLock(false)
    }
  }

  async function handleChangePodLevel(caseId: string, newPodLevel: number) {
    try {
      await updatePodLevel(caseId, newPodLevel)

      const list = await reloadPatients()

      // Update selected patient if it's the one being changed
      if (selectedPatient?.caseId === caseId) {
        const updated = list.find((p) => p.caseId === caseId)
        setSelectedPatient(updated ?? null)
      }
    } catch (error) {
      console.error('Error updating POD level:', error)
      alert('Có lỗi xảy ra khi cập nhật POD')
    }
  }

  async function handleArchivePatient(caseId: string) {
    if (!confirm('Bạn có chắc chắn muốn lưu trữ hồ sơ bệnh nhân này?')) return

    try {
      await archivePatient(caseId, true)
      await reloadPatients()
      // Close detail modal if it's the archived patient
      if (selectedPatient?.caseId === caseId) {
        setSelectedPatient(null)
      }
      alert('Đã lưu trữ hồ sơ bệnh nhân thành công')
    } catch (error) {
      console.error('Error archiving patient:', error)
      alert('Có lỗi xảy ra khi lưu trữ hồ sơ')
    }
  }

  // Uncomment when implementing collapsible rooms
  function toggleRoom(room: string) {
    setExpandedRooms((prev) => {
      const next = new Set(prev)
      if (next.has(room)) {
        next.delete(room)
      } else {
        next.add(room)
      }
      return next
    })
  }

  // Render patient card for 2-column compact layout
  function renderPatientCard(patient: PatientListItem, levelColor: 'red' | 'yellow' | 'green') {
    const isOverdue = isCriticalOverdue(patient)
    const isCompleted = patient.erasCompleted

    const borderColor =
      levelColor === 'red' ? 'border-l-red-500' :
        levelColor === 'yellow' ? 'border-l-yellow-500' :
          'border-l-green-500'
    const textColor =
      levelColor === 'red' ? 'text-red-600' :
        levelColor === 'yellow' ? 'text-yellow-600' :
          'text-green-600'
    const badgeBg =
      levelColor === 'red' ? 'bg-red-100' :
        levelColor === 'yellow' ? 'bg-yellow-100' :
          'bg-green-100'

    const handleClick = () => {
      // Allow opening detail modal even for completed patients
      // But editing will be disabled in the modal
      if (selectedPatient?.caseId === patient.caseId) {
        setSelectedPatient(null)
      } else {
        setSelectedPatient(patient)
      }
    }

    return (
      <div
        key={patient.caseId}
        onClick={handleClick}
        className={`patient-card transition-all duration-200 h-full flex flex-col
          ${isCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'}
          rounded-lg border-l-[4px] ${isOverdue && !isCompleted ? 'border-red-600 border-4 animate-pulse-border' : borderColor + ' border-y border-r'} border-slate-200 bg-white
          ${selectedPatient?.caseId === patient.caseId ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'}
          ${isOverdue && !isCompleted ? 'shadow-red-200 shadow-lg' : ''}
        `}
      >
        <div className="p-3 space-y-2 flex-1 flex flex-col">
          {/* POD Badge or Completed Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {isCompleted ? (
                // Completed: Show green badge instead of POD badge
                <span className="flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide bg-green-100 text-green-600 shadow-sm">
                  <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  Hoàn thành ERAS
                </span>
              ) : (
                // Not completed: Show POD badge with optional KHẨN badge
                <>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide ${badgeBg} ${textColor} shadow-sm`}>
                    POD {patient.currentPod} • {patient.operationType?.name || 'N/A'}
                  </span>
                  {isOverdue && (
                    <span className="text-[8px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded-full animate-pulse">
                      KHẨN
                    </span>
                  )}
                </>
              )}
            </div>
            {patient.isLocked && (
              <span className="flex items-center gap-0.5 text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-[10px]">lock</span>
              </span>
            )}
          </div>

          {/* Patient Name & ID */}
          <div>
            <h4 className={`text-sm font-bold truncate leading-tight ${isOverdue && !isCompleted ? 'text-red-700' : 'text-slate-800'}`}>
              {patientName(patient)}
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              Mã: {patient.caseId || '--'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50">
            <div className="flex items-center gap-1.5">
              {/* POD Decrease Button */}
              <div className="relative pod-dropdown-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPodDropdown(showPodDropdown === patient.caseId ? null : patient.caseId)
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center shadow-sm transition-all bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                  title="Giảm POD"
                >
                  <span className="material-symbols-outlined text-[16px] pointer-events-none">arrow_back</span>
                </button>

                {/* POD Dropdown */}
                {showPodDropdown === patient.caseId && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 min-w-[90px]">
                    {Array.from({ length: patient.currentPod }, (_, i) => i).map((pod) => (
                      <button
                        key={pod}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleChangePodLevel(patient.caseId, pod)
                          setShowPodDropdown(null)
                        }}
                        className="w-full px-2 py-1.5 text-left text-xs font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-700 cursor-pointer"
                      >
                        <span className="pointer-events-none flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                          POD {pod}
                        </span>
                      </button>
                    ))}
                    {patient.currentPod === 0 && (
                      <div className="px-2 py-1.5 text-[9px] text-slate-400 italic text-center">
                        Không có POD nhỏ hơn
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pause/Continue Button OR Archive Button */}
              {isCompleted ? (
                /* Archive Button - Replace pause button for completed patients */
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleArchivePatient(patient.caseId)
                  }}
                  className="w-7 h-7 rounded-md flex items-center justify-center shadow-sm transition-all bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md"
                  title="Lưu trữ hồ sơ"
                >
                  <span className="material-symbols-outlined text-[16px] pointer-events-none">archive</span>
                </button>
              ) : (
                /* Pause/Continue Button - For active patients */
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (patient.isLocked) {
                      handleQuickToggle(patient)
                    } else {
                      setPausingPatient(patient)
                      setShowHoldDialog(true)
                    }
                  }}
                  className={`w-7 h-7 rounded-md flex items-center justify-center shadow-sm transition-all
                    ${patient.isLocked
                      ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white hover:shadow-md hover:scale-105'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  title={patient.isLocked ? 'Tiếp tục POD' : 'Tạm dừng POD'}
                >
                  <span className="material-symbols-outlined text-[16px] pointer-events-none">
                    {patient.isLocked ? 'play_arrow' : 'pause'}
                  </span>
                </button>
              )}
            </div>

            {/* Last Assessment Time */}
            <div className="flex items-center gap-0.5">
              <span className={`material-symbols-outlined text-[12px] ${isOverdue && !isCompleted ? 'text-red-500' : 'text-slate-400'}`}>schedule</span>
              <span className={`text-[9px] font-medium ${isOverdue && !isCompleted ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                {formatLastAssessment(patient.lastAssessmentTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function handleAddNew() {
    setEditingPatient(null)
    setFormOpen(true)
  }

  // Sau khi thêm/sửa/xoá: nạp lại bảng, đồng bộ panel chi tiết, làm mới KPI.
  async function refreshAfterMutation() {
    const list = await reloadPatients()
    // Cập nhật panel chi tiết theo dữ liệu mới (hoặc đóng nếu bản ghi đã biến mất).
    if (selectedPatient) {
      const updated = list.find((p) => p.caseId === selectedPatient.caseId)
      setSelectedPatient(updated ?? null)
    }
    queryClient.invalidateQueries({ queryKey: ['patients', 'stats'] })
  }

  // Inject toolbar into header - wrap in useMemo to prevent infinite loop
  const headerActions = useMemo(
    () => (
      <>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="text-sm">Thêm mới</span>
        </button>

        <PatientSearchBar patients={patients} onSelect={setSelectedPatient} />

        <select
          value={operationTypeId ?? ''}
          onChange={(e) => setOperationTypeId(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <option value="">Loại phẫu thuật</option>
          {operationTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>

        <select
          value={level ?? ''}
          onChange={(e) => setLevel(e.target.value || undefined)}
          className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <option value="">Mức độ</option>
          <option value="Red">Đỏ</option>
          <option value="Yellow">Vàng</option>
          <option value="Green">Xanh</option>
        </select>
      </>
    ),
    [patients, operationTypeId, level, operationTypes]
  )

  useHeaderActions(headerActions)

  async function confirmDelete() {
    if (!deletingPatient?.account) return
    try {
      setDeleting(true)
      await deletePatient(deletingPatient.account.id)
      if (selectedPatient?.caseId === deletingPatient.caseId) setSelectedPatient(null)
      setDeletingPatient(null)
      await refreshAfterMutation()
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  function handleFieldChange(field: keyof PatientListItem, value: unknown) {
    setEditedPatient((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  async function handleSaveChanges() {
    if (!selectedPatient?.account || !hasChanges) return

    try {
      setSaving(true)
      await updatePatient(selectedPatient.account.id, editedPatient as UpdatePatientPayload)

      const list = await reloadPatients()
      const updated = list.find((p) => p.caseId === selectedPatient.caseId)
      setSelectedPatient(updated ?? null)
      setEditedPatient({})
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Có lỗi xảy ra khi lưu thay đổi')
    } finally {
      setSaving(false)
    }
  }

  function getDisplayValue<T>(field: keyof PatientListItem, originalValue: T): T {
    return (editedPatient[field] as T) ?? originalValue
  }

  return (
    <div className="p-8 space-y-8">
      {/* Main content */}
      <div className="space-y-10 pb-12">
        {/* Patient Cards - Table Layout by Room */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header - 3 Main Levels with 2 columns each */}
          <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-red-600">{patients.filter(p => levelKey(p.level?.name) === 'red').length}</span>
              <div className="w-1 h-4 bg-slate-300"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide">Nguy cơ cao</h3>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-yellow-600">{patients.filter(p => levelKey(p.level?.name) === 'yellow').length}</span>
              <div className="w-1 h-4 bg-slate-300"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-yellow-600 uppercase tracking-wide">Cần theo dõi</h3>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-bold text-green-600">{patients.filter(p => levelKey(p.level?.name) === 'green').length}</span>
              <div className="w-1 h-4 bg-slate-300"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="text-sm font-bold text-green-600 uppercase tracking-wide">Ổn định</h3>
            </div>
          </div>

          {/* Rooms - Each room is a row */}
          {Object.entries(
            patients.reduce((acc, patient) => {
              const room = patient.roomBed?.split('/')[0] || 'Chưa phân phòng'
              if (!acc[room]) acc[room] = []
              acc[room].push(patient)
              return acc
            }, {} as Record<string, PatientListItem[]>)
          ).map(([room, roomPatients]) => {
            const isOpen = expandedRooms.has(room)

            // Sort: Completed patients go to the end
            const sortedRoomPatients = [...roomPatients].sort((a, b) => {
              if (a.erasCompleted === b.erasCompleted) return 0
              return a.erasCompleted ? 1 : -1
            })

            const redPatients = sortedRoomPatients.filter((p) => levelKey(p.level?.name) === 'red')
            const yellowPatients = sortedRoomPatients.filter((p) => levelKey(p.level?.name) === 'yellow')
            const greenPatients = sortedRoomPatients.filter((p) => levelKey(p.level?.name) === 'green')

            return (
              <div key={room} className="border-b border-slate-200 last:border-b-0">
                {/* Room Header - Collapsible */}
                <button
                  onClick={() => toggleRoom(room)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? '' : '-rotate-90'}`}>
                      expand_more
                    </span>
                    <h4 className="text-base font-bold tracking-tight text-slate-800">{room}</h4>
                    <div className="flex items-center gap-2">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {redPatients.length}
                      </span>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {yellowPatients.length}
                      </span>
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {greenPatients.length}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      {redPatients.length > 0 && (
                        <div
                          className="bg-red-500 h-full"
                          style={{ width: `${(redPatients.length / roomPatients.length) * 100}%` }}
                        />
                      )}
                      {yellowPatients.length > 0 && (
                        <div
                          className="bg-yellow-500 h-full"
                          style={{ width: `${(yellowPatients.length / roomPatients.length) * 100}%` }}
                        />
                      )}
                      {greenPatients.length > 0 && (
                        <div
                          className="bg-green-500 h-full"
                          style={{ width: `${(greenPatients.length / roomPatients.length) * 100}%` }}
                        />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 min-w-[4rem] text-right">
                      {roomPatients.length} BN
                    </span>
                  </div>
                </button>

                {/* Room Content - Dynamic columns based on levels with patients */}
                {isOpen && (() => {
                  // Count how many levels have patients
                  const activeLevels = [
                    redPatients.length > 0,
                    yellowPatients.length > 0,
                    greenPatients.length > 0
                  ].filter(Boolean).length;

                  // Dynamic grid classes based on active levels
                  const gridClass = activeLevels === 1 ? 'grid-cols-1' :
                    activeLevels === 2 ? 'grid-cols-2' :
                      'grid-cols-3';

                  return (
                    <div className={`grid ${gridClass} gap-4 p-4 bg-white`}>
                      {/* RED Section - Only show if has patients */}
                      {redPatients.length > 0 && (
                        <div className="bg-red-50/80 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-xs font-bold text-red-700">Nguy cơ cao</span>
                            </div>
                            <span className="text-xs font-bold text-red-700">{redPatients.length}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {/* RED Column 1 */}
                            <div className="space-y-2">
                              {redPatients.slice(0, Math.ceil(redPatients.length / 2)).map((patient) => renderPatientCard(patient, 'red'))}
                            </div>
                            {/* RED Column 2 */}
                            <div className="space-y-2">
                              {redPatients.slice(Math.ceil(redPatients.length / 2)).map((patient) => renderPatientCard(patient, 'red'))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* YELLOW Section - Only show if has patients */}
                      {yellowPatients.length > 0 && (
                        <div className="bg-yellow-50/80 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              <span className="text-xs font-bold text-yellow-700">Cần theo dõi</span>
                            </div>
                            <span className="text-xs font-bold text-yellow-700">{yellowPatients.length}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {/* YELLOW Column 1 */}
                            <div className="space-y-2">
                              {yellowPatients.slice(0, Math.ceil(yellowPatients.length / 2)).map((patient) => renderPatientCard(patient, 'yellow'))}
                            </div>
                            {/* YELLOW Column 2 */}
                            <div className="space-y-2">
                              {yellowPatients.slice(Math.ceil(yellowPatients.length / 2)).map((patient) => renderPatientCard(patient, 'yellow'))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* GREEN Section - Only show if has patients */}
                      {greenPatients.length > 0 && (
                        <div className="bg-green-50/80 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs font-bold text-green-700">Ổn định</span>
                            </div>
                            <span className="text-xs font-bold text-green-700">{greenPatients.length}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {/* GREEN Column 1 */}
                            <div className="space-y-2">
                              {greenPatients.slice(0, Math.ceil(greenPatients.length / 2)).map((patient) => renderPatientCard(patient, 'green'))}
                            </div>
                            {/* GREEN Column 2 */}
                            <div className="space-y-2">
                              {greenPatients.slice(Math.ceil(greenPatients.length / 2)).map((patient) => renderPatientCard(patient, 'green'))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )
          })}

          {Object.keys(
            patients.reduce((acc, patient) => {
              const room = patient.roomBed?.split('/')[0] || 'Chưa phân phòng'
              acc[room] = true
              return acc
            }, {} as Record<string, boolean>)
          ).length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <span className="material-symbols-outlined text-[48px] mb-2">inbox</span>
                <p className="text-sm">Không có bệnh nhân nào</p>
              </div>
            )}
        </div>
      </div>

      {/* Patient Detail Popup Modal with Inline Editing */}
      {selectedPatient && (() => {
        // Disable editing for completed or archived patients
        const isReadOnly = selectedPatient.erasCompleted || selectedPatient.isArchived

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelectedPatient(null)}>
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-800 text-slate-800">
                    <span className="material-symbols-outlined text-[26px]">person</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{patientName(selectedPatient)}</p>
                    <p className="text-sm text-slate-500">
                      Mã: <span className="font-semibold text-slate-700">{selectedPatient.caseId}</span>
                      <span className="ml-4 font-semibold text-slate-700">POD {selectedPatient.currentPod}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Show readonly badge for completed/archived patients */}
                  {isReadOnly && (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-700 border border-amber-200">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      <span className="font-medium">Chỉ xem</span>
                    </div>
                  )}

                  {/* Only show save and delete buttons if not readonly */}
                  {!isReadOnly && hasChanges && (
                    <button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  )}
                  {!isReadOnly && (
                    <button
                      onClick={() => setDeletingPatient(selectedPatient)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors"
                      title="Xoá"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    title="Đóng">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Content — fieldset disabled sẽ vô hiệu mọi input/select khi hồ sơ chỉ xem */}
              <fieldset disabled={isReadOnly} className="max-h-[calc(90vh-10rem)] overflow-y-auto px-6 py-5 space-y-6 min-w-0 border-0">
                {/* Thông tin bệnh nhân */}
                <div>
                  <h3 className="mb-3 text-base font-bold text-slate-800">Thông tin bệnh nhân</h3>
                  <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-5">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Tuổi</label>
                      <input
                        type="number"
                        value={getDisplayValue('age', selectedPatient.age)}
                        onChange={(e) => handleFieldChange('age', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Giới tính</label>
                      <select
                        value={getDisplayValue('gender', selectedPatient.gender)}
                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Chiều cao (cm)</label>
                      <input
                        type="number"
                        value={getDisplayValue('height', selectedPatient.height) ?? ''}
                        onChange={(e) => handleFieldChange('height', e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Cân nặng (kg)</label>
                      <input
                        type="number"
                        value={getDisplayValue('weight', selectedPatient.weight) ?? ''}
                        onChange={(e) => handleFieldChange('weight', e.target.value ? Number(e.target.value) : null)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">BMI</label>
                      <input
                        type="text"
                        value={displayValue(selectedPatient.bmi)}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Thông tin điều trị */}
                <div>
                  <h3 className="mb-3 text-base font-bold text-slate-800">Thông tin điều trị</h3>
                  <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-5">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Ngày phẫu thuật</label>
                      <input
                        type="date"
                        value={getDisplayValue('surgeryDate', selectedPatient.surgeryDate)?.split('T')[0] ?? ''}
                        onChange={(e) => handleFieldChange('surgeryDate', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">POD hiện tại</label>
                      <input
                        type="text"
                        value={`POD ${selectedPatient.currentPod}`}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Buồng/giường</label>
                      <input
                        type="text"
                        value={getDisplayValue('roomBed', selectedPatient.roomBed) ?? ''}
                        onChange={(e) => handleFieldChange('roomBed', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Thông tin phẫu thuật */}
                <div>
                  <h3 className="mb-3 text-base font-bold text-slate-800">Thông tin phẫu thuật</h3>
                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-5">
                    <div className="col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-500">Chẩn đoán</label>
                      <input
                        type="text"
                        value={getDisplayValue('diagnosis', selectedPatient.diagnosis) ?? ''}
                        onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Loại phẫu thuật</label>
                      <select
                        value={getDisplayValue('operationTypeId', selectedPatient.operationTypeId)}
                        onChange={(e) => handleFieldChange('operationTypeId', Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        {operationTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Phương pháp mổ</label>
                      <input
                        type="text"
                        value={getDisplayValue('method', selectedPatient.method) ?? ''}
                        onChange={(e) => handleFieldChange('method', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Có miệng nối tiêu hoá</label>
                      <select
                        value={
                          getDisplayValue('hasGiAnastomosis', selectedPatient.hasGiAnastomosis) == null
                            ? ''
                            : getDisplayValue('hasGiAnastomosis', selectedPatient.hasGiAnastomosis)
                              ? 'true'
                              : 'false'
                        }
                        onChange={(e) =>
                          handleFieldChange(
                            'hasGiAnastomosis',
                            e.target.value === '' ? null : e.target.value === 'true',
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        <option value="">--</option>
                        <option value="true">Có</option>
                        <option value="false">Không</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tóm tắt đánh giá gần nhất */}
                <div>
                  <h3 className="mb-3 text-base font-bold text-slate-800">Tóm tắt đánh giá gần nhất</h3>
                  {assessmentDetail ? (
                    <>
                      <div className="grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-5">
                        <DetailField label="Buồn nôn" value={getAnswer('Bạn có buồn nôn không?')} />
                        <DetailField label="Số lần nôn" value={getAnswer('Bạn có nôn nhiều không?')} />
                        <DetailField label="Chướng bụng" value={getAnswer('Bạn có chướng bụng không?')} />
                        <DetailField label="Ăn uống" value={getAnswer('Bạn ăn được bao nhiêu?')} />
                        <DetailField label="Trung tiện" value={getAnswer('Bạn đã trung tiện chưa?')} />
                        <DetailField label="Tổng điểm" value={`${assessmentDetail.totalScore} ĐIỂM`} />
                      </div>
                      <div className="mt-2 text-right">
                        <button className="text-sm font-medium text-blue-600 hover:underline">
                          Xem tất cả đánh giá
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-8 text-center">
                      <div className="mb-3 flex justify-center">
                        <div className="rounded-full bg-slate-200 p-4">
                          <span className="material-symbols-outlined text-[32px] text-slate-400">assignment</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-600">Chưa có đánh giá nào</p>
                      <p className="mt-1 text-xs text-slate-500">Bệnh nhân chưa thực hiện đánh giá lần đầu</p>
                    </div>
                  )}
                </div>

                {/* POD Lock/Unlock — ẩn khi hồ sơ chỉ xem (hoàn thành/lưu trữ) */}
                {!isReadOnly && (
                  <div>
                    <button
                      onClick={selectedPatient.isLocked ? handleResumePod : openPodLockModal}
                      disabled={savingPodLock}
                      className={`w-full rounded-lg px-4 py-3 font-semibold text-white transition-colors
                    ${selectedPatient.isLocked
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                        }
                    disabled:opacity-60
                  `}
                    >
                      {savingPodLock
                        ? 'Đang xử lý...'
                        : selectedPatient.isLocked
                          ? 'Tiếp tục POD'
                          : 'Giữ POD hiện tại'}
                    </button>
                  </div>
                )}
              </fieldset>
            </div>
          </div>
        )
      })()}

      {/* Hold POD Dialog */}
      {showHoldDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-[500px] rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">Giữ POD hiện tại</h2>

            <p className="mb-3 text-sm text-slate-600">Nhập lý do giữ POD</p>

            <textarea
              value={holdReason}
              onChange={(e) => setHoldReason(e.target.value)}
              rows={4}
              className="w-full rounded border p-3"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowHoldDialog(false)}
                className="rounded border px-4 py-2"
              >
                Huỷ
              </button>

              <button
                onClick={handleConfirmPodLock}
                disabled={savingPodLock}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm / sửa hồ sơ bệnh án */}
      <PatientFormModal
        isOpen={formOpen}
        patient={editingPatient}
        operationTypes={operationTypes}
        onClose={() => setFormOpen(false)}
        onSaved={refreshAfterMutation}
      />

      {/* Dialog xác nhận Xoá */}
      {deletingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <p className="mb-8 text-center text-base font-medium text-slate-800">
              Bạn có chắc chắn muốn xoá hồ sơ bệnh án này không?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeletingPatient(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-200 bg-slate-50 px-8 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                Huỷ
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-700 px-8 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deleting ? 'Đang xoá...' : 'Xác nhận Xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



