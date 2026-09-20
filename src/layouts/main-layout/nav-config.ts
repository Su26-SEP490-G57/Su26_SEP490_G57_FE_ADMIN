export type UserRole = 'head_nurse' | 'admin'

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
  // Head Nurse only
  // -------------------------------------------------------------------------
  // Tạm ẩn màn Tổng quan (dashboard) — bật lại khi cần.
  // { label: 'Tổng quan', icon: 'dashboard', path: '/dashboard', roles: ['head_nurse'] },
  { label: 'Danh sách người bệnh', icon: 'group', path: '/patients', roles: ['head_nurse'] },
  {
    label: 'Phác đồ lâm sàng',
    icon: 'description',
    path: '/protocols',
    roles: ['head_nurse'],
    end: true,
  },
  {
    label: 'Bộ câu hỏi đánh giá',
    icon: 'quiz',
    path: '/protocols/questions',
    roles: ['head_nurse'],
  },
  { label: 'Quản lý điều dưỡng', icon: 'medical_services', path: '/nurses', roles: ['head_nurse'] },
  { label: 'Thống kê dữ liệu', icon: 'analytics', path: '/analytics', roles: ['head_nurse'] },

  // -------------------------------------------------------------------------
  // Admin only
  // -------------------------------------------------------------------------
  { label: 'Tổng quan', icon: 'dashboard', path: '/dashboard', roles: ['admin'] },
  { label: 'Quản lý điều dưỡng', icon: 'medical_services', path: '/nurses', roles: ['admin'] },
  { label: 'Nhật ký hoạt động', icon: 'history', path: '/logs', roles: ['admin'] },
  {
    label: 'Cài đặt hệ thống',
    icon: 'settings',
    path: '/settings',
    roles: ['admin'],
    dividerBefore: 'Cài đặt',
  },
]

// ---------------------------------------------------------------------------
// Tạm thời dùng cho dev — đổi giá trị này để test giao diện theo vai trò
// Thay bằng useRole() hook khi hệ thống phân quyền thật sẵn sàng
// ---------------------------------------------------------------------------
export const DEV_ROLE: UserRole = 'head_nurse'
