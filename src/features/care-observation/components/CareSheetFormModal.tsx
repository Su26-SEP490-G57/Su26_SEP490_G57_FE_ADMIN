import { useState } from 'react'
import { translateError } from '../../../lib/errorTranslator'
import { careLevelLabel } from '../../treatment-orders/types'
import { useCareSheetPrefill, useCreateCareSheet } from '../api/careObservation'
import {
  contentKey,
  type CareSheetField,
  type CareSheetPrefill,
  type CareSheetSection,
} from '../types'

interface CareSheetFormModalProps {
  onClose: () => void
  caseId: string
  patientName: string
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#00459a] focus:ring-2 focus:ring-[#00459a]/10'
const readOnlyClass = `${inputClass} cursor-default text-slate-700 focus:border-slate-300 focus:ring-0`
const disabledClass =
  'w-full rounded-lg border border-slate-300 bg-slate-200 px-3 py-2 text-sm text-slate-700'
const labelClass = 'text-sm text-slate-700'

// Ký hiệu nhanh theo "Quy ước ký hiệu" in trên phiếu.
const QUICK_SYMBOLS = ['(+)', '(-)', '(/)'] as const

function ReadOnlyField({
  label,
  value,
  disabled = false,
}: {
  label: string
  value: string | number | null
  disabled?: boolean
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <input
        readOnly
        disabled={disabled}
        tabIndex={-1}
        value={value ?? ''}
        className={disabled ? disabledClass : readOnlyClass}
      />
    </label>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CareSheetField
  value: string
  onChange: (value: string) => void
}) {
  if (field.multiline) {
    return (
      <textarea
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    )
  }
  return (
    <div className="flex items-center gap-1">
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      {QUICK_SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          type="button"
          tabIndex={-1}
          onClick={() => onChange(symbol)}
          title={`Điền ${symbol}`}
          className={`shrink-0 rounded-md border px-1.5 py-1 text-[11px] font-bold transition-colors ${
            value === symbol
              ? 'border-[#00459a] bg-[#00459a] text-white'
              : 'border-slate-200 text-slate-500 hover:bg-slate-100'
          }`}
        >
          {symbol}
        </button>
      ))}
    </div>
  )
}

