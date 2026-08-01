import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import type {
  CreateQuestionOptionPayload,
  CreateSurveyQuestionPayload,
  QuestionOption,
  SurveyQuestion,
  UpdateQuestionOptionPayload,
  UpdateSurveyQuestionPayload,
} from '../types'

export const questionKeys = {
  all: ['questions'] as const,
  lists: () => [...questionKeys.all, 'list'] as const,
  details: () => [...questionKeys.all, 'detail'] as const,
  detail: (id: number) => [...questionKeys.details(), id] as const,
}

// 1. Get all survey questions with options
export function useQuestions() {
  return useQuery({
    queryKey: questionKeys.lists(),
    queryFn: async () => {
      const response = await api.get<SurveyQuestion[]>('/symptom-surveys/questions')
      return response.data
    },
  })
}

// 2. Get single question with options
export function useQuestionDetail(questionId: number | null) {
  return useQuery({
    queryKey: questionKeys.detail(questionId ?? 0),
    queryFn: async () => {
      if (!questionId) return null
      const response = await api.get<SurveyQuestion>(`/symptom-surveys/questions/${questionId}`)
      return response.data
    },
    enabled: questionId !== null && questionId > 0,
  })
}

// 3. Create question (with optional inline options)
export function useCreateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateSurveyQuestionPayload) => {
      const response = await api.post<SurveyQuestion>('/symptom-surveys/questions', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all })
    },
  })
}

// 4. Update question
export function useUpdateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      questionId,
      data,
    }: {
      questionId: number
      data: UpdateSurveyQuestionPayload
    }) => {
      const response = await api.patch<SurveyQuestion>(
        `/symptom-surveys/questions/${questionId}`,
        data,
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all })
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(variables.questionId) })
    },
  })
}

// 5. Delete question
export function useDeleteQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (questionId: number) => {
      await api.delete(`/symptom-surveys/questions/${questionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all })
    },
  })
}

// 6. Add option to a question
export function useAddOption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      questionId,
      data,
    }: {
      questionId: number
      data: CreateQuestionOptionPayload
    }) => {
      const response = await api.post<QuestionOption>(
        `/symptom-surveys/questions/${questionId}/options`,
        data,
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all })
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(variables.questionId) })
    },
  })
}

// 7. Update option
export function useUpdateOption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      questionId,
      optionId,
      data,
    }: {
      questionId: number
      optionId: number
      data: UpdateQuestionOptionPayload
    }) => {
      const response = await api.patch<QuestionOption>(
        `/symptom-surveys/questions/${questionId}/options/${optionId}`,
        data,
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all })
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(variables.questionId) })
    },
  })
}

// 8. Delete option
export function useDeleteOption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ questionId, optionId }: { questionId: number; optionId: number }) => {
      await api.delete(`/symptom-surveys/questions/${questionId}/options/${optionId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all })
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(variables.questionId) })
    },
  })
}
