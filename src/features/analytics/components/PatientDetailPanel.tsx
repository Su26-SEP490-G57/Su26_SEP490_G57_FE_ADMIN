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
  { id: 'recovery', label: 'Ma tran hoi phuc' },
  { id: 'compliance', label: 'Tuan thu' },
  { id: 'assessment', label: 'Danh gia cuoi ngay' },
]

// Shell chi tiet benh nhan: dong header + TabSwitcher + body cua tab dang
// active. Luon render DAY DU shell (border, TabSwitcher bi disable) ke ca khi
// chua chon benh nhan nao — khong render null/rong, va KHONG tu dong chon
// benh nhan dau tien trong danh sach.
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
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${classes.badgeBg} ${classes.text}`}>
                {classes.label}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Ma: {patient.caseId} · POD {patient.currentPod}
            </p>
            {isOutsideFilter && (
              <p className="mt-1 text-xs italic text-amber-600">Nguoi benh dang chon khong thuoc bo loc hien tai</p>
            )}
          </div>
        ) : (
          <h3 className="font-bold text-slate-800">Chi tiet nguoi benh</h3>
        )}
      </div>

      <div className="flex items-center border-b border-slate-200 px-6">
        <TabSwitcher tabs={TABS} activeTab={activeTab} onChange={onTabChange} disabled={!patient} />
      </div>

      <div className="p-6">
        {!patient ? (
          <AnalyticsEmptyState
            icon="person_search"
            headline="Chon mot nguoi benh de xem chi tiet"
            subline="Bam vao 1 the nguoi benh o danh sach ben tren de xem ma tran hoi phuc, tuan thu va danh gia cuoi ngay."
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
