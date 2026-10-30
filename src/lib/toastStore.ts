import { create } from 'zustand'

export interface ToastItem {
  id: number
  message: string
}

interface ToastState {
  toasts: ToastItem[]
  push: (message: string) => void
  dismiss: (id: number) => void
}

let nextId = 1

// Queue backing the existing presentational <Toast> component (src/components/Toast.tsx),
// which previously had no global caller — used by query-client.ts's error
// handler and anywhere else that needs a non-blocking notification instead of
// the blocking `AlertModal`. Auto-dismiss timing lives in <Toast> itself
// (its own setTimeout -> onClose), not here, so only one entry is ever shown
// at a time (ToastContainer renders the head of the queue). Every caller so
// far is an error path — add a `variant` back if a non-error toast shows up.
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message) => {
    const id = nextId++
    set((state) => ({ toasts: [...state.toasts, { id, message }] }))
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
