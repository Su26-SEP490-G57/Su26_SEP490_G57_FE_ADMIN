import { useNurse } from '../api/nurses'

interface NurseDetailPanelProps {
  nurseId: number | null
  onClose: () => void
  onEdit: () => void
  onResetPassword: () => void
}

export function NurseDetailPanel({ nurseId, onClose, onEdit, onResetPassword }: NurseDetailPanelProps) {
  const { data: nurse, isLoading, isError } = useNurse(nurseId)

  // Smooth slide-in transition: if nurseId is null, don't show or slide away.
  const isOpen = nurseId !== null

  if (!isOpen) return null

  // Format Date from ISO/UTC/YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Chưa cập nhật'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr // Return raw if parsing fails
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return 'Chưa cập nhật'
    }
  }

  // Address helper
  const getFullAddress = () => {
    if (!nurse) return 'Chưa cập nhật'
    const parts = [nurse.detailedAddress, nurse.ward, nurse.cityProvince].filter(Boolean)
    return parts.join(', ') || 'Chưa cập nhật'
  }

  return (
    <aside className="relative z-30 flex h-full w-96 flex-shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl transition-all duration-300">
      {/* Top Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        title="Đóng chi tiết"
      >
        <span className="material-symbols-outlined text-[24px]">close</span>
      </button>

      {isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 space-y-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-slate-100" />
        </div>
      ) : isError || !nurse ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
          <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">error</span>
          <p className="text-sm font-semibold">Không thể tải thông tin điều dưỡng</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Header Profile Info */}
          <div className="flex items-start gap-4 pt-4">
            {/* Avatar Circle */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-800 bg-slate-100 text-slate-700">
              <span className="material-symbols-outlined text-[36px]">person</span>
            </div>

            {/* Name, Code, and Status Badge */}
            <div className="flex-1 min-w-0 pr-6">
              <h3 className="truncate text-lg font-bold text-slate-900 leading-snug">
                {nurse.fullName}
              </h3>
              <p className="text-sm text-slate-500">
                Mã: <span className="font-semibold text-[#00459a]">ĐD{String(nurse.id).padStart(3, '0')}</span>
              </p>

              {/* Status badge with indicator dot */}
              <div className="mt-2.5 flex items-center">
                {nurse.isActive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-600 animate-pulse" />
                    Đang hoạt động
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    Tạm ngưng
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm space-y-4">
            {/* Card Header Icon & Label */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800">
              <span className="material-symbols-outlined text-[20px] text-slate-500">person</span>
              <h4 className="text-sm font-bold">Thông tin chi tiết</h4>
            </div>

            {/* Cards Info List */}
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-medium whitespace-nowrap">Họ và tên:</span>
                <span className="text-slate-800 font-semibold text-right">{nurse.fullName}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-medium whitespace-nowrap">Vai trò:</span>
                <span className="text-slate-800 font-semibold text-right">
                  {nurse.roles.includes('Head_Nurse') ? 'Điều dưỡng trưởng' : 'Điều dưỡng viên'}
                </span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-medium whitespace-nowrap">Số điện thoại:</span>
                <span className="text-slate-800 font-semibold text-right">{nurse.phoneNumber || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-medium whitespace-nowrap">Ngày sinh:</span>
                <span className="text-slate-800 font-semibold text-right">{formatDate(nurse.dob)}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-medium whitespace-nowrap">Địa chỉ:</span>
                <span className="text-slate-800 font-semibold text-right">{getFullAddress()}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-500 font-medium whitespace-nowrap">Ngày tạo tk:</span>
                <span className="text-slate-800 font-semibold text-right">{formatDate(nurse.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onEdit}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#00459a] py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Chỉnh sửa thông tin
            </button>
            <button
              onClick={onResetPassword}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#00459a] py-3 text-sm font-bold text-[#00459a] transition-all hover:bg-blue-50"
            >
              <span className="material-symbols-outlined text-[18px]">key</span>
              Đặt lại mật khẩu
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
