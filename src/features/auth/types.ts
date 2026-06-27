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

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: UserProfile
}

export interface RefreshResponse {
  accessToken: string
}

// localStorage keys
export const STORAGE_KEYS = {
  REFRESH_TOKEN: 'poms_refresh_token',
} as const
