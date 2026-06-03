import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '../types'
import { STORAGE_KEYS } from '../types'

interface AuthState {
  // accessToken chỉ lưu in-memory (không persist — bảo mật hơn)
  accessToken: string | null
  // userProfile persist vào localStorage để không mất khi refresh trang
  userProfile: UserProfile | null
  isLoading: boolean

  // Actions
  setAccessToken: (token: string | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  clearSession: () => void
}

// refreshToken lưu riêng ngoài Zustand (không đi qua state manager)
export const tokenStorage = {
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token: string) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
  clearRefreshToken: () => localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      userProfile: null,
      isLoading: true,

      setAccessToken: (accessToken) => set({ accessToken }),
      setUserProfile: (userProfile) => set({ userProfile }),
      setLoading: (isLoading) => set({ isLoading }),
      clearSession: () => {
        tokenStorage.clearRefreshToken()
        set({ accessToken: null, userProfile: null, isLoading: false })
      },
    }),
    {
      name: 'poms-auth',
      // Chỉ persist userProfile — accessToken không persist (in-memory only)
      partialize: (state) => ({ userProfile: state.userProfile }),
    },
  ),
)
