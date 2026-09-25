import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { preventEnterSubmit } from '../../../lib/forms'
import { translateError } from '../../../lib/errorTranslator'
import { useHasRole } from '../../auth/hooks/useRole'
import { useOperationTypes, useUpdatePatient } from '../api/patientApi'
import type { PatientListItem, UpdatePatientPayload } from '../types'
import { DiseaseAutocomplete } from './DiseaseAutocomplete'

// Khối "Thông tin chung" trong tab Tổng quan — mọi nhân viên y tế (điều dưỡng,
// điều dưỡng trưởng, bác sĩ) sửa TRỰC TIẾP trên thẻ. Chỉ khi form có thay đổi
// mới hiện thanh "Huỷ / Lưu" dính ở đáy. Vai trò khác (admin) chỉ xem.

const schema = z
  .object({
    fullName: z.string(),
    age: z.string(),
    gender: z.string(),
    phoneNumber: z.string(),
    height: z.string(),
    weight: z.string(),
    surgeryDate: z.string(),
    operationTypeId: z.string(),
    method: z.string(),
    hasGiAnastomosis: z.string(),
    roomBed: z.string(),
    diagnosis: z.string(),
    comorbidities: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (!values.fullName.trim()) {
      ctx.addIssue({ code: 'custom', path: ['fullName'], message: 'Họ tên là bắt buộc' })
    }
    const age = Number(values.age)
    if (values.age.trim() && (!Number.isInteger(age) || age < 0 || age > 150)) {
      ctx.addIssue({ code: 'custom', path: ['age'], message: 'Tuổi không hợp lệ' })
    }
    for (const key of ['height', 'weight'] as const) {
      const n = Number(values[key])
      if (values[key].trim() && (Number.isNaN(n) || n <= 0)) {
        ctx.addIssue({ code: 'custom', path: [key], message: 'Giá trị không hợp lệ' })
      }
    }
    if (values.phoneNumber.trim() && !/^[0-9+\s.-]{8,20}$/.test(values.phoneNumber.trim())) {
      ctx.addIssue({ code: 'custom', path: ['phoneNumber'], message: 'Số điện thoại không hợp lệ' })
    }
    if (!values.diagnosis.trim()) {
      ctx.addIssue({ code: 'custom', path: ['diagnosis'], message: 'Chẩn đoán là bắt buộc' })
    }
  })

type FormValues = z.infer<typeof schema>

function toFormValues(patient: PatientListItem): FormValues {
  return {
    fullName: patient.account?.fullName ?? patient.fullName ?? '',
    age: patient.age != null ? String(patient.age) : '',
    gender: patient.gender ?? '',
    phoneNumber: patient.account?.phoneNumber ?? '',
    height: patient.height != null ? String(patient.height) : '',
    weight: patient.weight != null ? String(patient.weight) : '',
    surgeryDate: patient.surgeryDate ? patient.surgeryDate.split('T')[0] : '',
    operationTypeId: patient.operationType?.id != null ? String(patient.operationType.id) : '',
    method: patient.method ?? '',
    hasGiAnastomosis:
      patient.hasGiAnastomosis == null ? '' : patient.hasGiAnastomosis ? 'true' : 'false',
    roomBed: patient.roomBed ?? '',
    diagnosis: patient.diagnosis ?? '',
    comorbidities: patient.comorbidities ?? [],
  }
}

function computeBmi(height: string, weight: string): number | null {
  const h = Number(height)
  const w = Number(weight)
  if (!h || !w) return null
  return Math.round((w / (h / 100) ** 2) * 10) / 10
}

const textOrNull = (v: string) => (v.trim() === '' ? null : v.trim())
const numberOrNull = (v: string) => (v.trim() === '' ? null : Number(v))

// Chỉ gửi những field thực sự đổi — tránh ghi đè dữ liệu người khác vừa sửa.
function buildPayload(values: FormValues, dirty: Partial<Record<keyof FormValues, unknown>>) {
  const payload: UpdatePatientPayload = {}
  if (dirty.fullName) payload.fullName = values.fullName.trim()
  if (dirty.age) payload.age = numberOrNull(values.age)
  if (dirty.gender) payload.gender = textOrNull(values.gender)
  if (dirty.phoneNumber) payload.phoneNumber = textOrNull(values.phoneNumber)
  if (dirty.height) payload.height = numberOrNull(values.height)
  if (dirty.weight) payload.weight = numberOrNull(values.weight)
  if (dirty.height || dirty.weight) payload.bmi = computeBmi(values.height, values.weight)
  if (dirty.surgeryDate) payload.surgeryDate = textOrNull(values.surgeryDate)
  if (dirty.operationTypeId) payload.operationTypeId = numberOrNull(values.operationTypeId)
  if (dirty.method) payload.method = textOrNull(values.method)
  if (dirty.hasGiAnastomosis) {
    payload.hasGiAnastomosis =
      values.hasGiAnastomosis === '' ? null : values.hasGiAnastomosis === 'true'
  }
  if (dirty.roomBed) payload.roomBed = textOrNull(values.roomBed)
  if (dirty.diagnosis) payload.diagnosis = values.diagnosis.trim()
  if (dirty.comorbidities) payload.comorbidities = values.comorbidities
  return payload
}

