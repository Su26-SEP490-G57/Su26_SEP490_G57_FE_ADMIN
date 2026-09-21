# Plan: QuestionManagementPage UI Redesign — Option A (Professional Medical Dashboard)

**Objective:** Refactor `/protocols/questions` to high-density table view with stats header, inline editor, and improved accessibility.

**Date:** 2026-09-20  
**Approved approach:** Option A — Professional Medical Dashboard

---

## 1. Analysis Summary

### Current State
- **File:** `Su26_SEP490_G57_FE_ADMIN/src/features/protocols/pages/QuestionManagementPage.tsx` (685 LOC)
- **Pattern:** Accordion-style cards (expand/collapse per question)
- **Strengths:** Triage selector (GREEN/YELLOW/RED), validation, search
- **Weaknesses:** 
  - Low density (p-6, p-8 padding)
  - Weak visual hierarchy (all questions same style)
  - No stats/overview
  - Edit mode not distinct from view mode
  - Delete button too prominent (red, always visible)

### Existing Patterns in Codebase
- **Table pattern:** `NurseManagementPage.tsx` (lines 121-144) — sticky header, zebra striping, hover effect
- **Stats cards:** Not present (we'll create new pattern)
- **Triage config:** Already exists in `QuestionManagementPage.tsx` (lines 55-80)
- **Toast component:** `src/components/Toast.tsx` (reuse for feedback)
- **Icons:** Material Symbols (already used consistently)

---

## 2. Implementation Plan

### Phase 1: Stats Header Component (New)
**File:** Create `src/features/protocols/components/QuestionStatsBar.tsx`

**Props:**
```typescript
interface QuestionStatsBarProps {
  total: number
  triageCounts: { green: number; yellow: number; red: number }
  activeFilter: TriageLevel | 'ALL'
  onFilterChange: (filter: TriageLevel | 'ALL') => void
}
```

**Design:**
- Horizontal bar with 4 segments: `All` | `Xanh` | `Vàng` | `Đỏ`
- Each segment: count + percentage + click to filter
- Active filter: bold border + filled background
- Use existing `TRIAGE_CONFIG` colors

**Estimate:** ~80 LOC

---

### Phase 2: Table View Replacement
**File:** Modify `QuestionManagementPage.tsx`

**Changes:**
1. **Replace accordion cards (lines 449-661) with table:**
   - Structure: `<table>` → `<thead>` (sticky) → `<tbody>`
   - Columns: `#` (40px) | `Câu hỏi` (flex-1) | `Số phương án` (100px) | `Mức cao nhất` (120px) | `Actions` (80px)
   - Zebra striping: `even:bg-slate-50/50`
   - Hover: `hover:bg-blue-50/30 cursor-pointer`
   - Click row → expand inline editor below (similar to JIRA)

2. **Inline Editor (expanded row):**
   - Insert `<tr>` with `colspan={5}` below clicked row
   - Border-left (4px) colored by highest triage level
   - Content: same form as current (lines 495-621)
   - Sticky footer for Save/Cancel when scrolled

3. **Highest Triage Badge:**
   - Calculate highest triage from `question.answers.map(a => a.triageLevel)`
   - Priority: RED > YELLOW > GREEN
   - Display as pill badge in column 4

4. **Delete Button Polish:**
   - Icon-only (ghost style, gray)
   - Hover → red color + tooltip "Xóa câu hỏi"
   - Move to Actions column (far right)

**Estimate:** ~200 LOC refactor

---

### Phase 3: Empty States
**File:** Add to `QuestionManagementPage.tsx`

**Cases:**
1. **No questions at all:**
   ```tsx
   <div className="text-center py-16">
     <span className="material-symbols-outlined text-6xl text-slate-300">quiz</span>
     <p className="mt-4 text-slate-500">Chưa có câu hỏi đánh giá nào</p>
     <button onClick={handleAddNewQuestion}>Tạo câu hỏi đầu tiên</button>
   </div>
   ```

2. **Search/filter no results:**
   ```tsx
   <div className="text-center py-12">
     <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
     <p className="mt-2 text-slate-500">Không tìm thấy câu hỏi phù hợp</p>
   </div>
   ```

**Estimate:** ~30 LOC

---

### Phase 4: Accessibility & Keyboard Shortcuts
**File:** Modify `QuestionManagementPage.tsx`

**Additions:**
1. **Focus trap in editor:**
   - Use `useEffect` to focus first input when editor opens
   - Tab navigation within editor fields

2. **Keyboard shortcuts:**
   - `Cmd/Ctrl + S` → save (when editor open)
   - `Esc` → cancel/close editor
   - Add `useKeyboardShortcut` hook

3. **ARIA labels:**
   - `aria-label` on icon buttons
   - `aria-expanded` on table rows
   - `role="region"` on editor

**Estimate:** ~50 LOC

---

### Phase 5: Stats Aggregation Logic
**File:** Modify `QuestionManagementPage.tsx`

**Add `useMemo` hooks:**
```typescript
const stats = useMemo(() => {
  const counts = { green: 0, yellow: 0, red: 0 }
  questions.forEach(q => {
    const highest = getHighestTriageLevel(q.answers)
    if (highest === 'GREEN') counts.green++
    else if (highest === 'YELLOW') counts.yellow++
    else if (highest === 'RED') counts.red++
  })
  return { total: questions.length, triageCounts: counts }
}, [questions])

function getHighestTriageLevel(answers: Answer[]): TriageLevel | null {
  if (answers.some(a => a.triageLevel === 'RED')) return 'RED'
  if (answers.some(a => a.triageLevel === 'YELLOW')) return 'YELLOW'
  if (answers.some(a => a.triageLevel === 'GREEN')) return 'GREEN'
  return null
}
```

**Estimate:** ~30 LOC

---

## 3. File Structure

```
Su26_SEP490_G57_FE_ADMIN/src/features/protocols/
├── components/
│   └── QuestionStatsBar.tsx          [NEW — 80 LOC]
└── pages/
    └── QuestionManagementPage.tsx    [MODIFY — ~700 LOC total]
```

---

## 4. Design Specifications

### Color Palette (Reuse Existing)
- **GREEN:** `bg-green-50`, `text-green-700`, `border-green-300`
- **YELLOW:** `bg-yellow-50`, `text-yellow-700`, `border-yellow-300`
- **RED:** `bg-red-50`, `text-red-700`, `border-red-300`
- **Neutral:** `bg-slate-50`, `text-slate-700`, `border-slate-200`

### Spacing Reduction
- Page padding: `p-8` → `p-6`
- Card padding: `p-6` → `p-4`
- Table cell: `px-6 py-4.5` → `px-4 py-3`

### Sticky Elements
- Table header: `sticky top-0 z-10 bg-white`
- Editor footer (Save/Cancel): `sticky bottom-0 z-10 bg-white border-t`

---

## 5. Risk Mitigation

### Data Integrity
- **Risk:** Inline editor might interfere with table row click events
- **Mitigation:** Use `event.stopPropagation()` on editor form elements (already present in current code, line 492)

### Performance
- **Risk:** Large question lists (50+) could slow table rendering
- **Mitigation:** Already using `useMemo` for filtering; add virtual scrolling if >100 questions (future optimization)

### Accessibility
- **Risk:** Custom keyboard shortcuts conflict with browser shortcuts
- **Mitigation:** Only bind when editor is open; check `event.ctrlKey`/`event.metaKey` properly

### Breaking Changes
- **Risk:** None — this is pure UI refactor, no API/data model changes

---

## 6. Testing Checklist

After implementation:
- [ ] Lint: `npm run lint` — 0 errors
- [ ] Build: `npm run build` — success
- [ ] Manual testing:
  - [ ] Stats bar counts correct (all 4 filters)
  - [ ] Table row click opens editor inline
  - [ ] Save/Cancel works (same API calls as before)
  - [ ] Delete confirmation modal still works
  - [ ] Search filters table rows
  - [ ] Keyboard shortcuts (Cmd+S, Esc) work
  - [ ] Empty states render correctly
  - [ ] Triage selector still functional
  - [ ] Zebra striping visible
  - [ ] Sticky header stays on scroll

---

## 7. Rollback Plan

If design is not acceptable:
1. Git checkout previous version: `git checkout HEAD~1 -- src/features/protocols/pages/QuestionManagementPage.tsx`
2. Remove new file: `rm src/features/protocols/components/QuestionStatsBar.tsx`
3. Commit: `git commit -m "Revert: QuestionManagementPage redesign"`

---

## 8. Estimated Total Effort

- **Phase 1 (Stats Bar):** 1 hour
- **Phase 2 (Table View):** 2-3 hours
- **Phase 3 (Empty States):** 30 minutes
- **Phase 4 (A11y):** 1 hour
- **Phase 5 (Stats Logic):** 30 minutes
- **Testing:** 1 hour

**Total:** ~5-6 hours (single developer)

---

## 9. Open Questions / Decisions

1. **Table vs Accordion toggle?**
   - **Decision:** Full replacement to table view (no toggle option)
   - **Rationale:** Simplifies UX, users can expand row to see details

2. **Virtual scrolling for >100 questions?**
   - **Decision:** Not in scope for this phase
   - **Rationale:** Current question count unlikely to exceed 50; can add later if needed

3. **Stats bar fixed/sticky?**
   - **Decision:** Fixed below page header (scrolls with page)
   - **Rationale:** Avoids z-index conflicts with table sticky header

---

## 10. Post-Implementation Tasks

After approval and merge:
1. Update memory: `poms-refactor.md` — mark QuestionManagementPage redesign as ✅ COMPLETED
2. Screenshot new UI for documentation (if needed)
3. Consider similar refactor for other pages (NutritionGuidePage, ProtocolsPage) — future work

---

**Ready for implementation once user approves this plan.**
