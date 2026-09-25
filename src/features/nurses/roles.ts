// Vai trò trên trang "Quản lý nhân viên y tế" (điều dưỡng, điều dưỡng trưởng,
// bác sĩ). Điều dưỡng trưởng chỉ hiển thị — KHÔNG được tạo/gán ở trang này.
export type AssignableStaffRole = 'Nurse' | 'Doctor'

export const ASSIGNABLE_STAFF_ROLE_OPTIONS: { value: AssignableStaffRole; label: string }[] = [
  { value: 'Nurse', label: 'Điều dưỡng viên' },
  { value: 'Doctor', label: 'Bác sĩ' },
]

export function staffRoleLabel(roles: string[]): string {
  if (roles.includes('Head_Nurse')) return 'Điều dưỡng trưởng'
  if (roles.includes('Doctor')) return 'Bác sĩ'
  return 'Điều dưỡng viên'
}

// Mã hiển thị: BS001 cho bác sĩ, ĐD001 cho điều dưỡng / điều dưỡng trưởng.
export function staffCode(staff: { id: number; roles: string[] }): string {
  const prefix = staff.roles.includes('Doctor') ? 'BS' : 'ĐD'
  return `${prefix}${String(staff.id).padStart(3, '0')}`
}
