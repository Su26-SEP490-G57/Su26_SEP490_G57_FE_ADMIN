import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { AuditLogFilters, PaginatedAuditLogs } from '../types'

export async function getAuditLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs> {
  const params = new URLSearchParams()

  if (filters.userId) params.append('userId', String(filters.userId))
  if (filters.entityType) params.append('entityType', filters.entityType)
  if (filters.entityId) params.append('entityId', filters.entityId)
  if (filters.startDate) params.append('startDate', filters.startDate)
  if (filters.endDate) params.append('endDate', filters.endDate)
  if (filters.limit) params.append('limit', String(filters.limit))
  if (filters.offset) params.append('offset', String(filters.offset))

  const response = await api.get(`/audit-logs?${params.toString()}`)
  return response.data
}

export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => getAuditLogs(filters),
  })
}
