import { useEffect, useRef, useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../../auth/store/authStore'
import type { AuditLog } from '../types'

interface UseAuditLogsRealtimeOptions {
  /**
   * Nếu true, thêm log mới vào cache thay vì invalidate toàn bộ query.
   * **Trade-off**: Optimistic update nhanh hơn nhưng có thể miss nếu
   * socket event đến trước khi initial fetch hoàn tất.
   */
  optimistic?: boolean
  /**
   * Callback được gọi khi nhận được log mới (để hiển thị toast notification)
   */
  onNewLog?: (log: AuditLog) => void
}

/**
 * React hook for real-time audit log streaming via WebSocket.
 *
 * **Features**:
 * - Auto-connect/disconnect based on auth state
 * - Auto-reconnect on connection loss
 * - Optimistic cache update (không chờ refetch)
 * - Duplicate prevention (dựa vào log.id)
 *
 * **Usage**:
 * ```tsx
 * useAuditLogsRealtime({
 *   optimistic: true,
 *   onNewLog: (log) => toast.info(`New ${log.action} by ${log.userFullName}`)
 * });
 * ```
 *
 * **Failure modes**:
 * - Nếu socket disconnect, queries vẫn fetch qua REST API
 * - Nếu backend chưa có user relation trong emitted log, username sẽ undefined
 *   (frontend có thể lookup từ user cache hoặc bỏ qua)
 */
export function useAuditLogsRealtime(options: UseAuditLogsRealtimeOptions = {}) {
  const { optimistic = true, onNewLog } = options
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const socketRef = useRef<Socket | null>(null)
  const processedLogIds = useRef(new Set<number>())
  const [isConnected, setIsConnected] = useState(false)

  const handleNewLog = useCallback(
    (newLog: AuditLog) => {
      // Duplicate prevention
      if (processedLogIds.current.has(newLog.id)) {
        return
      }
      processedLogIds.current.add(newLog.id)

      // Limit processed IDs cache size (keep last 100)
      if (processedLogIds.current.size > 100) {
        const idsArray = Array.from(processedLogIds.current)
        processedLogIds.current = new Set(idsArray.slice(-100))
      }

      // Optimistic update
      if (optimistic) {
        queryClient.setQueriesData<{ data: AuditLog[]; total: number }>(
          { queryKey: ['audit-logs'] },
          (oldData) => {
            if (!oldData) return oldData

            // Prevent duplicate in cache
            const exists = oldData.data.some((log) => log.id === newLog.id)
            if (exists) return oldData

            return {
              data: [newLog, ...oldData.data],
              total: oldData.total + 1,
            }
          },
        )
      } else {
        // Fallback: invalidate để refetch
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      }

      // Callback cho toast notification
      onNewLog?.(newLog)
    },
    [optimistic, queryClient, onNewLog],
  )

  useEffect(() => {
    // Không connect nếu chưa authenticated
    if (!accessToken) {
      return
    }

    const socket = io(
      `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'}/audit-logs`,
      {
        auth: { token: accessToken },
        transports: ['websocket'], // Force WebSocket (không fallback polling)
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      },
    )

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[AuditLog WebSocket] Connected')
      setIsConnected(true)
    })

    socket.on('new-audit-log', handleNewLog)

    socket.on('disconnect', (reason) => {
      console.warn('[AuditLog WebSocket] Disconnected:', reason)
      setIsConnected(false)
      // Socket.io sẽ tự động reconnect nếu reason !== 'io server disconnect'
    })

    socket.on('connect_error', (error) => {
      console.error('[AuditLog WebSocket] Connection error:', error.message)
      setIsConnected(false)
    })

    // Cleanup on unmount hoặc khi accessToken thay đổi
    return () => {
      socket.disconnect()
      socketRef.current = null
      processedLogIds.current.clear()
      setIsConnected(false)
    }
  }, [accessToken, handleNewLog])

  return { isConnected }
}
