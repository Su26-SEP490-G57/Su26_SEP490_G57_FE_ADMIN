// Cấu hình Chart.js dùng chung cho trang Thống kê dữ liệu.
//
// Bảng màu đã được chạy qua dataviz skill validator
// (node scripts/validate_palette.js) và PASS toàn bộ check (lightness band,
// chroma floor, CVD separation, normal-vision floor). Contrast vs surface có
// WARN nên bắt buộc phải có nhãn hiển thị / bảng số liệu đi kèm (đã làm qua
// legend HTML + nút "Xem dạng bảng" trong SymptomTrendChart).
//
// KHÔNG được đổi thứ tự màu — thứ tự này được chọn để đảm bảo CVD-safe giữa
// các cặp kề nhau.
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { ChartData, ChartOptions } from 'chart.js'
import type { ComplianceOverview, SymptomSeriesKey, SymptomTrend } from './types'

// Filler là bắt buộc để fill vùng (area) của stacked area chart render được -
// thiếu nó là 1 lỗi hay gặp, chart sẽ hiện ra như line thường không tô màu.
ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip)

// ---------------------------------------------------------------------------
// Palette — symptom trend (stacked area), 5 series theo đúng thứ tự validated
// ---------------------------------------------------------------------------
export const SYMPTOM_COLORS: Record<SymptomSeriesKey, string> = {
  flatus: '#2a78d6',
  foodIntake: '#eb6834',
  bloating: '#1baf7a',
  vomiting: '#eda100',
  nausea: '#e87ba4',
}

export const SYMPTOM_LABELS: Record<SymptomSeriesKey, string> = {
  flatus: 'Đã trung tiện',
  foodIntake: 'Khả năng ăn',
  bloating: 'Chướng bụng',
  vomiting: 'Nôn nhiều',
  nausea: 'Buồn nôn',
}

// ---------------------------------------------------------------------------
// Palette — compliance donut (meter, không phải proportion chart)
// ---------------------------------------------------------------------------
export const COMPLIANCE_COLORS = {
  compliant: '#4a3aa7',
  nonCompliant: '#e34948',
} as const

// ---------------------------------------------------------------------------
// Builders — biểu đồ xu hướng triệu chứng (stacked area)
// ---------------------------------------------------------------------------
export function buildSymptomTrendChartData(trend: SymptomTrend): ChartData<'line'> {
  return {
    labels: trend.pods.map((pod) => `POD ${pod}`),
    datasets: trend.series.map((s) => ({
      label: s.label,
      data: s.data,
      backgroundColor: SYMPTOM_COLORS[s.key],
      borderColor: '#ffffff',
      borderWidth: 2,
      fill: true,
      tension: 0,
      pointRadius: 0,
      pointHoverRadius: 3,
    })),
  }
}

export function buildSymptomTrendChartOptions(): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 10,
        stacked: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 11 } },
      },
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  }
}

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
