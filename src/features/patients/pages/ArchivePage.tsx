/* eslint-disable react-hooks/set-state-in-effect */
import { X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import { getArchivedPatients, getAssessmentDetail, getLatestAssessment } from '../api/patientApi'
import type { AssessmentDetailResponse, LatestAssessmentResponse, PatientListItem } from '../types'

function displayValue<T>(value: T | null | undefined) {
  return value ?? '--'
}

// Tên hiển thị của bệnh nhân: ưu tiên fullName của tài khoản liên kết.
function patientName(p: {
  account?: { fullName?: string | null } | null
  nameInitials?: string | null
}) {
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

export function ArchivePage() {
  const [patientsByOperationType, setPatientsByOperationType] = useState<
    Record<string, PatientListItem[]>
  >({})
  const [totalArchived, setTotalArchived] = useState(0)
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const [latestAssessment, setLatestAssessment] = useState<LatestAssessmentResponse | null>(null)
  const [, setAssessmentDetail] = useState<AssessmentDetailResponse | null>(null)

  // Load archived patients grouped by operation type
  async function loadArchivedPatients() {
    try {
      const result = await getArchivedPatients(search)
      setPatientsByOperationType(result.data)
      setTotalArchived(result.total)

      // Auto-expand all operation types
      setExpandedTypes(new Set(Object.keys(result.data)))
    } catch (error) {
      console.error('Error loading archived patients:', error)
    }
  }

  useEffect(() => {
    loadArchivedPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Load assessment data when patient is selected
  useEffect(() => {
    if (!selectedPatient) {
      setLatestAssessment(null)
      setAssessmentDetail(null)
      return
    }

    async function loadAssessmentData() {
      if (!selectedPatient) return

      try {
        // Load latest assessment
        const latest = await getLatestAssessment(selectedPatient.caseId)
        setLatestAssessment(latest)

        // Load assessment detail if available
        if (latest?.assessmentId) {
          const detail = await getAssessmentDetail(latest.assessmentId)
          setAssessmentDetail(detail)
        } else {
          setAssessmentDetail(null)
        }
      } catch (error) {
        console.error('Error loading assessment data:', error)
        setLatestAssessment(null)
        setAssessmentDetail(null)
      }
    }

    loadAssessmentData()
  }, [selectedPatient])

  function handleClick(patient: PatientListItem) {
    setSelectedPatient(patient)
  }

  function toggleOperationType(operationType: string) {
    setExpandedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(operationType)) {
        next.delete(operationType)
      } else {
        next.add(operationType)
      }
      return next
    })
  }

  // Render patient card (no opacity fade, no action buttons)
  function renderPatientCard(patient: PatientListItem) {
    return (
      <div
        key={patient.caseId}
        onClick={() => handleClick(patient)}
        className="bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-all duration-200"
      >
        <div className="space-y-2">
          {/* Header badges */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Hoàn thành ERAS badge */}
              <span className="flex items-center gap-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full flex-shrink-0 border border-emerald-200">
                <span className="material-symbols-outlined text-[10px]">check_circle</span>
                Hoàn thành ERAS
              </span>
            </div>
            {patient.isLocked && (
              <span className="flex items-center gap-0.5 text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <span className="material-symbols-outlined text-[10px]">lock</span>
              </span>
            )}
          </div>

          {/* Patient Name & ID */}
          <div>
            <h4 className="text-sm font-bold truncate leading-tight text-slate-800">
              {patientName(patient)}
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate">
              Mã: {patient.caseId || '--'}
            </p>
          </div>

          {/* Info footer */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/50">
            <div className="text-[9px] text-slate-600">
              Hoàn thành:{' '}
              {patient.erasCompletedDate
                ? new Date(patient.erasCompletedDate).toLocaleDateString('vi-VN')
                : '--'}
            </div>
            <div className="flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px] text-slate-400">schedule</span>
              <span className="text-[9px] font-medium text-slate-500">
                {formatLastAssessment(patient.lastAssessmentTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Inject toolbar into header
  const headerActions = useMemo(
    () => (
      <>
        {/* Search box */}
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm bệnh nhân..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSearch(searchInput)
              }}
              className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setSearch(searchInput)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Tìm kiếm
          </button>
        </div>
      </>
    ),
    [searchInput],
  )

  useHeaderActions(headerActions)

  // Sort operation types by patient count (descending)
  const sortedOperationTypes = useMemo(() => {
    return Object.entries(patientsByOperationType)
      .sort(([, a], [, b]) => b.length - a.length)
      .map(([type]) => type)
  }, [patientsByOperationType])

  return (
    <div className="space-y-6 pb-8">
      {/* Summary header */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="material-symbols-outlined text-[20px]">archive</span>
          <span className="font-medium">Tổng số hồ sơ đã lưu trữ:</span>
          <span className="font-bold text-lg text-blue-600">{totalArchived}</span>
        </div>
      </div>

      {/* Grouped by operation type */}
      <div className="space-y-4">
        {sortedOperationTypes.map((operationType) => {
          const patientsInType = patientsByOperationType[operationType] || []
          const isExpanded = expandedTypes.has(operationType)

          // Sort by erasCompletedDate DESC (newest first)
          const sortedPatients = [...patientsInType].sort((a, b) => {
            const dateA = a.erasCompletedDate ? new Date(a.erasCompletedDate).getTime() : 0
            const dateB = b.erasCompletedDate ? new Date(b.erasCompletedDate).getTime() : 0
            return dateB - dateA
          })

          return (
            <div
              key={operationType}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden"
            >
              {/* Operation type header (collapsible) */}
              <button
                onClick={() => toggleOperationType(operationType)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-blue-600">
                    {isExpanded ? 'expand_more' : 'chevron_right'}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800">{operationType}</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {patientsInType.length}
                  </span>
                </div>
              </button>

              {/* Patient cards grid */}
              {isExpanded && (
                <div className="p-4 pt-0 grid grid-cols-6 gap-3">
                  {sortedPatients.map((patient) => renderPatientCard(patient))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {Object.keys(patientsByOperationType).length === 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <span className="material-symbols-outlined text-[64px] text-slate-300 mb-4">archive</span>
          <p className="text-slate-500 text-lg">Chưa có hồ sơ nào được lưu trữ</p>
        </div>
      )}

      {/* Detail Modal Popup */}
      {selectedPatient && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPatient(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl">
                  {patientName(selectedPatient).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {patientName(selectedPatient)}
                  </h2>
                  <p className="text-sm text-slate-600">Mã: {selectedPatient.caseId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Archived status banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <span className="material-symbols-outlined">archive</span>
                  <span className="font-medium">Hồ sơ đã được lưu trữ</span>
                </div>
                <p className="text-sm text-emerald-600 mt-1">
                  Hoàn thành ERAS:{' '}
                  {selectedPatient.erasCompletedDate
                    ? new Date(selectedPatient.erasCompletedDate).toLocaleDateString('vi-VN')
                    : '--'}
                </p>
              </div>

              {/* Thông tin cơ bản */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">person</span>
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <DetailField label="Tuổi" value={displayValue(selectedPatient.age)} />
                  <DetailField label="Giới tính" value={displayValue(selectedPatient.gender)} />
                  <DetailField
                    label="Chiều cao (cm)"
                    value={displayValue(selectedPatient.height)}
                  />
                  <DetailField label="Cân nặng (kg)" value={displayValue(selectedPatient.weight)} />
                  <DetailField label="BMI" value={displayValue(selectedPatient.bmi)} />
                  <DetailField
                    label="Phòng - Giường"
                    value={displayValue(selectedPatient.roomBed)}
                  />
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">location_on</span>
                  Địa chỉ
                </h3>
                <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-lg">
                  <DetailField
                    label="Tỉnh/Thành phố"
                    value={displayValue(selectedPatient.account?.cityProvince)}
                  />
                  <DetailField
                    label="Phường/Xã"
                    value={displayValue(selectedPatient.account?.ward)}
                  />
                  <DetailField
                    label="Địa chỉ chi tiết"
                    value={displayValue(selectedPatient.account?.detailedAddress)}
                  />
                </div>
              </div>

              {/* Thông tin phẫu thuật */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">medical_services</span>
                  Thông tin phẫu thuật
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <DetailField
                    label="Loại phẫu thuật"
                    value={displayValue(selectedPatient.operationType?.name)}
                  />
                  <DetailField label="Phương pháp" value={displayValue(selectedPatient.method)} />
                  <DetailField
                    label="Ngày phẫu thuật"
                    value={
                      selectedPatient.surgeryDate
                        ? new Date(selectedPatient.surgeryDate).toLocaleDateString('vi-VN')
                        : '--'
                    }
                  />
                  <DetailField label="Chẩn đoán" value={displayValue(selectedPatient.diagnosis)} />
                  <DetailField
                    label="Miệng nối đường tiêu hoá"
                    value={
                      selectedPatient.hasGiAnastomosis === null
                        ? '--'
                        : selectedPatient.hasGiAnastomosis
                          ? 'Có'
                          : 'Không'
                    }
                  />
                  <DetailField label="POD hiện tại" value={`POD ${selectedPatient.currentPod}`} />
                </div>
              </div>

              {/* Assessment info */}
              {latestAssessment && (
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600">assignment</span>
                    Đánh giá gần nhất
                  </h3>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                    <DetailField
                      label="Thời gian đánh giá"
                      value={new Date(latestAssessment.evaluationDatetime).toLocaleString('vi-VN')}
                    />
                    <DetailField label="Ca trực" value={latestAssessment.shiftPeriod} />
                    <DetailField
                      label="POD ngữ cảnh"
                      value={`POD ${latestAssessment.podContext}`}
                    />
                    <DetailField label="Tổng điểm" value={latestAssessment.totalScore} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
