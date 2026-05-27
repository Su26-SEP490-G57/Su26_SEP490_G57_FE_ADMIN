import type { User } from 'firebase/auth'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '../../../layouts/main-layout/nav-config'

interface AuthState {
  user: User | null
  role: UserRole | null
  isLoading: boolean

  // Actions
  setUser: (user: User | null) => void
  setRole: (role: UserRole | null) => void
  setLoading: (loading: boolean) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setRole: (role) => set({ role }),
      setLoading: (isLoading) => set({ isLoading }),
      clearSession: () => set({ user: null, role: null, isLoading: false }),
    }),
    {
      name: 'poms-auth',
      // Chỉ persist role, không persist user object (Firebase tự quản lý session)
      partialize: (state) => ({ role: state.role }),
    },
  ),
)
