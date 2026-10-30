import { useToastStore } from '../lib/toastStore'
import { Toast } from './Toast'

/** Mounted once in MainLayout so any global error (query-client.ts) or ad-hoc `push()` call surfaces here. */
export function ToastContainer() {
  const head = useToastStore((state) => state.toasts[0])
  const dismiss = useToastStore((state) => state.dismiss)

  if (!head) return null

  return <Toast message={head.message} type="error" onClose={() => dismiss(head.id)} />
}
