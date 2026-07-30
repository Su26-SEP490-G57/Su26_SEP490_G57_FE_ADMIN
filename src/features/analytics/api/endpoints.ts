// URL templates cho các endpoint thống kê — tách riêng để dễ đối chiếu với
// backend khi các route thực tế được triển khai xong (đang xây song song).
export const ANALYTICS_ENDPOINTS = {
  overview: '/patients/analytics/overview',
  recoveryMatrix: (caseId: string) => `/patients/${encodeURIComponent(caseId)}/recovery-matrix`,
  compliance: (caseId: string) => `/patients/${encodeURIComponent(caseId)}/compliance`,
  assessmentMatrix: (caseId: string) => `/patients/${encodeURIComponent(caseId)}/assessment-matrix`,
} as const
