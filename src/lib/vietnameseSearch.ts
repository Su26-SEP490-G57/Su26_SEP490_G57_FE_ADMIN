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
 *
 * Rút ra nguyên trạng từ src/features/patients/components/PatientSearchBar.tsx
 * để dùng lại cho bộ lọc tìm kiếm ở trang Thống kê dữ liệu (khác với
 * PatientSearchBar, vốn là ô chọn nhanh MỘT bệnh nhân — job khác nhau).
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

// So khớp toàn bộ query (có thể nhiều từ, cách nhau bởi khoảng trắng — mọi
// từ đều phải khớp, AND) với văn bản haystack.
export function matchesQuery(text: string, query: string): boolean {
  const raw = query.trim()
  if (!raw) return true

  const terms = raw
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => decompose(t))

  const hay = decompose(text)

  return terms.every((t) => termMatches(t, hay))
}
