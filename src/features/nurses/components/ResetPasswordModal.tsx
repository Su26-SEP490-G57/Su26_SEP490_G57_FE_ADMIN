import { useState } from 'react'
import { useUpdateNurse } from '../api/nurses'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  nurseId: number
  nurseName: string
}

export function ResetPasswordModal({ isOpen, onClose, nurseId, nurseName }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const updateMutation = useUpdateNurse()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Mật khẩu không được để trống')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (password.length > 100) {
      setError('Mật khẩu không được vượt quá 100 ký tự')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: nurseId,
        data: { password },
      })
      setPassword('')
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu')
    }
  }

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00459a]">lock_reset</span>
            <h3 className="text-base font-bold text-slate-800">Đặt lại mật khẩu</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-sm text-slate-600">
            Bạn đang đặt lại mật khẩu cho điều dưỡng:{' '}
            <span className="font-bold text-slate-800">{nurseName}</span> (Mã:{' '}
            <span className="font-mono text-[#00459a] font-semibold">
              ĐD{String(nurseId).padStart(3, '0')}
            </span>
            )
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">error</span>
              <p>{error}</p>
            </div>
          )}

          {updateMutation.isSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs font-medium text-green-600">
              <span className="material-symbols-outlined text-[16px] flex-shrink-0">check_circle</span>
              <p>Đổi mật khẩu thành công!</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-1 rounded-xl bg-[#00459a] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
