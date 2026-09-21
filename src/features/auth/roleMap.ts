import type { UserRole } from '../../layouts/main-layout/nav-config'

// Backend (`UserRoleName` enum) trả về chuỗi vai trò dạng 'Admin' | 'Head_Nurse'
// | 'Nurse' | 'Patient' | 'Doctor'. FE dùng union lowercase-snake riêng — đây là
// NƠI DUY NHẤT dịch giữa hai bảng chữ, tránh so sánh chuỗi backend rải rác
// trong UI.
const BACKEND_ROLE_MAP: Record<string, UserRole> = {
  Admin: 'admin',
  Head_Nurse: 'head_nurse',
  Nurse: 'nurse',
  Doctor: 'doctor',
}

// Ném lỗi thay vì mặc định âm thầm: một vai trò lạ (ví dụ 'Patient' — không
// được phép dùng app admin) phải lộ ra ngay ở bước đăng nhập, không được
// biến thành quyền hạn sai.
export function mapBackendRole(raw: string): UserRole {
  const mapped = BACKEND_ROLE_MAP[raw]
  if (!mapped) {
    throw new Error(`Vai trò không được hỗ trợ: ${raw}`)
  }
  return mapped
}
