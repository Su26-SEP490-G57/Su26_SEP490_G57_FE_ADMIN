import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { patientKeys } from '../../patients/api/patientApi'
import type { AlertItem, PaginatedAlerts } from '../types'

export const alertKeys = {
  all: ['alerts'] as const,
  pending: () => [...alertKeys.all, 'pending'] as const,
}

async function getPendingAlerts(): Promise<PaginatedAlerts> {
  const { data } = await api.get<PaginatedAlerts>('/alerts', {
    params: { status: 'PENDING_REVIEW', limit: 50 },
  })
  return data
}

async function acknowledgeAlert(alertId: number): Promise<AlertItem> {
  const { data } = await api.patch<AlertItem>(`/alerts/${alertId}/acknowledge`)
  return data
}

// Polling fallback on top of useAlertsRealtime's socket invalidation — keeps
// the bell correct even if the /alerts socket briefly drops.
export function usePendingAlerts() {
  return useQuery({
    queryKey: alertKeys.pending(),
    queryFn: getPendingAlerts,
    refetchInterval: 60_000,
  })
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: alertKeys.pending() })
      // Board's lock/color state can change once the alert backing it is handled.
      void queryClient.invalidateQueries({ queryKey: patientKeys.all })
    },
  })
}
