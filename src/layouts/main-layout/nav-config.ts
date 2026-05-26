export type UserRole = 'nurse' | 'head_nurse' | 'admin'

export interface NavItem {
  label: string
  icon: string
  path: string
  roles: UserRole[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon: 'dashboard',
    path: '/dashboard',
    roles: ['nurse', 'head_nurse', 'admin'],
  },
  {
    label: 'Patients',
    icon: 'group',
    path: '/patients',
    roles: ['nurse', 'head_nurse', 'admin'],
  },
  {
    label: 'Monitoring',
    icon: 'monitor_heart',
    path: '/monitoring',
    roles: ['nurse', 'head_nurse', 'admin'],
  },
  {
    label: 'Alerts',
    icon: 'warning',
    path: '/alerts',
    roles: ['nurse', 'head_nurse', 'admin'],
  },
  {
    label: 'Analytics',
    icon: 'analytics',
    path: '/analytics',
    roles: ['nurse', 'head_nurse', 'admin'],
  },
  {
    label: 'Recovery Tracking',
    icon: 'healing',
    path: '/recovery',
    roles: ['nurse', 'head_nurse', 'admin'],
  },
  {
    label: 'Notifications',
    icon: 'notifications',
    path: '/notifications',
    roles: ['nurse', 'head_nurse', 'admin'],
  },
  {
    label: 'Staff Management',
    icon: 'badge',
    path: '/staff',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Settings',
    icon: 'settings',
    path: '/settings',
    roles: ['head_nurse', 'admin'],
  },
]

// Temporary role ['nurse', 'head_nurse', 'admin']
export const DEV_ROLE: UserRole = 'nurse'
