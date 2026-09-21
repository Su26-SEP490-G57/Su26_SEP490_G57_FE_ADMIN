// Chỉ số sinh tồn (vital signs) — 1 bản ghi do điều dưỡng/bác sĩ ghi nhận.
// recordedBy*/recordedAt LUÔN do server gán, client chỉ đọc để hiển thị.
export interface VitalSignRecord {
  vitalSignId: number
  caseId: string
  pulseBpm: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  temperatureCelsius: number
  respiratoryRate: number
  spo2Percent: number
  note: string | null
  recordedByUserId: number | null
  recordedByName: string | null
  recordedAt: string
}

// Payload ghi nhận chỉ số — CỐ TÌNH không có recordedAt/recordedBy*.
export interface CreateVitalSignPayload {
  caseId: string
  pulseBpm: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  temperatureCelsius: number
  respiratoryRate: number
  spo2Percent: number
  note?: string
}

export interface PaginatedVitalSigns {
  data: VitalSignRecord[]
  total: number
  page: number
  limit: number
}
