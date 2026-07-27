import { useEffect, useMemo, useState } from 'react'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import { api } from '../../../lib/api'

interface Answer {
  id: string
  label: string
  text: string
  score: number
}

interface Question {
  id: string
  order: number
  title: string
  isDefault: boolean
  answers: Answer[]
}

type SurveyOptionResponse = {
  optionId?: number
  id?: number
  optionText?: string
  text?: string
  scoreValue?: number
  score?: number
}

type SurveyQuestionResponse = {
  questionId?: number
  id?: number
  questionText?: string
  title?: string
  orderNumber?: number | null
  displayOrder?: number
  order?: number
  isDefault?: boolean
  options?: SurveyOptionResponse[]
  answers?: SurveyOptionResponse[]
}

type CreateQuestionPayload = {
  questionText: string
  orderNumber: number
  isDefault: boolean
  options: Array<{ optionText: string; scoreValue: number }>
}

function normalizeQuestion(item: SurveyQuestionResponse, index = 0): Question {
  const options = item.options ?? item.answers ?? []

  return {
    id: String(item.questionId ?? item.id ?? index),
    order: item.orderNumber ?? item.displayOrder ?? item.order ?? index + 1,
    title: item.questionText ?? item.title ?? '',
    isDefault: item.isDefault ?? false,
    answers: options.map((option, optionIndex) => ({
      id: String(option.optionId ?? option.id ?? `option-${optionIndex}`),
      label: String.fromCharCode(65 + optionIndex),
      text: option.optionText ?? option.text ?? '',
      score: option.scoreValue ?? option.score ?? 0,
    })),
  }
}

function normalizeQuestions(payload: unknown): Question[] {
  const wrapped = payload as { data?: unknown }
  const items = Array.isArray(payload) ? payload : wrapped.data
  return Array.isArray(items)
    ? items.map((item, index) => normalizeQuestion(item as SurveyQuestionResponse, index))
    : []
}

function createDraftQuestion(order: number): Question {
  return {
    id: `new-${crypto.randomUUID()}`,
    order,
    title: '',
    isDefault: false,
    answers: [
      { id: crypto.randomUUID(), label: 'A', text: '', score: 0 },
      { id: crypto.randomUUID(), label: 'B', text: '', score: 1 },
    ],
  }
}

function getValidationError(question: Question): string | null {
  if (!question.title.trim()) return 'Vui lòng nhập nội dung câu hỏi.'
  if (question.answers.length === 0) return 'Câu hỏi phải có ít nhất một phương án trả lời.'
  if (question.answers.some((answer) => !answer.text.trim()))
    return 'Vui lòng nhập nội dung cho tất cả phương án.'
  if (question.answers.some((answer) => !Number.isInteger(answer.score) || answer.score < 0)) {
    return 'Điểm của mỗi phương án phải là số nguyên không âm.'
  }
  return null
}

