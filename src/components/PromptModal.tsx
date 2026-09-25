import { useEffect, useRef, useState } from 'react'

interface PromptModalProps {
  isOpen: boolean
  title: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

// Modal nhỏ thay cho window.prompt() (hiện "localhost says", không đồng bộ giao diện).
// Nơi gọi truyền `key` đổi mỗi lần mở (vd theo `title`) để component remount và
// input luôn bắt đầu rỗng — tránh phải setState('') bên trong effect.
export function PromptModal({
  isOpen,
  title,
  placeholder,
  confirmText = 'Thêm',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Đợi modal render xong rồi mới focus.
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [])

  if (!isOpen) return null

  const trimmed = value.trim()

  function handleSubmit() {
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-[380px] rounded-xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-slate-800 mb-3">{title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
            if (e.key === 'Escape') onCancel()
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />

        <div className="mt-4 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!trimmed}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
