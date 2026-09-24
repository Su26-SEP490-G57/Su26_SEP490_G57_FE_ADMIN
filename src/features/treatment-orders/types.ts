// Mức chăm sóc (care level) — enum `care_level_enum` của backend.
// CỐ TÌNH TÁCH BIỆT với `level` (Red/Yellow/Green — phân loại nguy cơ ERAS):
// hai khái niệm khác nhau, không dùng chung màu/nhãn/helper.
export type CareLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3'

export const CARE_LEVELS: CareLevel[] = ['LEVEL_1', 'LEVEL_2', 'LEVEL_3']

export const CARE_LEVEL_LABELS: Record<CareLevel, string> = {
  LEVEL_1: 'Cấp 1',
  LEVEL_2: 'Cấp 2',
  LEVEL_3: 'Cấp 3',
}

export const CARE_LEVEL_DESCRIPTIONS: Record<CareLevel, string> = {
  LEVEL_1: 'Chăm sóc tích cực — theo dõi sát',
  LEVEL_2: 'Chăm sóc trung bình',
  LEVEL_3: 'Chăm sóc cơ bản',
}

export function careLevelLabel(level: CareLevel | null | undefined): string {
  return level ? CARE_LEVEL_LABELS[level] : 'Chưa chỉ định'
}

// Payload "Phiếu theo dõi điều trị" — KHÔNG có orderedBy*/orderedAt và KHÔNG
// có các trường hành chính (tờ số, họ tên, phòng...): server tự gán/lấy lại từ
// hồ sơ bệnh nhân. `instructions` chính là ô "Chỉ định". Phiếu được lưu ở HIS.
export interface CreateTreatmentOrderPayload {
  caseId: string
  careLevel: CareLevel
  instructions: string
  sheet: {
    recordedAt: string // ISO
    progressNotes: string
    diagnosis?: string
    comorbidities?: string[]
  }
}

// Các trường form tự điền — GET /treatment-orders/patient/:caseId/sheet-prefill
export interface TreatmentSheetPrefill {
  sheetNumber: number
  facility: string
  department: string
  caseId: string
  patientName: string
  age: number | null
  gender: string | null
  room: string | null
  bed: string | null
  diagnosis: string | null
  diagnosisOptions: string[]
  comorbidities: string[]
  progressNotes: string // seed từ chỉ số sinh tồn gần nhất ('' nếu chưa có)
  latestVitalSignAt: string | null
  activeCareLevel: CareLevel | null
}

// Phiếu theo dõi điều trị đã lưu ở HIS.
export interface TreatmentSheet {
  sheetId: number
  sheetNumber: number
  patientCode: string
  patientName: string
  facility: string | null
  department: string | null
  diagnosis: string | null
  comorbidities: string | null
  age: number | null
  gender: string | null
  room: string | null
  bed: string | null
  recordedAt: string
  progressNotes: string
  orders: string
  careLevel: CareLevel | null
  doctorName: string | null
  externalOrderId: number | null
  createdAt: string
}

export interface TreatmentOrder {
  treatmentOrderId: number
  caseId: string
  careLevel: CareLevel
  instructions: string | null
  orderedByUserId: number | null
  orderedByName: string | null
  orderedAt: string
  updatedAt?: string | null
}
