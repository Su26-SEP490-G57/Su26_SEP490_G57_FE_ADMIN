import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { translateError } from '../../../lib/errorTranslator'
import { useCreateTreatmentOrder } from '../api/treatmentOrders'
import { CARE_LEVELS, CARE_LEVEL_DESCRIPTIONS, CARE_LEVEL_LABELS, type CareLevel } from '../types'

interface TreatmentOrderFormModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
  patientName: string
}

// Mức chăm sóc là trường DUY NHẤT bắt buộc và KHÔNG có giá trị mặc định —
// bác sĩ phải chọn tường minh.
const treatmentOrderSchema = z
  .object({
    careLevel: z.string(),
    instructions: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!values.careLevel) {
      ctx.addIssue({
        code: 'custom',
        path: ['careLevel'],
        message: 'Vui lòng chọn mức chăm sóc',
      })
    }

    if (values.instructions.length > 1000) {
      ctx.addIssue({
        code: 'custom',
        path: ['instructions'],
        message: 'Hướng dẫn tối đa 1000 ký tự',
      })
    }
  })

type FormValues = z.infer<typeof treatmentOrderSchema>

const EMPTY_VALUES: FormValues = { careLevel: '', instructions: '' }

export function TreatmentOrderFormModal({
  isOpen,
  onClose,
  caseId,
  patientName,
}: TreatmentOrderFormModalProps) {
  const createMutation = useCreateTreatmentOrder()
  const [submitError, setSubmitError] = useState('')

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<FormValues>({
    defaultValues: EMPTY_VALUES,
    mode: 'onSubmit',
    resolver: zodResolver(treatmentOrderSchema),
  })

  const selectedLevel = useWatch({ control, name: 'careLevel' })

  // Reset form mỗi lần mở lại modal (cùng cách NurseFormModal đang làm).
  useEffect(() => {
    if (!isOpen) return
    reset(EMPTY_VALUES)
  }, [isOpen, reset])

  if (!isOpen) return null

  const onSubmit = async (values: FormValues) => {
    setSubmitError('')
    try {
      await createMutation.mutateAsync({
        caseId,
        careLevel: values.careLevel as CareLevel,
        instructions: values.instructions.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setSubmitError(translateError(err, 'Có lỗi xảy ra khi tạo chỉ định điều trị'))
    }
  }

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00459a]">clinical_notes</span>
            <div>
              <h3 className="text-base font-bold text-slate-800">Tạo chỉ định điều trị</h3>
              <p className="text-xs text-slate-500">
                {patientName} · Mã {caseId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="custom-scrollbar max-h-[75vh] space-y-4 overflow-y-auto p-6"
        >
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
              <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
              <p>{submitError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mức chăm sóc <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup">
              {CARE_LEVELS.map((level) => {
                const isSelected = selectedLevel === level
                return (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() =>
                      setValue('careLevel', level, { shouldValidate: true, shouldDirty: true })
                    }
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-[#00459a] bg-[#00459a]/5 ring-2 ring-[#00459a]/10'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`block text-sm font-bold ${
                        isSelected ? 'text-[#00459a]' : 'text-slate-700'
                      }`}
                    >
                      {CARE_LEVEL_LABELS[level]}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {CARE_LEVEL_DESCRIPTIONS[level]}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.careLevel && <p className="text-xs text-red-500">{errors.careLevel.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hướng dẫn điều trị
            </label>
            <textarea
              rows={4}
              {...register('instructions')}
              placeholder="Hướng dẫn thêm cho điều dưỡng (không bắt buộc)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
            />
            {errors.instructions && (
              <p className="text-xs text-red-500">{errors.instructions.message}</p>
            )}
          </div>

          <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Khi lưu, hệ thống tự động cập nhật mức chăm sóc của người bệnh và giao phiếu theo dõi
            tương ứng cho điều dưỡng. Người chỉ định và thời điểm chỉ định do hệ thống tự lưu.
          </p>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !selectedLevel}
              className="flex items-center gap-1 rounded-xl bg-[#00459a] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Đang lưu...' : 'Lưu chỉ định'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
