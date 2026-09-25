import type { CareLevel } from '../treatment-orders/types'

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
  comorbidities?: string[] | null
  operationTypeId: number
  operationType: {
    id: number
    name: string
  } | null
  method: string
  surgeryDate: string
  currentPod: number
  currentDietLevel: number
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

  // Mức chăm sóc đang áp dụng (do bác sĩ chỉ định) — KHÁC với `level`
  // (Red/Yellow/Green). null = chưa có chỉ định điều trị nào.
  activeCareLevel?: CareLevel | null
  activeTreatmentOrderId?: number | null

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
  // Omit to auto-generate the next "CASE-NNN"; the HIS import flow passes its own hospital code.
  caseId?: string
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
  comorbidities?: string[]
  roomBed?: string
}

// Payload cập nhật — mọi field optional, không đổi mã bệnh nhân. `null` = xoá
// giá trị hiện có (backend chỉ bỏ qua field `undefined`).
export type UpdatePatientPayload = {
  [K in keyof Omit<CreatePatientPayload, 'caseId'>]?: CreatePatientPayload[K] | null
} & {
  phoneNumber?: string | null
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
  assessmentId: number
  caseId: string
  evaluationDatetime: string
  podContext: number
  shiftPeriod: string
  triageLevel: string
}

export interface AssessmentDetailResponse {
  assessmentId: number
  caseId: string
  evaluationDatetime: string
  podContext: number
  shiftPeriod: string
  triageLevel: string
  details: {
    questionId: number
    questionText: string
    selectedOptionId: number
    optionText: string
    optionTriageLevel: string
  }[]

  recommendation: string
}

// ── Import từ HIS (hệ thống ngoài) ──────────────────────────────────────────
// Một hồ sơ phẫu thuật do dummy HIS trả về (khớp ExternalSurgicalRecordDto của BE).
export interface ExternalSurgicalRecord {
  recordId: string
  hospitalPatientCode: string
  patientName: string
  dateOfBirth: string | null
  sex: string | null
  heightCm: number | null
  weightKg: number | null
  admissionDiagnosis: string | null
  procedureName: string
  procedureCode: string | null
  surgicalApproach: string | null
  bowelAnastomosis: boolean | null
  operatedAt: string
  attendingSurgeon: string | null
  wardCode: string | null
  bedNumber: string | null
  dischargeStatus: string | null
  contactPhone: string | null
}

export interface ExternalSurgicalRecordListResponse {
  data: ExternalSurgicalRecord[]
  total: number
}

export type ImportStatus = 'imported' | 'skipped' | 'failed'

export interface ImportResultItem {
  recordId: string
  caseId: string | null
  status: ImportStatus
  erasStarted: boolean
  roomBed: string | null
  message: string | null
}

export interface ImportPatientsResult {
  total: number
  imported: number
  skipped: number
  failed: number
  results: ImportResultItem[]
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
