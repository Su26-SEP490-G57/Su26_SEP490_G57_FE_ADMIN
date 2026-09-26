import { useState } from 'react'
import { useAuditLogs } from '../api/auditLog'
import { useAuditLogsRealtime } from '../hooks/useAuditLogsRealtime'
import { AuditLogFilterBar } from '../components/AuditLogFilterBar'
import { AuditLogTable } from '../components/AuditLogTable'
import type { AuditLogFilters } from '../types'

const ITEMS_PER_PAGE = 50

export function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
  })

  const { data, isLoading, error } = useAuditLogs(filters)

  // Real-time WebSocket connection
  const { isConnected } = useAuditLogsRealtime()

  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 0
  const currentPage = Math.floor((filters.offset ?? 0) / ITEMS_PER_PAGE) + 1

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
      limit: ITEMS_PER_PAGE,
    })
  }

  const handlePageChange = (page: number) => {
    setFilters({
      ...filters,
      offset: (page - 1) * ITEMS_PER_PAGE,
    })
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
        <p className="text-lg font-semibold text-slate-800 mb-2">Lỗi tải dữ liệu</p>
        <p className="text-sm text-slate-500">
          {error instanceof Error ? error.message : 'Không thể tải audit logs'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Lịch sử thay đổi dữ liệu trong hệ thống</p>
        </div>
        <div className="flex items-center gap-4">
          {/* WebSocket connection indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-slate-400'
              }`}
            />
            <span className="text-slate-600">{isConnected ? 'Realtime' : 'Offline'}</span>
          </div>
          {data && (
            <div className="text-sm text-slate-600">
              Tổng số: <span className="font-bold">{data.total}</span> bản ghi
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <AuditLogFilterBar onFiltersChange={handleFiltersChange} />

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-lg shadow">
          <AuditLogTable logs={data?.data ?? []} isLoading={isLoading} />
        </div>
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3">
          <div className="text-sm text-slate-600">
            Hiển thị {filters.offset! + 1} -{' '}
            {Math.min(filters.offset! + ITEMS_PER_PAGE, data.total)} / {data.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1.5 text-sm font-medium rounded ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
