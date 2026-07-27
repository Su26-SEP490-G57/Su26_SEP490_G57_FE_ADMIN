import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'
import { ANALYTICS_ENDPOINTS } from './endpoints'
import type {
  AnalyticsOverview,
  AnalyticsOverviewParams,
  AssessmentMatrix,
  AssessmentQuestionRow,
  ComplianceOverview,
  ComplianceStats,
  RecoveryMatrix,
  RecoveryMilestone,
  RecoveryMilestoneKey,
  SymptomSeries,
  SymptomSeriesKey,
  SymptomTrend,
} from '../types'

// ---------------------------------------------------------------------------
// Query key factory - model theo nurseKeys (src/features/nurses/api/nurses.ts).
// `patient(caseId)` gom cả 3 tab chi tiết của 1 bệnh nhân lại 1 chỗ để có thể
// invalidate cả 3 cùng lúc sau này.
// ---------------------------------------------------------------------------
export const analyticsKeys = {
  all: ['analytics'] as const,
  overviews: () => [...analyticsKeys.all, 'overview'] as const,
  overview: (params: AnalyticsOverviewParams = {}) => [...analyticsKeys.overviews(), params] as const,
  patients: () => [...analyticsKeys.all, 'patient'] as const,
  patient: (caseId: string) => [...analyticsKeys.patients(), caseId] as const,
  recoveryMatrix: (caseId: string) => [...analyticsKeys.patient(caseId), 'recovery-matrix'] as const,
  compliance: (caseId: string) => [...analyticsKeys.patient(caseId), 'compliance'] as const,
  assessmentMatrix: (caseId: string) => [...analyticsKeys.patient(caseId), 'assessment-matrix'] as const,
}

// ---------------------------------------------------------------------------
// Mappers - wire shape (backend thật) -> shape FE mong muốn (types.ts).
//
// Backend đang được xây song song nên các hình dạng dưới đây có thể lệch đôi
// chút so với thực tế cuối cùng - mỗi mapper là NƠI DUY NHẤT cần sửa nếu
// backend đổi hình dạng response, các component tiêu thụ types.ts không cần
// đổi gì. Toàn bộ đọc field đều dùng optional chaining + fallback rỗng để một
// response hơi khác không làm crash UI (chỉ suy biến về trạng thái "no data").
// ---------------------------------------------------------------------------

const SYMPTOM_SERIES_META: { key: SymptomSeriesKey; label: string; matchKeys: string[] }[] = [
  { key: 'flatus', label: 'Đã trung tiện', matchKeys: ['flatus', 'trungtien'] },
  { key: 'foodIntake', label: 'Khả năng ăn', matchKeys: ['foodintake', 'food', 'anuong'] },
  { key: 'bloating', label: 'Chướng bụng', matchKeys: ['bloating', 'chuongbung'] },
  { key: 'vomiting', label: 'Nôn nhiều', matchKeys: ['vomiting', 'vomit', 'non'] },
  { key: 'nausea', label: 'Buồn nôn', matchKeys: ['nausea', 'buonnon'] },
]

interface RawOverviewQuestion {
  questionId?: number
  questionKey?: string
  avgScore?: number | null
}

interface RawOverviewPodEntry {
  pod?: number
  questions?: RawOverviewQuestion[]
  avgTotalScore?: number | null
}

interface RawOverviewResponse {
  symptomTrend?: RawOverviewPodEntry[]
  pods?: RawOverviewPodEntry[]
  data?: RawOverviewPodEntry[]
  compliance?: Partial<ComplianceOverview>
}

function normalizeKey(key?: string | null): string {
  return (key ?? '').toLowerCase().replace(/[^a-z]/g, '')
}

