import type { CareLevel } from '../treatment-orders/types'

export type CareObservationInputType = 'checkbox' | 'text' | 'number' | 'select'

// 1 mục trong phiếu theo dõi chăm sóc. `value` là giá trị đã ghi nhận gần nhất
// (chuỗi rỗng nếu chưa ghi) — backend lưu findings dưới dạng Record<string,string>.
export interface CareObservationItem {
  id: string
  label: string
  inputType: CareObservationInputType
  options?: string[]
  value: string
}

// Phiếu theo dõi đang mở của 1 bệnh nhân (backend gọi là "task" + template).
// `id` chính là taskId dùng cho endpoint POST .../tasks/:taskId/entries.
export interface CareObservationSheet {
  id: number
  caseId: string
  careLevel: CareLevel | null
  sheetType: string
  items: CareObservationItem[]
  isComplete: boolean
  completedAt: string | null
}

// Payload gửi 1 lần ghi nhận. KHÔNG có người quan sát/thời điểm — server tự gán.
// `caseId` chỉ dùng phía client để invalidate đúng query key.
export interface SubmitCareObservationPayload {
  sheetId: number
  caseId: string
  entries: Record<string, string>
  note?: string
}
