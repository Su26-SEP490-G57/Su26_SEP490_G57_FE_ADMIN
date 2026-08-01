import { levelClasses, levelKey } from '../../../lib/levelColor'
import { patientName } from '../../../lib/patientDisplay'
import type { PatientListItem } from '../../patients/types'
import type { AssessmentMatrix, ComplianceStats, DetailTabId, RecoveryMatrix } from '../types'
import { AnalyticsEmptyState } from './AnalyticsEmptyState'
import { ComplianceStatsTab } from './ComplianceStatsTab'
import { EndOfDayAssessmentTab } from './EndOfDayAssessmentTab'
import { RecoveryMatrixTab } from './RecoveryMatrixTab'
import { TabSwitcher, type TabSwitcherItem } from './TabSwitcher'

interface QueryState<T> {
  data: T | null | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

interface PatientDetailPanelProps {
  patient: PatientListItem | null
  isOutsideFilter: boolean
  activeTab: DetailTabId
  onTabChange: (tab: DetailTabId) => void
  recovery: QueryState<RecoveryMatrix>
  compliance: QueryState<ComplianceStats>
  assessment: QueryState<AssessmentMatrix>
}

const TABS: TabSwitcherItem<DetailTabId>[] = [
  { id: 'recovery', label: 'Ma trận hồi phục' },
  { id: 'compliance', label: 'Tuân thủ' },
  { id: 'assessment', label: 'Đánh giá cuối ngày' },
]

// Shell chi tiết bệnh nhân: dòng header + TabSwitcher + body của tab đang
// active. Luôn render ĐẦY ĐỦ shell (border, TabSwitcher bị disable) kể cả khi
// chưa chọn bệnh nhân nào — không render null/rỗng, và KHÔNG tự động chọn
// bệnh nhân đầu tiên trong danh sách.
export function PatientDetailPanel({
  patient,
  isOutsideFilter,
  activeTab,
  onTabChange,
  recovery,
  compliance,
  assessment,
}: PatientDetailPanelProps) {
  const level = levelKey(patient?.level?.name)
  const classes = levelClasses(level)

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-6 py-4">
        {patient ? (
          <div>
            <h3 className="flex items-center gap-2 font-bold text-slate-800">
              {patientName(patient)}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${classes.badgeBg} ${classes.text}`}
              >
                {classes.label}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Mã: {patient.caseId} · POD {patient.currentPod}
            </p>
            {isOutsideFilter && (
              <p className="mt-1 text-xs italic text-amber-600">
                Người bệnh đang chọn không thuộc bộ lọc hiện tại
              </p>
            )}
          </div>
        ) : (
          <h3 className="font-bold text-slate-800">Chi tiết người bệnh</h3>
        )}
      </div>

      <div className="flex items-center border-b border-slate-200 px-6">
        <TabSwitcher tabs={TABS} activeTab={activeTab} onChange={onTabChange} disabled={!patient} />
      </div>

      <div className="p-6">
        {!patient ? (
          <AnalyticsEmptyState
            icon="person_search"
            headline="Chọn một người bệnh để xem chi tiết"
            subline="Bấm vào 1 thẻ người bệnh ở danh sách bên trên để xem ma trận hồi phục, tuân thủ và đánh giá cuối ngày."
          />
        ) : activeTab === 'recovery' ? (
          <RecoveryMatrixTab
            matrix={recovery.data}
            isLoading={recovery.isLoading}
            isError={recovery.isError}
            onRetry={recovery.refetch}
            currentPod={patient.currentPod}
          />
        ) : activeTab === 'compliance' ? (
          <ComplianceStatsTab
            stats={compliance.data}
            isLoading={compliance.isLoading}
            isError={compliance.isError}
            onRetry={compliance.refetch}
          />
        ) : (
          <EndOfDayAssessmentTab
            matrix={assessment.data}
            isLoading={assessment.isLoading}
            isError={assessment.isError}
            onRetry={assessment.refetch}
            currentPod={patient.currentPod}
          />
        )}
      </div>
    </section>
  )
}
