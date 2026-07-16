import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { translateError } from '../../../lib/errorTranslator'
import { createPatient, updatePatient } from '../api/patientApi'
import { useProvinces, useWards } from '../api/vn-address'
import type {
  CreatePatientPayload,
  OperationType,
  PatientListItem,
  UpdatePatientPayload,
} from '../types'

interface PatientFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  // null/undefined = chế độ thêm mới, có object = chế độ sửa.
  patient?: PatientListItem | null
  operationTypes: OperationType[]
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'
const labelCls = 'mb-1 block text-xs font-medium text-slate-500'

function Field({
  label,
  required = false,
  className = '',
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

// Số rỗng -> undefined để không gửi field thừa lên backend.
function toNumber(v: string): number | undefined {
  if (v.trim() === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

function emptyToUndefined(v: string): string | undefined {
  return v.trim() === '' ? undefined : v.trim()
}

const createPatientSchema = (isEdit: boolean) =>
  z
    .object({
      caseId: z.string(),
      fullName: z.string(),
      age: z.string(),
      gender: z.string(),
      height: z.string(),
      weight: z.string(),
      detailedAddress: z.string(),
      operationTypeId: z.string(),
      method: z.string(),
      surgeryDate: z.string(),
      hasGiAnastomosis: z.string(),
      diagnosis: z.string(),
      roomBed: z.string(),
      provinceCode: z.string(),
      ward: z.string(),
    })
    .superRefine((values, ctx) => {
      if (!isEdit && !values.caseId.trim()) {
        ctx.addIssue({ code: 'custom', path: ['caseId'], message: 'Mã bệnh nhân là bắt buộc' })
      }

      if (!values.fullName.trim()) {
        ctx.addIssue({ code: 'custom', path: ['fullName'], message: 'Họ tên là bắt buộc' })
      }

      if (!values.age.trim()) {
        ctx.addIssue({ code: 'custom', path: ['age'], message: 'Tuổi là bắt buộc' })
      }

      if (!values.gender.trim()) {
        ctx.addIssue({ code: 'custom', path: ['gender'], message: 'Giới tính là bắt buộc' })
      }

      if (!values.height.trim()) {
        ctx.addIssue({ code: 'custom', path: ['height'], message: 'Chiều cao là bắt buộc' })
      }

      if (!values.weight.trim()) {
        ctx.addIssue({ code: 'custom', path: ['weight'], message: 'Cân nặng là bắt buộc' })
      }

      if (!values.operationTypeId.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['operationTypeId'],
          message: 'Loại phẫu thuật là bắt buộc',
        })
      }

      if (!values.method.trim()) {
        ctx.addIssue({ code: 'custom', path: ['method'], message: 'Phương pháp mổ là bắt buộc' })
      }

      if (!values.surgeryDate.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['surgeryDate'],
          message: 'Ngày phẫu thuật là bắt buộc',
        })
      }

      if (!values.hasGiAnastomosis.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['hasGiAnastomosis'],
          message: 'Có miệng nối tiêu hoá là bắt buộc',
        })
      }

      if (!values.diagnosis.trim()) {
        ctx.addIssue({ code: 'custom', path: ['diagnosis'], message: 'Chẩn đoán là bắt buộc' })
      }

      if (!values.roomBed.trim()) {
        ctx.addIssue({ code: 'custom', path: ['roomBed'], message: 'Buồng giường là bắt buộc' })
      }
    })

type FormValues = z.infer<ReturnType<typeof createPatientSchema>>

function buildDefaultValues(patient?: PatientListItem | null): FormValues {
  return {
    caseId: patient?.caseId ?? '',
    fullName: patient?.account?.fullName ?? '',
    age: patient?.age != null ? String(patient.age) : '',
    gender: patient?.gender ?? '',
    height: patient?.height != null ? String(patient.height) : '',
    weight: patient?.weight != null ? String(patient.weight) : '',
    detailedAddress: patient?.account?.detailedAddress ?? '',
    operationTypeId: patient?.operationType?.id != null ? String(patient.operationType.id) : '',
    method: patient?.method ?? '',
    surgeryDate: patient?.surgeryDate ? patient.surgeryDate.split('T')[0] : '',
    hasGiAnastomosis:
      patient?.hasGiAnastomosis == null ? '' : patient.hasGiAnastomosis ? 'true' : 'false',
    diagnosis: patient?.diagnosis ?? '',
    roomBed: patient?.roomBed ?? '',
    provinceCode: '',
    ward: patient?.account?.ward ?? '',
  }
}

