import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { careObservationKeys } from '../../care-observation/api/careObservation'
import { patientKeys } from '../../patients/api/patientApi'
import type { CreateTreatmentOrderPayload, TreatmentOrder } from '../types'

// Query key factory — model theo nurseKeys (src/features/nurses/api/nurses.ts).
export const treatmentOrderKeys = {
  all: ['treatment-orders'] as const,
  histories: () => [...treatmentOrderKeys.all, 'history'] as const,
  history: (caseId: string) => [...treatmentOrderKeys.histories(), caseId] as const,
}

// 1. Lịch sử chỉ định điều trị của 1 bệnh nhân (mới nhất trước).
export function useTreatmentOrderHistory(caseId: string | null) {
  return useQuery({
    queryKey: treatmentOrderKeys.history(caseId ?? ''),
    queryFn: async () => {
      if (!caseId) return null
      const response = await api.get<TreatmentOrder[]>(
        `/treatment-orders/patient/${encodeURIComponent(caseId)}`,
      )
      return response.data
    },
    enabled: !!caseId,
  })
}

// 2. Bác sĩ tạo chỉ định điều trị. Tạo xong backend cập nhật activeCareLevel của
// bệnh nhân VÀ tự giao lại phiếu theo dõi -> invalidate cả 2 nhánh query.
export function useCreateTreatmentOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateTreatmentOrderPayload) => {
      const response = await api.post<TreatmentOrder>('/treatment-orders', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.history(variables.caseId) })
      // Overview lấy activeCareLevel từ danh sách bệnh nhân
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() })
      queryClient.invalidateQueries({ queryKey: careObservationKeys.sheet(variables.caseId) })
    },
  })
}
