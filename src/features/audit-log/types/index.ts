export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT'

export interface AuditLog {
  id: number
  userId: number
  username: string
  userFullName: string
  action: AuditAction
  entityType: string
  entityId: string
  changes: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
  } | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditLogFilters {
  userId?: number
  entityType?: string
  entityId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface PaginatedAuditLogs {
  data: AuditLog[]
  total: number
  limit: number
  offset: number
}
