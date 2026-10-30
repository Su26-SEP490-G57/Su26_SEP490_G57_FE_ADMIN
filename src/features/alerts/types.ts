export type AlertType = 'RED' | 'YELLOW'

export interface AlertItem {
  alertId: number
  caseId: string
  assessmentId: number
  alertType: AlertType
  status: string
  isOverdue: boolean
  isAutoProgression: boolean
  triggeredAt: string | null
  handledAt: string | null
  nurseAction: string | null
  nursingNote: string | null
  handledByUserId: number | null
  closedAt: string | null
}

export interface PaginatedAlerts {
  data: AlertItem[]
  total: number
  page: number
  limit: number
}
