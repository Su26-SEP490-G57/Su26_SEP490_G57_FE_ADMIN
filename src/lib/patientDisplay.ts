// Tiện ích hiển thị chung cho bệnh nhân — tên hiển thị + format thời gian
// đánh giá gần nhất. Rút ra nguyên trạng (không đổi hành vi) từ:
// - src/features/patients/pages/PatientPage.tsx
// - src/features/patients/pages/ArchivePage.tsx
// (cả hai đang duplicate y hệt logic này; file này là nơi tập trung dùng
// chung cho code MỚI — 2 file trên giữ nguyên bản sao cũ, không refactor
// trong đợt này theo đúng phạm vi kế hoạch.)

// Tên hiển thị của bệnh nhân: ưu tiên fullName của tài khoản liên kết.
export function patientName(p: {
  account?: { fullName?: string | null } | null
  nameInitials?: string | null
}): string {
  return p.account?.fullName ?? p.nameInitials ?? '--'
}

// Format thời gian đánh giá gần nhất — dạng tương đối tiếng Việt
// (Vừa xong / X phút trước / X giờ trước / X ngày trước).
export function formatLastAssessment(datetime?: string | null): string {
  if (!datetime) return 'Chưa đánh giá'

  const now = new Date()
  const assessed = new Date(datetime)
  const diffMs = now.getTime() - assessed.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngày trước`
}
