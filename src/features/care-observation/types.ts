import type { CareLevel } from '../treatment-orders/types'

// "Phiếu theo dõi và chăm sóc" (MS: 38/BV1) — lưu ở HIS. Bố cục form do
// backend định nghĩa DUY NHẤT một nơi và trả kèm prefill/danh sách, FE chỉ vẽ
// theo `form.sections` — không hardcode danh sách trường ở đây.
export type CareSheetType = 'LEVEL_1' | 'LEVEL_2_3'

export type CareSheetGroup = 'observation' | 'diagnosis' | 'intervention'

export interface CareSheetField {
  key: string
  label: string
  multiline?: boolean
}

export interface CareSheetSection {
  key: string
  title: string
  group: CareSheetGroup
  fields: CareSheetField[]
}

export interface CareSheetForm {
  formCode: string
  legend: string
  sections: CareSheetSection[]
  titles: Record<CareSheetType, string>
}

// Khoá của `content` = `${section.key}.${field.key}`.
export function contentKey(section: CareSheetSection, field: CareSheetField): string {
  return `${section.key}.${field.key}`
}

export interface CareSheetPrefill {
  sheetType: CareSheetType | null // null = bác sĩ chưa chỉ định mức chăm sóc
  careLevel: CareLevel | null
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
  nurseName: string
  content: Record<string, string> // tự điền: chỉ số sinh tồn, cân nặng, BMI
  latestVitalSignAt: string | null
  form: CareSheetForm
}

export interface CareSheet {
  sheetId: number
  sheetNumber: number
  sheetType: CareSheetType
  careLevel: CareLevel | null
  patientCode: string
  patientName: string
  facility: string | null
  department: string | null
  admissionNumber: string | null
  age: number | null
  gender: string | null
  room: string | null
  bed: string | null
  diagnosis: string | null
  hasAllergy: boolean | null
  allergyNote: string | null
  recordedAt: string
  content: Record<string, string>
  nurseName: string | null
  createdAt: string
}

export interface CareSheetList {
  sheets: CareSheet[]
  form: CareSheetForm
}

// Phần hành chính (tờ số, họ tên, phòng...) + loại phiếu + điều dưỡng do
// server tự gán — payload chỉ có phần điều dưỡng nhập.
export interface CreateCareSheetPayload {
  caseId: string
  recordedAt: string // ISO
  admissionNumber?: string
  hasAllergy?: boolean
  allergyNote?: string
  content: Record<string, string>
}
