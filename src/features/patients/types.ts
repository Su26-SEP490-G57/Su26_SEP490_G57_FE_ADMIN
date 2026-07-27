export interface PatientListItem {
  caseId: string
  fullName?: string | null
  nameInitials?: string | null
  age: number
  gender: string
  height: number | null
  weight: number | null
  bmi: number | null
  diagnosis: string
  operationTypeId: number
  operationType: {
    id: number
    name: string
  } | null
  method: string
  surgeryDate: string
  currentPod: number
  roomBed: string
  hasGiAnastomosis: boolean | null
  isLocked: boolean
  holdReason: string | null
  levelId: number | null
  level: {
    id: number
    name: string
    color: string
  } | null
  lastAssessmentTime?: string | null // Thời gian đánh giá gần nhất (ISO datetime)
  erasCompleted: boolean // Đã hoàn thành ERAS (đạt POD tối đa)
  erasCompletedDate?: string | null // Ngày hoàn thành ERAS (ISO datetime)

  account: {
    id: number
    username: string
    fullName: string
    phoneNumber?: string | null
    cityProvince?: string | null
    ward?: string | null
    detailedAddress?: string | null
  }
}

// Payload tạo bệnh nhân — khớp CreatePatientDto của backend.
export interface CreatePatientPayload {
  caseId: string
  fullName: string
  age?: number
  gender?: string
  height?: number
  weight?: number
  bmi?: number
  cityProvince?: string
  ward?: string
  detailedAddress?: string
  operationTypeId?: number
  method?: string
  surgeryDate?: string
  hasGiAnastomosis?: boolean
  diagnosis?: string
  roomBed?: string
}

// Payload cập nhật — mọi field optional, không đổi mã bệnh nhân.
export type UpdatePatientPayload = Partial<Omit<CreatePatientPayload, 'caseId'>>

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
  assessmentId: number
  caseId: string
  evaluationDatetime: string
  podContext: number
  shiftPeriod: string
  totalScore: number
  triageColor: string
}

export interface AssessmentDetailResponse {
  assessmentId: number
  caseId: string
  evaluationDatetime: string
  podContext: number
  shiftPeriod: string
  totalScore: number
  triageColor: string
  details: {
    questionId: number
    questionText: string
    selectedOptionId: number
    optionText: string
    scoreEarned: number
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

export interface ArchivePatientRequest {
  archived: boolean
}

export interface ArchivedPatientsResponse {
  data: Record<string, PatientListItem[]> // Grouped by operation type name
  total: number
}

export interface ArchivePatientQuery {
  search?: string
}
