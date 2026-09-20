import { useEffect, useMemo, useState } from 'react'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import { api } from '../../../lib/api'

type TriageLevel = 'GREEN' | 'YELLOW' | 'RED'

interface Answer {
  id: string
  label: string
  text: string
  triageLevel: TriageLevel | null
  optionDefinition: string
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
  optionTriageLevel?: TriageLevel | null
  optionDefinition?: string | null
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
  options: Array<{ optionText: string; optionTriageLevel: TriageLevel; optionDefinition?: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TRIAGE_CONFIG: Record<
  TriageLevel,
  { label: string; bg: string; text: string; border: string; ring: string }
> = {
  GREEN: {
    label: 'Xanh',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-300',
    ring: 'ring-green-400',
  },
  YELLOW: {
    label: 'Vàng',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    ring: 'ring-yellow-400',
  },
  RED: {
    label: 'Đỏ',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
    ring: 'ring-red-400',
  },
}

function TriageSelector({
  value,
  onChange,
  disabled,
}: {
  value: TriageLevel | null
  onChange: (v: TriageLevel) => void
  disabled?: boolean
}) {
  return (
    <div className="flex gap-1">
      {(['GREEN', 'YELLOW', 'RED'] as const).map((level) => {
        const cfg = TRIAGE_CONFIG[level]
        const isSelected = value === level
        return (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level)}
            title={cfg.label}
            className={`px-2.5 py-1 rounded text-xs font-bold border transition-all disabled:opacity-50 ${
              isSelected
                ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ${cfg.ring}`
                : `bg-white text-slate-400 border-slate-200 hover:${cfg.bg} hover:${cfg.text} hover:${cfg.border}`
            }`}
          >
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
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
      triageLevel: option.optionTriageLevel ?? null,
      optionDefinition: option.optionDefinition ?? '',
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
      { id: crypto.randomUUID(), label: 'A', text: '', triageLevel: null, optionDefinition: '' },
      { id: crypto.randomUUID(), label: 'B', text: '', triageLevel: null, optionDefinition: '' },
    ],
  }
}

function getValidationError(question: Question): string | null {
  if (!question.title.trim()) return 'Vui lòng nhập nội dung câu hỏi.'
  if (question.answers.length === 0) return 'Câu hỏi phải có ít nhất một phương án trả lời.'
  if (question.answers.some((a) => !a.text.trim()))
    return 'Vui lòng nhập nội dung cho tất cả phương án.'
  if (question.answers.some((a) => a.triageLevel === null))
    return 'Vui lòng chọn mức cảnh báo (Xanh / Vàng / Đỏ) cho tất cả phương án.'
  return null
}

function TriageBadge({ level }: { level: TriageLevel | null }) {
  if (!level) return <span className="text-[10px] text-slate-400 italic">Chưa cấu hình</span>
  const cfg = TRIAGE_CONFIG[level]
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border} border`}
    >
      {cfg.label}
    </span>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

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
    const nextOrder = Math.max(0, ...questions.map((q) => q.order)) + 1
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

    const originalAnswers = new Map(original.answers.map((a) => [a.id, a]))

    for (const answer of question.answers) {
      const previous = originalAnswers.get(answer.id)
      if (!previous) {
        // Đáp án mới — tạo option với optionTriageLevel
        await api.post(`/symptom-surveys/questions/${question.id}/options`, {
          optionText: answer.text.trim(),
          optionTriageLevel: answer.triageLevel as TriageLevel,
          ...(answer.optionDefinition.trim() && {
            optionDefinition: answer.optionDefinition.trim(),
          }),
        })
        continue
      }
      // Chỉ PATCH khi có thay đổi thực sự
      if (
        previous.text !== answer.text ||
        previous.triageLevel !== answer.triageLevel ||
        previous.optionDefinition !== answer.optionDefinition
      ) {
        await api.patch(`/symptom-surveys/questions/${question.id}/options/${answer.id}`, {
          optionText: answer.text.trim(),
          optionTriageLevel: answer.triageLevel as TriageLevel,
          ...(answer.optionDefinition.trim() && {
            optionDefinition: answer.optionDefinition.trim(),
          }),
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
          options: editingQuestion.answers.map((a) => ({
            optionText: a.text.trim(),
            optionTriageLevel: a.triageLevel as TriageLevel,
            ...(a.optionDefinition.trim() && { optionDefinition: a.optionDefinition.trim() }),
          })),
        }
        const { data } = await api.post<SurveyQuestionResponse>(
          '/symptom-surveys/questions',
          payload,
        )
        saved = normalizeQuestion(data)
      }

      setQuestions((current) => {
        const exists = current.some((q) => q.id === editingQuestion.id)
        const next = exists
          ? current.map((q) => (q.id === editingQuestion.id ? saved : q))
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
      setQuestions((current) => current.filter((q) => q.id !== editingQuestion.id))
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

      {/* Chú thích mức cảnh báo */}
      <div className="flex items-center gap-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-500 shrink-0">Mức cảnh báo:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-green-700 font-medium">Xanh</span>
          <span className="text-slate-400 ml-1">— không kích cảnh báo</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="text-yellow-700 font-medium">Vàng</span>
          <span className="text-slate-400 ml-1">— kích cảnh báo vàng</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-red-700 font-medium">Đỏ</span>
          <span className="text-slate-400 ml-1">— kích cảnh báo đỏ (ưu tiên cao nhất)</span>
        </span>
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
              {/* Header câu hỏi */}
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

                {/* Preview đáp án khi thu gọn */}
                {!isExpanded && (
                  <div className="ml-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                    {question.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <span className="font-semibold text-slate-400 shrink-0">
                          {answer.label}.
                        </span>
                        <span className="truncate">{answer.text}</span>
                        <TriageBadge level={answer.triageLevel} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form chỉnh sửa */}
              {isExpanded && editingQuestion && (
                <div
                  onClick={(event) => event.stopPropagation()}
                  className="px-6 pb-6 space-y-5 border-t border-slate-200 bg-slate-50/30"
                >
                  {/* Nội dung câu hỏi */}
                  <div className="pt-6 space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nội dung câu hỏi</label>
                    <input
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      type="text"
                      value={currentEdit.title}
                      onChange={(event) =>
                        setEditingQuestion({ ...editingQuestion, title: event.target.value })
                      }
                      placeholder="Ví dụ: Bạn có triệu chứng nôn không?"
                    />
                  </div>

                  {/* Danh sách đáp án */}
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-slate-700">
                      Các phương án trả lời
                    </label>

                    {/* Grid 2 cột */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentEdit.answers.map((answer, index) => (
                        <div
                          key={answer.id}
                          className="rounded-lg border border-slate-200 bg-white p-3 hover:border-slate-300 transition-colors"
                        >
                          {/* Label + Input + Delete */}
                          <div className="flex items-start gap-2 mb-2">
                            <span className="mt-2 text-sm font-bold text-slate-500 w-6 shrink-0">
                              {answer.label}.
                            </span>
                            <input
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                              type="text"
                              value={answer.text}
                              onChange={(event) => {
                                const answers = [...editingQuestion.answers]
                                answers[index] = { ...answers[index], text: event.target.value }
                                setEditingQuestion({ ...editingQuestion, answers })
                              }}
                              placeholder="Nội dung phương án"
                            />
                            {currentEdit.answers.length > 1 && (
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                  const answers = editingQuestion.answers
                                    .filter((_, i) => i !== index)
                                    .map((a, i) => ({
                                      ...a,
                                      label: String.fromCharCode(65 + i),
                                    }))
                                  setEditingQuestion({ ...editingQuestion, answers })
                                }}
                                className="mt-1 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-50 shrink-0"
                                title="Xóa phương án"
                              >
                                <span className="material-symbols-outlined text-base">close</span>
                              </button>
                            )}
                          </div>

                          {/* Triage selector */}
                          <div className="ml-8 flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-600 shrink-0">
                              Cảnh báo:
                            </span>
                            <TriageSelector
                              value={answer.triageLevel}
                              disabled={isSaving}
                              onChange={(level) => {
                                const answers = [...editingQuestion.answers]
                                answers[index] = { ...answers[index], triageLevel: level }
                                setEditingQuestion({ ...editingQuestion, answers })
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Nút thêm phương án (trong grid) */}
                      <button
                        type="button"
                        disabled={isSaving || editingQuestion.answers.length >= 26}
                        onClick={() => {
                          const nextIndex = editingQuestion.answers.length
                          setEditingQuestion({
                            ...editingQuestion,
                            answers: [
                              ...editingQuestion.answers,
                              {
                                id: `new-option-${crypto.randomUUID()}`,
                                label: String.fromCharCode(65 + nextIndex),
                                text: '',
                                triageLevel: null,
                                optionDefinition: '',
                              },
                            ],
                          })
                        }}
                        className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-lg py-6 text-blue-600 hover:border-blue-400 hover:bg-blue-50 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined text-2xl">add_circle</span>
                        <span>Thêm phương án</span>
                      </button>
                    </div>
                  </div>

                  {/* Lỗi validation */}
                  {validationError && hasChanges && (
                    <p className="text-sm text-red-600">{validationError}</p>
                  )}

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-5 border-t border-slate-200">
                    <button
                      onClick={() => handleDeleteQuestion(question)}
                      disabled={isSaving}
                      className="px-5 py-2 rounded-lg text-red-600 font-semibold hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                      Xóa câu hỏi
                    </button>
                    {hasChanges && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-6 py-2 rounded-lg text-slate-600 font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={() => void handleSaveQuestion()}
                          disabled={isSaving || Boolean(validationError)}
                          className="px-8 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-sm hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
