export interface QuestionOption {
  optionId: number
  optionText: string
  scoreValue: number
}

export interface SurveyQuestion {
  questionId: number
  questionText: string
  orderNumber: number | null
  isDefault: boolean
  options: QuestionOption[]
}

export interface CreateQuestionOptionPayload {
  optionText: string
  scoreValue: number
}

export interface CreateSurveyQuestionPayload {
  questionText: string
  orderNumber?: number
  isDefault: boolean
  options?: CreateQuestionOptionPayload[]
}

export interface UpdateSurveyQuestionPayload {
  questionText?: string
  orderNumber?: number
  isDefault?: boolean
}

export interface UpdateQuestionOptionPayload {
  optionText?: string
  scoreValue?: number
}
