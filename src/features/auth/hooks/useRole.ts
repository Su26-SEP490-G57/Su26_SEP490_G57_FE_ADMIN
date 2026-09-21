import type { UserRole } from '../../../layouts/main-layout/nav-config'
import { useAuthStore } from '../store/authStore'

// Vai trò của người đang đăng nhập — null khi chưa đăng nhập / chưa có profile.
export function useRole(): UserRole | null {
  return useAuthStore((s) => s.userProfile?.role ?? null)
}

// Kiểm tra vai trò hiện tại có nằm trong danh sách cho phép hay không.
export function useHasRole(...roles: UserRole[]): boolean {
  const role = useRole()
  return role !== null && roles.includes(role)
}
