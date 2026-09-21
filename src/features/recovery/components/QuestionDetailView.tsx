import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { translateError } from '../../../lib/errorTranslator'
import {
  useAddOption,
  useDeleteOption,
  useQuestionDetail,
  useUpdateOption,
  useUpdateQuestion,
} from '../api/recoveryApi'
import {
  buildQuestionDetailFormDefaultValues,
  questionDetailFormSchema,
  type QuestionDetailFormValues,
} from '../schemas'

interface QuestionDetailViewProps {
  questionId: number
  onBack: () => void
}

export function QuestionDetailView({ questionId, onBack }: QuestionDetailViewProps) {
  const { data: question, isLoading, isError, refetch } = useQuestionDetail(questionId)

  const updateQuestionMutation = useUpdateQuestion()
  const addOptionMutation = useAddOption()
  const updateOptionMutation = useUpdateOption()
  const deleteOptionMutation = useDeleteOption()

  // UI state
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = useForm<QuestionDetailFormValues>({
    defaultValues: buildQuestionDetailFormDefaultValues(question),
    mode: 'onSubmit',
    resolver: zodResolver(questionDetailFormSchema),
  })

  const { fields, append, remove, update } = useFieldArray({ control, name: 'options' })
  const isDefault = useWatch({ control, name: 'isDefault' })
  const questionText = useWatch({ control, name: 'questionText' })
  const watchedOptions = useWatch({ control, name: 'options' })

  // Populate the form when question data is fetched
  useEffect(() => {
    if (question) {
      reset(buildQuestionDetailFormDefaultValues(question))
    }
  }, [question, reset])

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined animate-spin text-[36px]">sync</span>
          <p className="text-sm font-semibold">Đang tải chi tiết câu hỏi...</p>
        </div>
      </div>
    )
  }

  if (isError || !question) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-12 text-slate-500">
        <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">
          error_outline
        </span>
        <p className="text-base font-bold text-slate-700">Không tìm thấy thông tin câu hỏi</p>
        <p className="text-xs text-slate-500 mb-4">Câu hỏi có thể đã bị xóa hoặc không tồn tại.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Quay lại danh sách
          </button>
          <button
            onClick={() => refetch()}
            className="rounded-xl bg-[#00459a] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Tải lại
          </button>
        </div>
      </div>
    )
  }

  // Handle Option List edits
  const handleAddLocalOption = () => {
    append({ optionText: '', scoreValue: 0, isNew: true })
  }

  const handleRemoveOption = (index: number) => {
    const target = watchedOptions[index]
    if (target.isNew) {
      // Remove immediately from the field array
      remove(index)
    } else {
      // Mark as deleted
      update(index, { ...target, isDeleted: true })
    }
  }

  const handleRestoreOption = (index: number) => {
    update(index, { ...watchedOptions[index], isDeleted: false })
  }

  const handleScoreStep = (index: number, delta: number) => {
    const current = watchedOptions[index]?.scoreValue ?? 0
    setValue(`options.${index}.scoreValue`, Math.max(0, current + delta), {
      shouldValidate: true,
    })
  }

  // Save changes handler
  const onSubmit = async (values: QuestionDetailFormValues) => {
    setSubmitError('')
    setSuccessMessage('')

    try {
      // 1. Update Question Text, Order, Default status if changed
      await updateQuestionMutation.mutateAsync({
        questionId: question.questionId,
        data: {
          questionText: values.questionText,
          orderNumber: values.orderNumber,
          isDefault: values.isDefault,
        },
      })

      // 2. Process Deleted Options
      for (const opt of values.options.filter((o) => o.isDeleted && o.optionId)) {
        await deleteOptionMutation.mutateAsync({
          questionId: question.questionId,
          optionId: opt.optionId!,
        })
      }

      // 3. Process New & Updated Options
      for (const opt of values.options.filter((o) => !o.isDeleted)) {
        if (opt.isNew || !opt.optionId) {
          await addOptionMutation.mutateAsync({
            questionId: question.questionId,
            data: {
              optionText: opt.optionText,
              scoreValue: opt.scoreValue,
            },
          })
        } else {
          // Check if option actually changed compared to original
          const original = question.options.find((o) => o.optionId === opt.optionId)
          if (
            original &&
            (original.optionText !== opt.optionText || original.scoreValue !== opt.scoreValue)
          ) {
            await updateOptionMutation.mutateAsync({
              questionId: question.questionId,
              optionId: opt.optionId,
              data: {
                optionText: opt.optionText,
                scoreValue: opt.scoreValue,
              },
            })
          }
        }
      }

      setSuccessMessage('Đã cập nhật câu hỏi và trọng số điểm thành công!')
      setTimeout(() => setSuccessMessage(''), 4000)
    } catch (err) {
      setSubmitError(translateError(err, 'Có lỗi xảy ra khi cập nhật thông tin câu hỏi.'))
    }
  }

  // Active options helper for preview stats
  const activeOptions = watchedOptions.filter((o) => !o.isDeleted)
  const maxScore = activeOptions.length
    ? Math.max(...activeOptions.map((o) => Number(o.scoreValue) || 0))
    : 0
  const minScore = activeOptions.length
    ? Math.min(...activeOptions.map((o) => Number(o.scoreValue) || 0))
    : 0

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#f0f4f8]">
      {/* TOP HEADER / ACTION BAR */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
            title="Quay lại danh sách câu hỏi"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">
                Chi tiết câu hỏi #{String(question.questionId).padStart(2, '0')}
              </h2>
              {isDefault ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#00459a] border border-blue-200">
                  <span className="material-symbols-outlined text-[14px]">star</span>
                  Câu hỏi mặc định ERAS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                  Tùy chỉnh
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Chỉnh sửa nội dung câu hỏi và thiết lập trọng số điểm (score weight) cho từng đáp án
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-[#00459a] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSubmitting ? 'sync' : 'save'}
            </span>
            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNERS */}
      {submitError && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200 shadow-sm animate-fadeIn">
          <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0">error</span>
          <p className="flex-1">{submitError}</p>
          <button onClick={() => setSubmitError('')} className="text-red-400 hover:text-red-600">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-200 shadow-sm animate-fadeIn">
          <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">
            check_circle
          </span>
          <p className="flex-1">{successMessage}</p>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Question Text & Settings */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card 1: Question Content */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <span className="material-symbols-outlined text-[#00459a] text-[20px]">quiz</span>
                  Nội dung câu hỏi
                </div>
                <span className="text-xs text-slate-400 font-mono">ID: {question.questionId}</span>
              </div>

              {/* Question Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Câu hỏi hiển thị cho người bệnh <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  {...register('questionText')}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
                />
                <p className="text-[11px] text-slate-400 text-right">
                  {(questionText ?? '').length} ký tự
                </p>
                {errors.questionText && (
                  <p className="text-xs text-red-500">{errors.questionText.message}</p>
                )}
              </div>

              {/* Order Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Thứ tự hiển thị (Order Number)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    {...register('orderNumber', { valueAsNumber: true })}
                    className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold outline-none transition-all focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
                  />
                  <span className="text-xs text-slate-500">
                    Số thứ tự nhỏ hơn sẽ được ưu tiên hiển thị trước
                  </span>
                </div>
                {errors.orderNumber && (
                  <p className="text-xs text-red-500">{errors.orderNumber.message}</p>
                )}
              </div>

              {/* Default ERAS Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <div className="text-xs font-bold text-slate-800">Câu hỏi mặc định hệ thống</div>
                  <div className="text-[11px] text-slate-500">
                    Bật tùy chọn này nếu đây là câu hỏi chuẩn trong phác đồ ERAS.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('isDefault', !isDefault)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none ${
                    isDefault ? 'bg-[#00459a]' : 'bg-[#c2c6d5]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      isDefault ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Card 2: Impact & Range Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-[#00459a] text-[20px]">
                  analytics
                </span>
                Thống kê trọng số & Tác động điểm số
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Số lượng lựa chọn
                  </span>
                  <p className="text-xl font-bold text-slate-800 mt-1">
                    {activeOptions.length} lựa chọn
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Biên độ điểm số
                  </span>
                  <p className="text-xl font-bold text-[#00459a] mt-1">
                    {minScore} - {maxScore} điểm
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/60 p-4 border border-blue-100 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-[#00459a] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Quy tắc phân loại cảnh báo dựa trên tổng điểm:
                </p>
                <div className="space-y-1 pl-5 list-disc text-[11px]">
                  <div>
                    <span className="font-bold text-emerald-700">Mức XANH (0 - 1 điểm):</span> Ổn
                    định, theo dõi thường quy.
                  </div>
                  <div>
                    <span className="font-bold text-amber-700">Mức VÀNG (2 - 3 điểm):</span> Mức độ
                    trung bình, tự động phát cảnh báo.
                  </div>
                  <div>
                    <span className="font-bold text-red-700">Mức ĐỎ (≥ 4 điểm):</span> Mức độ nặng,
                    cần can thiệp y tế tức thì.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Option & Score Weight Manager */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00459a] text-[20px]">
                      format_list_bulleted
                    </span>
                    Danh sách Lựa chọn & Trọng số điểm (Score Weights)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mỗi lựa chọn tương ứng với một mức độ triệu chứng và cộng điểm vào tổng số điểm
                    đánh giá
                  </p>
                </div>

                <button
                  onClick={handleAddLocalOption}
                  className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#00459a] hover:bg-blue-50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Thêm lựa chọn
                </button>
              </div>

              {errors.options?.message && (
                <p className="text-xs text-red-500">{errors.options.message}</p>
              )}

              {/* OPTIONS LIST TABLE / CARDS */}
              <div className="space-y-3">
                {fields.map((field, idx) => {
                  const opt = watchedOptions[idx]
                  const score = Number(opt?.scoreValue) || 0

                  // Color tag styling based on score weight
                  let badgeStyle =
                    'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  let levelLabel = 'Bình thường'
                  if (score === 1) {
                    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    levelLabel = 'Triệu chứng nhẹ'
                  } else if (score === 2) {
                    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    levelLabel = 'Triệu chứng vừa'
                  } else if (score >= 3) {
                    badgeStyle = 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    levelLabel = 'Triệu chứng nặng'
                  }

                  if (opt?.isDeleted) {
                    return (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded-xl border border-dashed border-red-200 bg-red-50/40 p-3.5 text-xs text-slate-500"
                      >
                        <span className="line-through text-red-600 font-medium">
                          {opt.optionText || '(Lựa chọn trống)'} (Trọng số: {opt.scoreValue}đ) — Đã
                          đánh dấu xóa
                        </span>
                        <button
                          onClick={() => handleRestoreOption(idx)}
                          className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50"
                        >
                          <span className="material-symbols-outlined text-[14px]">undo</span>
                          Hoàn tác
                        </button>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={field.id}
                      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center"
                    >
                      {/* Drag / Index indicator */}
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white font-mono text-xs font-bold text-slate-500 border border-slate-200">
                        {idx + 1}
                      </div>

                      {/* Option Text Input */}
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Nhãn hiển thị đáp án <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register(`options.${idx}.optionText`)}
                          placeholder="Ví dụ: Không, Nhẹ, Vừa, Nặng..."
                          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold outline-none transition-all focus:border-[#00459a] focus:ring-2 focus:ring-[#00459a]/10"
                        />
                        {errors.options?.[idx]?.optionText && (
                          <p className="text-xs text-red-500">
                            {errors.options[idx]?.optionText?.message}
                          </p>
                        )}
                      </div>

                      {/* Score Weight Input & Stepper */}
                      <div className="w-full sm:w-44 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Trọng số điểm (Score Weight) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleScoreStep(idx, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <input
                            type="number"
                            min={0}
                            {...register(`options.${idx}.scoreValue`, { valueAsNumber: true })}
                            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 text-center text-sm font-bold text-slate-800 outline-none focus:border-[#00459a]"
                          />
                          <button
                            type="button"
                            onClick={() => handleScoreStep(idx, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                      </div>

                      {/* Score Tag & Remove Action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${badgeStyle}`}
                        >
                          +{score} điểm
                          <span className="text-[10px] font-medium opacity-80">({levelLabel})</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Xóa lựa chọn"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add Option Bottom Button */}
              <button
                type="button"
                onClick={handleAddLocalOption}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-xs font-bold text-slate-600 hover:border-[#00459a] hover:bg-blue-50/50 hover:text-[#00459a] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Thêm lựa chọn đáp án mới
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
