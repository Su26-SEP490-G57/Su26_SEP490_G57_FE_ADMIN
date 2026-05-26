import { DEV_ROLE } from '../../../layouts/main-layout/nav-config'
import { AdminDashboard } from './AdminDashboard'
import { HeadNurseDashboard } from './HeadNurseDashboard'
import { NurseDashboard } from './NurseDashboard'

export function DashboardPage() {
    if (DEV_ROLE === 'admin') return <AdminDashboard />
    if (DEV_ROLE === 'head_nurse') return <HeadNurseDashboard />
    return <NurseDashboard />
}
