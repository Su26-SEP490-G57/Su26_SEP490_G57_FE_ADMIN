import { useEffect, useState } from 'react'
import { getExternalSurgicalRecords, importPatients } from '../api/patientApi'
import type { ExternalSurgicalRecord, ImportPatientsResult } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  // Gọi sau khi import thành công để trang cha nạp lại danh sách + KPI.
  onImported: () => void
}

function formatDate(iso?: string | null) {
  if (!iso) return '--'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '--'
  return d.toLocaleDateString('vi-VN')
}

function sexLabel(sex?: string | null) {
  if (!sex) return '--'
  const s = sex.trim().toUpperCase()
  if (s === 'M') return 'Nam'
  if (s === 'F') return 'Nữ'
  return sex
}

export function ImportPatientsModal({ isOpen, onClose, onImported }: Props) {
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [records, setRecords] = useState<ExternalSurgicalRecord[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [result, setResult] = useState<ImportPatientsResult | null>(null)

  // Nạp danh sách hồ sơ từ HIS mỗi lần mở popup; reset trạng thái cũ.
  useEffect(() => {
    if (!isOpen) return
    let active = true

    setLoadError('')
    setImportError('')
    setResult(null)
    setSelected(new Set())
    setRecords([])
    setLoading(true)

    getExternalSurgicalRecords()
      .then((res) => {
        if (active) setRecords(res.data)
      })
      .catch((err) => {
        if (!active) return
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        setLoadError(msg || 'Không lấy được dữ liệu từ hệ thống HIS. Vui lòng thử lại.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen])

  if (!isOpen) return null

  const allSelected = records.length > 0 && selected.size === records.length

  function toggle(recordId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(recordId)) next.delete(recordId)
      else next.add(recordId)
      return next
    })
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === records.length ? new Set() : new Set(records.map((r) => r.recordId)),
    )
  }

  async function handleConfirm() {
    if (selected.size === 0) return
    setImporting(true)
    setImportError('')
    try {
      const chosen = records.filter((r) => selected.has(r.recordId))
      const res = await importPatients(chosen)
      setResult(res)
      // Có ít nhất 1 bản ghi được tạo -> làm mới danh sách bên trang cha.
      if (res.imported > 0) onImported()
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message
      setImportError(
        Array.isArray(msg) ? msg.join(', ') : msg || 'Có lỗi xảy ra khi import hồ sơ.',
      )
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Nhập hồ sơ bệnh nhân từ HIS</h3>
            <p className="text-xs text-slate-500">
              Chọn những bệnh nhân đã phẫu thuật phù hợp để tạo hồ sơ và bắt đầu ERAS.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" title="Đóng">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Kết quả import */}
          {result && (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Hoàn tất: <b>{result.imported}</b> hồ sơ được tạo & bắt đầu ERAS
                {result.skipped > 0 && <>, <b>{result.skipped}</b> đã tồn tại (bỏ qua)</>}
                {result.failed > 0 && <>, <b>{result.failed}</b> lỗi</>}.
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Mã HIS</th>
                      <th className="px-4 py-2">Mã bệnh nhân</th>
                      <th className="px-4 py-2">Kết quả</th>
                      <th className="px-4 py-2">ERAS</th>
                      <th className="px-4 py-2">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.results.map((r) => (
                      <tr key={r.recordId}>
                        <td className="px-4 py-2 font-medium text-slate-700">{r.recordId}</td>
                        <td className="px-4 py-2">{r.caseId ?? '--'}</td>
                        <td className="px-4 py-2">
                          <span
                            className={
                              r.status === 'imported'
                                ? 'font-semibold text-green-600'
                                : r.status === 'skipped'
                                  ? 'font-semibold text-yellow-600'
                                  : 'font-semibold text-red-600'
                            }
                          >
                            {r.status === 'imported'
                              ? 'Đã tạo'
                              : r.status === 'skipped'
                                ? 'Bỏ qua'
                                : 'Lỗi'}
                          </span>
                        </td>
                        <td className="px-4 py-2">{r.erasStarted ? '✓' : '--'}</td>
                        <td className="px-4 py-2 text-slate-500">{r.message ?? '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Danh sách hồ sơ để chọn (khi chưa có kết quả) */}
          {!result && (
            <>
              {importError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {importError}
                </div>
              )}

              {loading && (
                <div className="py-16 text-center text-sm text-slate-500">
                  Đang tải hồ sơ từ HIS...
                </div>
              )}

              {loadError && !loading && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loadError}
                </div>
              )}

              {!loading && !loadError && records.length === 0 && (
                <div className="py-16 text-center text-sm text-slate-500">
                  Không có hồ sơ phẫu thuật nào từ HIS.
                </div>
              )}

              {!loading && !loadError && records.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="w-10 px-4 py-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            aria-label="Chọn tất cả"
                          />
                        </th>
                        <th className="px-4 py-2">Mã bệnh nhân</th>
                        <th className="px-4 py-2">Tên</th>
                        <th className="px-4 py-2">Giới tính</th>
                        <th className="px-4 py-2">Ngày sinh</th>
                        <th className="px-4 py-2">Phẫu thuật</th>
                        <th className="px-4 py-2">Phương pháp</th>
                        <th className="px-4 py-2">Ngày mổ</th>
                        <th className="px-4 py-2">Phòng/Giường</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((r) => {
                        const checked = selected.has(r.recordId)
                        return (
                          <tr
                            key={r.recordId}
                            onClick={() => toggle(r.recordId)}
                            className={`cursor-pointer ${checked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                          >
                            <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(r.recordId)}
                                aria-label={`Chọn ${r.hospitalPatientCode}`}
                              />
                            </td>
                            <td className="px-4 py-2 font-medium text-slate-700">
                              {r.hospitalPatientCode}
                            </td>
                            <td className="px-4 py-2">{r.patientName}</td>
                            <td className="px-4 py-2">{sexLabel(r.sex)}</td>
                            <td className="px-4 py-2">{formatDate(r.dateOfBirth)}</td>
                            <td className="px-4 py-2">{r.procedureName}</td>
                            <td className="px-4 py-2">{r.surgicalApproach ?? '--'}</td>
                            <td className="px-4 py-2">{formatDate(r.operatedAt)}</td>
                            <td className="px-4 py-2">
                              {[r.wardCode, r.bedNumber].filter(Boolean).join(' ') || '--'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          {result ? (
            <>
              <span className="text-sm text-slate-500">Đã xử lý {result.total} hồ sơ.</span>
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Đóng
              </button>
            </>
          ) : (
            <>
              <span className="text-sm text-slate-500">
                Đã chọn <b>{selected.size}</b> / {records.length} hồ sơ
              </span>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={importing}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                >
                  Huỷ
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selected.size === 0 || importing}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importing ? 'Đang nhập...' : `Nhập & bắt đầu ERAS (${selected.size})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
