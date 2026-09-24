export type UserRole = 'head_nurse' | 'admin' | 'doctor' | 'nurse'

// Nhãn tiếng Việt của từng vai trò — dùng chung cho header/sidebar và mọi nơi
// cần hiển thị vai trò người đang đăng nhập.
export const ROLE_LABELS: Record<UserRole, string> = {
  head_nurse: 'Điều dưỡng trưởng',
  admin: 'Quản trị viên',
  doctor: 'Bác sĩ',
  nurse: 'Điều dưỡng',
}

export interface NavItem {
  label: string
  icon: string
  path: string
  roles: UserRole[]
  badge?: number
  dividerBefore?: string
  end?: boolean // Thêm prop để NavLink match exact path
}

export const NAV_ITEMS: NavItem[] = [
  // -------------------------------------------------------------------------
  // Head Nurse (+ Doctor, cùng bộ menu theo yêu cầu — bác sĩ dùng chung mọi
  // mục với điều dưỡng trưởng, không có menu riêng nào khác)
  // -------------------------------------------------------------------------
  // Tạm ẩn màn Tổng quan (dashboard) — bật lại khi cần.
  // { label: 'Tổng quan', icon: 'dashboard', path: '/dashboard', roles: ['head_nurse', 'doctor'] },
  {
    label: 'Danh sách người bệnh',
    icon: 'group',
    path: '/patients',
    roles: ['head_nurse', 'doctor'],
  },
  {
    label: 'Phác đồ lâm sàng',
    icon: 'description',
    path: '/protocols',
    roles: ['head_nurse', 'doctor'],
    end: true,
  },
  {
    label: 'Bộ câu hỏi đánh giá',
    icon: 'quiz',
    path: '/protocols/questions',
    roles: ['head_nurse', 'doctor'],
  },
  {
    label: 'Quản lý điều dưỡng',
    icon: 'medical_services',
    path: '/nurses',
    roles: ['head_nurse', 'doctor'],
  },
  {
    label: 'Thống kê dữ liệu',
    icon: 'analytics',
    path: '/analytics',
    roles: ['head_nurse', 'doctor'],
  },

  // -------------------------------------------------------------------------
  // Admin only - Chỉ có Audit Logs
  // -------------------------------------------------------------------------
  {
    label: 'Audit Logs',
    icon: 'history',
    path: '/audit-logs',
    roles: ['admin'],
  },

  // -------------------------------------------------------------------------
  // Nurse only
  // -------------------------------------------------------------------------
  // '/patients' chỉ là danh sách hồ sơ (CRUD demographics) — tab Tổng quan /
  // Chỉ số / Phiếu theo dõi nằm trong PatientDetailPanel của trang
  // '/analytics', nên điều dưỡng cần cả hai mục.
  { label: 'Danh sách người bệnh', icon: 'group', path: '/patients', roles: ['nurse'] },
  { label: 'Hồ sơ bệnh nhân', icon: 'analytics', path: '/analytics', roles: ['nurse'] },
]
