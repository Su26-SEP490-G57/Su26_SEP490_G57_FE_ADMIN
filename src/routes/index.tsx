import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ROUTES } from '../constants/routes'
import { AuthLayout } from '../layouts/auth-layout/AuthLayout'
import { MainLayout } from '../layouts/main-layout/MainLayout'
import { AuthGuard } from '../features/auth/components/AuthGuard'
import { RoleGuard } from '../features/auth/components/RoleGuard'
import { ErrorBoundary } from '../components/ErrorBoundary'

// Lazy-loaded page components (heavy routes)
const AnalyticsPage = lazy(() =>
  import('../features/analytics/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
)
const AuditLogPage = lazy(() =>
  import('../features/audit-log/pages/AuditLogPage').then((m) => ({ default: m.AuditLogPage })),
)
const LoginPage = lazy(() =>
  import('../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const NurseManagementPage = lazy(() =>
  import('../features/nurses/pages/NurseManagementPage').then((m) => ({
    default: m.NurseManagementPage,
  })),
)
const NutritionGuidePage = lazy(() =>
  import('../features/protocols/pages/NutritionGuidePage').then((m) => ({
    default: m.NutritionGuidePage,
  })),
)
const PatientPage = lazy(() =>
  import('../features/patients/pages/PatientPage').then((m) => ({ default: m.PatientPage })),
)
const ProtocolsPage = lazy(() =>
  import('../features/protocols/pages/ProtocolsPage').then((m) => ({ default: m.ProtocolsPage })),
)
const QuestionManagementPage = lazy(() =>
  import('../features/protocols/pages/QuestionManagementPage').then((m) => ({
    default: m.QuestionManagementPage,
  })),
)
const RecoveryPage = lazy(() =>
  import('../features/recovery/pages/RecoveryPage').then((m) => ({ default: m.RecoveryPage })),
)

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 text-lg font-semibold text-slate-500">{title} — Đang phát triển</div>
)

// Loading fallback for lazy routes
const LoadingFallback = () => (
  <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

// Wrapper with Suspense + a per-page ErrorBoundary — a crash in one page no
// longer blanks the whole dashboard (react-router-dom's `errorElement` isn't
// available here since this app uses <Routes>, not createBrowserRouter).
const LazyRoute = ({ Component, label }: { Component: React.ComponentType; label?: string }) => (
  <ErrorBoundary label={label}>
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  </ErrorBoundary>
)

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LazyRoute Component={LoginPage} />} />
      </Route>

      <Route element={<AuthGuard />}>
        <Route element={<MainLayout />}>
          {/* Redirect dashboard về patients (temporary) */}
          <Route path={ROUTES.DASHBOARD} element={<Navigate to={ROUTES.PATIENTS} replace />} />

          {/* ADMIN-only routes */}
          <Route element={<RoleGuard roles={['admin']} />}>
            <Route
              path={ROUTES.AUDIT_LOGS}
              element={<LazyRoute Component={AuditLogPage} label="Nhật ký kiểm toán" />}
            />
          </Route>

          {/* Non-ADMIN routes (NURSE, HEAD_NURSE, DOCTOR) */}
          <Route element={<RoleGuard roles={['nurse', 'head_nurse', 'doctor']} />}>
            <Route
              path={ROUTES.PATIENTS}
              element={<LazyRoute Component={PatientPage} label="Danh sách bệnh nhân" />}
            />
            <Route
              path={ROUTES.PROTOCOLS}
              element={<LazyRoute Component={ProtocolsPage} label="Phác đồ" />}
            />
            <Route
              path={ROUTES.PROTOCOL_NUTRITION}
              element={<LazyRoute Component={NutritionGuidePage} label="Hướng dẫn dinh dưỡng" />}
            />
            <Route
              path={ROUTES.QUESTIONS}
              element={<LazyRoute Component={QuestionManagementPage} label="Quản lý câu hỏi" />}
            />
            <Route
              path={ROUTES.ANALYTICS}
              element={<LazyRoute Component={AnalyticsPage} label="Thống kê dữ liệu" />}
            />
            <Route
              path={ROUTES.RECOVERY}
              element={<LazyRoute Component={RecoveryPage} label="Phục hồi" />}
            />
            <Route
              path={ROUTES.NURSES}
              element={<LazyRoute Component={NurseManagementPage} label="Quản lý điều dưỡng" />}
            />
            <Route path={ROUTES.LOGS} element={<Placeholder title="Nhật ký hoạt động" />} />
            <Route path={ROUTES.SETTINGS} element={<Placeholder title="Cài đặt" />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  )
}
