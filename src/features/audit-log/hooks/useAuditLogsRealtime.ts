import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../../auth/store/authStore'

/**
 * Real-time audit log hook - đơn giản nhất, copy pattern từ AlertGateway
 */
export function useAuditLogsRealtime() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const socket = io('http://localhost:3000/audit-logs', {
      transports: ['websocket'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[AuditLog WebSocket] Connected:', socket.id)
      setIsConnected(true)
    })

    socket.on('new-audit-log', (log) => {
      console.log('[AuditLog WebSocket] New log received:', log)
      // Invalidate và refetch ngay
      queryClient.invalidateQueries({
        queryKey: ['audit-logs'],
        refetchType: 'active',
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('[AuditLog WebSocket] Disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('[AuditLog WebSocket] Error:', error)
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [accessToken, queryClient])

  return { isConnected }
}
