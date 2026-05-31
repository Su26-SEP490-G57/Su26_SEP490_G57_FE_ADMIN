import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '../constants/routes'
import { AuthGuard } from '../features/auth/components/AuthGuard'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import { AuthLayout } from '../layouts/auth-layout/AuthLayout'
import { MainLayout } from '../layouts/main-layout/MainLayout'

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 text-lg font-semibold text-slate-500">{title} — Đang phát triển</div>
)

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      </Route>

      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PATIENTS} element={<Placeholder title="Danh sách người bệnh" />} />
          <Route path={ROUTES.ALERTS} element={<Placeholder title="Cảnh báo (Alert)" />} />
          <Route path={ROUTES.MONITORING} element={<Placeholder title="Quản lý POD" />} />
          <Route path={ROUTES.RECOVERY} element={<Placeholder title="Đánh giá & Triệu chứng" />} />
          <Route path={ROUTES.ANALYTICS} element={<Placeholder title="Biểu đồ & Báo cáo" />} />
          <Route path={ROUTES.EXPORT} element={<Placeholder title="Xuất dữ liệu" />} />
          <Route path={ROUTES.NOTIFICATIONS} element={<Placeholder title="Thông báo" />} />
          <Route path={ROUTES.STAFF} element={<Placeholder title="Quản lý nhân viên" />} />
          <Route path={ROUTES.LOGS} element={<Placeholder title="Nhật ký hoạt động" />} />
          <Route path={ROUTES.SETTINGS} element={<Placeholder title="Cài đặt" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  )
}
