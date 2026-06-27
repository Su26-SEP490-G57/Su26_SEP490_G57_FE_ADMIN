import type {
  AssessmentDetailResponse,
  LatestAssessmentResponse,
  PatientListItem,
  OperationType,
} from '../types'
import { useState, useEffect, type ReactNode } from 'react'
import {
  getPatients,
  getLatestAssessment,
  getAssessmentDetail,
  getOperationTypes,
  updatePodLock,
  deletePatient,
  usePatientStats,
} from '../api/patientApi'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import { PatientFormModal } from '../components/PatientFormModal'

function displayValue<T>(value: T | null | undefined) {
  return value ?? '--'
}

// Tên hiển thị của bệnh nhân: ưu tiên fullName của tài khoản liên kết.
function patientName(p: { account?: { fullName?: string | null } | null; name_initials?: string | null }) {
  return p.account?.fullName ?? p.name_initials ?? '--'
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
type LevelKey = 'red' | 'yellow' | 'green'
function levelKey(name?: string | null): LevelKey | null {
  const n = (name ?? '').toLowerCase()
  if (n.includes('red') || n.includes('đỏ')) return 'red'
  if (n.includes('yellow') || n.includes('vàng')) return 'yellow'
  if (n.includes('green') || n.includes('xanh')) return 'green'
  return null
}

const LEVEL_BADGE: Record<LevelKey, { cls: string; label: string }> = {
  red: { cls: 'bg-red-500', label: 'Đỏ' },
  yellow: { cls: 'bg-yellow-400', label: 'Vàng' },
  green: { cls: 'bg-green-500', label: 'Xanh' },
}

function LevelBadge({ name }: { name?: string | null }) {
  const key = levelKey(name)
  if (!key) return <span className="text-slate-400">--</span>
  const { cls, label } = LEVEL_BADGE[key]
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${cls}`}>{label}</span>
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
  const pct = (n: number) => (totalPatients > 0 ? ((n / totalPatients) * 100).toFixed(1) : '0.0')

  const [, setLatestAssessment] = useState<LatestAssessmentResponse | null>(null)
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetailResponse | null>(null)

  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [holdReason, setHoldReason] = useState('')
  const [savingPodLock, setSavingPodLock] = useState(false)

  // Modal thêm/sửa + dialog xoá
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientListItem | null>(null)
  const [deletingPatient, setDeletingPatient] = useState<PatientListItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [openMenu, setOpenMenu] = useState<string | null>(null)
  useEffect(() => {
    setPage(1)
  }, [search, operationTypeId, level])

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
      setLatestAssessment(null)
      setAssessmentDetail(null)
      return
    }

    const patientDetail = selectedPatient

    async function loadAssessment() {
      setLatestAssessment(null)
      setAssessmentDetail(null)
      try {
        const latest = await getLatestAssessment(patientDetail.case_id)

        setLatestAssessment(latest)

        const detail = await getAssessmentDetail(latest.assessment_id)

        setAssessmentDetail(detail)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setLatestAssessment(null)
          setAssessmentDetail(null)
          return
        }

        console.error(error)
      }
    }

    loadAssessment()
  }, [selectedPatient])

  useEffect(() => {
    function closeMenu() {
      setOpenMenu(null)
    }

    window.addEventListener('click', closeMenu)

    return () => window.removeEventListener('click', closeMenu)
  }, [])

  function getAnswer(questionText: string) {
    return (
      assessmentDetail?.details.find((item) => item.question_text === questionText)?.option_text ??
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
      await updatePodLock(patientItem.case_id, {
        isLocked: !patientItem.is_locked,
        holdReason: patientItem.is_locked ? undefined : holdReason.trim(),
      })

      const list = await reloadPatients()
      const updated = list.find((p) => p.case_id === patientItem.case_id)

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
    if (!selectedPatient) return

    if (!holdReason.trim()) {
      alert('Vui lòng nhập lý do giữ POD')
      return
    }

    try {
      setSavingPodLock(true)

      await updatePodLock(selectedPatient.case_id, {
        isLocked: true,
        holdReason,
      })

      setShowHoldDialog(false)
      setHoldReason('')

      const list = await reloadPatients()
      const updated = list.find((p) => p.case_id === selectedPatient.case_id)

      setSelectedPatient(updated ?? null)
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

      await updatePodLock(selectedPatient.case_id, {
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

      const updated = response.data.find((p) => p.case_id === selectedPatient.case_id)

      setSelectedPatient(updated ?? null)
    } catch (error) {
      console.error(error)
    } finally {
      setSavingPodLock(false)
    }
  }

  function toggleMenu(caseId: string) {
    setOpenMenu((prev) => (prev === caseId ? null : caseId))
  }

  function handleAddNew() {
    setEditingPatient(null)
    setFormOpen(true)
  }

  function handleEdit(patient: PatientListItem) {
    setOpenMenu(null)
    setEditingPatient(patient)
    setFormOpen(true)
  }

  function handleDelete(patient: PatientListItem) {
    setOpenMenu(null)
    setDeletingPatient(patient)
  }

  // Sau khi thêm/sửa/xoá: nạp lại bảng, đồng bộ panel chi tiết, làm mới KPI.
  async function refreshAfterMutation() {
    const list = await reloadPatients()
    // Cập nhật panel chi tiết theo dữ liệu mới (hoặc đóng nếu bản ghi đã biến mất).
    if (selectedPatient) {
      const updated = list.find((p) => p.case_id === selectedPatient.case_id)
      setSelectedPatient(updated ?? null)
    }
    queryClient.invalidateQueries({ queryKey: ['patients', 'stats'] })
  }

  async function confirmDelete() {
    if (!deletingPatient?.account) return
    try {
      setDeleting(true)
      await deletePatient(deletingPatient.account.id)
      if (selectedPatient?.case_id === deletingPatient.case_id) setSelectedPatient(null)
      setDeletingPatient(null)
      await refreshAfterMutation()
    } catch (error) {
      console.error(error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Tổng số */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <span className="material-symbols-outlined text-[22px]">group</span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng số người bệnh</p>
            <p className="text-2xl font-bold">{totalPatients}</p>
            <p className="text-[10px] text-blue-600">Đang theo dõi</p>
          </div>
        </div>
        {/* GREEN */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-500">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold text-green-600">XANH</span>
              <span className="text-xl font-bold">{greenCount}</span>
            </div>
            <p className="text-[10px] text-slate-400">{pct(greenCount)}%</p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct(greenCount)}%` }} /></div>
          </div>
        </div>
        {/* YELLOW */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-500">
            <span className="material-symbols-outlined text-[22px]">error</span>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold text-yellow-600">VÀNG</span>
              <span className="text-xl font-bold">{yellowCount}</span>
            </div>
            <p className="text-[10px] text-slate-400">{pct(yellowCount)}%</p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-yellow-400" style={{ width: `${pct(yellowCount)}%` }} /></div>
          </div>
        </div>
        {/* RED */}
        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold text-red-600">ĐỎ</span>
              <span className="text-xl font-bold">{redCount}</span>
            </div>
            <p className="text-[10px] text-slate-400">{pct(redCount)}%</p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-red-500" style={{ width: `${pct(redCount)}%` }} /></div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <button
          onClick={handleAddNew}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          + Thêm mới
        </button>

        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 rounded-lg border bg-white px-4 py-2"
        />

        <select
          value={operationTypeId ?? ''}
          onChange={(e) => setOperationTypeId(e.target.value ? Number(e.target.value) : undefined)}
          className="rounded-lg border bg-white px-4 py-2"
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
          className="rounded-lg border bg-white px-4 py-2"
        >
          <option value="">Mức độ</option>
          <option value="Red">Đỏ</option>
          <option value="Yellow">Vàng</option>
          <option value="Green">Xanh</option>
        </select>
      </div>

      {/* Main content */}
      <div className="flex gap-4">
        <div
          className={`rounded-xl border border-slate-200 bg-white shadow-sm min-h-[600px]
            ${selectedPatient ? 'w-3/5' : 'w-full'}
            `}
        >
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              Danh sách người bệnh
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                {total}
              </span>
            </h3>
          </div>
          <div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mã BN</th>
                  <th className="px-4 py-3">Tên bệnh nhân</th>
                  <th className="px-4 py-3">POD</th>
                  <th className="px-4 py-3">Loại phẫu thuật</th>
                  <th className="px-4 py-3">Mức độ</th>
                  <th className="px-4 py-3">Hành động nhanh</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
              {patients.map((patient) => (
                <tr
                  key={patient.case_id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`
                        cursor-pointer
                        ${
                          selectedPatient?.case_id === patient.case_id
                            ? 'bg-blue-50'
                            : 'hover:bg-slate-50'
                        }
                    `}
                >
                  <td
                    className={`px-4 py-3 font-bold ${
                      levelKey(patient.level?.name) === 'red'
                        ? 'text-red-500'
                        : levelKey(patient.level?.name) === 'yellow'
                          ? 'text-yellow-500'
                          : 'text-slate-700'
                    }`}
                  >
                    {patient.case_id}
                  </td>
                  <td className="px-4 py-3">{patientName(patient)}</td>
                  <td className="px-4 py-3">POD {patient.current_pod}</td>
                  <td className="px-4 py-3 text-xs">{patient.operationType?.name}</td>
                  <td className="px-4 py-3">
                    <LevelBadge name={patient.level?.name} />
                  </td>
                  <td className="relative px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()

                          if (patient.is_locked) {
                            handleQuickToggle(patient)
                          } else {
                            setSelectedPatient(patient)
                            setShowHoldDialog(true)
                          }
                        }}
                        className={`rounded-full px-3 py-1 text-sm font-medium text-white ${
                          patient.is_locked
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {patient.is_locked ? 'Tiếp tục POD' : 'Giữ POD hiện tại'}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleMenu(patient.case_id)
                        }}
                        className="rounded p-1 transition hover:bg-gray-100"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>

                    {openMenu === patient.case_id && (
                      <div className="absolute right-2 top-14 z-50 w-36 rounded-lg border border-gray-200 bg-white shadow-lg">
                        <button
                          onClick={() => handleEdit(patient)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <Pencil size={16} />
                          Sửa
                        </button>

                        <button
                          onClick={() => handleDelete(patient)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          Xoá
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 p-4">
            <p className="text-sm text-slate-500">Tổng {total} bệnh nhân</p>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                ←
              </button>

              <span>
                {page} / {totalPages}
              </span>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border px-3 py-1 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        </div>
        {selectedPatient && (
          <div className="sticky top-6 max-h-[calc(100vh-7rem)] w-2/5 self-start overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-800 text-slate-800">
                    <span className="material-symbols-outlined text-[26px]">person</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{patientName(selectedPatient)}</p>
                    <p className="text-sm text-slate-500">
                      Mã: <span className="font-semibold text-slate-700">{selectedPatient.case_id}</span>
                      <span className="ml-4 font-semibold text-slate-700">POD {selectedPatient.current_pod}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500">
                  <button
                    onClick={() => handleEdit(selectedPatient)}
                    className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-blue-600"
                    title="Sửa"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPatient)}
                    className="rounded-lg p-1.5 hover:bg-slate-100 hover:text-red-600"
                    title="Xoá"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button
                    onClick={() => setSelectedPatient(null)}
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
                <DetailField label="Chiều cao" value={`${displayValue(selectedPatient.height)} cm`} />
                <DetailField label="Cân nặng" value={`${displayValue(selectedPatient.weight)} kg`} />
                <DetailField label="BMI" value={displayValue(selectedPatient.bmi)} />
              </div>

              {/* Thông tin điều trị */}
              <h3 className="mb-3 text-lg font-bold text-slate-800">Thông tin điều trị</h3>
              <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-slate-50 p-5">
                <DetailField label="Ngày phẫu thuật" value={displayValue(selectedPatient.surgery_date)} />
                <DetailField label="POD hiện tại" value={`POD ${selectedPatient.current_pod}`} />
                <DetailField label="Buồng/giường" value={displayValue(selectedPatient.room_bed)} />
              </div>

              {/* Thông tin phẫu thuật */}
              <h3 className="mb-3 text-lg font-bold text-slate-800">Thông tin phẫu thuật</h3>
              <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-slate-50 p-5">
                <DetailField label="Chẩn đoán" value={displayValue(selectedPatient.diagnosis)} />
                <DetailField label="Loại phẫu thuật" value={selectedPatient.operationType?.name ?? '--'} />
                <DetailField label="Phương pháp mổ" value={displayValue(selectedPatient.method)} />
                <DetailField
                  label="Có miệng nối tiêu hoá"
                  value={
                    selectedPatient.has_gi_anastomosis == null
                      ? '--'
                      : selectedPatient.has_gi_anastomosis
                        ? 'Có'
                        : 'Không'
                  }
                />
              </div>

              {/* Tóm tắt đánh giá gần nhất */}
              <h3 className="mb-3 text-lg font-bold text-slate-800">Tóm tắt đánh giá gần nhất</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl bg-slate-50 p-5">
                <DetailField label="Buồn nôn" value={getAnswer('Bạn có buồn nôn không?')} />
                <DetailField label="Số lần nôn" value={getAnswer('Bạn có nôn nhiều không?')} />
                <DetailField label="Chướng bụng" value={getAnswer('Bạn có chướng bụng không?')} />
                <DetailField label="Ăn uống" value={getAnswer('Bạn ăn được bao nhiêu?')} />
                <DetailField label="Trung tiện" value={getAnswer('Bạn đã trung tiện chưa?')} />
                <DetailField label="Tổng" value={`${assessmentDetail?.total_score ?? '--'} ĐIỂM`} />
              </div>
              <div className="mb-6 mt-2 text-right">
                <button className="text-sm font-medium text-blue-600 hover:underline">
                  Xem tất cả đánh giá
                </button>
              </div>

              <div className="mt-8">
                <button
                  onClick={selectedPatient.is_locked ? handleResumePod : openPodLockModal}
                  disabled={savingPodLock}
                  className={`w-full rounded-lg px-4 py-3 font-semibold text-white
                      ${
                        selectedPatient.is_locked
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }
                    `}
                >
                  {savingPodLock
                    ? 'Đang xử lý...'
                    : selectedPatient.is_locked
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
