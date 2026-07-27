import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { Toast } from '../../../components/Toast'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import {
  createOperationType,
  createPodProtocol,
  deleteOperationType,
  getOperationTypes,
  updateOperationType,
} from '../api/dietGuidanceApi'
import type { OperationTypeResponseDto } from '../types'

const COMPLIANCE_DATA = [
  { label: 'Đại trực tràng', value: 60 },
  { label: 'Dạ dày', value: 85 },
  { label: 'Gan mật', value: 45 },
  { label: 'Tuyến giáp', value: 95 },
  { label: 'Lồng ngực', value: 70 },
]

const RECENT_UPDATES = [
  {
    text: 'Cập nhật chỉ số POD 3 cho Đại trực tràng',
    username: 'Nguyễn Thị Hoa',
    time: '2 giờ trước',
    color: 'bg-blue-500',
  },
  {
    text: 'Phê duyệt bản nháp Tuyến giáp',
    username: 'Trần Văn Nam',
    time: 'Hôm qua',
    color: 'bg-teal-500',
  },
  {
    text: 'Khôi phục phác đồ Dạ dày v2.1',
    username: 'Lê Minh Anh',
    time: '3 ngày trước',
    color: 'bg-orange-500',
  },
]

const SYSTEM_UPDATES_STORAGE_KEY = 'protocol-system-update-history'

type SystemUpdate = {
  id: string
  text: string
  createdAt: string
  color: string
}

function loadSystemUpdates(): SystemUpdate[] {
  try {
    const stored = window.localStorage.getItem(SYSTEM_UPDATES_STORAGE_KEY)
    const updates = stored ? (JSON.parse(stored) as unknown) : []
    return Array.isArray(updates)
      ? updates.filter(
          (update): update is SystemUpdate =>
            typeof update === 'object' &&
            update !== null &&
            typeof update.id === 'string' &&
            typeof update.text === 'string' &&
            typeof update.createdAt === 'string' &&
            typeof update.color === 'string',
        )
      : []
  } catch {
    return []
  }
}

