import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DetailTabId } from '../types'

const DEFAULT_TAB: DetailTabId = 'recovery'

const VALID_TABS: DetailTabId[] = ['recovery', 'compliance', 'assessment']

function isDetailTab(value: string | null): value is DetailTabId {
  return value !== null && (VALID_TABS as string[]).includes(value)
}

// Wrapper cho useSearchParams giữ 4 filter của trang Thống kê dữ liệu trên
// URL (case/tab/surgery/room) — cho phép chia sẻ link + bấm Back/Forward giữ
// đúng ngữ cảnh đang xem. Tìm kiếm tự do (chưa debounce) KHÔNG nằm trong URL,
// được giữ ở page-level useState (xem AnalyticsPage.tsx).
export function useAnalyticsFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedCaseId = searchParams.get('case')
  const activeTab: DetailTabId = isDetailTab(searchParams.get('tab'))
    ? (searchParams.get('tab') as DetailTabId)
    : DEFAULT_TAB
  const surgeryParam = searchParams.get('surgery')
  const operationTypeId = surgeryParam ? Number(surgeryParam) : undefined
  const room = searchParams.get('room') ?? undefined

  // Cập nhật 1 key duy nhất, giữ nguyên các key khác; bỏ key khỏi URL nếu
  // value rỗng/undefined (thay vì ghi chuỗi rỗng).
  const setParam = useCallback(
    (key: string, value: string | undefined | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value === undefined || value === null || value === '') {
            next.delete(key)
          } else {
            next.set(key, value)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setSelectedCaseId = useCallback(
    (caseId: string | null) => setParam('case', caseId),
    [setParam],
  )
  const setActiveTab = useCallback(
    (tab: DetailTabId) => setParam('tab', tab === DEFAULT_TAB ? undefined : tab),
    [setParam],
  )
  const setOperationTypeId = useCallback(
    (id: number | undefined) => setParam('surgery', id === undefined ? undefined : String(id)),
    [setParam],
  )
  const setRoom = useCallback((value: string | undefined) => setParam('room', value), [setParam])

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('surgery')
        next.delete('room')
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  return useMemo(
    () => ({
      selectedCaseId,
      activeTab,
      operationTypeId,
      room,
      setSelectedCaseId,
      setActiveTab,
      setOperationTypeId,
      setRoom,
      clearFilters,
    }),
    [
      selectedCaseId,
      activeTab,
      operationTypeId,
      room,
      setSelectedCaseId,
      setActiveTab,
      setOperationTypeId,
      setRoom,
      clearFilters,
    ],
  )
}
