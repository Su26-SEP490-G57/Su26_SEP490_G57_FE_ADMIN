import { useMemo, useState } from 'react'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import { groupPatientsByRoom } from '../../../lib/patientGrouping'
import { matchesQuery } from '../../../lib/vietnameseSearch'
import { useOperationTypes, usePatients } from '../../patients/api/patientApi'
import type { PatientListItem } from '../../patients/types'
import {
  useAnalyticsOverview,
  useAssessmentMatrix,
  useComplianceStats,
  useRecoveryMatrix,
} from '../api/analytics'
import { AnalyticsFilterBar } from '../components/AnalyticsFilterBar'
import { ComplianceDonutChart } from '../components/ComplianceDonutChart'
import { PatientDetailPanel } from '../components/PatientDetailPanel'
import { RoomPatientList } from '../components/RoomPatientList'
import { SymptomTrendChart } from '../components/SymptomTrendChart'
import { useAnalyticsFilters } from '../hooks/useAnalyticsFilters'
import { useAnalyticsRealtime } from '../hooks/useAnalyticsRealtime'

function patientSearchHaystack(p: PatientListItem): string {
  return [
    p.caseId,
    p.account?.fullName,
    p.nameInitials,
    p.roomBed,
    p.diagnosis,
    p.operationType?.name,
  ]
    .filter(Boolean)
    .join(' ')
}

// Trang "Thống kê dữ liệu" (SEP490-377) — biểu đồ tổng quan (xu hướng triệu
// chứng + tỷ lệ tuân thủ) ở trên, danh sách người bệnh gom theo phòng ở giữa
// (có thể lọc + tìm kiếm), và panel chi tiết 3-tab (ma trận hồi phục / tuân
// thủ / đánh giá cuối ngày) cho 1 người bệnh được chọn ở dưới.
//
// Chỉ ghép nối (composition) — mọi logic hiển thị/tính toán nằm trong các
// component/hook con ở cùng feature folder.
export function AnalyticsPage() {
  const filters = useAnalyticsFilters()
  const [search, setSearch] = useState('')
  useAnalyticsRealtime()

  const { data: patientsResponse } = usePatients({ limit: 9999 })
  const { data: operationTypes = [] } = useOperationTypes()
  const allPatients = useMemo(() => patientsResponse?.data ?? [], [patientsResponse])

  const rooms = useMemo(
    () =>
      groupPatientsByRoom(allPatients)
        .map((g) => g.room)
        .filter((r) => r !== 'Chưa phân phòng'),
    [allPatients],
  )

  const filteredPatients = useMemo(() => {
    return allPatients.filter((p) => {
      if (filters.operationTypeId !== undefined && p.operationTypeId !== filters.operationTypeId)
        return false
      if (filters.room && (p.roomBed?.split('/')[0]?.trim() || 'Chưa phân phòng') !== filters.room)
        return false
      if (search && !matchesQuery(patientSearchHaystack(p), search)) return false
      return true
    })
  }, [allPatients, filters.operationTypeId, filters.room, search])

  // Tìm bệnh nhân đang chọn trên TOÀN BỘ danh sách (không phải danh sách đã
  // lọc) để nếu người dùng đổi bộ lọc sau khi đã chọn 1 người bệnh ở phòng
  // khác, lựa chọn vẫn được GIỮ NGUYÊN thay vì bị mất/tự động bỏ.
  const selectedPatient = useMemo(
    () =>
      filters.selectedCaseId
        ? (allPatients.find((p) => p.caseId === filters.selectedCaseId) ?? null)
        : null,
    [allPatients, filters.selectedCaseId],
  )
  const isOutsideFilter =
    !!selectedPatient && !filteredPatients.some((p) => p.caseId === selectedPatient.caseId)

  const isFiltered = filters.operationTypeId !== undefined || !!filters.room || !!search

  function clearAllFilters() {
    filters.clearFilters()
    setSearch('')
  }

  const overviewQuery = useAnalyticsOverview({
    operationTypeId: filters.operationTypeId,
    room: filters.room,
  })
  const recoveryQuery = useRecoveryMatrix(filters.selectedCaseId)
  const complianceQuery = useComplianceStats(filters.selectedCaseId)
  const assessmentQuery = useAssessmentMatrix(filters.selectedCaseId)

  useHeaderActions(
    useMemo(
      () => (
        <AnalyticsFilterBar
          operationTypes={operationTypes}
          operationTypeId={filters.operationTypeId}
          onOperationTypeChange={filters.setOperationTypeId}
          rooms={rooms}
          room={filters.room}
          onRoomChange={filters.setRoom}
          onSearchChange={setSearch}
        />
      ),
      [
        operationTypes,
        filters.operationTypeId,
        filters.setOperationTypeId,
        rooms,
        filters.room,
        filters.setRoom,
      ],
    ),
  )

  return (
    <div className="space-y-6 p-8 pb-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SymptomTrendChart
            trend={overviewQuery.data?.symptomTrend}
            isLoading={overviewQuery.isLoading}
            isFetching={overviewQuery.isFetching && !overviewQuery.isLoading}
            isError={overviewQuery.isError}
            onRetry={() => overviewQuery.refetch()}
          />
        </div>
        <div className="lg:col-span-1">
          <ComplianceDonutChart
            overview={overviewQuery.data?.compliance}
            isLoading={overviewQuery.isLoading}
            isFetching={overviewQuery.isFetching && !overviewQuery.isLoading}
            isError={overviewQuery.isError}
            onRetry={() => overviewQuery.refetch()}
          />
        </div>
      </div>

      <div>
        {filteredPatients.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            {isFiltered ? (
              <>
                <p className="mb-3 text-slate-500">
                  Không có người bệnh nào phù hợp bộ lọc hiện tại
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Xóa bộ lọc
                </button>
              </>
            ) : (
              <p className="text-slate-400">Không có người bệnh nào</p>
            )}
          </div>
        ) : (
          <RoomPatientList
            patients={filteredPatients}
            selectedCaseId={filters.selectedCaseId}
            onSelect={(p) => filters.setSelectedCaseId(p.caseId)}
          />
        )}
      </div>

      <PatientDetailPanel
        patient={selectedPatient}
        isOutsideFilter={isOutsideFilter}
        activeTab={filters.activeTab}
        onTabChange={filters.setActiveTab}
        recovery={{
          data: recoveryQuery.data,
          isLoading: recoveryQuery.isLoading,
          isError: recoveryQuery.isError,
          refetch: () => recoveryQuery.refetch(),
        }}
        compliance={{
          data: complianceQuery.data,
          isLoading: complianceQuery.isLoading,
          isError: complianceQuery.isError,
          refetch: () => complianceQuery.refetch(),
        }}
        assessment={{
          data: assessmentQuery.data,
          isLoading: assessmentQuery.isLoading,
          isError: assessmentQuery.isError,
          refetch: () => assessmentQuery.refetch(),
        }}
      />
    </div>
  )
}
