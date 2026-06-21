export interface Patient {
  researchCode: string
  fullName: string
  age: number
  gender: 'Nam' | 'Nữ'
  height: number
  weight: number
  bmi: number
  diagnosis: string
  surgeryGroup: string
  surgeryType: string
  surgeryMethod: string
  hasDigestiveAnastomosis: boolean
  surgeryDate: string
  pod: number
  pathway: string
  roomBed: string
  assignedNurse: string
  riskLevel: 'Xanh' | 'Vàng' | 'Đỏ'
  note?: string
}