import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { nurseKeys } from '../api/nurses'
import { useAuthStore } from '../../auth/store/authStore'

const NURSES_SOCKET_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/nurses`

// Backend's NurseGateway emits `nurse.rooms.changed` (no payload — clients
// reload their own scope via the authenticated REST endpoint) whenever room
// assignments change. Previously nothing in FE_ADMIN listened for it, so if
// Nurse A's assignments changed while another tab/session had
// NurseAssignmentCell open for the same room, it stayed stale until an
// unrelated refetch. Mounted once in MainLayout, same pattern as
// usePatientsRealtime.
export function useNurseAssignmentsRealtime() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    if (!accessToken) return

    const socket = io(NURSES_SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
    })

    socket.on('nurse.rooms.changed', () => {
      void queryClient.invalidateQueries({ queryKey: nurseKeys.roomAssignments() })
    })

    return () => {
      socket.disconnect()
    }
  }, [queryClient, accessToken])
}