// Chuyển response overview (mảng phẳng theo POD) thành SymptomTrend
// (mảng pods[] + 5 series song song theo đúng thứ tự màu đã validate).
export function toSymptomTrend(raw: unknown): SymptomTrend {
  const response = (raw ?? {}) as RawOverviewResponse
  const entries: RawOverviewPodEntry[] = Array.isArray(response)
    ? (response as RawOverviewPodEntry[])
    : response.symptomTrend ?? response.pods ?? response.data ?? []

  const pods = entries.map((entry, index) => entry.pod ?? index)

  const series: SymptomSeries[] = SYMPTOM_SERIES_META.map((meta, seriesIndex) => ({
    key: meta.key,
    label: meta.label,
    data: entries.map((entry) => {
      const questions = entry.questions ?? []

      // Ưu tiên khớp theo questionKey; nếu BE không gửi questionKey (hoặc đặt
      // tên khác), fallback về vị trí cố định (thứ tự 5 câu hỏi con trong 1
      // POD được backend trả nhất quán theo đúng thứ tự SYMPTOM_SERIES_META).
      const byKey = questions.find((q) => meta.matchKeys.includes(normalizeKey(q.questionKey)))
      if (byKey) return byKey.avgScore ?? null

      return questions[seriesIndex]?.avgScore ?? null
    }),
  }))

  return { pods, series }
}

export function toComplianceOverview(raw: unknown): ComplianceOverview {
  const response = (raw ?? {}) as RawOverviewResponse
  const compliance = response.compliance ?? {}

  const compliant = compliance.compliant ?? 0
  const nonCompliant = compliance.nonCompliant ?? 0
  const total = compliance.total ?? compliant + nonCompliant
  const complianceRate = compliance.complianceRate ?? (total > 0 ? compliant / total : 0)

  return { compliant, nonCompliant, total, complianceRate }
}

function toAnalyticsOverview(raw: unknown): AnalyticsOverview {
  return {
    symptomTrend: toSymptomTrend(raw),
    compliance: toComplianceOverview(raw),
  }
}

// ---------------------------------------------------------------------------
// Recovery matrix - wire shape có `milestones` là 1 object phẳng
// ({timeToRedrink, timeToReeat, podSoftDietReached, timeToFlatus, timeToDefecation})
// thay vì mảng RecoveryMilestone[] như type FE mong muốn.
// ---------------------------------------------------------------------------
const MILESTONE_META: { key: RecoveryMilestoneKey; label: string; rawKeys: string[] }[] = [
  { key: 'firstDrink', label: 'Uống nước đầu tiên', rawKeys: ['timeToRedrink', 'firstDrink'] },
  { key: 'firstFood', label: 'Ăn đầu tiên', rawKeys: ['timeToReeat', 'firstFood'] },
  { key: 'podSoft', label: 'Ăn thức ăn mềm', rawKeys: ['podSoftDietReached', 'podSoft'] },
  { key: 'firstFlatus', label: 'Trung tiện đầu tiên', rawKeys: ['timeToFlatus', 'firstFlatus'] },
  { key: 'firstStool', label: 'Đại tiện đầu tiên', rawKeys: ['timeToDefecation', 'firstStool'] },
]

interface RawMilestoneValue {
  pod?: number | null
  occurredAt?: string | null
}

interface RawRecoveryMatrix {
  caseId?: string
  maxPod?: number
  milestones?: Record<string, number | RawMilestoneValue | null | undefined> | RecoveryMilestone[]
  summary?: Partial<RecoveryMatrix['summary']>
}

export function toRecoveryMilestones(raw: unknown): RecoveryMilestone[] {
  const milestones = (raw as RawRecoveryMatrix | undefined)?.milestones

  if (Array.isArray(milestones)) return milestones

  const flat = milestones ?? {}

  return MILESTONE_META.map((meta) => {
    const rawValue = meta.rawKeys.map((k) => flat[k]).find((v) => v !== undefined && v !== null)

    if (rawValue == null) {
      return { key: meta.key, label: meta.label, pod: null, occurredAt: null }
    }
    if (typeof rawValue === 'number') {
      return { key: meta.key, label: meta.label, pod: rawValue, occurredAt: null }
    }
    return {
      key: meta.key,
      label: meta.label,
      pod: rawValue.pod ?? null,
      occurredAt: rawValue.occurredAt ?? null,
    }
  })
}

