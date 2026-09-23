import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { translateError } from '../../../lib/errorTranslator'
import { DiseaseAutocomplete } from '../../patients/components/DiseaseAutocomplete'
import { useCreateTreatmentOrder, useTreatmentSheetPrefill } from '../api/treatmentOrders'
import { CARE_LEVELS, CARE_LEVEL_DESCRIPTIONS, CARE_LEVEL_LABELS, type CareLevel } from '../types'

interface TreatmentOrderFormModalProps {
  isOpen: boolean
  onClose: () => void
  caseId: string
  patientName: string
}

// "Phiếu theo dõi điều trị". Các trường hành chính (tờ số, cơ sở, khoa, họ tên,
// tuổi, giới tính, phòng, giường) tự điền và CHỈ ĐỌC — server lấy lại từ hồ sơ
// khi lưu. Bác sĩ nhập: mức chăm sóc (bắt buộc, KHÔNG có mặc định), thời gian,
// diễn biến bệnh (tự điền sẵn chỉ số sinh tồn gần nhất), chỉ định; có thể chỉnh
// chẩn đoán / bệnh kèm theo.
const treatmentSheetSchema = z
  .object({
    careLevel: z.string(),
    recordedAt: z.string(),
    progressNotes: z.string(),
    instructions: z.string(),
    diagnosis: z.string(),
    comorbidities: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (!values.careLevel) {
      ctx.addIssue({ code: 'custom', path: ['careLevel'], message: 'Vui lòng chọn mức chăm sóc' })
    }

    const recordedAt = new Date(values.recordedAt)
    if (!values.recordedAt || Number.isNaN(recordedAt.getTime())) {
      ctx.addIssue({ code: 'custom', path: ['recordedAt'], message: 'Vui lòng nhập thời gian' })
    } else if (recordedAt.getTime() > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({
        code: 'custom',
        path: ['recordedAt'],
        message: 'Thời gian không được ở tương lai',
      })
    }

    if (!values.progressNotes.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['progressNotes'],
        message: 'Vui lòng nhập diễn biến bệnh',
      })
    } else if (values.progressNotes.length > 5000) {
      ctx.addIssue({ code: 'custom', path: ['progressNotes'], message: 'Tối đa 5000 ký tự' })
    }

    if (!values.instructions.trim()) {
      ctx.addIssue({ code: 'custom', path: ['instructions'], message: 'Vui lòng nhập chỉ định' })
    } else if (values.instructions.length > 2000) {
      ctx.addIssue({ code: 'custom', path: ['instructions'], message: 'Tối đa 2000 ký tự' })
    }
  })

type FormValues = z.infer<typeof treatmentSheetSchema>

