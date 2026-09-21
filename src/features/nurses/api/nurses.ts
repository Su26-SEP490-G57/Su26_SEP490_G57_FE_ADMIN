import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type {
  CreateNurseInput,
  Nurse,
  PaginatedNurses,
  QueryNurseParams,
  UpdateNurseInput,
} from '../types'

export const nurseKeys = {
  all: ['nurses'] as const,
  lists: () => [...nurseKeys.all, 'list'] as const,
  list: (params: QueryNurseParams) => [...nurseKeys.lists(), params] as const,
  details: () => [...nurseKeys.all, 'detail'] as const,
  detail: (id: number) => [...nurseKeys.details(), id] as const,
  roomAssignments: () => [...nurseKeys.all, 'room-assignments'] as const,
  roomAssignment: (roomCode: string) => [...nurseKeys.roomAssignments(), roomCode] as const,
}

// 1. Get paginated nurses list
export function useNurses(params: QueryNurseParams = {}) {
  return useQuery({
    queryKey: nurseKeys.list(params),
    queryFn: async () => {
      const response = await api.get<PaginatedNurses>('/nurses', {
        params: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search || undefined,
        },
      })
      return response.data
    },
  })
}

// 2. Get single nurse details
export function useNurse(id: number | null) {
  return useQuery({
    queryKey: nurseKeys.detail(id ?? 0),
    queryFn: async () => {
      if (!id) return null
      const response = await api.get<Nurse>(`/nurses/${id}`)
      return response.data
    },
    enabled: id !== null && id > 0,
  })
}

// 3. Create a new nurse
export function useCreateNurse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateNurseInput) => {
      const response = await api.post<Nurse>('/nurses', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nurseKeys.lists() })
    },
  })
}

// 4. Update an existing nurse
export function useUpdateNurse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateNurseInput }) => {
      const response = await api.patch<Nurse>(`/nurses/${id}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: nurseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: nurseKeys.detail(variables.id) })
    },
  })
}

// 5. Delete (deactivate) a nurse
export function useDeleteNurse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete<Nurse>(`/nurses/${id}`)
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: nurseKeys.lists() })
      queryClient.invalidateQueries({ queryKey: nurseKeys.detail(id) })
    },
  })
}

// 6. Get assigned nurses for a room
export function useRoomAssignment(roomCode: string) {
  return useQuery({
    queryKey: nurseKeys.roomAssignment(roomCode),
    queryFn: async () => {
      const response = await api.get<number[]>(`/room-nurse-assignments/${roomCode}`)
      return response.data
    },
    enabled: !!roomCode,
  })
}

// 7. Assign nurse to room (POST /nurses/:id/assign-rooms)
export function useAssignNurseToRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nurseId, roomCode }: { nurseId: number; roomCode: string }) => {
      const response = await api.post(`/nurses/${nurseId}/assign-rooms`, {
        roomCodes: [roomCode],
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      // Invalidate room assignment cache
      queryClient.invalidateQueries({ queryKey: nurseKeys.roomAssignment(variables.roomCode) })
      // Also invalidate patients list to reflect changes
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}

// 8. Unassign nurse from room (DELETE /nurses/:id/rooms/:roomCode)
export function useUnassignNurseFromRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ nurseId, roomCode }: { nurseId: number; roomCode: string }) => {
      const response = await api.delete(`/nurses/${nurseId}/rooms/${roomCode}`)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: nurseKeys.roomAssignment(variables.roomCode) })
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}
