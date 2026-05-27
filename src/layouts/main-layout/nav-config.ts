export type UserRole = 'head_nurse' | 'admin'

export interface NavItem {
  label: string
  icon: string
  path: string
  roles: UserRole[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Tổng quan',
    icon: 'dashboard',
    path: '/dashboard',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Bệnh nhân',
    icon: 'group',
    path: '/patients',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Theo dõi',
    icon: 'monitor_heart',
    path: '/monitoring',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Cảnh báo',
    icon: 'warning',
    path: '/alerts',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Phân tích',
    icon: 'analytics',
    path: '/analytics',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Theo dõi hồi phục',
    icon: 'healing',
    path: '/recovery',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Thông báo',
    icon: 'notifications',
    path: '/notifications',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Quản lý nhân viên',
    icon: 'badge',
    path: '/staff',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Cài đặt',
    icon: 'settings',
    path: '/settings',
    roles: ['head_nurse', 'admin'],
  },
]

// ---------------------------------------------------------------------------
// Tạm thời dùng cho dev — đổi giá trị này để test giao diện theo vai trò
// Thay bằng useRole() hook khi hệ thống phân quyền thật sẵn sàng
// ---------------------------------------------------------------------------
export const DEV_ROLE: UserRole = 'head_nurse'