export function toRecoveryMatrix(raw: unknown, caseId: string): RecoveryMatrix {
  const response = (raw ?? {}) as RawRecoveryMatrix
  const milestones = toRecoveryMilestones(raw)
  const maxPod = response.maxPod ?? Math.max(0, ...milestones.map((m) => m.pod ?? 0))
  const summary = response.summary ?? {}

  return {
    caseId: response.caseId ?? caseId,
    maxPod,
    milestones,
    summary: {
      // Backend trả về field tên `redAlertCount` (không phải `redCount`) - xem
      // RecoveryMatrixSummaryDto trong statistics module của backend.
      redCount: (summary as Record<string, unknown>).redAlertCount as number | undefined ?? summary.redCount ?? 0,
      totalPodDays: summary.totalPodDays ?? null,
      erasCompleted: summary.erasCompleted ?? false,
      erasCompletedDate: summary.erasCompletedDate ?? null,
      holdCount: summary.holdCount ?? 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Compliance stats - backend (PatientComplianceResponseDto) trả về 1 object
// PHẲNG: { viewedGuidance, viewedEducation, reminderCount, appAccessCount,
// assessmentCompletedCount, ... }, không phải 2 object con checklist/counters
// như bản nháp đầu. Vẫn giữ fallback đọc thêm nested checklist/counters phòng
// khi backend đổi lại hình dạng có cấu trúc hơn.
// ---------------------------------------------------------------------------
interface RawComplianceStats {
  caseId?: string
  checklist?: Partial<ComplianceStats['checklist']>
  counters?: Partial<ComplianceStats['counters']>
  viewedGuidance?: boolean
  viewedEducation?: boolean
  reminderCount?: number
  appAccessCount?: number
  assessmentCompletedCount?: number
}

export function toComplianceStats(raw: unknown, caseId: string): ComplianceStats {
  const response = (raw ?? {}) as RawComplianceStats
  const checklist = response.checklist ?? {}
  const counters = response.counters ?? {}
  const assessmentCompletedCount = counters.completedAssessments ?? response.assessmentCompletedCount ?? 0

  return {
    caseId: response.caseId ?? caseId,
    checklist: {
      viewedPodGuide: checklist.viewedPodGuide ?? response.viewedGuidance ?? false,
      viewedHealthEducation: checklist.viewedHealthEducation ?? response.viewedEducation ?? false,
      completedAssessment: checklist.completedAssessment ?? assessmentCompletedCount > 0,
    },
    counters: {
      completedAssessments: assessmentCompletedCount,
      reminderCount: counters.reminderCount ?? response.reminderCount ?? 0,
      appAccessCount: counters.appAccessCount ?? response.appAccessCount ?? 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Assessment matrix - hỗ trợ cả 2 hình dạng có thể xảy ra:
//  a) đã "question-major" sẵn: { questions: [{questionId, questionText, cells:[...]}] }
//  b) "pod-major" giống overview: mảng theo POD, mỗi POD có list câu hỏi con
//     -> cần pivot lại thành question-major để PodMatrixTable render theo hàng.
// ---------------------------------------------------------------------------
interface RawAssessmentCell {
  pod?: number
  score?: number | null
  optionText?: string | null
}
interface RawAssessmentQuestionRow {
  questionId?: number
  questionText?: string
  cells?: RawAssessmentCell[]
}
interface RawAssessmentPodQuestion {
  questionId?: number
  questionText?: string
  score?: number | null
  optionText?: string | null
}
interface RawAssessmentPodEntry {
  pod?: number
  questions?: RawAssessmentPodQuestion[]
}
interface RawAssessmentMatrix {
  caseId?: string
  maxPod?: number
  questions?: RawAssessmentQuestionRow[]
  pods?: RawAssessmentPodEntry[]
  data?: RawAssessmentPodEntry[]
}

function pivotPodMajorToQuestionMajor(podEntries: RawAssessmentPodEntry[]): AssessmentQuestionRow[] {
  const rowsByQuestion = new Map<number, AssessmentQuestionRow>()

  for (const podEntry of podEntries) {
    const pod = podEntry.pod ?? 0
    const podQuestions = podEntry.questions ?? []

    for (const q of podQuestions) {
      const questionId = q.questionId ?? 0
      const row = rowsByQuestion.get(questionId) ?? {
        questionId,
        questionText: q.questionText ?? '',
        cells: [],
      }
      row.cells.push({ pod, score: q.score ?? null, optionText: q.optionText ?? null })
      rowsByQuestion.set(questionId, row)
    }
  }

  return Array.from(rowsByQuestion.values())
}

export function toAssessmentMatrix(raw: unknown, caseId: string): AssessmentMatrix {
  const response = (raw ?? {}) as RawAssessmentMatrix

  const alreadyQuestionMajor =
    Array.isArray(response.questions) && response.questions.length > 0 && Array.isArray(response.questions[0]?.cells)

  const questions: AssessmentQuestionRow[] = alreadyQuestionMajor
    ? (response.questions ?? []).map((row) => ({
        questionId: row.questionId ?? 0,
        questionText: row.questionText ?? '',
        cells: (row.cells ?? []).map((cell) => ({
          pod: cell.pod ?? 0,
          score: cell.score ?? null,
          optionText: cell.optionText ?? null,
        })),
      }))
    : pivotPodMajorToQuestionMajor(response.pods ?? response.data ?? [])

  const maxPod = response.maxPod ?? Math.max(0, ...questions.flatMap((q) => q.cells.map((c) => c.pod)))

  return {
    caseId: response.caseId ?? caseId,
    maxPod,
    questions,
  }
}

// ---------------------------------------------------------------------------
// React-query hooks
// ---------------------------------------------------------------------------

// Overview: symptom trend (stacked area) + compliance donut cho toàn khoa
// (có thể lọc theo loại phẫu thuật / phòng). 404 = chưa có dữ liệu -> null,
// không phải lỗi (backend có thể chưa deploy route này).
export function useAnalyticsOverview(params: AnalyticsOverviewParams = {}) {
  return useQuery({
    queryKey: analyticsKeys.overview(params),
    queryFn: async (): Promise<AnalyticsOverview | null> => {
      const response = await api.get(ANALYTICS_ENDPOINTS.overview, {
        params,
        validateStatus: (status) => status === 200 || status === 404,
      })

      if (response.status === 404) return null

      return toAnalyticsOverview(response.data)
    },
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

// Recovery matrix (tab "Ma trận hồi phục") cho 1 bệnh nhân.
export function useRecoveryMatrix(caseId: string | null) {
  return useQuery({
    queryKey: analyticsKeys.recoveryMatrix(caseId ?? ''),
    queryFn: async (): Promise<RecoveryMatrix | null> => {
      const response = await api.get(ANALYTICS_ENDPOINTS.recoveryMatrix(caseId as string), {
        validateStatus: (status) => status === 200 || status === 404,
      })

      if (response.status === 404) return null

      return toRecoveryMatrix(response.data, caseId as string)
    },
    enabled: !!caseId,
  })
}

// Compliance stats (tab "Tuân thủ") cho 1 bệnh nhân.
export function useComplianceStats(caseId: string | null) {
  return useQuery({
    queryKey: analyticsKeys.compliance(caseId ?? ''),
    queryFn: async (): Promise<ComplianceStats | null> => {
      const response = await api.get(ANALYTICS_ENDPOINTS.compliance(caseId as string), {
        validateStatus: (status) => status === 200 || status === 404,
      })

      if (response.status === 404) return null

      return toComplianceStats(response.data, caseId as string)
    },
    enabled: !!caseId,
  })
}

// Assessment matrix (tab "Đánh giá cuối ngày") cho 1 bệnh nhân.
export function useAssessmentMatrix(caseId: string | null) {
  return useQuery({
    queryKey: analyticsKeys.assessmentMatrix(caseId ?? ''),
    queryFn: async (): Promise<AssessmentMatrix | null> => {
      const response = await api.get(ANALYTICS_ENDPOINTS.assessmentMatrix(caseId as string), {
        validateStatus: (status) => status === 200 || status === 404,
      })

      if (response.status === 404) return null

      return toAssessmentMatrix(response.data, caseId as string)
    },
    enabled: !!caseId,
  })
}
