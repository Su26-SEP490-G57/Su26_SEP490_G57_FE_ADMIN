import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHasRole } from '../../auth/hooks/useRole'
import { useAcknowledgeAlert, usePendingAlerts } from '../api/alerts'
import { useAlertsRealtime } from '../hooks/useAlertsRealtime'
import type { AlertItem } from '../types'

function formatElapsed(triggeredAt: string | null): string {
  if (!triggeredAt) return ''
  const minutes = Math.max(0, Math.round((Date.now() - new Date(triggeredAt).getTime()) / 60000))
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  return `${hours} giờ ${minutes % 60} phút trước`
}

/**
 * Minimal alert center: badge + dropdown over the existing GET /alerts and
 * PATCH /alerts/:id/acknowledge endpoints. Scope deliberately kept small —
 * board colors already reflect triage state; this exists so a PENDING_REVIEW
 * alert can't be raised backend-side and never surface anywhere in the admin
 * dashboard (see recommendations-2026-09-28.md, finding #5).
 */
export function AlertBell() {
  const canSee = useHasRole('nurse', 'head_nurse', 'doctor', 'admin')
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useAlertsRealtime()
  const { data, isLoading } = usePendingAlerts()
  const acknowledge = useAcknowledgeAlert()

  if (!canSee) return null

  const alerts = data?.data ?? []
  const count = alerts.length

  function handleOpenPatient(alert: AlertItem) {
    setIsOpen(false)
    navigate(`/patients?caseId=${encodeURIComponent(alert.caseId)}`)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Cảnh báo chờ xử trí"
        className="relative flex flex-shrink-0 items-center justify-center p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="sticky top-0 border-b border-slate-100 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Cảnh báo chờ xử trí {count > 0 && `(${count})`}
            </div>

            {isLoading && <div className="p-4 text-sm text-slate-400">Đang tải...</div>}

            {!isLoading && alerts.length === 0 && (
              <div className="p-4 text-sm text-slate-400">Không có cảnh báo nào đang chờ.</div>
            )}

            {alerts.map((alert) => (
              <div
                key={alert.alertId}
                className={`border-b border-slate-100 px-3 py-2.5 text-sm ${
                  alert.isOverdue ? 'bg-red-50' : ''
                }`}
              >
                <button
                  onClick={() => handleOpenPatient(alert)}
                  className="text-left w-full mb-1.5 hover:underline"
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                      alert.alertType === 'RED' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  ></span>
                  <span className="font-semibold text-slate-800">{alert.caseId}</span>
                  {alert.isOverdue && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase text-red-600">
                      Quá hạn
                    </span>
                  )}
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {formatElapsed(alert.triggeredAt)}
                  </div>
                </button>
                <button
                  onClick={() => acknowledge.mutate(alert.alertId)}
                  disabled={acknowledge.isPending}
                  className="w-full rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  Xác nhận xử trí
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
