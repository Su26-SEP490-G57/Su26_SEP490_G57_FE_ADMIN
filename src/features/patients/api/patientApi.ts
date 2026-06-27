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

// We only need `total`, so request the smallest possible page per filter.
async function getPatientCount(level?: LevelName) {
  const data = await getPatients({ page: 1, limit: 1, level })
  return data.total
}

// Dashboard KPI counts derived from the real patient list.
export function usePatientStats() {
  return useQuery({
    queryKey: ['patients', 'stats'],
    queryFn: async (): Promise<PatientStats> => {
      const [total, red, yellow, green] = await Promise.all([
        getPatientCount(),
        getPatientCount('Red'),
        getPatientCount('Yellow'),
        getPatientCount('Green'),
      ])
      return { total, byLevel: { Red: red, Yellow: yellow, Green: green } }
    },
  })
}

export async function getOperationTypes() {
  const { data } = await api.get<OperationType[]>('/patients/operation-types')

  return data
}

export async function getLatestAssessment(caseId: string) {
  const { data } = await api.get<LatestAssessmentResponse>(
    `/symptom-surveys/patient/${caseId}/latest`,
  )

  return data
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