import { useState } from 'react'
import { PdfDownloadButton } from '../../../components/PdfDownloadButton'
import { AnalyticsEmptyState } from '../../analytics/components/AnalyticsEmptyState'
import { RoleGuard } from '../../auth/components/RoleGuard'
import { useTreatmentSheets } from '../api/treatmentOrders'
import { careLevelLabel, type TreatmentSheet } from '../types'
import { TreatmentOrderFormModal } from './TreatmentOrderFormModal'

interface TreatmentSheetsTabProps {
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

function HeaderItem({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="min-w-0">
      <span className="text-slate-400">{label}: </span>
      <span className="font-medium text-slate-700">{value ?? '--'}</span>
    </div>
  )
}

// Một phiếu, trình bày giống bản giấy: phần hành chính phía trên, bảng
// Thời gian | Diễn biến bệnh | Chỉ định phía dưới.
function TreatmentSheetCard({ sheet, caseId }: { sheet: TreatmentSheet; caseId: string }) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#00459a]">description</span>
          <h5 className="text-sm font-bold text-slate-800">Tờ số {sheet.sheetNumber}</h5>
          {sheet.careLevel && (
            <span className="rounded-full bg-[#00459a]/10 px-2 py-0.5 text-[11px] font-bold text-[#00459a]">
              {careLevelLabel(sheet.careLevel)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">
            {sheet.doctorName ?? '--'} · lưu lúc {formatDateTime(sheet.createdAt)}
          </p>
          <PdfDownloadButton
            url={`/treatment-orders/patient/${encodeURIComponent(caseId)}/sheets/${sheet.sheetId}/pdf`}
            fileName={`phieu-dieu-tri-${caseId}-to-${sheet.sheetNumber}.pdf`}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 px-4 py-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
        <HeaderItem label="Cơ sở KC, CB" value={sheet.facility} />
        <HeaderItem label="Khoa" value={sheet.department} />
        <HeaderItem label="Họ và tên" value={sheet.patientName} />
        <HeaderItem label="Mã số người bệnh" value={sheet.patientCode} />
        <HeaderItem
          label="Tuổi / Giới tính"
          value={`${sheet.age ?? '--'} / ${sheet.gender ?? '--'}`}
        />
        <HeaderItem label="Phòng / Giường" value={`${sheet.room ?? '--'} / ${sheet.bed ?? '--'}`} />
        <HeaderItem label="Chẩn đoán" value={sheet.diagnosis} />
        <HeaderItem label="Bệnh kèm theo" value={sheet.comorbidities || null} />
      </div>

      <div className="grid grid-cols-1 border-t border-slate-100 text-sm md:grid-cols-[9rem_1fr_1fr]">
        <div className="border-slate-100 px-4 py-3 md:border-r">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Thời gian
          </p>
          <p className="font-medium text-slate-700">{formatDateTime(sheet.recordedAt)}</p>
        </div>
        <div className="border-slate-100 px-4 py-3 md:border-r">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Diễn biến bệnh
          </p>
          <p className="whitespace-pre-wrap text-slate-700">{sheet.progressNotes}</p>
        </div>
        <div className="px-4 py-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Chỉ định
          </p>
          <p className="whitespace-pre-wrap text-slate-700">{sheet.orders}</p>
        </div>
      </div>
    </article>
  )
}

// Tab "Phiếu điều trị" — danh sách phiếu theo dõi điều trị lưu ở HIS (mới
// nhất trước). Mọi vai trò xem được; chỉ bác sĩ thấy nút thêm phiếu.
export function TreatmentSheetsTab({ caseId, patientName }: TreatmentSheetsTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { data, isLoading, isError, refetch } = useTreatmentSheets(caseId)
  const sheets = data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-700">Phiếu theo dõi điều trị</h4>
        <RoleGuard roles={['doctor']} fallback={null}>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#00459a] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Thêm phiếu
          </button>
        </RoleGuard>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-400">Đang tải phiếu điều trị...</p>
      ) : isError ? (
        <AnalyticsEmptyState
          icon="cloud_off"
          headline="Không tải được phiếu điều trị từ HIS"
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
          icon="description"
          headline="Chưa có phiếu theo dõi điều trị"
          subline="Phiếu do bác sĩ lập sẽ hiển thị tại đây."
        />
      ) : (
        <div className="space-y-4">
          {sheets.map((sheet) => (
            <TreatmentSheetCard key={sheet.sheetId} sheet={sheet} caseId={caseId} />
          ))}
        </div>
      )}

      {isFormOpen && (
        <TreatmentOrderFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          caseId={caseId}
          patientName={patientName}
        />
      )}
    </div>
  )
}
