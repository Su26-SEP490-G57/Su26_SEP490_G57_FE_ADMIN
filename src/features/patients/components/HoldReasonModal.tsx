import { useEffect, useRef, useState } from 'react'
import type { PatientListItem } from '../types'

interface HoldReasonModalProps {
  patient: PatientListItem | null
  title: string
  description: string
  reasonLabel: string
  reasonPlaceholder: string
  confirmText: string
  isSubmitting: boolean
  onConfirm: (reason: string) => Promise<void>
  onCancel: () => void
}

const MAX_REASON_LENGTH = 500

function patientName(patient: PatientListItem) {
  return patient.fullName ?? patient.account?.fullName ?? patient.nameInitials ?? '--'
}

export function HoldReasonModal({
  patient,
  title,
  description,
  reasonLabel,
  reasonPlaceholder,
  confirmText,
  isSubmitting,
  onConfirm,
  onCancel,
}: HoldReasonModalProps) {
  const [reason, setReason] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const trimmedReason = reason.trim()

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  if (!patient) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmedReason || isSubmitting) return

    await onConfirm(trimmedReason)
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onCancel()
      }}
    >
      <form
        aria-labelledby="clinical-action-title"
        aria-modal="true"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        role="dialog"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
            <span className="material-symbols-outlined text-2xl text-orange-600">
              clinical_notes
            </span>
          </div>
          <div>
            <h2 id="clinical-action-title" className="text-lg font-bold text-slate-800">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {description} <strong>{patientName(patient)}</strong> ({patient.caseId}).
            </p>
          </div>
        </div>

        <label
          htmlFor="clinical-action-reason"
          className="mt-5 block text-sm font-semibold text-slate-700"
        >
          {reasonLabel} <span className="text-red-600">*</span>
        </label>
        <textarea
          ref={textareaRef}
          id="clinical-action-reason"
          value={reason}
          maxLength={MAX_REASON_LENGTH}
          disabled={isSubmitting}
          required
          rows={4}
          onChange={(event) => setReason(event.target.value)}
          placeholder={reasonPlaceholder}
          className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:cursor-wait disabled:bg-slate-100"
        />
        <p className="mt-1 text-right text-xs text-slate-500">
          {reason.length}/{MAX_REASON_LENGTH}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!trimmedReason || isSubmitting}
            className="rounded-lg bg-orange-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Đang cập nhật...' : confirmText}
          </button>
        </div>
      </form>
    </div>
  )
}
