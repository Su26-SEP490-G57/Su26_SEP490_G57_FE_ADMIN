import { useState } from 'react'
import { PdfDownloadButton } from '../../../components/PdfDownloadButton'
import { AnalyticsEmptyState } from '../../analytics/components/AnalyticsEmptyState'
import { RoleGuard } from '../../auth/components/RoleGuard'
import { careLevelLabel } from '../../treatment-orders/types'
import { useCareSheets } from '../api/careObservation'
import { contentKey, type CareSheet, type CareSheetForm, type CareSheetSection } from '../types'
import { CareSheetFormModal } from './CareSheetFormModal'

interface CareSheetsTabProps {
  caseId: string
  patientName: string
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function allergyText(sheet: CareSheet): string {
  if (sheet.hasAllergy === true) return `Có${sheet.allergyNote ? `: ${sheet.allergyNote}` : ''}`
  if (sheet.hasAllergy === false) return 'Chưa ghi nhận'
  return '--'
}

function HeaderItem({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="min-w-0">
      <span className="text-slate-400">{label}: </span>
      <span className="font-medium text-slate-700">{value ?? '--'}</span>
    </div>
  )
}

// Chỉ hiện các nhóm/trường CÓ giá trị — phiếu giấy có rất nhiều ô trống.
function FilledSections({
  sections,
  content,
}: {
  sections: CareSheetSection[]
  content: Record<string, string>
}) {
  const filled = sections
    .map((section) => ({
      section,
      fields: section.fields.filter((field) => content[contentKey(section, field)]?.trim()),
    }))
    .filter((item) => item.fields.length > 0)

  if (filled.length === 0) return null

  return (
    <div className="space-y-3">
      {filled.map(({ section, fields }) => (
        <div key={section.key}>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {section.title}
          </p>
          <dl className="space-y-1 text-sm">
            {fields.map((field) => (
              <div key={field.key} className="grid grid-cols-[10rem_1fr] gap-2">
                <dt className="text-slate-500">
                  {fields.length === 1 && section.fields.length === 1 ? '' : field.label}
                </dt>
                <dd className="whitespace-pre-wrap text-slate-700">
                  {content[contentKey(section, field)]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )
}

function CareSheetCard({
  sheet,
  form,
  caseId,
}: {
  sheet: CareSheet
  form: CareSheetForm
  caseId: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const bySection = (group: CareSheetSection['group']) =>
    form.sections.filter((section) => section.group === group)

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 bg-slate-50 pr-4">
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-100"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#00459a]">assignment</span>
            <h5 className="text-sm font-bold text-slate-800">
              {form.titles[sheet.sheetType] ?? 'Phiếu theo dõi và chăm sóc'} · Tờ số{' '}
              {sheet.sheetNumber}
            </h5>
            {sheet.careLevel && (
              <span className="rounded-full bg-[#00459a]/10 px-2 py-0.5 text-[11px] font-bold text-[#00459a]">
                {careLevelLabel(sheet.careLevel)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {formatDateTime(sheet.recordedAt)} · {sheet.nurseName ?? '--'}
            </span>
            <span className="material-symbols-outlined text-[18px]">
              {isExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </button>
        <PdfDownloadButton
          url={`/care-observation/patient/${encodeURIComponent(caseId)}/sheets/${sheet.sheetId}/pdf`}
          fileName={`phieu-cham-soc-${caseId}-to-${sheet.sheetNumber}.pdf`}
        />
      </div>

      {isExpanded && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <HeaderItem label="Cơ sở" value={sheet.facility} />
            <HeaderItem label="Khoa" value={sheet.department} />
            <HeaderItem label="Số vào viện" value={sheet.admissionNumber} />
            <HeaderItem label="Họ và tên" value={sheet.patientName} />
            <HeaderItem label="Mã người bệnh" value={sheet.patientCode} />
            <HeaderItem
              label="Tuổi / Giới tính"
              value={`${sheet.age ?? '--'} / ${sheet.gender ?? '--'}`}
            />
            <HeaderItem
              label="Phòng / Giường"
              value={`${sheet.room ?? '--'} / ${sheet.bed ?? '--'}`}
            />
            <HeaderItem label="Chẩn đoán" value={sheet.diagnosis} />
            <HeaderItem label="Tiền sử dị ứng" value={allergyText(sheet)} />
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-slate-100 pt-4 lg:grid-cols-[3fr_2fr]">
            <FilledSections sections={bySection('observation')} content={sheet.content} />
            <FilledSections sections={bySection('diagnosis')} content={sheet.content} />
          </div>
          <FilledSections sections={bySection('intervention')} content={sheet.content} />
        </div>
      )}
    </article>
  )
}

// Tab "Phiếu chăm sóc" — các phiếu theo dõi và chăm sóc lưu ở HIS (mới nhất
// trước). Mọi vai trò được mở tab đều xem được; điều dưỡng, điều dưỡng
// trưởng và bác sĩ thấy nút thêm phiếu. Phiếu đã lưu không sửa được.
export function CareSheetsTab({ caseId, patientName }: CareSheetsTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { data, isLoading, isError, refetch } = useCareSheets(caseId)
  const sheets = data?.sheets ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Phiếu theo dõi và chăm sóc</h4>
        <RoleGuard roles={['nurse', 'head_nurse', 'doctor']} fallback={null}>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#00459a] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm phiếu chăm sóc
          </button>
        </RoleGuard>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">Đang tải phiếu chăm sóc...</p>
      ) : isError || !data ? (
        <AnalyticsEmptyState
          icon="cloud_off"
          headline="Không tải được phiếu chăm sóc từ HIS"
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Thử lại
            </button>
          }
        />
      ) : sheets.length === 0 ? (
        <AnalyticsEmptyState
          icon="assignment"
          headline="Chưa có phiếu theo dõi và chăm sóc"
          subline="Phiếu do điều dưỡng lập sẽ hiển thị tại đây."
        />
      ) : (
        <div className="space-y-3">
          {sheets.map((sheet) => (
            <CareSheetCard key={sheet.sheetId} sheet={sheet} form={data.form} caseId={caseId} />
          ))}
        </div>
      )}

      {isFormOpen && (
        <CareSheetFormModal
          onClose={() => setIsFormOpen(false)}
          caseId={caseId}
          patientName={patientName}
        />
      )}
    </div>
  )
}
