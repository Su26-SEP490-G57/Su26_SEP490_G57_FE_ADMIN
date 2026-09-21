// Cấu hình Chart.js dùng chung cho trang Thống kê dữ liệu.
//
// Chỉ còn donut tuân thủ (Biểu đồ xu hướng triệu chứng / SymptomTrendChart đã
// bị bỏ theo yêu cầu — cùng lúc xoá luôn phần cấu hình line/area chart tương
// ứng bên dưới, vì không còn nơi nào dùng).
//
// Bảng màu đã được chạy qua dataviz skill validator
// (node scripts/validate_palette.js) và PASS toàn bộ check (lightness band,
// chroma floor, CVD separation, normal-vision floor).
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import type { ComplianceOverview } from './types'

ChartJS.register(ArcElement, Legend, Tooltip)

// ---------------------------------------------------------------------------
// Palette — compliance donut (meter, không phải proportion chart)
// ---------------------------------------------------------------------------
export const COMPLIANCE_COLORS = {
  compliant: '#4a3aa7',
  nonCompliant: '#e34948',
} as const

// ---------------------------------------------------------------------------
// Builders — compliance donut (meter)
// ---------------------------------------------------------------------------
export function buildComplianceDonutData(overview: ComplianceOverview): ChartData<'doughnut'> {
  return {
    datasets: [
      {
        data: [overview.compliant, overview.nonCompliant],
        backgroundColor: [COMPLIANCE_COLORS.compliant, COMPLIANCE_COLORS.nonCompliant],
        borderWidth: 0,
      },
    ],
  }
}

export function buildComplianceDonutOptions(): ChartOptions<'doughnut'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  }
}