const EMPTY_VALUES: FormValues = {
  careLevel: '',
  recordedAt: '',
  progressNotes: '',
  instructions: '',
  diagnosis: '',
  comorbidities: [],
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:ring-2 focus:ring-[#00459a]/10'
const readOnlyClass = `${inputClass} cursor-default text-slate-700 focus:border-slate-300 focus:ring-0`
const disabledClass =
  'w-full rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-sm text-slate-700'
const labelClass = 'text-sm text-slate-700'

function ReadOnlyField({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-center gap-3">
      <span className={labelClass}>{label}</span>
      <input readOnly tabIndex={-1} value={value ?? ''} className={readOnlyClass} />
    </div>
  )
}

function SmallReadOnly({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`${labelClass} whitespace-nowrap`}>{label}</span>
      <input readOnly tabIndex={-1} value={value ?? ''} className={`${readOnlyClass} w-20`} />
    </div>
  )
}

export function TreatmentOrderFormModal({
  isOpen,
  onClose,
  caseId,
  patientName,
}: TreatmentOrderFormModalProps) {
  const createMutation = useCreateTreatmentOrder()
  const prefillQuery = useTreatmentSheetPrefill(caseId)
  const prefill = prefillQuery.data
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
    resolver: zodResolver(treatmentSheetSchema),
  })

  const selectedLevel = useWatch({ control, name: 'careLevel' })
  const selectedComorbidities = useWatch({ control, name: 'comorbidities' }) ?? []

  // Đổ dữ liệu tự điền vào form khi tải xong. Thời gian + chỉ định + mức chăm
  // sóc cố tình để trống — bác sĩ phải nhập tường minh.
  useEffect(() => {
    if (!isOpen || !prefill) return
    reset({
      ...EMPTY_VALUES,
      progressNotes: prefill.progressNotes,
      diagnosis: prefill.diagnosis ?? '',
      comorbidities: prefill.comorbidities,
    })
  }, [isOpen, prefill, reset])

  if (!isOpen) return null

  const onSubmit = async (values: FormValues) => {
    setSubmitError('')
    try {
      await createMutation.mutateAsync({
        caseId,
        careLevel: values.careLevel as CareLevel,
        instructions: values.instructions.trim(),
        sheet: {
          recordedAt: new Date(values.recordedAt).toISOString(),
          progressNotes: values.progressNotes.trim(),
          diagnosis: values.diagnosis.trim() || undefined,
          comorbidities: values.comorbidities,
        },
      })
      onClose()
    } catch (err) {
      setSubmitError(translateError(err, 'Có lỗi xảy ra khi lưu phiếu theo dõi điều trị'))
    }
  }

  const diagnosisOptions = prefill?.diagnosisOptions ?? []

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Thêm phiếu theo dõi điều trị</h3>
            <p className="text-xs text-slate-500">
              {patientName} · Mã {caseId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {prefillQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-16 text-sm text-slate-500">
            <span className="material-symbols-outlined animate-spin text-[20px]">
              progress_activity
            </span>
            Đang tải thông tin người bệnh...
          </div>
        ) : prefillQuery.isError || !prefill ? (
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
              <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
              <p>
                {translateError(
                  prefillQuery.error,
                  'Không tải được thông tin phiếu (kiểm tra kết nối HIS)',
                )}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => prefillQuery.refetch()}
                className="rounded-xl bg-[#00459a] px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="custom-scrollbar max-h-[80vh] space-y-4 overflow-y-auto p-6"
          >
            {submitError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
                <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
                <p>{submitError}</p>
              </div>
            )}

            {/* Thông tin hành chính — tự điền */}
            <ReadOnlyField label="Tờ số" value={prefill.sheetNumber} />

            <div className="grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-2">
              <ReadOnlyField label="Cơ sở KC, CB" value={prefill.facility} />
              <ReadOnlyField label="Họ và tên" value={prefill.patientName} />

              <div className="grid grid-cols-[7rem_1fr] items-center gap-3">
                <span className={labelClass}>Khoa</span>
                <input disabled value={prefill.department} className={disabledClass} />
              </div>
              <ReadOnlyField label="Mã số người bệnh" value={prefill.caseId} />

              <div className="grid grid-cols-[7rem_1fr] items-center gap-3">
                <span className={labelClass}>Chẩn đoán</span>
                <select {...register('diagnosis')} className={inputClass}>
                  <option value="">-- Chọn chẩn đoán --</option>
                  {diagnosisOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <SmallReadOnly label="Tuổi" value={prefill.age} />
                <SmallReadOnly label="Giới tính" value={prefill.gender} />
              </div>

              <div className="grid grid-cols-[7rem_1fr] items-start gap-3">
                <span className={`${labelClass} pt-2`}>Bệnh kèm theo</span>
                <DiseaseAutocomplete
                  multiple
                  value={selectedComorbidities}
                  onChange={(value) =>
                    setValue('comorbidities', value as string[], { shouldValidate: true })
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <SmallReadOnly label="Phòng" value={prefill.room} />
                <SmallReadOnly label="Số giường" value={prefill.bed} />
              </div>
            </div>

            {/* Mức chăm sóc — giữ nguyên từ form chỉ định cũ */}
            <div className="space-y-1.5">
              <span className={labelClass}>
                Mức chăm sóc <span className="text-red-500">*</span>
              </span>
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
                      className={`rounded-xl border px-4 py-2.5 text-left transition-all ${
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
                        {prefill.activeCareLevel === level && (
                          <span className="ml-2 text-[11px] font-medium text-slate-400">
                            (hiện tại)
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {CARE_LEVEL_DESCRIPTIONS[level]}
                      </span>
                    </button>
                  )
                })}
              </div>
              {errors.careLevel && (
                <p className="text-xs text-red-500">{errors.careLevel.message}</p>
              )}
            </div>

            {/* Thời gian | Diễn biến bệnh | Chỉ định */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[11rem_1fr_1fr]">
              <div className="flex flex-col gap-1.5">
                <span className={`${labelClass} text-center`}>
                  Thời gian <span className="text-red-500">*</span>
                </span>
                <input type="datetime-local" {...register('recordedAt')} className={inputClass} />
                {errors.recordedAt && (
                  <p className="text-xs text-red-500">{errors.recordedAt.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className={`${labelClass} text-center`}>
                  Diễn biến bệnh <span className="text-red-500">*</span>
                </span>
                <textarea rows={10} {...register('progressNotes')} className={inputClass} />
                <p className="text-[11px] text-slate-400">
                  {prefill.latestVitalSignAt
                    ? 'Đã tự điền chỉ số sinh tồn gần nhất — có thể chỉnh sửa.'
                    : 'Người bệnh chưa có chỉ số sinh tồn nào được ghi nhận.'}
                </p>
                {errors.progressNotes && (
                  <p className="text-xs text-red-500">{errors.progressNotes.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className={`${labelClass} text-center`}>
                  Chỉ định <span className="text-red-500">*</span>
                </span>
                <textarea rows={10} {...register('instructions')} className={inputClass} />
                {errors.instructions && (
                  <p className="text-xs text-red-500">{errors.instructions.message}</p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-32 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-32 rounded-lg bg-[#1d4ed8] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-800 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
