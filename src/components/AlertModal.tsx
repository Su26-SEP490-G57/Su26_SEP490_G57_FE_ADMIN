interface AlertModalProps {
  isOpen: boolean
  title: string
  message: string
  onClose: () => void
  type?: 'error' | 'warning' | 'success' | 'info'
}

export function AlertModal({ isOpen, title, message, onClose, type = 'error' }: AlertModalProps) {
  if (!isOpen) return null

  const typeStyles = {
    error: {
      icon: 'error',
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'warning',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
    success: {
      icon: 'check_circle',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      button: 'bg-green-600 hover:bg-green-700',
    },
    info: {
      icon: 'info',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
  }

  const style = typeStyles[type]

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40">
      <div className="w-[450px] rounded-xl bg-white p-6 shadow-2xl">
        {/* Icon & Title */}
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-full ${style.iconBg} flex items-center justify-center`}
          >
            <span className={`material-symbols-outlined ${style.iconColor} text-2xl`}>
              {style.icon}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-lg text-white font-semibold transition-colors ${style.button}`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
