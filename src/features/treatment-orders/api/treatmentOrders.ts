import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { careObservationKeys } from '../../care-observation/api/careObservation'
import { patientKeys } from '../../patients/api/patientApi'
import type {
  CreateTreatmentOrderPayload,
  TreatmentOrder,
  TreatmentSheet,
  TreatmentSheetPrefill,
} from '../types'

// Query key factory — model theo nurseKeys (src/features/nurses/api/nurses.ts).
export const treatmentOrderKeys = {
  all: ['treatment-orders'] as const,
  histories: () => [...treatmentOrderKeys.all, 'history'] as const,
  history: (caseId: string) => [...treatmentOrderKeys.histories(), caseId] as const,
  sheets: (caseId: string) => [...treatmentOrderKeys.all, 'sheets', caseId] as const,
  prefill: (caseId: string) => [...treatmentOrderKeys.all, 'sheet-prefill', caseId] as const,
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

// 2. Các trường tự điền cho phiếu mới. staleTime 0 + gcTime 0: mỗi lần mở form
// đều lấy lại chỉ số sinh tồn / tờ số mới nhất.
export function useTreatmentSheetPrefill(caseId: string) {
  return useQuery({
    queryKey: treatmentOrderKeys.prefill(caseId),
    queryFn: async () => {
      const response = await api.get<TreatmentSheetPrefill>(
        `/treatment-orders/patient/${encodeURIComponent(caseId)}/sheet-prefill`,
      )
      return response.data
    },
    staleTime: 0,
    gcTime: 0,
  })
}

// 3. Danh sách phiếu theo dõi điều trị (lưu ở HIS), mới nhất trước.
export function useTreatmentSheets(caseId: string) {
  return useQuery({
    queryKey: treatmentOrderKeys.sheets(caseId),
    queryFn: async () => {
      const response = await api.get<TreatmentSheet[]>(
        `/treatment-orders/patient/${encodeURIComponent(caseId)}/sheets`,
      )
      return response.data
    },
  })
}

// 4. Bác sĩ lưu phiếu theo dõi điều trị (kèm mức chăm sóc). Tạo xong backend
// cập nhật activeCareLevel của bệnh nhân, tự giao lại phiếu theo dõi chăm sóc
// VÀ ghi phiếu sang HIS -> invalidate cả các nhánh query đó.
export function useCreateTreatmentOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateTreatmentOrderPayload) => {
      const response = await api.post<TreatmentOrder>('/treatment-orders', data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.history(variables.caseId) })
      queryClient.invalidateQueries({ queryKey: treatmentOrderKeys.sheets(variables.caseId) })
      // Overview lấy activeCareLevel từ danh sách bệnh nhân
      queryClient.invalidateQueries({ queryKey: patientKeys.lists() })
      queryClient.invalidateQueries({ queryKey: careObservationKeys.patient(variables.caseId) })
    },
  })
}
