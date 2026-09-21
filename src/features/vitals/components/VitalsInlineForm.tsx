import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { translateError } from '../../../lib/errorTranslator'
import { useRecordVitals } from '../api/vitals'

interface VitalsInlineFormProps {
  caseId: string
  patientName: string
  onClose: () => void
}

// Ngưỡng hợp lệ — là "sanity bound" kỹ thuật, ÁP DỤNG GIỐNG HỆT ở backend
// (xem plan SEP490-421). Huyết áp và nhịp thở KHÔNG có giới hạn min/max theo
// yêu cầu — chỉ còn bắt buộc nhập + phải là số nguyên.
type NumericField =
  | 'pulseBpm'
  | 'bloodPressureSystolic'
  | 'bloodPressureDiastolic'
  | 'temperatureCelsius'
  | 'respiratoryRate'
  | 'spo2Percent'

const RANGES: Partial<Record<NumericField, { min: number; max: number }>> = {
  pulseBpm: { min: 30, max: 220 },
  temperatureCelsius: { min: 30, max: 43 },
  spo2Percent: { min: 0, max: 100 },
}

const FIELD_META: {
  name: NumericField
  label: string
  unit: string
  placeholder: string
  step?: string
  maxDecimalPlaces?: number
}[] = [
  { name: 'pulseBpm', label: 'Mạch', unit: 'lần/phút', placeholder: '30 - 220' },
  {
    name: 'bloodPressureSystolic',
    label: 'Huyết áp tâm thu',
    unit: 'mmHg',
    placeholder: 'mmHg',
  },
  {
    name: 'bloodPressureDiastolic',
    label: 'Huyết áp tâm trương',
    unit: 'mmHg',
    placeholder: 'mmHg',
  },
  {
    name: 'temperatureCelsius',
    label: 'Nhiệt độ',
    unit: '°C',
    placeholder: '30.00 - 43.00',
    step: '0.01',
    maxDecimalPlaces: 2,
  },
  { name: 'respiratoryRate', label: 'Nhịp thở', unit: 'lần/phút', placeholder: 'lần/phút' },
  { name: 'spo2Percent', label: 'SpO₂', unit: '%', placeholder: '0 - 100' },
]

const vitalsFormSchema = z
  .object({
    pulseBpm: z.string(),
    bloodPressureSystolic: z.string(),
    bloodPressureDiastolic: z.string(),
    temperatureCelsius: z.string(),
    respiratoryRate: z.string(),
    spo2Percent: z.string(),
    note: z.string(),
  })
  .superRefine((values, ctx) => {
    for (const meta of FIELD_META) {
      const raw = values[meta.name].trim()
      const range = RANGES[meta.name]

      if (!raw) {
        ctx.addIssue({
          code: 'custom',
          path: [meta.name],
          message: `${meta.label} không được để trống`,
        })
        continue
      }

      const num = Number(raw)
      if (!Number.isFinite(num)) {
        ctx.addIssue({ code: 'custom', path: [meta.name], message: `${meta.label} phải là số` })
        continue
      }

      if (range && (num < range.min || num > range.max)) {
        ctx.addIssue({
          code: 'custom',
          path: [meta.name],
          message: `${meta.label} phải trong khoảng ${range.min} - ${range.max} ${meta.unit}`,
        })
        continue
      }

      if (meta.maxDecimalPlaces !== undefined) {
        const decimals = raw.includes('.') ? raw.split('.')[1].length : 0
        if (decimals > meta.maxDecimalPlaces) {
          ctx.addIssue({
            code: 'custom',
            path: [meta.name],
            message: `${meta.label} tối đa ${meta.maxDecimalPlaces} chữ số thập phân`,
          })
        }
      }
    }

    const systolic = Number(values.bloodPressureSystolic)
    const diastolic = Number(values.bloodPressureDiastolic)
    if (Number.isFinite(systolic) && Number.isFinite(diastolic) && systolic <= diastolic) {
      ctx.addIssue({
        code: 'custom',
        path: ['bloodPressureSystolic'],
        message: 'Huyết áp tâm thu phải lớn hơn huyết áp tâm trương',
      })
    }

    if (values.note.length > 500) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: 'Ghi chú tối đa 500 ký tự' })
    }
  })