function formatUpdateTime(createdAt: string): string {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.max(0, Math.floor(elapsed / 60_000))
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export function ProtocolsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [protocols, setProtocols] = useState<OperationTypeResponseDto[]>([])
  const [loading, setLoading] = useState(true)
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>(loadSystemUpdates)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState<OperationTypeResponseDto | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    podCount: 0,
  })

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info' | 'warning'
  }>({
    show: false,
    message: '',
    type: 'success',
  })

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
  ) => {
    setToast({ show: true, message, type })
  }

  function addSystemUpdate(text: string, color: string) {
    const update: SystemUpdate = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
      color,
    }
    setSystemUpdates((current) => {
      const next = [update, ...current].slice(0, 100)
      try {
        window.localStorage.setItem(SYSTEM_UPDATES_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Keep the update for this session if browser storage is unavailable.
      }
      return next
    })
  }

  // Fetch operation types from API
  useEffect(() => {
    async function loadOperationTypes() {
      try {
        setLoading(true)
        const data = await getOperationTypes()
        console.log('Operation types response:', data)
        setProtocols(data)
      } catch (error) {
        console.error('Error loading operation types:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOperationTypes()
  }, [])

  const filteredProtocols = protocols.filter((protocol) =>
    protocol.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  const recentUpdates =
    systemUpdates.length > 0
      ? systemUpdates.slice(0, 3).map((update) => ({
          text: update.text,
          username: 'Phiên làm việc này',
          time: formatUpdateTime(update.createdAt),
          color: update.color,
        }))
      : RECENT_UPDATES

  function handleAddNew() {
    setEditingProtocol(null)
    setIsModalOpen(true)
    setFormData({ name: '', description: '', podCount: 0 })
  }

  function handleEditProtocol(protocol: OperationTypeResponseDto) {
    setEditingProtocol(protocol)
    setIsModalOpen(true)
    setFormData({
      name: protocol.name,
      description: protocol.description || '',
      podCount: 0, // Can't modify POD count in edit mode
    })
  }

  function handleDeleteProtocol(protocol: OperationTypeResponseDto) {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa loại phẫu thuật',
      message: `Bạn có chắc chắn muốn xóa loại phẫu thuật "${protocol.name}"? Tất cả ${protocol.podCount} POD sẽ bị xóa theo.`,
      onConfirm: () => executeDeleteProtocol(protocol),
    })
  }

  async function executeDeleteProtocol(protocol: OperationTypeResponseDto) {
    try {
      await deleteOperationType(protocol.id)
      addSystemUpdate(`Đã xóa loại phẫu thuật “${protocol.name}”`, 'bg-red-500')
      showToast('Đã xóa loại phẫu thuật', 'success')
      setConfirmModal({ ...confirmModal, isOpen: false })

      // Reload protocols
      const data = await getOperationTypes()
      setProtocols(data)
    } catch (error) {
      console.error('Error deleting operation type:', error)
      showToast('Không thể xóa loại phẫu thuật. Vui lòng thử lại.', 'error')
      setConfirmModal({ ...confirmModal, isOpen: false })
    }
  }

  async function handleSaveNewProtocol() {
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên loại phẫu thuật', 'error')
      return
    }

    if (formData.podCount < 0) {
      showToast('Số lượng POD không được âm', 'error')
      return
    }

    try {
      if (editingProtocol) {
        // Update existing protocol
        await updateOperationType(editingProtocol.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        })
        addSystemUpdate(`Đã cập nhật loại phẫu thuật “${formData.name.trim()}”`, 'bg-blue-500')
        showToast('Đã cập nhật loại phẫu thuật', 'success')
      } else {
        // Create new protocol
        const newOperationType = await createOperationType({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        })

        // Create PODs only if podCount > 0
        if (formData.podCount > 0) {
          const podPromises = []
          for (let i = 0; i < formData.podCount; i++) {
            podPromises.push(
              createPodProtocol(newOperationType.id, {
                label: `POD ${i}`,
                mealsPerDayMin: 0,
                mealsPerDayMax: 0,
                volumePerMealMin: 0,
                volumePerMealMax: 0,
                recommendedFoods: [],
                recommendedDrinks: [],
              }),
            )
          }
          await Promise.all(podPromises)
        }

        addSystemUpdate(`Đã tạo loại phẫu thuật “${formData.name.trim()}”`, 'bg-teal-500')
        const message =
          formData.podCount > 0
            ? `Đã tạo loại phẫu thuật với ${formData.podCount} POD`
            : 'Đã tạo loại phẫu thuật'
        showToast(message, 'success')
      }

      setIsModalOpen(false)
      setEditingProtocol(null)

      // Reload protocols
      const data = await getOperationTypes()
      setProtocols(data)
    } catch (error) {
      console.error('Error saving operation type:', error)
      showToast('Không thể lưu loại phẫu thuật. Vui lòng thử lại.', 'error')
    }
  }

  function handleProtocolClick(protocol: OperationTypeResponseDto) {
    navigate(`/protocols/${protocol.id}/nutrition`)
  }

  // Inject header actions
  const headerActions = useMemo(
    () => (
      <>
        <div className="relative w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-full text-sm focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Tìm kiếm loại phẫu thuật..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          Thêm loại phẫu thuật
        </button>
      </>
    ),
    [searchQuery],
  )

  useHeaderActions(headerActions)

  return (
    <div className="p-8 space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 mb-1">Quản lý Loại phẫu thuật</h2>
          <p className="text-sm text-slate-500">
            Hệ thống ERAS: Tối ưu hóa chăm sóc và phục hồi sau phẫu thuật
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-100 px-4 py-2 rounded-lg flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tổng số phác đồ:
            </span>
            <span className="text-lg font-bold text-blue-600">{protocols.length}</span>
          </div>
        </div>
      </div>

      {/* Bento Grid of Surgery Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex items-center justify-center py-12">
            <p className="text-slate-400">Đang tải...</p>
          </div>
        ) : filteredProtocols.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-12 text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2">search_off</span>
            <p>Không tìm thấy loại phẫu thuật nào</p>
          </div>
        ) : (
          <>
            {filteredProtocols.map((protocol) => (
              <div
                key={protocol.id}
                className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 active:scale-[0.98]"
              >
                {/* Action buttons - show on hover */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditProtocol(protocol)
                    }}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProtocol(protocol)
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>

                <div onClick={() => handleProtocolClick(protocol)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-3xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        medical_services
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-teal-100 text-teal-700">
                      {protocol.podCount} POD
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {protocol.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {protocol.description || 'Chưa có mô tả'}
                  </p>
                </div>
              </div>
            ))}

            {/* Add Protocol Card */}
            <div
              onClick={handleAddNew}
              className="group border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-8 hover:border-blue-600 hover:bg-blue-50/50 transition-all duration-300 cursor-pointer text-slate-400 hover:text-blue-600 active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 group-hover:border-blue-600">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <span className="text-lg font-bold">Tạo phác đồ mới</span>
              <p className="text-sm opacity-60 mt-1 text-center">
                Bắt đầu thiết lập quy trình POD cho loại phẫu thuật khác.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Performance Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-800">Thống kê tuân thủ ERAS</h4>
              <p className="text-sm text-slate-500">
                Dữ liệu tổng hợp từ các phác đồ đang hoạt động
              </p>
            </div>
            <button className="text-blue-600 text-xs font-bold uppercase tracking-wide hover:underline">
              Chi tiết
            </button>
          </div>

          <div className="h-48 flex items-end justify-between gap-4 px-4">
            {COMPLIANCE_DATA.map((item, index) => (
              <div key={index} className="w-full relative flex flex-col items-center">
                <div
                  className="w-full bg-blue-100 rounded-t-lg transition-all duration-500 hover:bg-blue-200"
                  style={{ height: `${item.value}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-sm font-bold text-blue-600">
                    {item.value}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-2 px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            {COMPLIANCE_DATA.map((item, index) => (
              <span key={index} className="text-center">
                {item.label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h4 className="text-lg font-bold text-slate-800 mb-4">Cập nhật hệ thống</h4>
            <div className="space-y-4">
              {recentUpdates.map((update, index) => (
                <div key={index} className="flex gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${update.color} mt-2 shrink-0`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 mb-1">{update.text}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-medium">{update.username}</span>
                      <span>•</span>
                      <span className="uppercase tracking-wide">{update.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-full mt-6 py-2 bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wide rounded-lg hover:bg-slate-200 transition-colors"
          >
            Xem tất cả lịch sử
          </button>
        </div>
      </div>

      {/* Add/Edit Protocol Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">
              {editingProtocol ? 'Chỉnh sửa loại phẫu thuật' : 'Thêm loại phẫu thuật mới'}
            </h3>

            <div className="space-y-6">
              {/* Operation Type Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tên loại phẫu thuật <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ví dụ: Phẫu thuật dạ dày"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả</label>
                <textarea
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Mô tả chi tiết về loại phẫu thuật này..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* POD Count - only show when creating new */}
              {!editingProtocol && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Số lượng POD
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ví dụ: 4 (hoặc để trống nếu chưa biết)"
                    value={formData.podCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      setFormData({ ...formData, podCount: value < 0 ? 0 : value })
                    }}
                  />
                  {formData.podCount > 0 ? (
                    <p className="text-xs text-slate-500 mt-1">
                      Hệ thống sẽ tự động tạo {formData.podCount} POD từ POD 0 đến POD{' '}
                      {formData.podCount - 1}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">
                      Có thể thêm POD sau khi tạo loại phẫu thuật
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-4 mt-8">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNewProtocol}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
              >
                {editingProtocol ? 'Cập nhật' : 'Tạo loại phẫu thuật'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="system-history-title"
        >
          <div className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 id="system-history-title" className="text-xl font-bold text-slate-800">
                Lịch sử cập nhật
              </h3>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng lịch sử cập nhật"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
              {systemUpdates.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Chưa có cập nhật nào được lưu trên trình duyệt này.
                </p>
              ) : (
                systemUpdates.map((update) => (
                  <div key={update.id} className="flex gap-3">
                    <div className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${update.color}`} />
                    <div>
                      <p className="text-sm text-slate-800">{update.text}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(update.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  )
}
