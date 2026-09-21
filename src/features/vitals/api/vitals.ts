import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { CreateVitalSignPayload, PaginatedVitalSigns, VitalSignRecord } from '../types'

// Query key factory — model theo nurseKeys (src/features/nurses/api/nurses.ts).
export const vitalsKeys = {
  all: ['vital-signs'] as const,
  histories: () => [...vitalsKeys.all, 'history'] as const,
  history: (caseId: string) => [...vitalsKeys.histories(), caseId] as const,
}

// 1. Lịch sử chỉ số của 1 bệnh nhân (mới nhất trước — backend đã sắp xếp).
export function useVitalsHistory(caseId: string | null) {
  return useQuery({
    queryKey: vitalsKeys.history(caseId ?? ''),
    queryFn: async () => {
      if (!caseId) return null
      const response = await api.get<PaginatedVitalSigns>(
        `/vital-signs/patient/${encodeURIComponent(caseId)}`,
        { params: { page: 1, limit: 50 } },
      )
      return response.data
    },
    enabled: !!caseId,
  })
}

// 2. Ghi nhận 1 lần đo mới.
export function useRecordVitals() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateVitalSignPayload) => {
      const response = await api.post<VitalSignRecord>('/vital-signs', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vitalsKeys.history(variables.caseId) })
    },
  })
}
