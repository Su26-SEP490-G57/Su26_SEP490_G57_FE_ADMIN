import { X } from 'lucide-react'
import { useState } from 'react'
import { levelClasses, levelKey } from '../../../lib/levelColor'
import { patientName } from '../../../lib/patientDisplay'
import type { UserRole } from '../../../layouts/main-layout/nav-config'
import {
  useAssessmentMatrix,
  useComplianceStats,
  useRecoveryMatrix,
} from '../../analytics/api/analytics'
import { ComplianceStatsTab } from '../../analytics/components/ComplianceStatsTab'
import { EndOfDayAssessmentTab } from '../../analytics/components/EndOfDayAssessmentTab'
import { OverviewTab } from '../../analytics/components/OverviewTab'
import { RecoveryMatrixTab } from '../../analytics/components/RecoveryMatrixTab'
import { TabSwitcher, type TabSwitcherItem } from '../../analytics/components/TabSwitcher'
import type { DetailTabId } from '../../analytics/types'
import { useRole } from '../../auth/hooks/useRole'
import { useAssignedCareObservationSheet } from '../../care-observation/api/careObservation'
import { CareObservationTab } from '../../care-observation/components/CareObservationTab'
import { useVitalsHistory } from '../../vitals/api/vitals'
import { VitalsTab } from '../../vitals/components/VitalsTab'
import type { PatientListItem } from '../types'

// Ý định "mở tab Chỉ số + mở sẵn form ghi nhận" từ nút tắt ở danh sách người
// bệnh. `token` phải là 1 giá trị MỚI mỗi lần bấm (kể cả bấm lại trên đúng
// người bệnh đang mở) để panel biết đây là 1 yêu cầu mới cần áp dụng lại.
export interface VitalsQuickIntent {
  caseId: string
  token: number
}

interface PatientDetailPanelProps {
  patient: PatientListItem | null
  onClose: () => void
  vitalsIntent?: VitalsQuickIntent | null
}

// Cùng bộ tab với PatientDetailPanel của trang "Thống kê dữ liệu"
// (src/features/analytics/components/PatientDetailPanel.tsx) — panel này chỉ
// khác ở CHỖ HIỂN THỊ (side panel trượt từ phải, không phải card giữa trang),
// nội dung từng tab dùng chung y hệt component/hook bên analytics.
const TABS: (TabSwitcherItem<DetailTabId> & { roles?: UserRole[] })[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'recovery', label: 'Ma trận hồi phục' },
  { id: 'compliance', label: 'Tuân thủ' },
  { id: 'assessment', label: 'Đánh giá cuối ngày' },
  { id: 'vitals', label: 'Chỉ số' },
  { id: 'careObservation', label: 'Phiếu theo dõi', roles: ['nurse'] },
]

export function PatientDetailPanel({ patient, onClose, vitalsIntent }: PatientDetailPanelProps) {
  const role = useRole()
  const [activeTab, setActiveTab] = useState<DetailTabId>('overview')
  const [appliedIntentToken, setAppliedIntentToken] = useState<number | null>(null)
  const [autoOpenVitalsForm, setAutoOpenVitalsForm] = useState(false)

  // Đổi bệnh nhân đang xem → luôn quay về tab "Tổng quan", TRỪ KHI có 1 ý
  // định "Chỉ số" chưa áp dụng (nút tắt "Điền chỉ số sinh tồn") — lúc đó nhảy
  // thẳng tới tab Chỉ số và báo cho VitalsTab tự mở sẵn form. Vẫn theo đúng
  // convention "điều chỉnh state ngay trong render" đã dùng ở CareObservationTab.
  const [loadedCaseId, setLoadedCaseId] = useState<string | null>(null)
  if (patient) {
    const hasUnappliedIntent =
      vitalsIntent !== null &&
      vitalsIntent !== undefined &&
      vitalsIntent.caseId === patient.caseId &&
      vitalsIntent.token !== appliedIntentToken

    if (hasUnappliedIntent) {
      setAppliedIntentToken(vitalsIntent.token)
      setLoadedCaseId(patient.caseId)
      setActiveTab('vitals')
      setAutoOpenVitalsForm(true)
    } else if (patient.caseId !== loadedCaseId) {
      setLoadedCaseId(patient.caseId)
      setActiveTab('overview')
    }
  }

  const caseId = patient?.caseId ?? null
  const recoveryQuery = useRecoveryMatrix(caseId)
  const complianceQuery = useComplianceStats(caseId)
  const assessmentQuery = useAssessmentMatrix(caseId)
  const vitalsQuery = useVitalsHistory(caseId)
  const careObservationQuery = useAssignedCareObservationSheet(caseId)

  if (!patient) return null

  const level = levelKey(patient.level?.name)
  const classes = levelClasses(level)
  const visibleTabs = TABS.filter(
    (tab) => !tab.roles || (role !== null && tab.roles.includes(role)),
  )
  const effectiveTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : 'overview'

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-[860px] max-w-[95vw] flex-col border-l border-slate-200 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">{patientName(patient)}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${classes.badgeBg} ${classes.text}`}
            >
              {classes.label}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Mã: {patient.caseId} · POD {patient.currentPod}
          </p>
        </div>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 px-6">
        <TabSwitcher tabs={visibleTabs} activeTab={effectiveTab} onChange={setActiveTab} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {effectiveTab === 'overview' ? (
          <OverviewTab patient={patient} />
        ) : effectiveTab === 'recovery' ? (
          <RecoveryMatrixTab
            matrix={recoveryQuery.data}
            isLoading={recoveryQuery.isLoading}
            isError={recoveryQuery.isError}
            onRetry={() => recoveryQuery.refetch()}
            currentPod={patient.currentPod}
          />
        ) : effectiveTab === 'compliance' ? (
          <ComplianceStatsTab
            stats={complianceQuery.data}
            isLoading={complianceQuery.isLoading}
            isError={complianceQuery.isError}
            onRetry={() => complianceQuery.refetch()}
          />
        ) : effectiveTab === 'vitals' ? (
          <VitalsTab
            caseId={patient.caseId}
            patientName={patientName(patient)}
            history={vitalsQuery.data}
            isLoading={vitalsQuery.isLoading}
            isError={vitalsQuery.isError}
            onRetry={() => vitalsQuery.refetch()}
            autoOpenForm={autoOpenVitalsForm}
            onAutoOpenConsumed={() => setAutoOpenVitalsForm(false)}
          />
        ) : effectiveTab === 'careObservation' ? (
          <CareObservationTab
            caseId={patient.caseId}
            sheet={careObservationQuery.data}
            isLoading={careObservationQuery.isLoading}
            isError={careObservationQuery.isError}
            onRetry={() => careObservationQuery.refetch()}
          />
        ) : (
          <EndOfDayAssessmentTab
            matrix={assessmentQuery.data}
            isLoading={assessmentQuery.isLoading}
            isError={assessmentQuery.isError}
            onRetry={() => assessmentQuery.refetch()}
            currentPod={patient.currentPod}
          />
        )}
      </div>
    </div>
  )
}