type FormValues = z.infer<typeof vitalsFormSchema>

const EMPTY_VALUES: FormValues = {
  pulseBpm: '',
  bloodPressureSystolic: '',
  bloodPressureDiastolic: '',
  temperatureCelsius: '',
  respiratoryRate: '',
  spo2Percent: '',
  note: '',
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:ring-2 focus:ring-[#00459a]/10'

// Form ghi nhận chỉ số sinh tồn — NẰM NGAY TRONG tab "Chỉ số" (không phải
// dialog/overlay che màn hình), theo đúng bố cục dày đặc kiểu phiếu giấy
// (nhiều ô nhỏ trên cùng 1 hàng) mà người dùng yêu cầu. KHÔNG có ô nhập
// người ghi/thời điểm ghi — server tự gán từ tài khoản đang đăng nhập.
//
// LƯU Ý: component PHẢI được mount với `key={caseId}` ở nơi gọi (VitalsTab) —
// đây là cách "làm sạch form khi đổi bệnh nhân" mà không cần effect gọi
// reset()/setState cục bộ (tránh cascading render, đúng lint rule
// react-hooks/set-state-in-effect của repo).
export function VitalsInlineForm({ caseId, patientName, onClose }: VitalsInlineFormProps) {
  const recordMutation = useRecordVitals()
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: EMPTY_VALUES,
    mode: 'onSubmit',
    resolver: zodResolver(vitalsFormSchema),
  })

  const onSubmit = async (values: FormValues) => {
    setSubmitError('')
    try {
      await recordMutation.mutateAsync({
        caseId,
        pulseBpm: Number(values.pulseBpm),
        bloodPressureSystolic: Number(values.bloodPressureSystolic),
        bloodPressureDiastolic: Number(values.bloodPressureDiastolic),
        temperatureCelsius: Number(values.temperatureCelsius),
        respiratoryRate: Number(values.respiratoryRate),
        spo2Percent: Number(values.spo2Percent),
        note: values.note.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setSubmitError(translateError(err, 'Có lỗi xảy ra khi ghi nhận chỉ số'))
    }
  }

  return (
    <div className="rounded-xl border border-[#00459a]/20 bg-[#00459a]/[0.03]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00459a]/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#00459a]">
            monitor_heart
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Ghi nhận chỉ số sinh tồn</h3>
            <p className="text-[11px] text-slate-500">{patientName}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 p-4">
        {submitError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-600">
            <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
            <p>{submitError}</p>
          </div>
        )}

        {/* Lưới dày đặc — nhiều ô nhỏ trên cùng hàng, giống bố cục phiếu giấy. */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {FIELD_META.map((meta) => (
            <div key={meta.name}>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {meta.label} ({meta.unit}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                step={meta.step ?? '1'}
                {...register(meta.name)}
                placeholder={meta.placeholder}
                className={`${inputClass} mt-1`}
              />
              {errors[meta.name] && (
                <p className="mt-0.5 text-[10px] text-red-500">{errors[meta.name]?.message}</p>
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Ghi chú
          </label>
          <textarea
            rows={2}
            {...register('note')}
            placeholder="Ghi chú thêm (nếu có)"
            className={`${inputClass} mt-1`}
          />
          {errors.note && <p className="mt-0.5 text-[10px] text-red-500">{errors.note.message}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#00459a]/10 pt-3">
          <p className="text-[11px] text-slate-500">
            Người ghi nhận và thời điểm ghi nhận do hệ thống tự động lưu — không thể chỉnh sửa.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-white hover:text-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={recordMutation.isPending}
              className="flex items-center gap-1 rounded-lg bg-[#00459a] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 transition-all hover:bg-blue-700 disabled:opacity-50"
            >
              {recordMutation.isPending ? 'Đang lưu...' : 'Lưu chỉ số'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
