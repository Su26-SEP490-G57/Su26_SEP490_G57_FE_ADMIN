import { api } from '../../../lib/api'
import type {
  AssessmentDetailResponse,
  LatestAssessmentResponse,
  OperationType,
  PatientListResponse,
  PatientQuery,
  PodLockRequest,
  PodLockResponse,
} from '../types'

export async function getPatients(query?: PatientQuery) {
  const { data } = await api.get<PatientListResponse>('/patients', {
    params: query,
  })

  return data
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