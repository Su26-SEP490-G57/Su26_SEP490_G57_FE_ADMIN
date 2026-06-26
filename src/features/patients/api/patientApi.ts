import { api } from '../../../lib/api'
import type {
  PatientListResponse,
  PatientQuery,
  LatestAssessmentResponse,
  AssessmentDetailResponse,
  OperationType,
} from '../types'

export async function getPatients(query?: PatientQuery) {
  const { data } = await api.get<PatientListResponse>('/patients', {
    params: query,
  })

  return data
}

export async function getLatestAssessment(caseId: string) {
  const { data } = await api.get<LatestAssessmentResponse>(
    `/symptom-surveys/${caseId}/latest`,
  )

  return data
}

export async function getAssessmentDetail(assessmentId: number) {
  const { data } = await api.get<AssessmentDetailResponse>(
    `/symptom-surveys/${assessmentId}`,
  )

  return data
}

export async function getOperationTypes() {
  const { data } = await api.get<OperationType[]>('/patients/operation-types')
  return data
}