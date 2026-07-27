// Types cho tính năng "Thống kê dữ liệu" (SEP490-377).
//
// Các type dưới đây là hình dạng FE MONG MUỐN dùng để render (đã "làm phẳng"
// và đặt tên lại cho dễ dùng). Backend thực tế (đang được xây song song) trả
// về hình dạng "wire" hơi khác — xem comment trong api/analytics.ts, nơi có
// các hàm mapper (toSymptomTrend, toRecoveryMilestones, ...) chuyển từ wire
// shape sang các type FE-friendly này. Nếu backend đổi hình dạng, CHỈ cần sửa
// mapper, không cần đụng vào component nào dùng các type này.

export type DetailTabId = 'recovery' | 'compliance' | 'assessment'

// ---------------------------------------------------------------------------
// Overview — biểu đồ triệu chứng (stacked area) + biểu đồ tuân thủ (donut)
// ---------------------------------------------------------------------------
export type SymptomSeriesKey = 'flatus' | 'foodIntake' | 'bloating' | 'vomiting' | 'nausea'

export interface SymptomSeries {
  key: SymptomSeriesKey
  label: string
  data: (number | null)[]
}

export interface SymptomTrend {
  pods: number[]
  series: SymptomSeries[]
}

export interface ComplianceOverview {
  compliant: number
  nonCompliant: number
  total: number
  complianceRate: number
}

export interface AnalyticsOverview {
  symptomTrend: SymptomTrend
  compliance: ComplianceOverview
}

export interface AnalyticsOverviewParams {
  operationTypeId?: number
  room?: string
}

// ---------------------------------------------------------------------------
// Recovery matrix — mốc hồi phục theo POD
// ---------------------------------------------------------------------------
export type RecoveryMilestoneKey = 'firstDrink' | 'firstFood' | 'podSoft' | 'firstFlatus' | 'firstStool'

export interface RecoveryMilestone {
  key: RecoveryMilestoneKey
  label: string
  pod: number | null
  occurredAt: string | null
}

export interface RecoveryMatrixSummary {
  redCount: number
  totalPodDays: number | null
  erasCompleted: boolean
  erasCompletedDate: string | null
  holdCount: number
}

export interface RecoveryMatrix {
  caseId: string
  maxPod: number
  milestones: RecoveryMilestone[]
  summary: RecoveryMatrixSummary
}

// ---------------------------------------------------------------------------
// Compliance stats — checklist + counters cho 1 bệnh nhân
// ---------------------------------------------------------------------------
export interface ComplianceChecklist {
  viewedPodGuide: boolean
  viewedHealthEducation: boolean
  completedAssessment: boolean
}

export interface ComplianceCounters {
  completedAssessments: number
  reminderCount: number
  appAccessCount: number
}

export interface ComplianceStats {
  caseId: string
  checklist: ComplianceChecklist
  counters: ComplianceCounters
}

// ---------------------------------------------------------------------------
// Assessment matrix — bảng câu hỏi x POD
// ---------------------------------------------------------------------------
export interface AssessmentCell {
  pod: number
  score: number | null
  optionText: string | null
}

export interface AssessmentQuestionRow {
  questionId: number
  questionText: string
  cells: AssessmentCell[]
}

export interface AssessmentMatrix {
  caseId: string
  maxPod: number
  questions: AssessmentQuestionRow[]
}
