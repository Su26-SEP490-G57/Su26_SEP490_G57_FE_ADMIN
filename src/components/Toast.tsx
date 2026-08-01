import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeStyles = {
    success: {
      icon: 'check_circle',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
    },
    error: {
      icon: 'error',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
    },
    warning: {
      icon: 'warning',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-800',
    },
    info: {
      icon: 'info',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
    },
  }

  const style = typeStyles[type]

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${style.bgColor} ${style.borderColor} shadow-lg min-w-[300px] max-w-[500px]`}
      >
        <span
          className={`material-symbols-outlined ${style.iconColor}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {style.icon}
        </span>
        <p className={`flex-1 text-sm font-medium ${style.textColor}`}>{message}</p>
        <button
          onClick={onClose}
          className={`${style.iconColor} hover:opacity-70 transition-opacity`}
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>
    </div>
  )
}
