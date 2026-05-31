export type UserRole = 'head_nurse' | 'admin'

export interface NavItem {
  label: string
  icon: string
  path: string
  roles: UserRole[]
  badge?: number
  dividerBefore?: string
}

export const NAV_ITEMS: NavItem[] = [
  // -------------------------------------------------------------------------
  // Head Nurse only
  // -------------------------------------------------------------------------
  { label: 'Tổng quan', icon: 'dashboard', path: '/dashboard', roles: ['head_nurse'] },
  { label: 'Danh sách người bệnh', icon: 'group', path: '/patients', roles: ['head_nurse'] },
  { label: 'Cảnh báo (Alert)', icon: 'notifications', path: '/alerts', roles: ['head_nurse'], badge: 3 },
  { label: 'Quản lý POD', icon: 'task', path: '/monitoring', roles: ['head_nurse'] },
  { label: 'Đánh giá & Triệu chứng', icon: 'assignment', path: '/recovery', roles: ['head_nurse'] },
  { label: 'Biểu đồ & Báo cáo', icon: 'analytics', path: '/analytics', roles: ['head_nurse'] },
  { label: 'Xuất dữ liệu', icon: 'file_export', path: '/export', roles: ['head_nurse'], dividerBefore: 'Cài đặt'  },
  { label: 'Quản lý nhân viên', icon: 'badge', path: '/staff', roles: ['head_nurse'] },
  { label: 'Thông báo', icon: 'campaign', path: '/notifications', roles: ['head_nurse'] },


  // -------------------------------------------------------------------------
  // Admin only
  // -------------------------------------------------------------------------
  { label: 'Tổng quan', icon: 'dashboard', path: '/dashboard', roles: ['admin'] },
  { label: 'Quản lý người dùng', icon: 'manage_accounts', path: '/staff', roles: ['admin'] },
  { label: 'Nhật ký hoạt động', icon: 'history', path: '/logs', roles: ['admin'] },
  { label: 'Thông báo', icon: 'campaign', path: '/notifications', roles: ['admin'] },
  { label: 'Cài đặt hệ thống', icon: 'settings', path: '/settings', roles: ['admin'], dividerBefore: 'Cài đặt' },
]

// ---------------------------------------------------------------------------
// Tạm thời dùng cho dev — đổi giá trị này để test giao diện theo vai trò
// Thay bằng useRole() hook khi hệ thống phân quyền thật sẵn sàng
// ---------------------------------------------------------------------------
export const DEV_ROLE: UserRole = 'head_nurse'
