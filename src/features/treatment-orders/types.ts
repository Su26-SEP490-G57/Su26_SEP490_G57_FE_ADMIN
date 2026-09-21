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

// Payload tạo chỉ định điều trị — KHÔNG có orderedBy*/orderedAt: server tự
// gán từ người dùng đang đăng nhập + đồng hồ server.
export interface CreateTreatmentOrderPayload {
  caseId: string
  careLevel: CareLevel
  instructions?: string
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
