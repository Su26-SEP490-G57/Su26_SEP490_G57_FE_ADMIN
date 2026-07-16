import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import {
  deletePatient,
  getAssessmentDetail,
  getLatestAssessment,
  getOperationTypes,
  getPatients,
  updatePodLevel,
  updatePodLock,
  usePatientStats,
} from '../api/patientApi'
import { PatientFormModal } from '../components/PatientFormModal'
import type {
  AssessmentDetailResponse,
  LatestAssessmentResponse,
  OperationType,
  PatientListItem,
} from '../types'

function displayValue<T>(value: T | null | undefined) {
  return value ?? '--'
}

// Tên hiển thị của bệnh nhân: ưu tiên fullName của tài khoản liên kết.
function patientName(p: {
  account?: { fullName?: string | null } | null
  fullName?: string | null
  nameInitials?: string | null
}) {
  return p.fullName ?? p.account?.fullName ?? p.nameInitials ?? '--'
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

export function PatientPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [operationTypeId, setOperationTypeId] = useState<number | undefined>()
  const [level, setLevel] = useState<string | undefined>()
  const [page, setPage] = useState(1)

  const limit = 10
  const [total, setTotal] = useState(0)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // KPI thật từ GET /patients (tổng + phân bố theo mức độ).
  const { data: stats } = usePatientStats()
  const totalPatients = stats?.total ?? 0
  const greenCount = stats?.byLevel.Green ?? 0
  const yellowCount = stats?.byLevel.Yellow ?? 0
  const redCount = stats?.byLevel.Red ?? 0

  const [, setLatestAssessment] = useState<LatestAssessmentResponse | null>(null)
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetailResponse | null>(null)

  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [holdReason, setHoldReason] = useState('')
  const [savingPodLock, setSavingPodLock] = useState(false)

  // POD dropdown state
  const [showPodDropdown, setShowPodDropdown] = useState<string | null>(null) // caseId of patient with open dropdown

  // Modal thêm/sửa + dialog xoá
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientListItem | null>(null)
  const [deletingPatient, setDeletingPatient] = useState<PatientListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const clearSelectedPatient = () => {
    setSelectedPatient(null)
    setLatestAssessment(null)
    setAssessmentDetail(null)
  }

  const selectPatient = (patient: PatientListItem | null) => {
    setSelectedPatient(patient)
    if (!patient) {
      setLatestAssessment(null)
      setAssessmentDetail(null)
      return
    }

    setLatestAssessment(null)
    setAssessmentDetail(null)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    async function loadPatients() {
      const response = await getPatients({
        search,
        operationTypeId,
        level,
        page,
        limit,
      })

      setSelectedPatient(null)
      setPatients(response.data)
      setTotal(response.total)
    }

    loadPatients()
  }, [search, operationTypeId, level, page])

  useEffect(() => {
    async function loadOperationTypes() {
      const data = await getOperationTypes()
      setOperationTypes(data)
    }

    loadOperationTypes()
  }, [])

  useEffect(() => {
    if (!selectedPatient) {
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

  // Click outside to close side panel
  useEffect(() => {
    if (!selectedPatient) return

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement

      // Check if click is inside a patient card or the side panel
      const isPatientCard = target.closest('.patient-card')
      const isSidePanel = target.closest('.patient-side-panel')

      // Close panel if click is outside both
      if (!isPatientCard && !isSidePanel) {
        clearSelectedPatient()
      }
    }

    // Add small delay to avoid immediate closing when opening panel
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
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

  function getAnswer(questionText: string) {
    return (
      assessmentDetail?.details.find((item) => item.questionText === questionText)?.optionText ??
      '--'
    )
  }

  async function reloadPatients() {
    const response = await getPatients({
      search,
      operationTypeId,
      level,
      page,
      limit,
    })

    setPatients(response.data)
    setTotal(response.total)

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

      selectPatient(updated ?? null)
    } catch (error) {
      console.error(error)
    }
  }

  function openPodLockModal() {
    setHoldReason('')
    setShowHoldDialog(true)
  }

  async function handleConfirmPodLock() {
    if (!selectedPatient) return

    if (!holdReason.trim()) {
      alert('Vui lòng nhập lý do giữ POD')
      return
    }

    try {
      setSavingPodLock(true)

      await updatePodLock(selectedPatient.caseId, {
        isLocked: true,
        holdReason,
      })

      setShowHoldDialog(false)
      setHoldReason('')

      const list = await reloadPatients()
      const updated = list.find((p) => p.caseId === selectedPatient.caseId)

      selectPatient(updated ?? null)
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

      const response = await getPatients({
        search,
        operationTypeId,
        level,
        page,
        limit,
      })

      setPatients(response.data)
      setTotal(response.total)

      const updated = response.data.find((p) => p.caseId === selectedPatient.caseId)

      selectPatient(updated ?? null)
    } catch (error) {
      console.error(error)
    } finally {
      setSavingPodLock(false)
    }
  }

  async function handleChangePodLevel(caseId: string, newPodLevel: number) {
    try {
      await updatePodLevel(caseId, newPodLevel)

      // Reload patient list to get updated data
      const response = await getPatients({
        search,
        operationTypeId,
        level,
        page,
        limit,
      })

      setPatients(response.data)
      setTotal(response.total)

      // Update selected patient if it's the one being changed
      if (selectedPatient?.caseId === caseId) {
        const updated = response.data.find((p) => p.caseId === caseId)
        selectPatient(updated ?? null)
      }
    } catch (error) {
      console.error('Error updating POD level:', error)
      alert('Có lỗi xảy ra khi cập nhật POD')
    }
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
      selectPatient(updated ?? null)
    }
    queryClient.invalidateQueries({ queryKey: ['patients', 'stats'] })
  }

  async function confirmDelete() {
    if (!deletingPatient?.account) return
    try {
      setDeleting(true)
      await deletePatient(deletingPatient.account.id)
      if (selectedPatient?.caseId === deletingPatient.caseId) clearSelectedPatient()
      setDeletingPatient(null)
      await refreshAfterMutation()
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tổng số */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:border-blue-600/30 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
          </div>
          <span className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">
            Tổng số
          </span>
          <span className="text-3xl font-extrabold my-0.5">{totalPatients}</span>
          <span className="text-[11px] text-blue-600 font-semibold">Đang theo dõi</span>
        </div>
        {/* GREEN */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:border-green-600/30 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-green-50 text-green-600">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <span className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">
            Ổn định
          </span>
          <span className="text-3xl font-extrabold my-0.5">{greenCount}</span>
          <span className="text-[11px] text-green-600 font-semibold">Bình thường</span>
        </div>
        {/* YELLOW */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:border-yellow-500/30 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>
          <span className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">
            Theo dõi
          </span>
          <span className="text-3xl font-extrabold my-0.5">{yellowCount}</span>
          <span className="text-[11px] text-yellow-600 font-semibold">Cần lưu ý</span>
        </div>
        {/* RED */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col group hover:border-red-600/30 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <span className="material-symbols-outlined text-[20px]">emergency</span>
            </div>
          </div>
          <span className="text-[12px] text-slate-500 font-bold uppercase tracking-wider">
            Nguy cơ
          </span>
          <span className="text-3xl font-extrabold my-0.5 text-red-600">{redCount}</span>
          <span className="text-[11px] text-red-600 font-semibold">Khẩn cấp</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-white/60 p-4 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={handleAddNew}
          className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-2.5 font-semibold hover:opacity-90 shadow-md transition-all active:scale-95 flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[22px]">add</span>
          Thêm
        </button>

        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã số, hoặc phòng..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 focus:ring-4 focus:ring-black/5 focus:border-black outline-none text-sm transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={operationTypeId ?? ''}
              onChange={(e) => {
                setOperationTypeId(e.target.value ? Number(e.target.value) : undefined)
                setPage(1)
              }}
              className="bg-white border border-slate-200 px-5 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap appearance-none pr-10"
            >
              <option value="">Loại phẫu thuật</option>
              {operationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500 pointer-events-none">
              expand_more
            </span>
          </div>

          <div className="relative">
            <select
              value={level ?? ''}
              onChange={(e) => {
                setLevel(e.target.value || undefined)
                setPage(1)
              }}
              className="bg-white border border-slate-200 px-5 py-3 rounded-xl flex items-center gap-3 text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap appearance-none pr-10"
            >
              <option value="">Phòng</option>
              <option value="Red">Đỏ</option>
              <option value="Yellow">Vàng</option>
              <option value="Green">Xanh</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500 pointer-events-none">
              filter_alt
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-4">
        <div
          className={`space-y-10 pb-12 transition-all duration-300
            ${selectedPatient ? 'w-3/5' : 'w-full'}
            `}
        >
          {/* Patient Cards grouped by room */}
          {Object.entries(
            patients.reduce(
              (acc, patient) => {
                const room = patient.roomBed?.split('/')[0] || 'Chưa phân phòng'
                if (!acc[room]) acc[room] = []
                acc[room].push(patient)
                return acc
              },
              {} as Record<string, PatientListItem[]>,
            ),
          ).map(([room, roomPatients]) => (
            <section key={room}>
              <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-extrabold tracking-tight">{room}</h3>
                  <span className="bg-slate-100 px-2.5 py-0.5 rounded-full text-[12px] font-bold text-slate-600">
                    {roomPatients.length} người bệnh
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {roomPatients.map((patient) => {
                  const lKey = levelKey(patient.level?.name)
                  const borderColor =
                    lKey === 'red'
                      ? 'border-l-red-500'
                      : lKey === 'yellow'
                        ? 'border-l-yellow-400'
                        : 'border-l-green-500'
                  const bgColor =
                    lKey === 'red'
                      ? 'bg-red-50'
                      : lKey === 'yellow'
                        ? 'bg-yellow-50'
                        : 'bg-green-50'
                  const textColor =
                    lKey === 'red'
                      ? 'text-red-600'
                      : lKey === 'yellow'
                        ? 'text-yellow-600'
                        : 'text-green-600'

                  return (
                    <div
                      key={patient.caseId}
                      onClick={() => {
                        if (selectedPatient?.caseId === patient.caseId) {
                          selectPatient(null)
                        } else {
                          selectPatient(patient)
                        }
                      }}
                      className={`patient-card cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                        bg-white rounded-2xl border-l-4 ${borderColor} border-y border-r border-slate-200 shadow-sm
                        ${selectedPatient?.caseId === patient.caseId ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span
                                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${bgColor} ${textColor}`}
                              >
                                POD {patient.currentPod} • {patient.operationType?.name || '--'}
                              </span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-800 truncate">
                              {patientName(patient)}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Mã: {patient.caseId}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="relative pod-dropdown-container">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowPodDropdown(
                                    showPodDropdown === patient.caseId ? null : patient.caseId,
                                  )
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
                                title="Chọn POD"
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  arrow_back
                                </span>
                              </button>

                              {/* POD Dropdown */}
                              {showPodDropdown === patient.caseId && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 min-w-[120px]">
                                  {Array.from({ length: patient.currentPod }, (_, i) => i).map(
                                    (pod) => (
                                      <button
                                        key={pod}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleChangePodLevel(patient.caseId, pod)
                                          setShowPodDropdown(null)
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors text-slate-700 cursor-pointer"
                                      >
                                        POD {pod}
                                      </button>
                                    ),
                                  )}
                                  {patient.currentPod === 0 && (
                                    <div className="px-4 py-2 text-xs text-slate-400 italic">
                                      Không có POD nhỏ hơn
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (patient.isLocked) {
                                  handleQuickToggle(patient)
                                } else {
                                  selectPatient(patient)
                                  setShowHoldDialog(true)
                                }
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all
                                ${
                                  patient.isLocked
                                    ? 'bg-black text-white hover:scale-110 border-2 border-white'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                                }`}
                              title={patient.isLocked ? 'Tiếp tục POD' : 'Giữ POD hiện tại'}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {patient.isLocked ? 'play_arrow' : 'pause'}
                              </span>
                            </button>
                          </div>

                          <span className="text-[12px] font-medium text-slate-500 italic">
                            Đánh giá: {formatLastAssessment(patient.lastAssessmentTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-slate-500">Tổng {total} bệnh nhân</p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50 hover:bg-slate-50"
              >
                ←
              </button>
              <span className="text-sm font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-slate-200 px-4 py-2 disabled:opacity-50 hover:bg-slate-50"
              >
                →
              </button>
            </div>
          </div>
        </div>
        {selectedPatient && (
          <div className="patient-side-panel sticky top-6 max-h-[calc(100vh-7rem)] w-2/5 self-start overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm hide-scrollbar">
            <div>
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-800 text-slate-800">
                    <span className="material-symbols-outlined text-[26px]">person</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">
                      {patientName(selectedPatient)}
                    </p>
                    <p className="text-sm text-slate-500">
                      Mã:{' '}
                      <span className="font-semibold text-slate-700">{selectedPatient.caseId}</span>
                      <span className="ml-4 font-semibold text-slate-700">
                        POD {selectedPatient.currentPod}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500">
                  <button
                    onClick={() => {
                      setEditingPatient(selectedPatient)
                      setFormOpen(true)
                    }}
                    className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-blue-600"
                    title="Sửa"
                  >
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    onClick={() => setDeletingPatient(selectedPatient)}
                    className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-red-600"
                    title="Xoá"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                  <button
                    onClick={() => clearSelectedPatient()}
                    className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-slate-700"
                    title="Đóng"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Thông tin bệnh nhân */}
              <h3 className="mb-3 text-lg font-bold text-slate-800">Thông tin bệnh nhân</h3>
              <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-slate-50 p-5">
                <DetailField label="Tuổi" value={displayValue(selectedPatient.age)} />
                <DetailField label="Giới tính" value={displayValue(selectedPatient.gender)} />
                <DetailField
                  label="Chiều cao"
                  value={`${displayValue(selectedPatient.height)} cm`}
                />
                <DetailField
                  label="Cân nặng"
                  value={`${displayValue(selectedPatient.weight)} kg`}
                />
                <DetailField label="BMI" value={displayValue(selectedPatient.bmi)} />
              </div>

              {/* Thông tin điều trị */}
              <h3 className="mb-3 text-lg font-bold text-slate-800">Thông tin điều trị</h3>
              <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-slate-50 p-5">
                <DetailField
                  label="Ngày phẫu thuật"
                  value={displayValue(selectedPatient.surgeryDate)}
                />
                <DetailField label="POD hiện tại" value={`POD ${selectedPatient.currentPod}`} />
                <DetailField label="Buồng/giường" value={displayValue(selectedPatient.roomBed)} />
              </div>

              {/* Thông tin phẫu thuật */}
              <h3 className="mb-3 text-lg font-bold text-slate-800">Thông tin phẫu thuật</h3>
              <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-slate-50 p-5">
                <DetailField label="Chẩn đoán" value={displayValue(selectedPatient.diagnosis)} />
                <DetailField
                  label="Loại phẫu thuật"
                  value={selectedPatient.operationType?.name ?? '--'}
                />
                <DetailField label="Phương pháp mổ" value={displayValue(selectedPatient.method)} />
                <DetailField
                  label="Có miệng nối tiêu hoá"
                  value={
                    selectedPatient.hasGiAnastomosis == null
                      ? '--'
                      : selectedPatient.hasGiAnastomosis
                        ? 'Có'
                        : 'Không'
                  }
                />
              </div>

              {/* Tóm tắt đánh giá gần nhất */}
              <h3 className="mb-3 text-lg font-bold text-slate-800">Tóm tắt đánh giá gần nhất</h3>
              {assessmentDetail ? (
                <>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-slate-50 p-5">
                    <DetailField label="Buồn nôn" value={getAnswer('Bạn có buồn nôn không?')} />
                    <DetailField label="Số lần nôn" value={getAnswer('Bạn có nôn nhiều không?')} />
                    <DetailField
                      label="Chướng bụng"
                      value={getAnswer('Bạn có chướng bụng không?')}
                    />
                    <DetailField label="Ăn uống" value={getAnswer('Bạn ăn được bao nhiêu?')} />
                    <DetailField label="Trung tiện" value={getAnswer('Bạn đã trung tiện chưa?')} />
                    <DetailField label="Tổng" value={`${assessmentDetail.totalScore} ĐIỂM`} />
                  </div>
                  <div className="mb-6 mt-2 text-right">
                    <button className="text-sm font-medium text-blue-600 hover:underline">
                      Xem tất cả đánh giá
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-6 rounded-xl bg-slate-50 p-8 text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="rounded-full bg-slate-200 p-4">
                      <span className="material-symbols-outlined text-[32px] text-slate-400">
                        assignment
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600">Chưa có đánh giá nào</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Bệnh nhân chưa thực hiện đánh giá lần đầu
                  </p>
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={selectedPatient.isLocked ? handleResumePod : openPodLockModal}
                  disabled={savingPodLock}
                  className={`w-full rounded-lg px-4 py-3 font-semibold text-white
                      ${
                        selectedPatient.isLocked
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }
                    `}
                >
                  {savingPodLock
                    ? 'Đang xử lý...'
                    : selectedPatient.isLocked
                      ? 'Tiếp tục POD'
                      : 'Giữ POD hiện tại'}
                </button>
              </div>

              {showHoldDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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
                        Hủy
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
            </div>
          </div>
        )}
      </div>

      {/* Modal thêm / sửa hồ sơ bệnh án */}
      <PatientFormModal
        isOpen={formOpen}
        patient={editingPatient}
        operationTypes={operationTypes}
        onClose={() => setFormOpen(false)}
        onSaved={refreshAfterMutation}
      />

      {/* Dialog xác nhận xoá */}
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
                {deleting ? 'Đang xoá...' : 'Xác nhận xoá'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
