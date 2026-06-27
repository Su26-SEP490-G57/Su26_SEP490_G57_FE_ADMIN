export interface PatientListItem {
  case_id: string
  name_initials: string
  age: number
  gender: string
  height: number | null
  weight: number | null
  bmi: number | null
  diagnosis: string
  operation_type_id: number
  operationType: {
    id: number
    name: string
  }
  method: string
  surgery_date: string
  current_pod: number
  room_bed: string
  has_gi_anastomosis: boolean | null
  is_locked: boolean
  hold_reason: string | null
  level_id: number | null
  level: {
    id: number
    name: string
    color: string
  } | null

  account: {
    id: number
    username: string
    fullName: string
  }
}

export interface PatientListResponse {
  data: PatientListItem[]
  total: number
  page: number
  limit: number
}

export interface PatientQuery {
  search?: string
  operationTypeId?: number
  level?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface OperationType {
  id: number
  name: string
}

export interface LatestAssessmentResponse {
  assessment_id: number
  case_id: string
  evaluation_datetime: string
  pod_context: number
  shift_period: string
  total_score: number
  triage_color: string
}

export interface AssessmentDetailResponse {
  assessment_id: number
  case_id: string
  evaluation_datetime: string
  pod_context: number
  shift_period: string
  total_score: number
  triage_color: string
  details: {
    question_id: number
    question_text: string
    selected_option_id: number
    option_text: string
    score_earned: number
  }[]

  recommendation: string
}

export interface PodLockRequest {
  isLocked: boolean
  holdReason?: string
}

export interface PodLockResponse {
  caseId: string
  currentPod: number
  isLocked: boolean
  holdReason: string | null
}