// Một nhóm trên phiếu: tiêu đề nhóm + các dòng nhãn/giá trị. Nhóm chỉ có 1
// trường trùng tên nhóm (vd "Bàn giao") thì không lặp lại nhãn.
function SectionBlock({
  section,
  content,
  onChange,
}: {
  section: CareSheetSection
  content: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  const single = section.fields.length === 1
  return (
    <fieldset className="rounded-xl border border-slate-200 p-3">
      <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-600">
        {section.title}
      </legend>
      <div className="space-y-2">
        {section.fields.map((field) => {
          const key = contentKey(section, field)
          return single ? (
            <FieldInput
              key={key}
              field={field}
              value={content[key] ?? ''}
              onChange={(value) => onChange(key, value)}
            />
          ) : (
            <div key={key} className="grid grid-cols-[9rem_1fr] items-start gap-2">
              <span className={`${labelClass} pt-2`}>{field.label}</span>
              <FieldInput
                field={field}
                value={content[key] ?? ''}
                onChange={(value) => onChange(key, value)}
              />
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

// Form "Phiếu theo dõi và chăm sóc" — tách khỏi modal để state khởi tạo
// thẳng từ prefill (không cần effect reset).
function CareSheetForm({
  prefill,
  caseId,
  onClose,
}: {
  prefill: CareSheetPrefill
  caseId: string
  onClose: () => void
}) {
  const createMutation = useCreateCareSheet()
  const [content, setContent] = useState<Record<string, string>>(prefill.content)
  const [recordedAt, setRecordedAt] = useState('') // cố tình KHÔNG tự điền
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [hasAllergy, setHasAllergy] = useState<boolean | null>(null)
  const [allergyNote, setAllergyNote] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const { form } = prefill
  const bySection = (group: CareSheetSection['group']) =>
    form.sections.filter((section) => section.group === group)

  const setField = (key: string, value: string) => setContent((prev) => ({ ...prev, [key]: value }))

  const validate = (): boolean => {
    const next: Record<string, string> = {}
    const at = new Date(recordedAt)
    if (!recordedAt || Number.isNaN(at.getTime())) {
      next.recordedAt = 'Vui lòng nhập ngày giờ'
    } else if (at.getTime() > Date.now() + 5 * 60 * 1000) {
      next.recordedAt = 'Ngày giờ không được ở tương lai'
    }
    if (hasAllergy && !allergyNote.trim()) {
      next.allergyNote = 'Vui lòng ghi rõ dị ứng'
    }
    if (!Object.values(content).some((value) => value.trim())) {
      next.content = 'Vui lòng ghi nhận ít nhất một mục trên phiếu'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError('')
    if (!validate()) return
    try {
      await createMutation.mutateAsync({
        caseId,
        recordedAt: new Date(recordedAt).toISOString(),
        admissionNumber: admissionNumber.trim() || undefined,
        hasAllergy: hasAllergy ?? undefined,
        allergyNote: hasAllergy ? allergyNote.trim() : undefined,
        // Server tự bỏ các ô trống.
        content,
      })
      onClose()
    } catch (err) {
      setSubmitError(translateError(err, 'Có lỗi xảy ra khi lưu phiếu chăm sóc'))
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="custom-scrollbar max-h-[80vh] space-y-4 overflow-y-auto p-6"
    >
      {submitError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600">
          <span className="material-symbols-outlined shrink-0 text-[16px]">error</span>
          <p>{submitError}</p>
        </div>
      )}

      {/* Phần hành chính — tự điền */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ReadOnlyField label="Cơ sở" value={prefill.facility} />
        <ReadOnlyField label="Khoa" value={prefill.department} disabled />
        <ReadOnlyField label="Tờ số" value={prefill.sheetNumber} />
        <ReadOnlyField label="Mã người bệnh" value={prefill.caseId} />
        <ReadOnlyField label="Họ và tên người bệnh" value={prefill.patientName} />
        <ReadOnlyField label="Tuổi" value={prefill.age} />
        <ReadOnlyField label="Giới tính" value={prefill.gender} />
        <label className="flex flex-col gap-1">
          <span className="text-xs text-slate-500">Số vào viện</span>
          <input
            value={admissionNumber}
            onChange={(e) => setAdmissionNumber(e.target.value)}
            className={inputClass}
          />
        </label>
        <ReadOnlyField label="Phòng" value={prefill.room} />
        <ReadOnlyField label="Giường" value={prefill.bed} />
        <ReadOnlyField label="Phân cấp chăm sóc" value={careLevelLabel(prefill.careLevel)} />
        <ReadOnlyField label="Điều dưỡng thực hiện" value={prefill.nurseName} />
        <div className="col-span-2 md:col-span-4">
          <ReadOnlyField label="Chẩn đoán" value={prefill.diagnosis} />
        </div>
      </div>

      {/* Tiền sử dị ứng + Ngày giờ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_16rem]">
        <div className="space-y-2">
          <span className={labelClass}>Tiền sử dị ứng</span>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="hasAllergy"
                checked={hasAllergy === false}
                onChange={() => setHasAllergy(false)}
              />
              Chưa ghi nhận
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="hasAllergy"
                checked={hasAllergy === true}
                onChange={() => setHasAllergy(true)}
              />
              Có
            </label>
          </div>
          {hasAllergy && (
            <textarea
              rows={2}
              value={allergyNote}
              onChange={(e) => setAllergyNote(e.target.value)}
              placeholder="Ghi rõ dị ứng"
              className={inputClass}
            />
          )}
          {errors.allergyNote && <p className="text-xs text-red-500">{errors.allergyNote}</p>}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>
            Ngày giờ <span className="text-red-500">*</span>
          </span>
          <input
            type="datetime-local"
            value={recordedAt}
            onChange={(e) => setRecordedAt(e.target.value)}
            className={inputClass}
          />
          {errors.recordedAt && <p className="text-xs text-red-500">{errors.recordedAt}</p>}
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <span>
          Quy ước ký hiệu: <span className="font-semibold">{form.legend}</span>
        </span>
        <span>
          {prefill.latestVitalSignAt
            ? 'Chỉ số sinh tồn, cân nặng, BMI đã tự điền — có thể chỉnh sửa.'
            : 'Người bệnh chưa có chỉ số sinh tồn nào được ghi nhận.'}
        </span>
      </div>

      {/* Nhận định, theo dõi (trái) | Chẩn đoán ĐD / đánh giá mục tiêu (phải) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-3">
          {bySection('observation').map((section) => (
            <SectionBlock
              key={section.key}
              section={section}
              content={content}
              onChange={setField}
            />
          ))}
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Chẩn đoán ĐD / Đánh giá mục tiêu
          </h4>
          {bySection('diagnosis').map((section) => (
            <SectionBlock
              key={section.key}
              section={section}
              content={content}
              onChange={setField}
            />
          ))}
        </div>
      </div>

      {/* Can thiệp điều dưỡng, bàn giao */}
      <div className="space-y-3">
        {bySection('intervention').map((section) => (
          <SectionBlock key={section.key} section={section} content={content} onChange={setField} />
        ))}
      </div>

      {errors.content && <p className="text-xs text-red-500">{errors.content}</p>}

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
  )
}

// Modal "Thêm phiếu theo dõi và chăm sóc" (điều dưỡng / điều dưỡng trưởng).
// Loại phiếu (Cấp 1 / Cấp 2-3) theo mức chăm sóc bác sĩ đã chỉ định.
export function CareSheetFormModal({ onClose, caseId, patientName }: CareSheetFormModalProps) {
  const prefillQuery = useCareSheetPrefill(caseId)
  const prefill = prefillQuery.data
  const title =
    prefill?.sheetType != null
      ? prefill.form.titles[prefill.sheetType]
      : 'Phiếu theo dõi và chăm sóc'

  return (
    <div className="fixed inset-0 z-99 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Thêm {title.toLowerCase()}</h3>
            <p className="text-xs text-slate-500">
              {patientName} · Mã {caseId}
              {prefill && ` · MS: ${prefill.form.formCode}`}
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
        ) : prefill.sheetType === null ? (
          <div className="space-y-4 p-6">
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <span className="material-symbols-outlined shrink-0 text-[18px]">info</span>
              <p>
                Người bệnh chưa được bác sĩ chỉ định mức chăm sóc — chưa thể lập phiếu chăm sóc.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <CareSheetForm prefill={prefill} caseId={caseId} onClose={onClose} />
        )}
      </div>
    </div>
  )
}
