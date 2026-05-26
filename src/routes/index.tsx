import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { AuthGuard } from '../features/auth/components/AuthGuard'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { AuthLayout } from '../layouts/auth-layout/AuthLayout'
import { MainLayout } from '../layouts/main-layout/MainLayout'

export function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>

      {/* Protected routes */}
      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          {/* Placeholder routes — sẽ thêm page thật sau */}
          <Route path={ROUTES.PATIENTS} element={<div className="p-8 text-lg font-semibold text-[#424753]">Patients — Coming soon</div>} />
          <Route path={ROUTES.MONITORING} element={<div className="p-8 text-lg font-semibold text-[#424753]">Monitoring — Coming soon</div>} />
          <Route path={ROUTES.ALERTS} element={<div className="p-8 text-lg font-semibold text-[#424753]">Alerts — Coming soon</div>} />
          <Route path={ROUTES.ANALYTICS} element={<div className="p-8 text-lg font-semibold text-[#424753]">Analytics — Coming soon</div>} />
          <Route path={ROUTES.RECOVERY} element={<div className="p-8 text-lg font-semibold text-[#424753]">Recovery Tracking — Coming soon</div>} />
          <Route path={ROUTES.NOTIFICATIONS} element={<div className="p-8 text-lg font-semibold text-[#424753]">Notifications — Coming soon</div>} />
          <Route path={ROUTES.STAFF} element={<div className="p-8 text-lg font-semibold text-[#424753]">Staff Management — Coming soon</div>} />
          <Route path={ROUTES.SETTINGS} element={<div className="p-8 text-lg font-semibold text-[#424753]">Settings — Coming soon</div>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  )
}
