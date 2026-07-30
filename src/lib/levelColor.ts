// Chuẩn hoá & style hoá mức độ nguy cơ (level) của bệnh nhân.
//
// BE có thể trả `level.name` bằng tiếng Anh (Red/Yellow/Green) hoặc tiếng Việt
// (Đỏ/Vàng/Xanh) tuỳ nguồn dữ liệu — hàm `levelKey` gom cả hai về cùng 1 key.
// `levelClasses` cung cấp bundle class Tailwind dùng chung cho mọi nơi cần
// hiển thị màu mức độ (card viền trái, badge, chấm tròn, ...).
//
// Logic được rút ra (giữ nguyên, không đổi hành vi) từ:
// - src/features/patients/pages/PatientPage.tsx (levelKey, renderPatientCard)
// - src/features/patients/components/PatientSearchBar.tsx (levelDotClass)
// - src/features/patients/api/patientApi.ts (usePatientStats)

export type LevelKey = 'red' | 'yellow' | 'green'

export function levelKey(name?: string | null): LevelKey | null {
  const n = (name ?? '').toLowerCase()
  if (n.includes('red') || n.includes('đỏ')) return 'red'
  if (n.includes('yellow') || n.includes('vàng')) return 'yellow'
  if (n.includes('green') || n.includes('xanh')) return 'green'
  return null
}

export interface LevelClasses {
  borderLeft: string
  text: string
  badgeBg: string
  softBg: string
  dot: string
  label: string
}

const LEVEL_CLASSES: Record<LevelKey, LevelClasses> = {
  red: {
    borderLeft: 'border-l-red-500',
    text: 'text-red-600',
    badgeBg: 'bg-red-100',
    softBg: 'bg-red-50',
    dot: 'bg-red-500',
    label: 'Nguy cơ cao',
  },
  yellow: {
    borderLeft: 'border-l-yellow-500',
    text: 'text-yellow-600',
    badgeBg: 'bg-yellow-100',
    softBg: 'bg-yellow-50',
    dot: 'bg-yellow-500',
    label: 'Cần theo dõi',
  },
  green: {
    borderLeft: 'border-l-green-500',
    text: 'text-green-600',
    badgeBg: 'bg-green-100',
    softBg: 'bg-green-50',
    dot: 'bg-green-500',
    label: 'Ổn định',
  },
}

const NEUTRAL_CLASSES: LevelClasses = {
  borderLeft: 'border-l-slate-300',
  text: 'text-slate-500',
  badgeBg: 'bg-slate-100',
  softBg: 'bg-slate-50',
  dot: 'bg-slate-300',
  label: 'Chưa phân loại',
}

export function levelClasses(key: LevelKey | null): LevelClasses {
  if (!key) return NEUTRAL_CLASSES
  return LEVEL_CLASSES[key]
}
