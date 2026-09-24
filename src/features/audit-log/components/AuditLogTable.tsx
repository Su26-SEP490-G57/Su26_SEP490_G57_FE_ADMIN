import { format } from 'date-fns'
import type { AuditLog } from '../types'

interface AuditLogTableProps {
  logs: AuditLog[]
  isLoading: boolean
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
}

export function AuditLogTable({ logs, isLoading }: AuditLogTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Đang tải...</div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
        <p>Không có audit log nào</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              Thời gian
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              Người dùng
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              Hành động
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              Entity
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              Thay đổi
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
              IP
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
              </td>
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-slate-800">{log.userFullName}</div>
                <div className="text-xs text-slate-500">@{log.username}</div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                    ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {log.action}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-slate-800 font-mono">{log.entityType}</div>
                <div className="text-xs text-slate-500 font-mono">{log.entityId}</div>
              </td>
              <td className="px-4 py-3 max-w-md">
                {log.changes ? (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                      Xem chi tiết
                    </summary>
                    <pre className="mt-2 p-2 bg-slate-50 rounded text-slate-700 overflow-x-auto text-[10px]">
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </details>
                ) : (
                  <span className="text-slate-400 italic text-xs">Không có</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 font-mono">
                {log.ipAddress || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
