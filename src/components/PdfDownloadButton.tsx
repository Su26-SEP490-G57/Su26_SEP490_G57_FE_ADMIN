import { useState } from 'react'
import { api } from '../lib/api'

interface PdfDownloadButtonProps {
  // Đường dẫn API trả về file PDF (vd `/treatment-orders/patient/X/sheets/1/pdf`).
  url: string
  fileName: string
}

// Nút "Tải PDF" cho các phiếu. Tải qua axios (kèm token) rồi lưu bằng object
// URL — không mở thẳng link vì API cần header Authorization. Tên file đặt ở
// client: header Content-Disposition không đọc được khi khác origin (CORS).
export function PdfDownloadButton({ url, fileName }: PdfDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const download = async () => {
    setIsDownloading(true)
    setHasError(false)
    try {
      const response = await api.get<Blob>(url, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      link.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setHasError(true)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={isDownloading}
      title={hasError ? 'Tải PDF thất bại — bấm để thử lại' : 'Tải phiếu dạng PDF'}
      className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
        hasError
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">
        {isDownloading ? 'progress_activity' : hasError ? 'error' : 'download'}
      </span>
      {isDownloading ? 'Đang tải...' : 'Tải PDF'}
    </button>
  )
}