export function QuestionManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [originalQuestion, setOriginalQuestion] = useState<Question | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  useEffect(() => {
    async function loadQuestions() {
      try {
        const { data } = await api.get<unknown>('/symptom-surveys/questions')
        setQuestions(normalizeQuestions(data))
      } catch (error) {
        console.error('Error loading assessment questions:', error)
        setErrorMessage('Không thể tải bộ câu hỏi đánh giá. Vui lòng thử lại.')
      }
    }

    void loadQuestions()
  }, [])

  const hasChanges = useMemo(() => {
    if (!editingQuestion) return false
    return !originalQuestion || JSON.stringify(editingQuestion) !== JSON.stringify(originalQuestion)
  }, [editingQuestion, originalQuestion])

  const validationError = editingQuestion ? getValidationError(editingQuestion) : null

  function closeEditor() {
    setExpandedQuestionId(null)
    setEditingQuestion(null)
    setOriginalQuestion(null)
    setErrorMessage(null)
  }

  function handleToggleQuestion(question: Question) {
    if (expandedQuestionId === question.id) {
      if (!originalQuestion)
        setQuestions((current) => current.filter((item) => item.id !== question.id))
      closeEditor()
      return
    }

    setExpandedQuestionId(question.id)
    setEditingQuestion(structuredClone(question))
    setOriginalQuestion(structuredClone(question))
    setErrorMessage(null)
  }

  function handleAddNewQuestion() {
    if (!originalQuestion && editingQuestion) {
      setQuestions((current) => current.filter((question) => question.id !== editingQuestion.id))
    }

    const nextOrder = Math.max(0, ...questions.map((question) => question.order)) + 1
    const draft = createDraftQuestion(nextOrder)
    setQuestions((current) => [...current, draft])
    setExpandedQuestionId(draft.id)
    setEditingQuestion(draft)
    setOriginalQuestion(null)
    setErrorMessage(null)
  }

  async function refreshQuestion(questionId: string): Promise<Question> {
    const { data } = await api.get<SurveyQuestionResponse>(
      `/symptom-surveys/questions/${questionId}`,
    )
    return normalizeQuestion(data)
  }

  async function saveExistingQuestion(question: Question, original: Question) {
    await api.patch(`/symptom-surveys/questions/${question.id}`, {
      questionText: question.title.trim(),
      order_number: question.order,
      isDefault: question.isDefault,
    })

    const originalAnswers = new Map(original.answers.map((answer) => [answer.id, answer]))
    for (const answer of question.answers) {
      const previous = originalAnswers.get(answer.id)
      if (!previous) {
        await api.post(`/symptom-surveys/questions/${question.id}/options`, {
          optionText: answer.text.trim(),
          scoreValue: answer.score,
        })
        continue
      }
      if (previous.text !== answer.text || previous.score !== answer.score) {
        await api.patch(`/symptom-surveys/questions/${question.id}/options/${answer.id}`, {
          optionText: answer.text.trim(),
          scoreValue: answer.score,
        })
      }
    }

    return refreshQuestion(question.id)
  }

  async function handleSaveQuestion() {
    if (!editingQuestion || validationError) return

    setIsSaving(true)
    setErrorMessage(null)
    try {
      let saved: Question
      if (originalQuestion) {
        saved = await saveExistingQuestion(editingQuestion, originalQuestion)
      } else {
        const payload: CreateQuestionPayload = {
          questionText: editingQuestion.title.trim(),
          orderNumber: editingQuestion.order,
          isDefault: editingQuestion.isDefault,
          options: editingQuestion.answers.map((answer) => ({
            optionText: answer.text.trim(),
            scoreValue: answer.score,
          })),
        }
        const { data } = await api.post<SurveyQuestionResponse>(
          '/symptom-surveys/questions',
          payload,
        )
        saved = normalizeQuestion(data)
      }

      setQuestions((current) => {
        const exists = current.some((question) => question.id === editingQuestion.id)
        const next = exists
          ? current.map((question) => (question.id === editingQuestion.id ? saved : question))
          : [...current, saved]
        return [...next].sort((a, b) => a.order - b.order)
      })
      closeEditor()
    } catch (error) {
      console.error('Error saving assessment question:', error)
      setErrorMessage('Không thể lưu câu hỏi. Vui lòng kiểm tra quyền truy cập và thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancelEdit() {
    if (!originalQuestion && editingQuestion) {
      setQuestions((current) => current.filter((question) => question.id !== editingQuestion.id))
    }
    closeEditor()
  }

  function handleDeleteQuestion(question: Question) {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa câu hỏi',
      message: `Bạn có chắc chắn muốn xóa câu hỏi "${question.title || `Câu ${question.order}`}"?`,
      onConfirm: () => void executeDeleteQuestion(question),
    })
  }

  async function executeDeleteQuestion(question: Question) {
    if (question.id.startsWith('new-')) {
      setQuestions((current) => current.filter((item) => item.id !== question.id))
      setConfirmModal((current) => ({ ...current, isOpen: false }))
      closeEditor()
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    try {
      await api.delete(`/symptom-surveys/questions/${question.id}`)
      setQuestions((current) => current.filter((item) => item.id !== question.id))
      setConfirmModal((current) => ({ ...current, isOpen: false }))
      closeEditor()
    } catch (error) {
      console.error('Error deleting assessment question:', error)
      setConfirmModal((current) => ({ ...current, isOpen: false }))
      setErrorMessage(
        'Không thể xóa câu hỏi. Câu hỏi đã được dùng trong đánh giá sẽ không thể xóa.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const headerActions = useMemo(
    () => (
      <div className="relative w-96">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          search
        </span>
        <input
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-full text-sm focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Tìm kiếm câu hỏi..."
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>
    ),
    [searchQuery],
  )
  useHeaderActions(headerActions)

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions
    const query = searchQuery.toLowerCase()
    return questions.filter(
      (question) =>
        question.title.toLowerCase().includes(query) ||
        question.answers.some((answer) => answer.text.toLowerCase().includes(query)),
    )
  }, [questions, searchQuery])

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">Quản lý bộ câu hỏi đánh giá</h2>
          <p className="text-sm text-slate-500">
            Thiết lập các câu hỏi đánh giá triệu chứng lâm sàng cho bệnh nhân.
          </p>
        </div>
        <button
          onClick={handleAddNewQuestion}
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Thêm câu hỏi
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="space-y-4">
        {filteredQuestions.map((question) => {
          const isExpanded = expandedQuestionId === question.id
          const currentEdit =
            isExpanded && editingQuestion?.id === question.id ? editingQuestion : question

          return (
            <article
              key={question.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm transition-all"
            >
              <div
                onClick={() => handleToggleQuestion(question)}
                className="p-6 cursor-pointer hover:bg-slate-50"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-slate-400 font-bold">Câu {question.order}.</span>
                  <h4 className="font-bold text-slate-800">{question.title || 'Câu hỏi mới'}</h4>
                  <span
                    className={`material-symbols-outlined text-slate-400 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    expand_more
                  </span>
                </div>
                {!isExpanded && (
                  <div className="ml-8 grid grid-cols-2 md:grid-cols-3 gap-y-2">
                    {question.answers.map((answer) => (
                      <div key={answer.id} className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-400 mr-2">{answer.label}.</span>
                        {answer.text}
                        <span className="ml-2 text-slate-400">({answer.score} điểm)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isExpanded && editingQuestion && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="px-6 pb-6 space-y-6 border-t border-slate-100"
                >
                  <div className="pt-6 space-y-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Nội dung câu hỏi
                      </label>
                      <input
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        type="text"
                        value={currentEdit.title}
                        onChange={(event) =>
                          setEditingQuestion({ ...editingQuestion, title: event.target.value })
                        }
                        placeholder="Nhập nội dung câu hỏi"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700">
                      Các phương án trả lời
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {currentEdit.answers.map((answer, index) => (
                        <div key={answer.id} className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-slate-400 w-4">
                            {answer.label}.
                          </span>
                          <input
                            className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            type="text"
                            value={answer.text}
                            onChange={(event) => {
                              const answers = [...editingQuestion.answers]
                              answers[index] = { ...answers[index], text: event.target.value }
                              setEditingQuestion({ ...editingQuestion, answers })
                            }}
                            placeholder="Nhập câu trả lời"
                          />
                          <input
                            className="w-20 px-3 py-2 border-2 border-slate-300 rounded-lg text-sm text-center font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            type="number"
                            min="0"
                            step="1"
                            value={answer.score}
                            onChange={(event) => {
                              const answers = [...editingQuestion.answers]
                              answers[index] = {
                                ...answers[index],
                                score: Number(event.target.value),
                              }
                              setEditingQuestion({ ...editingQuestion, answers })
                            }}
                            aria-label={`Điểm phương án ${answer.label}`}
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const index = editingQuestion.answers.length
                          if (index < 26)
                            setEditingQuestion({
                              ...editingQuestion,
                              answers: [
                                ...editingQuestion.answers,
                                {
                                  id: `new-option-${crypto.randomUUID()}`,
                                  label: String.fromCharCode(65 + index),
                                  text: '',
                                  score: 0,
                                },
                              ],
                            })
                        }}
                        className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg py-2 text-blue-600 hover:bg-blue-50 text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-sm mr-2">add</span>Thêm câu
                        trả lời
                      </button>
                    </div>
                  </div>

                  {validationError && hasChanges && (
                    <p className="text-sm text-red-600">{validationError}</p>
                  )}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button
                      onClick={() => handleDeleteQuestion(question)}
                      disabled={isSaving}
                      className="px-6 py-2 rounded-lg text-red-600 font-medium hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>Xóa câu hỏi
                    </button>
                    {hasChanges && (
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 disabled:opacity-50"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => void handleSaveQuestion()}
                          disabled={isSaving || Boolean(validationError)}
                          className="px-8 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </article>
          )
        })}

        <button
          onClick={handleAddNewQuestion}
          disabled={isSaving}
          className="w-full border-2 border-dashed border-slate-300 rounded-xl py-4 hover:border-blue-500 hover:bg-blue-50/50 disabled:opacity-50 transition-all flex items-center justify-center gap-3 text-slate-400 hover:text-blue-600"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          <span className="text-sm font-semibold">Thêm câu hỏi mới</span>
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((current) => ({ ...current, isOpen: false }))}
      />
    </div>
  )
}
