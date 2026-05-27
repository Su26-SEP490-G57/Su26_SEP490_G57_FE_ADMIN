export type UserRole = 'head_nurse' | 'admin'

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
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Patients',
    icon: 'group',
    path: '/patients',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Monitoring',
    icon: 'monitor_heart',
    path: '/monitoring',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Alerts',
    icon: 'warning',
    path: '/alerts',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Analytics',
    icon: 'analytics',
    path: '/analytics',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Recovery Tracking',
    icon: 'healing',
    path: '/recovery',
    roles: ['head_nurse', 'admin'],
  },
  {
    label: 'Notifications',
    icon: 'notifications',
    path: '/notifications',
    roles: ['head_nurse', 'admin'],
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

// Temporary role ['admin', 'head_nurse']
export const DEV_ROLE: UserRole = 'head_nurse'