// Ô nhập "trong suốt": trông như chữ thường, hiện viền khi hover/focus.
const inlineInputCls =
  'w-full rounded-md border border-transparent bg-transparent px-1.5 py-0.5 -mx-1.5 text-sm font-semibold text-slate-800 outline-none transition hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:cursor-default disabled:hover:border-transparent'

function FieldCard({
  icon,
  label,
  error,
  dirty,
  className = '',
  children,
}: {
  icon: string
  label: string
  error?: string
  dirty?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border bg-white p-3 transition ${
        error ? 'border-red-300' : dirty ? 'border-blue-300 bg-blue-50/30' : 'border-slate-100'
      } ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        {children}
        {error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  )
}

export function PatientInfoForm({ patient }: { patient: PatientListItem }) {
  const canEdit = useHasRole('nurse', 'head_nurse', 'doctor')
  const { data: operationTypes = [] } = useOperationTypes()
  const updateMutation = useUpdatePatient()
  const [submitError, setSubmitError] = useState('')
  const [justSaved, setJustSaved] = useState(false)

  const defaultValues = useMemo(() => toFormValues(patient), [patient])
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<FormValues>({ defaultValues, resolver: zodResolver(schema) })

  // Dữ liệu người bệnh được làm mới (sau khi lưu, realtime, refetch) → nạp
  // lại form nhưng giữ những gì đang gõ dở. Đổi sang người bệnh khác thì
  // OverviewTab remount component (key = caseId) nên state luôn sạch.
  useEffect(() => {
    reset(defaultValues, { keepDirtyValues: true })
  }, [defaultValues, reset])

  const height = useWatch({ control, name: 'height' })
  const weight = useWatch({ control, name: 'weight' })
  const bmi = computeBmi(height, weight)

  const onSubmit = async (values: FormValues) => {
    setSubmitError('')
    const payload = buildPayload(values, dirtyFields)
    try {
      await updateMutation.mutateAsync({ userId: patient.account.id, payload })
      reset(values) // form sạch ngay; dữ liệu mới từ server sẽ nạp lại qua effect trên
      setJustSaved(true)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      setSubmitError(
        translateError(
          err,
          'Không lưu được thông tin người bệnh',
          status === 400 || status === 409,
        ),
      )
    }
  }

  const handleCancel = () => {
    reset(defaultValues)
    setSubmitError('')
  }

  const disabled = !canEdit || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={preventEnterSubmit} noValidate>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FieldCard icon="badge" label="Mã người bệnh">
          <p className="truncate py-0.5 text-sm font-semibold text-slate-800">{patient.caseId}</p>
        </FieldCard>

        <FieldCard
          icon="person"
          label="Họ và tên"
          error={errors.fullName?.message}
          dirty={!!dirtyFields.fullName}
        >
          <input {...register('fullName')} disabled={disabled} className={inlineInputCls} />
        </FieldCard>

        <FieldCard icon="cake" label="Tuổi" error={errors.age?.message} dirty={!!dirtyFields.age}>
          <input
            {...register('age')}
            type="number"
            min={0}
            max={150}
            placeholder="--"
            disabled={disabled}
            className={inlineInputCls}
          />
        </FieldCard>

        <FieldCard icon="wc" label="Giới tính" dirty={!!dirtyFields.gender}>
          <select {...register('gender')} disabled={disabled} className={inlineInputCls}>
            <option value="">--</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </FieldCard>

        <FieldCard
          icon="call"
          label="Số điện thoại"
          error={errors.phoneNumber?.message}
          dirty={!!dirtyFields.phoneNumber}
        >
          <input
            {...register('phoneNumber')}
            type="tel"
            placeholder="--"
            disabled={disabled}
            className={inlineInputCls}
          />
        </FieldCard>

        <FieldCard
          icon="bed"
          label="Phòng / Giường"
          error={errors.roomBed?.message}
          dirty={!!dirtyFields.roomBed}
        >
          <input
            {...register('roomBed')}
            placeholder="--"
            disabled={disabled}
            className={inlineInputCls}
          />
        </FieldCard>

        <FieldCard
          icon="height"
          label="Chiều cao (cm)"
          error={errors.height?.message}
          dirty={!!dirtyFields.height}
        >
          <input
            {...register('height')}
            type="number"
            step="0.1"
            placeholder="--"
            disabled={disabled}
            className={inlineInputCls}
          />
        </FieldCard>

        <FieldCard
          icon="monitor_weight"
          label="Cân nặng (kg)"
          error={errors.weight?.message}
          dirty={!!dirtyFields.weight}
        >
          <input
            {...register('weight')}
            type="number"
            step="0.1"
            placeholder="--"
            disabled={disabled}
            className={inlineInputCls}
          />
        </FieldCard>

        <FieldCard icon="calculate" label="BMI (tự tính)">
          <p className="py-0.5 text-sm font-semibold text-slate-800">{bmi ?? '--'}</p>
        </FieldCard>

        <FieldCard icon="event" label="Ngày phẫu thuật" dirty={!!dirtyFields.surgeryDate}>
          <input
            {...register('surgeryDate')}
            type="date"
            disabled={disabled}
            className={inlineInputCls}
          />
        </FieldCard>

        <FieldCard
          icon="medical_services"
          label="Loại phẫu thuật"
          dirty={!!dirtyFields.operationTypeId}
        >
          {/* Controlled: danh sách loại phẫu thuật tải SAU form, select uncontrolled
              sẽ kẹt ở "--" dù giá trị trong form đã đúng. */}
          <Controller
            control={control}
            name="operationTypeId"
            render={({ field }) => (
              <select {...field} disabled={disabled} className={inlineInputCls}>
                <option value="">--</option>
                {operationTypes.map((type) => (
                  <option key={type.id} value={String(type.id)}>
                    {type.name}
                  </option>
                ))}
              </select>
            )}
          />
        </FieldCard>

        <FieldCard icon="content_cut" label="Phương pháp mổ" dirty={!!dirtyFields.method}>
          <input
            {...register('method')}
            placeholder="--"
            disabled={disabled}
            className={inlineInputCls}
            title={patient.method ?? undefined}
          />
        </FieldCard>

        <FieldCard
          icon="join_inner"
          label="Miệng nối tiêu hoá"
          dirty={!!dirtyFields.hasGiAnastomosis}
        >
          <select {...register('hasGiAnastomosis')} disabled={disabled} className={inlineInputCls}>
            <option value="">--</option>
            <option value="true">Có</option>
            <option value="false">Không</option>
          </select>
        </FieldCard>

        <FieldCard icon="timeline" label="POD hiện tại">
          <p className="py-0.5 text-sm font-semibold text-slate-800">POD {patient.currentPod}</p>
        </FieldCard>

        <FieldCard
          icon="stethoscope"
          label="Chẩn đoán"
          error={errors.diagnosis?.message}
          dirty={!!dirtyFields.diagnosis}
          className="sm:col-span-2 lg:col-span-3"
        >
          {canEdit ? (
            <div className="mt-1">
              <Controller
                control={control}
                name="diagnosis"
                render={({ field }) => (
                  <DiseaseAutocomplete
                    value={field.value}
                    onChange={(next) => field.onChange(next as string)}
                  />
                )}
              />
            </div>
          ) : (
            <p className="py-0.5 text-sm font-semibold text-slate-800">
              {patient.diagnosis || '--'}
            </p>
          )}
        </FieldCard>

        <FieldCard
          icon="healing"
          label="Bệnh kèm theo"
          dirty={!!dirtyFields.comorbidities}
          className="sm:col-span-2 lg:col-span-3"
        >
          {canEdit ? (
            <div className="mt-1">
              <Controller
                control={control}
                name="comorbidities"
                render={({ field }) => (
                  <DiseaseAutocomplete
                    multiple
                    value={field.value}
                    onChange={(next) => field.onChange(next as string[])}
                  />
                )}
              />
            </div>
          ) : (
            <p className="py-0.5 text-sm font-semibold text-slate-800">
              {patient.comorbidities?.length ? patient.comorbidities.join('; ') : '--'}
            </p>
          )}
        </FieldCard>
      </div>

      {justSaved && !isDirty && (
        <p className="mt-3 flex items-center gap-1 text-xs font-medium text-green-600">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Đã lưu thông tin người bệnh
        </p>
      )}

      {canEdit && isDirty && (
        <div className="sticky bottom-0 -mx-5 -mb-5 mt-4 flex items-center justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
          {submitError && <p className="mr-auto text-sm text-red-500">{submitError}</p>}
          <button
            type="button"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-[#00459a] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition hover:bg-blue-700 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      )}
    </form>
  )
}
