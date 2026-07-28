import { useMemo, useState } from 'react'
import { translateError } from '../../../lib/errorTranslator'
import { useDeleteQuestion, useQuestions } from '../api/recoveryApi'
import { QuestionDetailView } from '../components/QuestionDetailView'
import { QuestionFormModal } from '../components/QuestionFormModal'
import { QuestionListTable } from '../components/QuestionListTable'
import type { SurveyQuestion } from '../types'

export function RecoveryPage() {
  const { data: questions, isLoading, isError, refetch } = useQuestions()
  const deleteMutation = useDeleteQuestion()

  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteConfirmQuestion, setDeleteConfirmQuestion] = useState<SurveyQuestion | null>(null)
  const [errorNotification, setErrorNotification] = useState('')

  // Filtered & sorted questions
  const filteredQuestions = useMemo(() => {
    if (!questions) return []
    let list = [...questions]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((item) => item.questionText.toLowerCase().includes(q))
    }
    // Sort by orderNumber asc
    return list.sort((a, b) => (a.orderNumber ?? 999) - (b.orderNumber ?? 999))
  }, [questions, search])

  // Summary KPIs
  const stats = useMemo(() => {
    if (!questions) return { total: 0, defaultCount: 0, customCount: 0, maxPossibleTotal: 0 }
    const total = questions.length
    const defaultCount = questions.filter((q) => q.isDefault).length
    const customCount = total - defaultCount

    const maxPossibleTotal = questions.reduce((sum, q) => {
      const maxOpt = q.options?.length ? Math.max(...q.options.map((o) => o.scoreValue)) : 0
      return sum + maxOpt
    }, 0)

    return { total, defaultCount, customCount, maxPossibleTotal }
  }, [questions])

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmQuestion) return
    setErrorNotification('')
    try {
      await deleteMutation.mutateAsync(deleteConfirmQuestion.questionId)
      setDeleteConfirmQuestion(null)
    } catch (err) {
      setDeleteConfirmQuestion(null)
      setErrorNotification(
        translateError(err, 'Không thể xóa câu hỏi này do đã được sử dụng trong các lượt đánh giá.'),
      )
    }
  }

  // If a question detail is selected, show QuestionDetailView
  if (selectedQuestionId !== null) {
    return (
      <QuestionDetailView
        questionId={selectedQuestionId}
        onBack={() => setSelectedQuestionId(null)}
      />
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-[#f0f4f8]">
      {/* ERROR NOTIFICATION BANNER */}
      {errorNotification && (
        <div className="m-6 mb-0 flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200 shadow-sm animate-fadeIn">
          <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0">
            warning
          </span>
          <p className="flex-1">{errorNotification}</p>
          <button
            onClick={() => setErrorNotification('')}
            className="text-red-400 hover:text-red-600"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* TOP HEADER & SEARCH BAR */}
      <div className="p-6 pb-4 space-y-4 min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00459a] text-[24px]">
                assignment
              </span>
              <h2 className="text-xl font-bold text-slate-800">
                Đánh giá & Triệu chứng — Quản lý bộ câu hỏi
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Quản lý câu hỏi khảo sát triệu chứng hàng ngày cho bệnh nhân ERAS, chỉnh sửa nội dung và điều chỉnh trọng số điểm số (score weights)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
            </div>

            {/* Add Question Button */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#00459a] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Thêm câu hỏi mới
            </button>
          </div>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#00459a]">
              <span className="material-symbols-outlined text-[22px]">quiz</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tổng số câu hỏi
              </p>
              <p className="text-xl font-extrabold text-slate-800">{stats.total}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <span className="material-symbols-outlined text-[22px]">star</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Câu hỏi mặc định ERAS
              </p>
              <p className="text-xl font-extrabold text-slate-800">{stats.defaultCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <span className="material-symbols-outlined text-[22px]">tune</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Câu hỏi tùy chỉnh
              </p>
              <p className="text-xl font-extrabold text-slate-800">{stats.customCount}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-[22px]">bar_chart</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Điểm tối đa khảo sát
              </p>
              <p className="text-xl font-extrabold text-slate-800">{stats.maxPossibleTotal} điểm</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden">
          <QuestionListTable
            questions={filteredQuestions}
            isLoading={isLoading}
            isError={isError}
            onRefetch={() => refetch()}
            onSelectQuestion={(id) => setSelectedQuestionId(id)}
            onDeleteQuestion={(q) => setDeleteConfirmQuestion(q)}
          />
        </div>
      </div>

      {/* CREATE QUESTION MODAL */}
      <QuestionFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Xác nhận xóa câu hỏi</h3>
                <p className="text-xs text-slate-500">Thao tác này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
              Bạn có chắc chắn muốn xóa câu hỏi "{deleteConfirmQuestion.questionText}"?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmQuestion(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
