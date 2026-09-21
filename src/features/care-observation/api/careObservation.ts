import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type { CareLevel } from '../../treatment-orders/types'
import type {
  CareObservationInputType,
  CareObservationItem,
  CareObservationSheet,
  SubmitCareObservationPayload,
} from '../types'

// Query key factory — model theo nurseKeys (src/features/nurses/api/nurses.ts).
export const careObservationKeys = {
  all: ['care-observation'] as const,
  sheets: () => [...careObservationKeys.all, 'sheet'] as const,
  sheet: (caseId: string) => [...careObservationKeys.sheets(), caseId] as const,
  myTasks: () => [...careObservationKeys.all, 'tasks', 'mine'] as const,
}

// ---------------------------------------------------------------------------
// Mapper wire shape (backend) -> CareObservationSheet.
// Backend đang xây song song: đây là NƠI DUY NHẤT cần sửa nếu response lệch.
// Mọi truy cập field đều optional-chaining để response hơi khác không crash UI.
// ---------------------------------------------------------------------------
interface RawChecklistItem {
  key?: string
  id?: string | number
  label?: string
  inputType?: string
  options?: string[]
}

interface RawEntry {
  entryId?: number
  findings?: Record<string, string>
  observedAt?: string
}

interface RawTaskResponse {
  taskId?: number
  caseId?: string
  careLevelAtAssignment?: CareLevel | null
  status?: string
  completedAt?: string | null
  template?: {
    code?: string
    name?: string
    checklistItems?: RawChecklistItem[]
  }
  entries?: RawEntry[]
}

const VALID_INPUT_TYPES: CareObservationInputType[] = ['checkbox', 'text', 'number', 'select']

function toInputType(raw?: string): CareObservationInputType {
  const value = (raw ?? '').toLowerCase() as CareObservationInputType
  return VALID_INPUT_TYPES.includes(value) ? value : 'text'
}

function latestFindings(entries?: RawEntry[]): Record<string, string> {
  if (!entries || entries.length === 0) return {}
  // Backend trả entries mới nhất trước; phòng trường hợp ngược lại thì so sánh
  // observedAt khi có.
  const sorted = [...entries].sort(
    (a, b) => new Date(b.observedAt ?? 0).getTime() - new Date(a.observedAt ?? 0).getTime(),
  )
  return sorted[0]?.findings ?? {}
}

export function toCareObservationSheet(
  raw: RawTaskResponse | null | undefined,
  caseId: string,
): CareObservationSheet | null {
  if (!raw || raw.taskId === undefined || raw.taskId === null) return null

  const findings = latestFindings(raw.entries)
  const items: CareObservationItem[] = (raw.template?.checklistItems ?? []).map((item, index) => {
    const id = String(item.key ?? item.id ?? index)
    return {
      id,
      label: item.label ?? id,
      inputType: toInputType(item.inputType),
      options: item.options,
      value: findings[id] ?? '',
    }
  })

  return {
    id: raw.taskId,
    caseId: raw.caseId ?? caseId,
    careLevel: raw.careLevelAtAssignment ?? null,
    sheetType: raw.template?.name ?? raw.template?.code ?? 'Phiếu theo dõi chăm sóc',
    items,
    isComplete: raw.status === 'COMPLETED',
    completedAt: raw.completedAt ?? null,
  }
}

// 1. Phiếu theo dõi đang được giao cho 1 bệnh nhân.
export function useAssignedCareObservationSheet(caseId: string | null) {
  return useQuery({
    queryKey: careObservationKeys.sheet(caseId ?? ''),
    queryFn: async () => {
      if (!caseId) return null
      const response = await api.get<RawTaskResponse>(
        `/care-observation/tasks/patient/${encodeURIComponent(caseId)}`,
      )
      return toCareObservationSheet(response.data, caseId)
    },
    enabled: !!caseId,
  })
}

// 2. Ghi nhận 1 lần theo dõi vào phiếu đang mở.
export function useSubmitCareObservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sheetId, entries, note }: SubmitCareObservationPayload) => {
      const response = await api.post(`/care-observation/tasks/${sheetId}/entries`, {
        findings: entries,
        note,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: careObservationKeys.sheet(variables.caseId) })
      queryClient.invalidateQueries({ queryKey: careObservationKeys.myTasks() })
    },
  })
}
