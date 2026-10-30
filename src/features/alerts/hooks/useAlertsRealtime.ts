import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { alertKeys } from '../api/alerts'
import { useAuthStore } from '../../auth/store/authStore'

const ALERTS_SOCKET_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/alerts`

// Mounted once at the app shell (MainLayout) so the bell badge stays correct
// no matter which page is open — unlike usePatientsRealtime, which is only
// mounted on PatientPage.
export function useAlertsRealtime() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    if (!accessToken) return

    const socket = io(ALERTS_SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
    })

    const invalidatePending = () => {
      void queryClient.invalidateQueries({ queryKey: alertKeys.pending() })
    }

    socket.on('alert.created', invalidatePending)
    socket.on('alert.handled', invalidatePending)

    return () => {
      socket.off('alert.created', invalidatePending)
      socket.off('alert.handled', invalidatePending)
      socket.disconnect()
    }
  }, [queryClient, accessToken])
}
