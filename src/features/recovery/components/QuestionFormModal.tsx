import { useEffect, useState } from 'react'
import { translateError } from '../../../lib/errorTranslator'
import { useCreateQuestion } from '../api/recoveryApi'

interface QuestionFormModalProps {
  isOpen: boolean
  onClose: () => void
}

interface NewOption {
  optionText: string
  scoreValue: number
}

const DEFAULT_OPTIONS: NewOption[] = [
  { optionText: 'Không', scoreValue: 0 },
  { optionText: 'Nhẹ', scoreValue: 1 },
  { optionText: 'Vừa', scoreValue: 2 },
  { optionText: 'Nặng', scoreValue: 3 },
]

export function QuestionFormModal({ isOpen, onClose }: QuestionFormModalProps) {
  const createMutation = useCreateQuestion()

  const [questionText, setQuestionText] = useState('')
  const [orderNumber, setOrderNumber] = useState<number>(1)
  const [isDefault, setIsDefault] = useState(false)
  const [options, setOptions] = useState<NewOption[]>(DEFAULT_OPTIONS)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQuestionText('')
      setOrderNumber(1)
      setIsDefault(false)
      setOptions(DEFAULT_OPTIONS)
      setSubmitError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAddOption = () => {
    setOptions((prev) => [...prev, { optionText: '', scoreValue: 0 }])
  }

  const handleUpdateOption = (index: number, field: 'optionText' | 'scoreValue', value: any) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)),
    )
  }

  const handleRemoveOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    if (!questionText.trim()) {
      setSubmitError('Nội dung câu hỏi không được để trống.')
      return
    }

    if (options.length === 0) {
      setSubmitError('Vui lòng thêm ít nhất 1 lựa chọn trả lời.')
      return
    }

    for (const opt of options) {
      if (!opt.optionText.trim()) {
        setSubmitError('Tất cả các lựa chọn phải có tên nhãn hiển thị.')
        return
      }
    }

    try {
      await createMutation.mutateAsync({
        questionText: questionText.trim(),
        orderNumber,
        isDefault,
        options: options.map((o) => ({
          optionText: o.optionText.trim(),
          scoreValue: Number(o.scoreValue),
        })),
      })
      onClose()
    } catch (err) {
      setSubmitError(translateError(err, 'Có lỗi xảy ra khi tạo câu hỏi mới.'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00459a]">add_circle</span>
            <h3 className="text-base font-bold text-slate-800">Thêm câu hỏi đánh giá mới</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {submitError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-600 border border-red-200">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <p>{submitError}</p>
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nội dung câu hỏi <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ví dụ: Bạn có cảm giác buồn nôn hoặc nôn mửa không?"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-medium outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Order Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Thứ tự hiển thị
              </label>
              <input
                type="number"
                min={1}
                value={orderNumber}
                onChange={(e) => setOrderNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold outline-none transition-all focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
            </div>

            {/* Default Status */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2">
              <div>
                <div className="text-xs font-bold text-slate-800">Câu hỏi mặc định</div>
                <div className="text-[10px] text-slate-500">Mặc định phác đồ ERAS</div>
              </div>
              <button
                type="button"
                onClick={() => setIsDefault(!isDefault)}
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

          {/* Options & Score Weights */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Các lựa chọn & Trọng số điểm (Score Weights)
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-bold text-[#00459a] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                Thêm lựa chọn
              </button>
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5"
                >
                  <span className="font-mono text-xs font-bold text-slate-400 w-5 text-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={opt.optionText}
                    onChange={(e) => handleUpdateOption(idx, 'optionText', e.target.value)}
                    placeholder="Tên lựa chọn (vd: Nhẹ)"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#00459a]"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 font-medium">Trọng số:</span>
                    <input
                      type="number"
                      min={0}
                      value={opt.scoreValue}
                      onChange={(e) =>
                        handleUpdateOption(idx, 'scoreValue', Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-[#00459a]"
                    />
                    <span className="text-xs text-slate-400">đ</span>
                  </div>
                  {options.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-1 rounded-xl bg-[#00459a] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/10 hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
