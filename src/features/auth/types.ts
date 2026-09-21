import type { UserRole } from '../../layouts/main-layout/nav-config'

export interface UserProfile {
  id: string
  username: string
  fullName: string
  role: UserRole
}

export interface LoginRequest {
  username: string
  password: string
}

// Backend trả `user.roles: string[]` (ví dụ `['Head_Nurse']`) — KHÔNG có
// field `role` số ít. FE lấy `roles[0]` làm vai trò chính rồi đi qua
// mapBackendRole() trước khi lưu vào store dưới dạng UserRole số ít của FE.
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: Omit<UserProfile, 'role'> & { roles: string[] }
}

export interface RefreshResponse {
  accessToken: string
}

// localStorage keys
export const STORAGE_KEYS = {
  REFRESH_TOKEN: 'poms_refresh_token',
} as const
