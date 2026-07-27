import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { DetailTabId } from '../types'

const DEFAULT_TAB: DetailTabId = 'recovery'

const VALID_TABS: DetailTabId[] = ['recovery', 'compliance', 'assessment']

function isDetailTab(value: string | null): value is DetailTabId {
  return value !== null && (VALID_TABS as string[]).includes(value)
}

// Wrapper cho useSearchParams giu 4 filter cua trang Thong ke du lieu tren
// URL (case/tab/surgery/room) — cho phep chia se link + bam Back/Forward giu
// dung ngu canh dang xem. Tim kiem tu do (chua debounce) KHONG nam trong URL,
// duoc giu o page-level useState (xem AnalyticsPage.tsx).
export function useAnalyticsFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedCaseId = searchParams.get('case')
  const activeTab: DetailTabId = isDetailTab(searchParams.get('tab')) ? (searchParams.get('tab') as DetailTabId) : DEFAULT_TAB
  const surgeryParam = searchParams.get('surgery')
  const operationTypeId = surgeryParam ? Number(surgeryParam) : undefined
  const room = searchParams.get('room') ?? undefined

  // Cap nhat 1 key duy nhat, giu nguyen cac key khac; bo key khoi URL neu
  // value rong/undefined (thay vi ghi chuoi rong).
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

  const setSelectedCaseId = useCallback((caseId: string | null) => setParam('case', caseId), [setParam])
  const setActiveTab = useCallback((tab: DetailTabId) => setParam('tab', tab === DEFAULT_TAB ? undefined : tab), [setParam])
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
    [selectedCaseId, activeTab, operationTypeId, room, setSelectedCaseId, setActiveTab, setOperationTypeId, setRoom, clearFilters],
  )
}
