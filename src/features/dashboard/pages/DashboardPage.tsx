import { DEV_ROLE } from '../../../layouts/main-layout/nav-config'
import { AdminDashboard } from './AdminDashboard'
import { HeadNurseDashboard } from './HeadNurseDashboard'

export function DashboardPage() {
    if (DEV_ROLE === 'admin') return <AdminDashboard />
    return <HeadNurseDashboard />
}
