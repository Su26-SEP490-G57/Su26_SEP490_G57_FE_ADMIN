import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { Toast } from '../../../components/Toast'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import {
  createOperationType,
  createDietLevelProtocol,
  deleteOperationType,
  getOperationTypes,
  updateOperationType,
} from '../api/dietGuidanceApi'
import type { OperationTypeResponseDto } from '../types'

export function ProtocolsPage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [protocols, setProtocols] = useState<OperationTypeResponseDto[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState<OperationTypeResponseDto | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dietLevelCount: 0,
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

  function handleAddNew() {
    setEditingProtocol(null)
    setIsModalOpen(true)
    setFormData({ name: '', description: '', dietLevelCount: 0 })
  }

  function handleEditProtocol(protocol: OperationTypeResponseDto) {
    setEditingProtocol(protocol)
    setIsModalOpen(true)
    setFormData({
      name: protocol.name,
      description: protocol.description || '',
      dietLevelCount: 0, // Can't modify diet level count in edit mode
    })
  }

  function handleDeleteProtocol(protocol: OperationTypeResponseDto) {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận xóa loại phẫu thuật',
      message: `Bạn có chắc chắn muốn xóa loại phẫu thuật "${protocol.name}"? Tất cả ${protocol.dietLevelCount} mức ăn sẽ bị xóa theo.`,
      onConfirm: () => executeDeleteProtocol(protocol),
    })
  }

  async function executeDeleteProtocol(protocol: OperationTypeResponseDto) {
    try {
      await deleteOperationType(protocol.id)
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

    if (formData.dietLevelCount < 0) {
      showToast('Số lượng mức ăn không được âm', 'error')
      return
    }

    try {
      if (editingProtocol) {
        // Update existing protocol
        await updateOperationType(editingProtocol.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        })
        showToast('Đã cập nhật loại phẫu thuật', 'success')
      } else {
        // Create new protocol
        const newOperationType = await createOperationType({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        })

        // Create diet levels only if dietLevelCount > 0
        // NOTE: dietLevel trùng với label số (Mức 1 = dietLevel: 1, v.v.)
        if (formData.dietLevelCount > 0) {
          const dietLevelPromises = []
          for (let i = 1; i <= formData.dietLevelCount; i++) {
            dietLevelPromises.push(
              createDietLevelProtocol(newOperationType.id, {
                label: `Mức ${i}`,
                dietLevel: i,
                mealsPerDayMin: 0,
                mealsPerDayMax: 0,
                volumePerMealMin: 0,
                volumePerMealMax: 0,
                recommendedFoods: [],
                recommendedDrinks: [],
              }),
            )
          }
          await Promise.all(dietLevelPromises)
        }

        const message =
          formData.dietLevelCount > 0
            ? `Đã tạo loại phẫu thuật với ${formData.dietLevelCount} mức ăn`
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-teal-400"></div>

                {/* Action buttons - show on hover (bottom) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditProtocol(protocol)
                    }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors bg-white/90 backdrop-blur-sm"
                    title="Chỉnh sửa"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProtocol(protocol)
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors bg-white/90 backdrop-blur-sm"
                    title="Xóa"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>

                <div onClick={() => handleProtocolClick(protocol)} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <span
                        className="material-symbols-outlined text-white text-2xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        medical_services
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-teal-100 text-teal-700">
                        {protocol.dietLevelCount} mức ăn
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {protocol.name}
                  </h3>

                  {protocol.description && protocol.description.trim() ? (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {protocol.description}
                    </p>
                  ) : (
                    <div className="mb-3"></div>
                  )}

                  {/* Footer with view detail link */}
                  <div className="flex items-center text-xs font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                    <span>Xem chi tiết</span>
                    <span className="material-symbols-outlined text-base ml-1">arrow_forward</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Protocol Card */}
            <div
              onClick={handleAddNew}
              className="group border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300 cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 group-hover:border-blue-500 transition-colors">
                <span className="material-symbols-outlined text-3xl text-slate-400 group-hover:text-blue-500">
                  add
                </span>
              </div>
              <span className="text-base font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                Tạo phác đồ mới
              </span>
              <p className="text-xs text-slate-400 mt-1 text-center">
                Bắt đầu thiết lập quy trình mức ăn
              </p>
            </div>
          </>
        )}
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

              {/* mức ăn Count - only show when creating new */}
              {!editingProtocol && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Số lượng mức ăn
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ví dụ: 4 (hoặc để trống nếu chưa biết)"
                    value={formData.dietLevelCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      setFormData({ ...formData, dietLevelCount: value < 0 ? 0 : value })
                    }}
                  />
                  {formData.dietLevelCount > 0 ? (
                    <p className="text-xs text-slate-500 mt-1">
                      Hệ thống sẽ tự động tạo {formData.dietLevelCount} mức ăn từ mức ăn 0 đến mức
                      ăn {formData.dietLevelCount - 1}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 mt-1">
                      Có thể thêm mức ăn sau khi tạo loại phẫu thuật
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