export function PatientFormModal({
  isOpen,
  onClose,
  onSaved,
  patient,
  operationTypes,
}: PatientFormModalProps) {
  const isEdit = !!patient
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)
  const [provinceSearch, setProvinceSearch] = useState('')
  const [provinceSearchTimeout, setProvinceSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)
  const [wardSearch, setWardSearch] = useState('')
  const [wardSearchTimeout, setWardSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const { data: provinces = [] } = useProvinces()

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: buildDefaultValues(patient),
    mode: 'onSubmit',
    resolver: zodResolver(createPatientSchema(isEdit)),
  })

  const heightValue = useWatch({ control, name: 'height' }) ?? ''
  const weightValue = useWatch({ control, name: 'weight' }) ?? ''
  const selectedProvinceCode = useWatch({ control, name: 'provinceCode' }) ?? ''
  const selectedWard = useWatch({ control, name: 'ward' }) ?? ''
  const selectedGender = useWatch({ control, name: 'gender' }) ?? ''
  const selectedOperationTypeId = useWatch({ control, name: 'operationTypeId' }) ?? ''
  const selectedHasGiAnastomosis = useWatch({ control, name: 'hasGiAnastomosis' }) ?? ''

  const { data: wards = [] } = useWards(selectedProvinceCode ? Number(selectedProvinceCode) : null)

  const bmi = useMemo(() => {
    const h = Number(heightValue)
    const w = Number(weightValue)
    if (!h || !w) return ''
    return (w / (h / 100) ** 2).toFixed(1)
  }, [heightValue, weightValue])

  useEffect(() => {
    if (!isOpen) return
    reset(buildDefaultValues(patient))
  }, [isOpen, patient, reset])

  useEffect(() => {
    if (!isOpen || !patient?.account?.cityProvince || provinces.length === 0) return
    const match = provinces.find((p) => p.name === patient.account?.cityProvince)
    if (match) {
      setValue('provinceCode', String(match.code), { shouldValidate: true, shouldDirty: true })
    }
  }, [isOpen, patient, provinces, setValue])

  if (!isOpen) return null

  const cityProvince = provinces.find((p) => p.code === Number(selectedProvinceCode))?.name ?? ''

  const handleClose = () => {
    setSubmitError('')
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitError('')

    const common = {
      fullName: values.fullName.trim(),
      age: toNumber(values.age),
      gender: emptyToUndefined(values.gender),
      height: toNumber(values.height),
      weight: toNumber(values.weight),
      bmi: bmi === '' ? undefined : Number(bmi),
      cityProvince: emptyToUndefined(cityProvince),
      ward: emptyToUndefined(values.ward),
      detailedAddress: emptyToUndefined(values.detailedAddress),
      operationTypeId: toNumber(values.operationTypeId),
      method: emptyToUndefined(values.method),
      surgeryDate: emptyToUndefined(values.surgeryDate),
      hasGiAnastomosis:
        values.hasGiAnastomosis === '' ? undefined : values.hasGiAnastomosis === 'true',
      diagnosis: emptyToUndefined(values.diagnosis),
      roomBed: emptyToUndefined(values.roomBed),
    }

    try {
      setSaving(true)
      if (isEdit && patient?.account) {
        await updatePatient(patient.account.id, common as UpdatePatientPayload)
      } else {
        await createPatient({ caseId: values.caseId.trim(), ...common } as CreatePatientPayload)
      }
      onSaved()
      onClose()
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      const shouldSuppress = status === 400 || status === 409
      const errorMessage = translateError(
        err,
        'Có lỗi xảy ra khi lưu hồ sơ bệnh án',
        shouldSuppress,
      )
      setSubmitError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="flex-1 text-center text-lg font-bold text-slate-800">
            {isEdit ? 'Sửa hồ sơ bệnh nhân' : 'Thêm hồ sơ bệnh án'}
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
            title="Đóng"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[calc(90vh-9rem)] space-y-4 overflow-y-auto px-6 py-5"
        >
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Mã + Họ tên */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Mã bệnh nhân" required={!isEdit}>
              <input
                {...register('caseId', {
                  onChange: (e) =>
                    setValue('caseId', e.target.value.toUpperCase(), { shouldValidate: true }),
                })}
                disabled={isEdit}
                placeholder="Ví dụ: CASE-001"
                className={inputCls}
              />
              {errors.caseId && (
                <p className="mt-1 text-xs text-red-500">{errors.caseId.message}</p>
              )}
            </Field>
            <Field label="Họ tên đầy đủ" required>
              <input {...register('fullName')} className={inputCls} />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>
              )}
            </Field>
          </div>

          {/* Tuổi / Giới tính / Chiều cao / Cân nặng / BMI */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Field label="Tuổi" required>
              <input type="number" min={0} {...register('age')} className={inputCls} />
              {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age.message}</p>}
            </Field>
            <Field label="Giới tính" required>
              <select
                value={selectedGender}
                onChange={(e) => setValue('gender', e.target.value, { shouldValidate: true })}
                className={inputCls}
              >
                <option value="">--</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-xs text-red-500">{errors.gender.message}</p>
              )}
            </Field>
            <Field label="Chiều cao (cm)" required>
              <input type="number" {...register('height')} className={inputCls} />
              {errors.height && (
                <p className="mt-1 text-xs text-red-500">{errors.height.message}</p>
              )}
            </Field>
            <Field label="Cân nặng (kg)" required>
              <input type="number" {...register('weight')} className={inputCls} />
              {errors.weight && (
                <p className="mt-1 text-xs text-red-500">{errors.weight.message}</p>
              )}
            </Field>
            <Field label="BMI">
              <input value={bmi} disabled className={inputCls} />
            </Field>
          </div>

          {/* Thành phố / Quận, xã / Địa chỉ chi tiết */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Thành phố">
              <select
                value={selectedProvinceCode}
                onChange={(e) => {
                  setValue('provinceCode', e.target.value, { shouldValidate: true })
                  setValue('ward', '', { shouldValidate: true })
                }}
                onKeyDown={(e) => {
                  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                    const char = e.key.toLowerCase()
                    setProvinceSearch((prev) => prev + char)

                    if (provinceSearchTimeout) clearTimeout(provinceSearchTimeout)
                    setProvinceSearchTimeout(setTimeout(() => setProvinceSearch(''), 1000))

                    const match = provinces.find((p) =>
                      p.name.toLowerCase().startsWith(provinceSearch + char),
                    )
                    if (match) {
                      setValue('provinceCode', String(match.code), { shouldValidate: true })
                      setValue('ward', '', { shouldValidate: true })
                    }
                  }
                }}
                className={inputCls}
              >
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quận, xã">
              <select
                value={selectedWard}
                onChange={(e) => setValue('ward', e.target.value, { shouldValidate: true })}
                disabled={!selectedProvinceCode}
                onKeyDown={(e) => {
                  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                    const char = e.key.toLowerCase()
                    setWardSearch((prev) => prev + char)

                    if (wardSearchTimeout) clearTimeout(wardSearchTimeout)
                    setWardSearchTimeout(setTimeout(() => setWardSearch(''), 1000))

                    const match = wards.find((w) =>
                      w.name.toLowerCase().startsWith(wardSearch + char),
                    )
                    if (match) setValue('ward', match.name, { shouldValidate: true })
                  }
                }}
                className={inputCls}
              >
                <option value="">Chọn phường/xã</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Địa chỉ chi tiết">
              <input {...register('detailedAddress')} className={inputCls} />
            </Field>
          </div>

          {/* Loại PT / Phương pháp / Ngày PT / Miệng nối */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Loại phẫu thuật" required>
              <select
                value={selectedOperationTypeId}
                onChange={(e) =>
                  setValue('operationTypeId', e.target.value, { shouldValidate: true })
                }
                className={inputCls}
              >
                <option value="">--</option>
                {operationTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.operationTypeId && (
                <p className="mt-1 text-xs text-red-500">{errors.operationTypeId.message}</p>
              )}
            </Field>
            <Field label="Phương pháp mổ" required>
              <input {...register('method')} className={inputCls} />
              {errors.method && (
                <p className="mt-1 text-xs text-red-500">{errors.method.message}</p>
              )}
            </Field>
            <Field label="Ngày phẫu thuật" required>
              <input type="date" {...register('surgeryDate')} className={inputCls} />
              {errors.surgeryDate && (
                <p className="mt-1 text-xs text-red-500">{errors.surgeryDate.message}</p>
              )}
            </Field>
            <Field label="Có miệng nối tiêu hoá" required>
              <select
                value={selectedHasGiAnastomosis}
                onChange={(e) =>
                  setValue('hasGiAnastomosis', e.target.value, { shouldValidate: true })
                }
                className={inputCls}
              >
                <option value="">--</option>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </select>
              {errors.hasGiAnastomosis && (
                <p className="mt-1 text-xs text-red-500">{errors.hasGiAnastomosis.message}</p>
              )}
            </Field>
          </div>

          {/* Chẩn đoán / Buồng giường */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <Field label="Chẩn đoán" required>
              <input {...register('diagnosis')} className={inputCls} />
              {errors.diagnosis && (
                <p className="mt-1 text-xs text-red-500">{errors.diagnosis.message}</p>
              )}
            </Field>
            <Field label="Buồng giường" required>
              <input
                {...register('roomBed', {
                  onChange: (e) =>
                    setValue('roomBed', e.target.value.toUpperCase(), { shouldValidate: true }),
                })}
                placeholder="Ví dụ: P101-B1"
                className={inputCls}
              />
              {errors.roomBed && (
                <p className="mt-1 text-xs text-red-500">{errors.roomBed.message}</p>
              )}
            </Field>
          </div>

          {/* Footer */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-200 bg-slate-50 px-8 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Xác nhận' : 'Thêm hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
