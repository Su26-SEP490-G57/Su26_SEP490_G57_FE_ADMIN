import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from '../layouts/main-layout/MainLayout'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { UsersPage } from '../pages/users/UsersPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
