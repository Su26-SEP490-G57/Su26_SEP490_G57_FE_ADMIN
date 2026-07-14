import { useEffect, useMemo, useState } from 'react'
import { translateError } from '../../../lib/errorTranslator'
import { createPatient, updatePatient } from '../api/patientApi'
import { useProvinces, useWards } from '../api/vn-address'
import type { CreatePatientPayload, OperationType, PatientListItem, UpdatePatientPayload } from '../types'

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

function Field({ label, required = false, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
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

export function PatientFormModal({ isOpen, onClose, onSaved, patient, operationTypes }: PatientFormModalProps) {
  const isEdit = !!patient

  // Clinical / account fields
  const [caseId, setCaseId] = useState('')
  const [fullName, setFullName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [detailedAddress, setDetailedAddress] = useState('')
  const [operationTypeId, setOperationTypeId] = useState('')
  const [method, setMethod] = useState('')
  const [surgeryDate, setSurgeryDate] = useState('')
  const [hasGiAnastomosis, setHasGiAnastomosis] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [roomBed, setRoomBed] = useState('')

  // Address (tỉnh/thành lưu theo tên; cần code để load phường/xã)
  const [provinceCode, setProvinceCode] = useState<number | null>(null)
  const [ward, setWard] = useState('')
  const [provinceSearch, setProvinceSearch] = useState('')
  const [provinceSearchTimeout, setProvinceSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [wardSearch, setWardSearch] = useState('')
  const [wardSearchTimeout, setWardSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: provinces = [] } = useProvinces()
  const { data: wards = [] } = useWards(provinceCode)

  // BMI tự tính từ chiều cao (cm) & cân nặng (kg).
  const bmi = useMemo(() => {
    const h = Number(height)
    const w = Number(weight)
    if (!h || !w) return ''
    return (w / (h / 100) ** 2).toFixed(1)
  }, [height, weight])

  // Đồng bộ state khi mở modal.
  useEffect(() => {
    if (!isOpen) return
    setErrors({})
    setSubmitError('')
    if (patient) {
      setCaseId(patient.case_id)
      setFullName(patient.account?.fullName ?? '')
      setAge(patient.age != null ? String(patient.age) : '')
      setGender(patient.gender ?? '')
      setHeight(patient.height != null ? String(patient.height) : '')
      setWeight(patient.weight != null ? String(patient.weight) : '')
      setDetailedAddress(patient.account?.detailedAddress ?? '')
      setOperationTypeId(patient.operation_type_id != null ? String(patient.operation_type_id) : '')
      setMethod(patient.method ?? '')
      setSurgeryDate(patient.surgery_date ? patient.surgery_date.split('T')[0] : '')
      setHasGiAnastomosis(
        patient.has_gi_anastomosis == null ? '' : patient.has_gi_anastomosis ? 'true' : 'false',
      )
      setDiagnosis(patient.diagnosis ?? '')
      setRoomBed(patient.room_bed ?? '')
      setWard(patient.account?.ward ?? '')
      setProvinceCode(null) // sẽ được resolve từ tên ở effect bên dưới
    } else {
      setCaseId('')
      setFullName('')
      setAge('')
      setGender('')
      setHeight('')
      setWeight('')
      setDetailedAddress('')
      setOperationTypeId('')
      setMethod('')
      setSurgeryDate('')
      setHasGiAnastomosis('')
      setDiagnosis('')
      setRoomBed('')
      setWard('')
      setProvinceCode(null)
    }
  }, [isOpen, patient])

  // Khi sửa: map tên tỉnh đã lưu -> code để load phường/xã.
  useEffect(() => {
    if (!isOpen || !patient?.account?.cityProvince || provinces.length === 0) return
    const match = provinces.find((p) => p.name === patient.account?.cityProvince)
    if (match) setProvinceCode(match.code)
  }, [isOpen, patient, provinces])

  if (!isOpen) return null

  const cityProvince = provinces.find((p) => p.code === provinceCode)?.name ?? ''

  function validate() {
    const e: Record<string, string> = {}

    // Required fields
    if (!isEdit && !caseId.trim()) e.caseId = 'Mã bệnh nhân là bắt buộc'
    if (!fullName.trim()) e.fullName = 'Họ tên là bắt buộc'
    if (!age.trim()) e.age = 'Tuổi là bắt buộc'
    if (!gender.trim()) e.gender = 'Giới tính là bắt buộc'
    if (!height.trim()) e.height = 'Chiều cao là bắt buộc'
    if (!weight.trim()) e.weight = 'Cân nặng là bắt buộc'
    if (!operationTypeId.trim()) e.operationTypeId = 'Loại phẫu thuật là bắt buộc'
    if (!method.trim()) e.method = 'Phương pháp mổ là bắt buộc'
    if (!surgeryDate.trim()) e.surgeryDate = 'Ngày phẫu thuật là bắt buộc'
    if (!hasGiAnastomosis.trim()) e.hasGiAnastomosis = 'Có miệng nối tiêu hoá là bắt buộc'
    if (!diagnosis.trim()) e.diagnosis = 'Chẩn đoán là bắt buộc'
    if (!roomBed.trim()) e.roomBed = 'Buồng giường là bắt buộc'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSubmitError('')
    if (!validate()) return

    const common = {
      fullName: fullName.trim(),
      age: toNumber(age),
      gender: emptyToUndefined(gender),
      height: toNumber(height),
      weight: toNumber(weight),
      bmi: bmi === '' ? undefined : Number(bmi),
      cityProvince: emptyToUndefined(cityProvince),
      ward: emptyToUndefined(ward),
      detailedAddress: emptyToUndefined(detailedAddress),
      operationTypeId: toNumber(operationTypeId),
      method: emptyToUndefined(method),
      surgeryDate: emptyToUndefined(surgeryDate),
      hasGiAnastomosis: hasGiAnastomosis === '' ? undefined : hasGiAnastomosis === 'true',
      diagnosis: emptyToUndefined(diagnosis),
      roomBed: emptyToUndefined(roomBed),
    }

    try {
      setSaving(true)
      if (isEdit && patient?.account) {
        await updatePatient(patient.account.id, common as UpdatePatientPayload)
      } else {
        await createPatient({ caseId: caseId.trim(), ...common } as CreatePatientPayload)
      }
      onSaved()
      onClose()
    } catch (err) {
      console.log('🔴 Submit error caught:', err)
      console.log('🔴 Error response:', (err as any)?.response)

      // Suppress console log cho lỗi validation (400, 409 là expected)
      const status = (err as any)?.response?.status
      const shouldSuppress = status === 400 || status === 409
      const errorMessage = translateError(err, 'Có lỗi xảy ra khi lưu hồ sơ bệnh án', shouldSuppress)

      console.log('🔴 Translated error:', errorMessage)
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-9rem)] space-y-4 overflow-y-auto px-6 py-5">
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
              {submitError}
            </div>
          )}

          {/* Mã + Họ tên */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Mã bệnh nhân" required={!isEdit}>
              <input
                value={caseId}
                disabled={isEdit}
                onChange={(e) => setCaseId(e.target.value.toUpperCase())}
                placeholder="Ví dụ: CASE-001"
                className={inputCls}
              />
              {errors.caseId && <p className="mt-1 text-xs text-red-500">{errors.caseId}</p>}
            </Field>
            <Field label="Họ tên đầy đủ" required>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </Field>
          </div>

          {/* Tuổi / Giới tính / Chiều cao / Cân nặng / BMI */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <Field label="Tuổi" required>
              <input type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)} className={inputCls} />
              {errors.age && <p className="mt-1 text-xs text-red-500">{errors.age}</p>}
            </Field>
            <Field label="Giới tính" required>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
                <option value="">--</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
              {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender}</p>}
            </Field>
            <Field label="Chiều cao (cm)" required>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className={inputCls} />
              {errors.height && <p className="mt-1 text-xs text-red-500">{errors.height}</p>}
            </Field>
            <Field label="Cân nặng (kg)" required>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className={inputCls} />
              {errors.weight && <p className="mt-1 text-xs text-red-500">{errors.weight}</p>}
            </Field>
            <Field label="BMI">
              <input value={bmi} disabled className={inputCls} />
            </Field>
          </div>

          {/* Thành phố / Quận, xã / Địa chỉ chi tiết */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Thành phố">
              <select
                value={provinceCode ?? ''}
                onChange={(e) => {
                  setProvinceCode(e.target.value ? Number(e.target.value) : null)
                  setWard('')
                }}
                onKeyDown={(e) => {
                  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                    const char = e.key.toLowerCase()
                    setProvinceSearch((prev) => prev + char)

                    if (provinceSearchTimeout) clearTimeout(provinceSearchTimeout)
                    setProvinceSearchTimeout(setTimeout(() => setProvinceSearch(''), 1000))

                    const match = provinces.find((p) =>
                      p.name.toLowerCase().startsWith(provinceSearch + char)
                    )
                    if (match) {
                      setProvinceCode(match.code)
                      setWard('')
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
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                disabled={!provinceCode}
                onKeyDown={(e) => {
                  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                    const char = e.key.toLowerCase()
                    setWardSearch((prev) => prev + char)

                    if (wardSearchTimeout) clearTimeout(wardSearchTimeout)
                    setWardSearchTimeout(setTimeout(() => setWardSearch(''), 1000))

                    const match = wards.find((w) =>
                      w.name.toLowerCase().startsWith(wardSearch + char)
                    )
                    if (match) setWard(match.name)
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
              <input
                value={detailedAddress}
                onChange={(e) => setDetailedAddress(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Loại PT / Phương pháp / Ngày PT / Miệng nối */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Field label="Loại phẫu thuật" required>
              <select
                value={operationTypeId}
                onChange={(e) => setOperationTypeId(e.target.value)}
                className={inputCls}
              >
                <option value="">--</option>
                {operationTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.operationTypeId && <p className="mt-1 text-xs text-red-500">{errors.operationTypeId}</p>}
            </Field>
            <Field label="Phương pháp mổ" required>
              <input value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls} />
              {errors.method && <p className="mt-1 text-xs text-red-500">{errors.method}</p>}
            </Field>
            <Field label="Ngày phẫu thuật" required>
              <input
                type="date"
                value={surgeryDate}
                onChange={(e) => setSurgeryDate(e.target.value)}
                className={inputCls}
              />
              {errors.surgeryDate && <p className="mt-1 text-xs text-red-500">{errors.surgeryDate}</p>}
            </Field>
            <Field label="Có miệng nối tiêu hoá" required>
              <select
                value={hasGiAnastomosis}
                onChange={(e) => setHasGiAnastomosis(e.target.value)}
                className={inputCls}
              >
                <option value="">--</option>
                <option value="true">Có</option>
                <option value="false">Không</option>
              </select>
              {errors.hasGiAnastomosis && <p className="mt-1 text-xs text-red-500">{errors.hasGiAnastomosis}</p>}
            </Field>
          </div>

          {/* Chẩn đoán / Buồng giường */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
            <Field label="Chẩn đoán" required>
              <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className={inputCls} />
              {errors.diagnosis && <p className="mt-1 text-xs text-red-500">{errors.diagnosis}</p>}
            </Field>
            <Field label="Buồng giường" required>
              <input
                value={roomBed}
                onChange={(e) => setRoomBed(e.target.value.toUpperCase())}
                placeholder="Ví dụ: P101-B1"
                className={inputCls}
              />
              {errors.roomBed && <p className="mt-1 text-xs text-red-500">{errors.roomBed}</p>}
            </Field>
          </div>

          {/* Footer */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
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
