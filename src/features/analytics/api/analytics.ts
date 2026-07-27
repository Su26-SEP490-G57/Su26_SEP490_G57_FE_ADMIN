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
// `patient(caseId)` gom ca 3 tab chi tiet cua 1 benh nhan lai 1 cho de co the
// invalidate ca 3 cung luc sau nay.
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
// Mappers - wire shape (backend that) -> shape FE mong muon (types.ts).
//
// Backend dang duoc xay song song nen cac hinh dang duoi day co the lech doi
// chut so voi thuc te cuoi cung - moi mapper la NOI DUY NHAT can sua neu
// backend doi hinh dang response, cac component tieu thu types.ts khong can
// doi gi. Toan bo doc field deu dung optional chaining + fallback rong de mot
// response hoi khac khong lam crash UI (chi suy bien ve trang thai "no data").
// ---------------------------------------------------------------------------

const SYMPTOM_SERIES_META: { key: SymptomSeriesKey; label: string; matchKeys: string[] }[] = [
  { key: 'flatus', label: 'Da trung tien', matchKeys: ['flatus', 'trungtien'] },
  { key: 'foodIntake', label: 'Kha nang an', matchKeys: ['foodintake', 'food', 'anuong'] },
  { key: 'bloating', label: 'Chuong bung', matchKeys: ['bloating', 'chuongbung'] },
  { key: 'vomiting', label: 'Non nhieu', matchKeys: ['vomiting', 'vomit', 'non'] },
  { key: 'nausea', label: 'Buon non', matchKeys: ['nausea', 'buonnon'] },
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

// Chuyen response overview (mang phang theo POD) thanh SymptomTrend
// (mang pods[] + 5 series song song theo dung thu tu mau da validate).
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

      // Uu tien khop theo questionKey; neu BE khong gui questionKey (hoac dat
      // ten khac), fallback ve vi tri co dinh (thu tu 5 cau hoi con trong 1
      // POD duoc backend tra nhat quan theo dung thu tu SYMPTOM_SERIES_META).
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
// Recovery matrix - wire shape co `milestones` la 1 object phang
// ({timeToRedrink, timeToReeat, podSoftDietReached, timeToFlatus, timeToDefecation})
// thay vi mang RecoveryMilestone[] nhu type FE mong muon.
// ---------------------------------------------------------------------------
const MILESTONE_META: { key: RecoveryMilestoneKey; label: string; rawKeys: string[] }[] = [
  { key: 'firstDrink', label: 'Uong nuoc dau tien', rawKeys: ['timeToRedrink', 'firstDrink'] },
  { key: 'firstFood', label: 'An dau tien', rawKeys: ['timeToReeat', 'firstFood'] },
  { key: 'podSoft', label: 'An thuc an mem', rawKeys: ['podSoftDietReached', 'podSoft'] },
  { key: 'firstFlatus', label: 'Trung tien dau tien', rawKeys: ['timeToFlatus', 'firstFlatus'] },
  { key: 'firstStool', label: 'Dai tien dau tien', rawKeys: ['timeToDefecation', 'firstStool'] },
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
      // Backend tra ve field ten `redAlertCount` (khong phai `redCount`) - xem
      // RecoveryMatrixSummaryDto trong statistics module cua backend.
      redCount: (summary as Record<string, unknown>).redAlertCount as number | undefined ?? summary.redCount ?? 0,
      totalPodDays: summary.totalPodDays ?? null,
      erasCompleted: summary.erasCompleted ?? false,
      erasCompletedDate: summary.erasCompletedDate ?? null,
      holdCount: summary.holdCount ?? 0,
    },
  }
}

// ---------------------------------------------------------------------------
// Compliance stats - backend (PatientComplianceResponseDto) tra ve 1 object
// PHANG: { viewedGuidance, viewedEducation, reminderCount, appAccessCount,
// assessmentCompletedCount, ... }, khong phai 2 object con checklist/counters
// nhu ban nhap dau. Van giu fallback doc them nested checklist/counters phong
// khi backend doi lai hinh dang co cau truc hon.
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
// Assessment matrix - ho tro ca 2 hinh dang co the xay ra:
//  a) da "question-major" san: { questions: [{questionId, questionText, cells:[...]}] }
//  b) "pod-major" giong overview: mang theo POD, moi POD co list cau hoi con
//     -> can pivot lai thanh question-major de PodMatrixTable render theo hang.
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

// Overview: symptom trend (stacked area) + compliance donut cho toan khoa
// (co the loc theo loai phau thuat / phong). 404 = chua co du lieu -> null,
// khong phai loi (backend co the chua deploy route nay).
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

// Recovery matrix (tab "Ma tran hoi phuc") cho 1 benh nhan.
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

// Compliance stats (tab "Tuan thu") cho 1 benh nhan.
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

// Assessment matrix (tab "Danh gia cuoi ngay") cho 1 benh nhan.
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
