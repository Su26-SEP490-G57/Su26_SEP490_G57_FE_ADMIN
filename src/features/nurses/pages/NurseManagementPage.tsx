import { useEffect, useState } from 'react'
import { useDeleteNurse, useNurses, useUpdateNurse } from '../api/nurses'
import { NurseDetailPanel } from '../components/NurseDetailPanel'
import { NurseFormModal } from '../components/NurseFormModal'
import { ResetPasswordModal } from '../components/ResetPasswordModal'
import type { Nurse } from '../types'

export function NurseManagementPage() {
  // Queries & Mutations state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on new search
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const { data, isLoading, isError, refetch } = useNurses({
    page,
    limit,
    search: debouncedSearch,
  })

  // Selected Nurse for Detail Panel
  const [selectedNurseId, setSelectedNurseId] = useState<number | null>(null)

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formNurse, setFormNurse] = useState<Nurse | null>(null) // null = Create, object = Edit
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [resetNurse, setResetNurse] = useState<{ id: number; name: string } | null>(null)

  const deleteMutation = useDeleteNurse()
  const updateMutation = useUpdateNurse()

  // Find currently selected nurse data for quick reference (like updating name inside modals)
  const selectedNurse = data?.data.find((n) => n.id === selectedNurseId)

  // Actions
  const handleOpenCreate = () => {
    setFormNurse(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (nurse: Nurse) => {
    setFormNurse(nurse)
    setIsFormOpen(true)
  }

  const handleOpenResetPassword = (id: number, name: string) => {
    setResetNurse({ id, name })
    setIsResetPasswordOpen(true)
  }

  const handleToggleActive = async (nurse: Nurse) => {
    try {
      if (nurse.isActive) {
        // Soft delete / deactivate
        await deleteMutation.mutateAsync(nurse.id)
      } else {
        // Activate
        await updateMutation.mutateAsync({
          id: nurse.id,
          data: { isActive: true },
        })
      }
    } catch (err) {
      console.error('Failed to toggle active state', err)
    }
  }

  const totalNurses = data?.total ?? 0
  const totalPages = Math.ceil(totalNurses / limit)

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#f0f4f8]">
      {/* LEFT SECTION: List, Filters & Pagination */}
      <div className="flex flex-1 flex-col h-full overflow-hidden p-6 space-y-4 min-w-0">
        {/* Top Header & Search Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">Danh sách điều dưỡng</h2>
            <p className="text-xs text-slate-500">Quản lý danh sách tài khoản, thông tin liên lạc và vai trò của điều dưỡng</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-slate-400">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm điều dưỡng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
            </div>
            {/* Create Button */}
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 rounded-xl bg-[#00459a] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Thêm điều dưỡng
            </button>
          </div>
        </div>

        {/* Table List Container */}
        <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-500">Mã điều dưỡng</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-500">Tên điều dưỡng</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-500">Số điện thoại</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-500">Vai trò</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Trạng thái</th>
                  <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right pr-8">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-slate-100" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-slate-100" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 rounded bg-slate-100" /></td>
                      <td className="px-6 py-4"><div className="mx-auto h-6 w-20 rounded bg-slate-100" /></td>
                      <td className="px-6 py-4 text-right"><div className="ml-auto h-8 w-24 rounded bg-slate-100" /></td>
                    </tr>
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">cloud_off</span>
                      <p className="text-sm font-semibold">Lỗi tải dữ liệu. Vui lòng thử lại sau.</p>
                      <button onClick={() => refetch()} className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                        Tải lại
                      </button>
                    </td>
                  </tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">person_search</span>
                      <p className="text-sm font-semibold">Không tìm thấy điều dưỡng nào phù hợp</p>
                    </td>
                  </tr>
                ) : (
                  data?.data.map((nurse) => {
                    const isSelected = selectedNurseId === nurse.id
                    return (
                      <tr
                        key={nurse.id}
                        onClick={() => setSelectedNurseId(nurse.id)}
                        className={`cursor-pointer border-l-4 transition-all duration-150 hover:bg-slate-50/80 ${
                          isSelected
                            ? 'bg-blue-50/50 border-l-[#00459a]'
                            : 'border-l-transparent hover:border-l-slate-200'
                        }`}
                      >
                        {/* ID Column */}
                        <td className="px-6 py-4 font-mono font-bold text-[#00459a] text-sm">
                          ĐD{String(nurse.id).padStart(3, '0')}
                        </td>
                        {/* Name Column */}
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                          {nurse.fullName}
                        </td>
                        {/* Phone Column */}
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {nurse.phoneNumber || '—'}
                        </td>
                        {/* Role Column */}
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {nurse.roles.includes('Head_Nurse') ? 'Điều dưỡng trưởng' : 'Điều dưỡng viên'}
                        </td>
                        {/* Status Column */}
                        <td className="px-6 py-4 text-center">
                          {nurse.isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                              Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                              Tạm ngưng
                            </span>
                          )}
                        </td>
                        {/* Actions Column */}
                        <td className="px-6 py-4 text-right pr-8" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => setSelectedNurseId(nurse.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#00459a] transition-all"
                              title="Xem chi tiết"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(nurse)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-all"
                              title="Sửa"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleToggleActive(nurse)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                                nurse.isActive
                                  ? 'text-slate-400 hover:bg-red-50 hover:text-red-600'
                                  : 'text-slate-400 hover:bg-green-50 hover:text-green-600'
                              }`}
                              title={nurse.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                {nurse.isActive ? 'block' : 'check_circle'}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <span className="text-xs font-semibold text-slate-500">
                Hiển thị từ {Math.min((page - 1) * limit + 1, totalNurses)} đến{' '}
                {Math.min(page * limit, totalNurses)} trong tổng số {totalNurses} điều dưỡng
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  Trước
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1
                  const isCurrent = pNum === page
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#00459a] text-white shadow-md'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Sau
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Sliding Detail Panel */}
      <NurseDetailPanel
        nurseId={selectedNurseId}
        onClose={() => setSelectedNurseId(null)}
        onEdit={() => selectedNurse && handleOpenEdit(selectedNurse)}
        onResetPassword={() => selectedNurse && handleOpenResetPassword(selectedNurse.id, selectedNurse.fullName)}
      />

      {/* MODALS */}
      <NurseFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setFormNurse(null)
        }}
        nurse={formNurse}
      />

      {isResetPasswordOpen && resetNurse && (
        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => {
            setIsResetPasswordOpen(false)
            setResetNurse(null)
          }}
          nurseId={resetNurse.id}
          nurseName={resetNurse.name}
        />
      )}
    </div>
  )
}
