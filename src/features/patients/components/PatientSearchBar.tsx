import { useEffect, useMemo, useRef, useState } from 'react'
import type { PatientListItem } from '../types'

/**
 * Tìm kiếm tiếng Việt theo cấp độ (accent-insensitive có phân cấp).
 *
 * Mỗi ký tự tách thành 3 tầng: gốc (u/o/a/e/d) -> biến thể hình
 * (móc ư/ơ, mũ â/ê/ô, trăng ă, gạch đ) -> thanh điệu (sắc/huyền/hỏi/ngã/nặng).
 * Gõ tới tầng nào thì lọc chặt tới tầng đó:
 *   - gõ "u"  -> khớp mọi biến thể của u: u ư ú ù ủ ũ ụ ứ ừ ử ữ ự
 *   - gõ "ư"  -> chỉ khớp họ ư: ư ứ ừ ử ữ ự (không ra u)
 *   - gõ "ứ"  -> khớp đúng ứ
 *   - gõ "d"  -> khớp cả d và đ; gõ "đ" -> chỉ đ
 */

// Dấu tổ hợp (combining marks) trong NFD.
const SHAPE_MARKS = new Set(['̂', '̆', '̛']) // mũ, trăng, móc
const TONE_MARKS = new Set(['̀', '́', '̃', '̉', '̣']) // huyền, sắc, ngã, hỏi, nặng

interface CharDesc {
  r: string // ký tự gốc (ascii)
  s: string // dấu hình (rỗng nếu không có)
  t: string // dấu thanh (rỗng nếu không có)
}

// Tách một chuỗi thành mảng mô tả từng ký tự (đã tách gốc/hình/thanh).
function decompose(text: string): CharDesc[] {
  const nfd = text.toLowerCase().normalize('NFD')
  const out: CharDesc[] = []

  for (const ch of nfd) {
    if (SHAPE_MARKS.has(ch)) {
      const last = out[out.length - 1]
      if (last) last.s += ch
    } else if (TONE_MARKS.has(ch)) {
      const last = out[out.length - 1]
      if (last) last.t += ch
    } else if (ch === 'đ') {
      out.push({ r: 'd', s: 'đ', t: '' }) // đ = d + biến thể hình
    } else {
      out.push({ r: ch, s: '', t: '' })
    }
  }

  return out
}

// Ký tự truy vấn q có khớp ký tự trong dữ liệu h không, theo cấp độ của q.
function charMatch(q: CharDesc, h: CharDesc): boolean {
  if (q.t) return h.r === q.r && h.s === q.s && h.t === q.t // đã có thanh -> khớp chính xác
  if (q.s) return h.r === q.r && h.s === q.s // có dấu hình -> khớp gốc + hình
  return h.r === q.r // chỉ gốc -> khớp mọi biến thể
}

// term có xuất hiện như một đoạn con liên tiếp trong hay không.
function termMatches(term: CharDesc[], hay: CharDesc[]): boolean {
  if (term.length === 0) return true
  const max = hay.length - term.length
  for (let start = 0; start <= max; start++) {
    let ok = true
    for (let i = 0; i < term.length; i++) {
      if (!charMatch(term[i], hay[start + i])) {
        ok = false
        break
      }
    }
    if (ok) return true
  }
  return false
}

function patientName(p: PatientListItem): string {
  return p.account?.fullName ?? p.nameInitials ?? '--'
}

function levelDotClass(name?: string | null): string {
  const n = (name ?? '').toLowerCase()
  if (n.includes('red') || n.includes('đỏ')) return 'bg-red-500'
  if (n.includes('yellow') || n.includes('vàng')) return 'bg-yellow-500'
  if (n.includes('green') || n.includes('xanh')) return 'bg-green-500'
  return 'bg-slate-300'
}

interface PatientSearchBarProps {
  patients: PatientListItem[]
  onSelect: (patient: PatientListItem) => void
}

const MAX_RESULTS = 8

// Ô tìm kiếm kiểu hopamchuan: gõ -> hiện dropdown gợi ý ngay ->
// click (hoặc Enter) là mở chi tiết bệnh nhân luôn.
// State gõ được giữ CỤC BỘ trong component này nên việc gõ không làm
// trang cha re-render -> không còn mất focus, gõ tiếng Việt bình thường.
export function PatientSearchBar({ patients, onSelect }: PatientSearchBarProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Tiền xử lý: tách sẵn haystack của từng bệnh nhân (chỉ tính lại khi
  // danh sách bệnh nhân đổi, không tính lại mỗi lần gõ).
  const haystacks = useMemo(
    () =>
      patients.map((p) => ({
        p,
        desc: decompose(
          [p.caseId, patientName(p), p.roomBed, p.diagnosis, p.operationType?.name]
            .filter(Boolean)
            .join(' '),
        ),
      })),
    [patients],
  )

  const results = useMemo(() => {
    const raw = query.trim()
    if (!raw) return []

    // Tách từ khoá theo khoảng trắng: mọi từ đều phải khớp (AND).
    const terms = raw
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => decompose(t))

    return haystacks
      .filter(({ desc }) => terms.every((t) => termMatches(t, desc)))
      .slice(0, MAX_RESULTS)
      .map(({ p }) => p)
  }, [query, haystacks])

  // Đóng dropdown khi click ra ngoài.
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Reset ô đang chọn mỗi khi danh sách kết quả đổi.
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  function handleSelect(patient: PatientListItem) {
    onSelect(patient)
    setQuery('')
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const chosen = results[activeIndex]
      if (chosen) handleSelect(chosen)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showDropdown = open && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative w-72">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
        search
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm bệnh nhân, mã, phòng, chẩn đoán..."
        className="w-full pl-10 pr-9 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('')
            setOpen(false)
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title="Xoá"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 z-[70] max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              Không tìm thấy bệnh nhân phù hợp
            </div>
          ) : (
            <ul className="py-1">
              {results.map((patient, index) => (
                <li key={patient.caseId}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(patient)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      index === activeIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${levelDotClass(
                        patient.level?.name,
                      )}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {patientName(patient)}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        Mã: {patient.caseId}
                        {patient.roomBed ? ` • ${patient.roomBed}` : ''}
                        {patient.operationType?.name ? ` • ${patient.operationType.name}` : ''}
                      </p>
                    </div>
                    <span className="flex-shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      POD {patient.currentPod}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
