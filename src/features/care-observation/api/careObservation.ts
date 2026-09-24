import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { CareSheet, CareSheetList, CareSheetPrefill, CreateCareSheetPayload } from '../types'

// Query key factory — model theo nurseKeys (src/features/nurses/api/nurses.ts).
// `patient(caseId)` là tiền tố chung: tạo chỉ định điều trị mới (đổi mức chăm
// sóc → đổi loại phiếu) chỉ cần invalidate tiền tố này.
export const careObservationKeys = {
  all: ['care-observation'] as const,
  patient: (caseId: string) => [...careObservationKeys.all, 'patient', caseId] as const,
  sheets: (caseId: string) => [...careObservationKeys.patient(caseId), 'sheets'] as const,
  prefill: (caseId: string) => [...careObservationKeys.patient(caseId), 'prefill'] as const,
}

// 1. Danh sách phiếu chăm sóc (lưu ở HIS) + bố cục form, mới nhất trước.
export function useCareSheets(caseId: string) {
  return useQuery({
    queryKey: careObservationKeys.sheets(caseId),
    queryFn: async () => {
      const response = await api.get<CareSheetList>(
        `/care-observation/patient/${encodeURIComponent(caseId)}/sheets`,
      )
      return response.data
    },
  })
}

// 2. Dữ liệu tự điền cho phiếu mới. staleTime 0 + gcTime 0: mỗi lần mở form
// đều lấy lại chỉ số sinh tồn / tờ số / loại phiếu mới nhất.
export function useCareSheetPrefill(caseId: string) {
  return useQuery({
    queryKey: careObservationKeys.prefill(caseId),
    queryFn: async () => {
      const response = await api.get<CareSheetPrefill>(
        `/care-observation/patient/${encodeURIComponent(caseId)}/sheet-prefill`,
      )
      return response.data
    },
    staleTime: 0,
    gcTime: 0,
  })
}

// 3. Điều dưỡng lưu phiếu chăm sóc (ghi sang HIS). Phiếu đã lưu không sửa được.
export function useCreateCareSheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ caseId, ...body }: CreateCareSheetPayload) => {
      const response = await api.post<CareSheet>(
        `/care-observation/patient/${encodeURIComponent(caseId)}/sheets`,
        body,
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: careObservationKeys.sheets(variables.caseId) })
    },
  })
}
