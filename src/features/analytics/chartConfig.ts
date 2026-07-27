// Cau hinh Chart.js dung chung cho trang Thong ke du lieu.
//
// Bang mau da duoc chay qua dataviz skill validator
// (node scripts/validate_palette.js) va PASS toan bo check (lightness band,
// chroma floor, CVD separation, normal-vision floor). Contrast vs surface co
// WARN nen bat buoc phai co nhan hien thi / bang so lieu di kem (da lam qua
// legend HTML + nut "Xem dang bang" trong SymptomTrendChart).
//
// KHONG duoc doi thu tu mau — thu tu nay duoc chon de dam bao CVD-safe giua
// cac cap ke nhau.
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

// Filler la bat buoc de fill vung (area) cua stacked area chart render duoc -
// thieu no la 1 loi hay gap, chart se hien ra nhu line thuong khong to mau.
ChartJS.register(ArcElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip)

// ---------------------------------------------------------------------------
// Palette — symptom trend (stacked area), 5 series theo dung thu tu validated
// ---------------------------------------------------------------------------
export const SYMPTOM_COLORS: Record<SymptomSeriesKey, string> = {
  flatus: '#2a78d6',
  foodIntake: '#eb6834',
  bloating: '#1baf7a',
  vomiting: '#eda100',
  nausea: '#e87ba4',
}

export const SYMPTOM_LABELS: Record<SymptomSeriesKey, string> = {
  flatus: 'Da trung tien',
  foodIntake: 'Kha nang an',
  bloating: 'Chuong bung',
  vomiting: 'Non nhieu',
  nausea: 'Buon non',
}

// ---------------------------------------------------------------------------
// Palette — compliance donut (meter, khong phai proportion chart)
// ---------------------------------------------------------------------------
export const COMPLIANCE_COLORS = {
  compliant: '#4a3aa7',
  nonCompliant: '#e34948',
} as const

// ---------------------------------------------------------------------------
// Builders — symptom trend stacked area
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
