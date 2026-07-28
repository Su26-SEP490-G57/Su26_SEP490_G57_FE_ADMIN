import type { SurveyQuestion } from '../types'

interface QuestionListTableProps {
  questions: SurveyQuestion[]
  isLoading: boolean
  isError: boolean
  onRefetch: () => void
  onSelectQuestion: (questionId: number) => void
  onDeleteQuestion: (question: SurveyQuestion) => void
}

export function QuestionListTable({
  questions,
  isLoading,
  isError,
  onRefetch,
  onSelectQuestion,
  onDeleteQuestion,
}: QuestionListTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined animate-spin text-[36px]">sync</span>
          <p className="text-sm font-semibold">Đang tải danh sách câu hỏi đánh giá...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-12 text-slate-500">
        <span className="material-symbols-outlined text-[40px] text-slate-300 mb-2">
          cloud_off
        </span>
        <p className="text-sm font-bold text-slate-700">Không thể tải dữ liệu câu hỏi</p>
        <button
          onClick={onRefetch}
          className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
        >
          Tải lại
        </button>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-12 text-slate-500">
        <span className="material-symbols-outlined text-[40px] text-slate-300 mb-2">
          search_off
        </span>
        <p className="text-sm font-bold text-slate-700">Chưa có câu hỏi đánh giá nào</p>
        <p className="text-xs text-slate-400 mt-1">
          Nhấn "Thêm câu hỏi mới" để khởi tạo bộ câu hỏi đánh giá triệu chứng.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-16 text-center">
              STT
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Nội dung câu hỏi đánh giá
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
              Các đáp án & Trọng số
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
              Điểm tối đa
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
              Phân loại
            </th>
            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right pr-8">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {questions.map((question) => {
            const maxScore = question.options?.length
              ? Math.max(...question.options.map((o) => o.scoreValue))
              : 0

            return (
              <tr
                key={question.questionId}
                onClick={() => onSelectQuestion(question.questionId)}
                className="group cursor-pointer border-l-4 border-l-transparent hover:border-l-[#00459a] hover:bg-blue-50/40 transition-all"
              >
                {/* Order / Index */}
                <td className="px-6 py-4 text-center font-mono font-bold text-slate-400 text-xs">
                  #{question.orderNumber ?? question.questionId}
                </td>

                {/* Question Text */}
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800 text-sm group-hover:text-[#00459a] transition-colors">
                    {question.questionText}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Mã câu hỏi: Q-{String(question.questionId).padStart(3, '0')}
                  </div>
                </td>

                {/* Options & Score Weights preview */}
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(question.options ?? []).map((opt) => (
                      <span
                        key={opt.optionId}
                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200"
                      >
                        {opt.optionText}:{' '}
                        <strong className="text-[#00459a] font-bold">+{opt.scoreValue}đ</strong>
                      </span>
                    ))}
                    {(!question.options || question.options.length === 0) && (
                      <span className="text-xs text-slate-400 italic">Chưa có lựa chọn nào</span>
                    )}
                  </div>
                </td>

                {/* Max Score */}
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#00459a] border border-blue-100">
                    +{maxScore} điểm
                  </span>
                </td>

                {/* Default Tag */}
                <td className="px-6 py-4 text-center">
                  {question.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#00459a] border border-blue-200">
                      <span className="material-symbols-outlined text-[13px]">star</span>
                      Mặc định ERAS
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">
                      Tùy chỉnh
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td
                  className="px-6 py-4 text-right pr-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => onSelectQuestion(question.questionId)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#00459a] hover:shadow-sm border border-transparent hover:border-slate-200 transition-all"
                      title="Xem chi tiết & Sửa trọng số điểm"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit_note</span>
                    </button>
                    <button
                      onClick={() => onDeleteQuestion(question)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                      title="Xóa câu hỏi"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
