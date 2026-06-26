import type {
  AssessmentDetailResponse,
  LatestAssessmentResponse,
  PatientListItem,
  OperationType,
} from '../types'
import { useState, useEffect } from 'react'
import {
  getPatients,
  getLatestAssessment,
  getAssessmentDetail,
  getOperationTypes,
} from '../api/patientApi'
import axios from 'axios'

const summaryCards = [
  { title: 'Tổng số người bệnh', value: 24, subtitle: 'Đang theo dõi' },
  { title: 'Xanh', value: 15 },
  { title: 'Vàng', value: 6 },
  { title: 'Đỏ', value: 3 },
  { title: 'Alert chưa xử lý', value: 2 },
  { title: 'Đánh giá hôm nay', value: '18/24' },
]

function displayValue<T>(value: T | null | undefined) {
  return value ?? '--'
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

  const [latestAssessment, setLatestAssessment] = useState<LatestAssessmentResponse | null>(null)
  const [assessmentDetail, setAssessmentDetail] = useState<AssessmentDetailResponse | null>(null)

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

    const patient = selectedPatient

    async function loadAssessment() {
      setLatestAssessment(null)
      setAssessmentDetail(null)
      try {
        const latest = await getLatestAssessment(patient.case_id)

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

  function getAnswer(questionText: string) {
    return (
      assessmentDetail?.details.find((item) => item.question_text === questionText)?.option_text ??
      '--'
    )
  }

  return (
    <div className="p-4">
      {/* Summary cards */}
      <div className="mb-4 flex gap-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="flex-1 rounded-lg border bg-white p-4">
            <p>{card.title}</p>
            <p>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex gap-4">
        <button className="rounded-lg border bg-white px-4 py-2">+ Thêm mới</button>

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
          className={`rounded-lg border bg-white p-4 min-h-[600px]
            ${selectedPatient ? 'w-3/5' : 'w-full'}
            `}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Mã BN</th>
                <th className="p-3 text-left">Tên bệnh nhân</th>
                <th className="p-3 text-left">POD</th>
                <th className="p-3 text-left">Loại phẫu thuật</th>
                <th className="p-3 text-left">Mức độ</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.case_id}
                  onClick={() => setSelectedPatient(patient)}
                  className={`
                        cursor-pointer border-b
                        ${
                          selectedPatient?.case_id === patient.case_id
                            ? 'bg-blue-200 border-l-4 border-blue-500'
                            : 'hover:bg-slate-100'
                        }
                    `}
                >
                  <td className="p-3">{patient.case_id}</td>
                  <td className="p-3">{patient.name_initials}</td>
                  <td className="p-3">POD {patient.current_pod}</td>
                  <td className="p-3">{patient.operationType?.name}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-white text-sm
                        ${
                          patient.level?.name === 'Đỏ'
                            ? 'bg-red-600'
                            : patient.level?.name === 'Vàng'
                              ? 'bg-yellow-500'
                              : 'bg-green-600'
                        }
                        `}
                    >
                      {patient.level?.name ?? '--'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-between">
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
          <div className="w-2/5 rounded-lg border bg-white p-4 min-h-[600px]">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Thông tin bệnh nhân</h2>

                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-2xl text-slate-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Mã nghiên cứu</span>
                <span>{selectedPatient.case_id}</span>

                <span className="text-slate-500">Họ tên</span>
                <span>{selectedPatient.name_initials}</span>

                <span className="text-slate-500">Tuổi</span>
                <span>{selectedPatient.age}</span>

                <span className="text-slate-500">Giới tính</span>
                <span>{selectedPatient.gender}</span>

                <span className="text-slate-500">Chiều cao</span>
                <span>{displayValue(selectedPatient.height)} cm</span>

                <span className="text-slate-500">Cân nặng</span>
                <span>{displayValue(selectedPatient.weight)} kg</span>

                <span className="text-slate-500">BMI</span>
                <span>{displayValue(selectedPatient.bmi)}</span>
              </div>
              <div className="mb-6 mt-6">
                <h3 className="mb-3 font-bold">Thông tin điều trị</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Ngày phẫu thuật</span>
                <span>{selectedPatient.surgery_date}</span>

                <span className="text-slate-500">POD hiện tại</span>
                <span>POD {selectedPatient.current_pod}</span>

                <span className="text-slate-500">Buồng/giường</span>
                <span>{selectedPatient.room_bed}</span>
              </div>
              <div className="mb-6 mt-6">
                <h3 className="mb-3 font-bold">Thông tin phẫu thuật</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Chẩn đoán</span>
                <span>{selectedPatient.diagnosis}</span>

                <span className="text-slate-500">Loại phẫu thuật</span>
                <span>{selectedPatient.operationType?.name ?? '--'}</span>

                <span className="text-slate-500">Phương pháp mổ</span>
                <span>{selectedPatient.method}</span>

                <span className="text-slate-500">Có miệng nối ống tiêu hoá</span>
                <span>
                  {selectedPatient.has_gi_anastomosis == null
                    ? '--'
                    : selectedPatient.has_gi_anastomosis
                      ? 'Có'
                      : 'Không'}
                </span>
              </div>
              <div className="mb-6 mt-6">
                <h3 className="mb-3 font-bold">Tóm tắt đánh giá gần nhất</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Buồn nôn</span>
                <span>{getAnswer('Bạn có buồn nôn không?')}</span>

                <span className="text-slate-500">Nôn</span>
                <span>{getAnswer('Bạn có nôn nhiều không?')}</span>

                <span className="text-slate-500">Chướng bụng</span>
                <span>{getAnswer('Bạn có chướng bụng không?')}</span>

                <span className="text-slate-500">Ăn uống</span>
                <span>{getAnswer('Bạn ăn được bao nhiêu?')}</span>

                <span className="text-slate-500">Trung tiện</span>
                <span>{getAnswer('Bạn đã trung tiện chưa?')}</span>

                <span className="font-semibold">Tổng điểm</span>
                <span className="font-semibold">{assessmentDetail?.total_score ?? '--'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
