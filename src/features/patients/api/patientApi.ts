/* eslint-disable no-useless-catch */
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type {
    AssessmentDetailResponse,
    CreatePatientPayload,
    LatestAssessmentResponse,
    OperationType,
    PatientListItem,
    PatientListResponse,
    PatientQuery,
    PodLockRequest,
    PodLockResponse,
    UpdatePatientPayload,
} from '../types'

export async function getPatients(query?: PatientQuery) {
  const { data } = await api.get<PatientListResponse>('/patients', {
    params: query,
  })

  return data
}

// Tạo bệnh nhân (case + tài khoản đăng nhập liên kết).
export async function createPatient(payload: CreatePatientPayload) {
  const { data } = await api.post<PatientListItem>('/patients', payload)
  return data
}

// Cập nhật bệnh nhân theo user_id của tài khoản liên kết.
export async function updatePatient(userId: number, payload: UpdatePatientPayload) {
  const { data } = await api.patch<PatientListItem>(`/patients/${userId}`, payload)
  return data
}

// Xoá mềm bệnh nhân theo user_id của tài khoản liên kết.
export async function deletePatient(userId: number) {
  const { data } = await api.delete(`/patients/${userId}`)
  return data
}

// Risk levels as named by the backend (level filter on GET /patients).
type LevelName = 'Red' | 'Yellow' | 'Green'

export interface PatientStats {
  total: number
  byLevel: Record<LevelName, number>
}

// Dashboard KPI counts derived from the real patient list.
// Đếm từ data thật thay vì gọi API nhiều lần để tránh sai số
export function usePatientStats() {
  return useQuery({
    queryKey: ['patients', 'stats'],
    queryFn: async (): Promise<PatientStats> => {
      // Lấy TẤT CẢ bệnh nhân (không filter, không phân trang)
      const allPatients = await getPatients({ page: 1, limit: 9999 })

      console.log('📊 All patients data:', allPatients.data)

      const total = allPatients.total

      // Đếm từng loại dựa trên level.name của từng bệnh nhân
      const counts = { Red: 0, Yellow: 0, Green: 0 }

      allPatients.data.forEach((patient) => {
        const levelName = patient.level?.name
        console.log(`Patient ${patient.caseId}: level =`, patient.level)

        if (!levelName) return

        // Chuẩn hoá tên level (có thể là "Red", "Đỏ", "red", etc.)
        const normalized = levelName.toLowerCase()
        if (normalized.includes('red') || normalized.includes('đỏ')) {
          counts.Red++
        } else if (normalized.includes('yellow') || normalized.includes('vàng')) {
          counts.Yellow++
        } else if (normalized.includes('green') || normalized.includes('xanh')) {
          counts.Green++
        }
      })

      console.log('📊 Final counts:', counts)

      return { total, byLevel: counts }
    },
  })
}

export async function getOperationTypes() {
  const { data } = await api.get<OperationType[]>('/patients/operation-types')

  return data
}

export async function getLatestAssessment(caseId: string) {
  try {
    const response = await api.get<LatestAssessmentResponse>(
      `/symptom-surveys/patient/${caseId}/latest`,
      {
        // Không throw error cho 404 - coi như valid response
        validateStatus: (status) => status === 200 || status === 404,
      }
    )

    // Nếu 404 thì trả về null
    if (response.status === 404) {
      return null
    }

    return response.data
  } catch (error) {
    // Các lỗi khác (network, 500, etc.)
    throw error
  }
}

export async function getAssessmentDetail(assessmentId: number) {
  const { data } = await api.get<AssessmentDetailResponse>(
    `/symptom-surveys/${assessmentId}`,
  )

  return data
}

export async function updatePodLock(
  caseId: string,
  body: PodLockRequest,
) {
  const { data } = await api.patch<PodLockResponse>(
    `/patients/${caseId}/pod-lock`,
    body,
  )

  return data
}

export async function updatePodLevel(
  caseId: string,
  podLevel: number,
) {
  const { data } = await api.patch<PatientListItem>(
    `/patients/${caseId}/pod-level`,
    { podLevel },
  )

  return data
}
