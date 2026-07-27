/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { Toast } from '../../../components/Toast'
import { getPatients } from '../../patients/api/patientApi'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import {
  createPodProtocol,
  deletePodProtocol,
  getOperationTypeById,
  getPodProtocols,
  updatePodProtocol,
} from '../api/dietGuidanceApi'
import type { OperationTypeResponseDto, PodProtocolResponseDto } from '../types'

export function NutritionGuidePage() {
  const navigate = useNavigate()
  const { protocolId } = useParams<{ protocolId: string }>()
  const operationTypeId = protocolId ? parseInt(protocolId) : 0

  const [loading, setLoading] = useState(true)
  const [operationType, setOperationType] = useState<OperationTypeResponseDto | null>(null)
  const [podProtocols, setPodProtocols] = useState<PodProtocolResponseDto[]>([])
  const [selectedPodId, setSelectedPodId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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

  // Toast notification state
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

  // Get current POD config
  const currentPod = podProtocols.find((p) => p.podId === selectedPodId)

  // State for editing
  const [mealCountMin, setMealCountMin] = useState<number>(0)
  const [mealCountMax, setMealCountMax] = useState<number>(0)
  const [mealDetails, setMealDetails] = useState('')
  const [volumeMin, setVolumeMin] = useState<number>(0)
  const [volumeMax, setVolumeMax] = useState<number>(0)
  const [foods, setFoods] = useState<string[]>([])
  const [drinks, setDrinks] = useState<string[]>([])

  // Track original values to detect changes
  const [originalValues, setOriginalValues] = useState({
    mealCountMin: 0,
    mealCountMax: 0,
    mealDetails: '',
    volumeMin: 0,
    volumeMax: 0,
    foods: [] as string[],
    drinks: [] as string[],
  })

  // Check if there are any changes
  const hasChanges = useMemo(() => {
    return (
      mealCountMin !== originalValues.mealCountMin ||
      mealCountMax !== originalValues.mealCountMax ||
      mealDetails !== originalValues.mealDetails ||
      volumeMin !== originalValues.volumeMin ||
      volumeMax !== originalValues.volumeMax ||
      JSON.stringify(foods) !== JSON.stringify(originalValues.foods) ||
      JSON.stringify(drinks) !== JSON.stringify(originalValues.drinks)
    )
  }, [mealCountMin, mealCountMax, mealDetails, volumeMin, volumeMax, foods, drinks, originalValues])

  // Fetch operation type and POD protocols from API
  useEffect(() => {
    async function loadData() {
      if (!operationTypeId) return

      try {
        setLoading(true)
        const [opType, pods] = await Promise.all([
          getOperationTypeById(operationTypeId),
          getPodProtocols(operationTypeId),
        ])
        setOperationType(opType)

        // Sort PODs by podId to ensure correct order
        const sortedPods = [...pods].sort((a, b) => a.podId - b.podId)
        setPodProtocols(sortedPods)

        // Select first POD by default
        if (sortedPods.length > 0) {
          setSelectedPodId(sortedPods[0].podId)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        alert('Không thể tải dữ liệu. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [operationTypeId])

  // Update form state when selected POD changes

  useEffect(() => {
    const pod = podProtocols.find((p) => p.podId === selectedPodId)
    if (pod) {
      const newValues = {
        mealCountMin: pod.mealsPerDayMin || 0,
        mealCountMax: pod.mealsPerDayMax || 0,
        mealDetails: pod.mealInstruction || '',
        volumeMin: pod.volumePerMealMin || 0,
        volumeMax: pod.volumePerMealMax || 0,
        foods: pod.recommendedFoods || [],
        drinks: pod.recommendedDrinks || [],
      }

      setMealCountMin(newValues.mealCountMin)
      setMealCountMax(newValues.mealCountMax)
      setMealDetails(newValues.mealDetails)
      setVolumeMin(newValues.volumeMin)
      setVolumeMax(newValues.volumeMax)
      setFoods(newValues.foods)
      setDrinks(newValues.drinks)
      setOriginalValues(newValues)
    }
  }, [selectedPodId, podProtocols])

  function handleAddFood() {
    const name = prompt('Nhập tên món ăn:')
    if (name?.trim()) {
      setFoods([...foods, name.trim()])
    }
  }

  function handleAddDrink() {
    const name = prompt('Nhập tên đồ uống:')
    if (name?.trim()) {
      setDrinks([...drinks, name.trim()])
    }
  }

  function handleRemoveFood(index: number) {
    setFoods(foods.filter((_, i) => i !== index))
  }

  function handleRemoveDrink(index: number) {
    setDrinks(drinks.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!currentPod || !operationTypeId) return

    try {
      await updatePodProtocol(operationTypeId, currentPod.podId, {
        label: currentPod.label,
        mealsPerDayMin: mealCountMin,
        mealsPerDayMax: mealCountMax,
        mealInstruction: mealDetails || undefined,
        volumePerMealMin: volumeMin,
        volumePerMealMax: volumeMax,
        recommendedFoods: foods,
        recommendedDrinks: drinks,
      })

      showToast(`Đã lưu cấu hình ${currentPod.label}`, 'success')

      // Reload data and sort by podId
      const pods = await getPodProtocols(operationTypeId)
      const sortedPods = [...pods].sort((a, b) => a.podId - b.podId)
      setPodProtocols(sortedPods)

      // Update original values after successful save
      setOriginalValues({
        mealCountMin,
        mealCountMax,
        mealDetails,
        volumeMin,
        volumeMax,
        foods: [...foods],
        drinks: [...drinks],
      })
    } catch (error) {
      console.error('Error saving POD protocol:', error)
      showToast('Không thể lưu. Vui lòng thử lại.', 'error')
    }
  }

  function handleCancel() {
    // Reset to original values
    setMealCountMin(originalValues.mealCountMin)
    setMealCountMax(originalValues.mealCountMax)
    setMealDetails(originalValues.mealDetails)
    setVolumeMin(originalValues.volumeMin)
    setVolumeMax(originalValues.volumeMax)
    setFoods(originalValues.foods)
    setDrinks(originalValues.drinks)
  }

  async function handleAddPOD() {
    if (!operationTypeId) return

    // Tự động tạo label POD tiếp theo
    const nextPodNumber = podProtocols.length
    const newLabel = `POD ${nextPodNumber}`

    try {
      await createPodProtocol(operationTypeId, {
        label: newLabel,
        mealsPerDayMin: 0,
        mealsPerDayMax: 0,
        mealInstruction: '',
        volumePerMealMin: 0,
        volumePerMealMax: 0,
        recommendedFoods: [],
        recommendedDrinks: [],
      })

      showToast(`Đã thêm ${newLabel}`, 'success')

      // Reload data and sort by podId
      const pods = await getPodProtocols(operationTypeId)
      const sortedPods = [...pods].sort((a, b) => a.podId - b.podId)
      setPodProtocols(sortedPods)

      // Select the newly created POD (should be last after sorting)
      if (sortedPods.length > 0) {
        setSelectedPodId(sortedPods[sortedPods.length - 1].podId)
      }
    } catch (error) {
      console.error('Error creating POD:', error)
      showToast('Không thể thêm POD. Vui lòng thử lại.', 'error')
    }
  }

  async function handleDeletePOD(podId: number) {
    if (!operationTypeId) return

    const pod = podProtocols.find((p) => p.podId === podId)
    if (!pod) return

    const podNumber = Number(pod.label.match(/\d+/)?.[0])
    if (!Number.isInteger(podNumber)) {
      showToast(`Không xác định được số POD của "${pod.label}".`, 'error')
      return
    }

    try {
      const response = await getPatients({ operationTypeId, limit: 9999 })
      const patientCount = response.data.filter(
        (patient) => patient.currentPod === podNumber && !patient.erasCompleted,
      ).length

      if (patientCount > 0) {
        showToast(
          `Không thể xóa ${pod.label}: hiện có ${patientCount} người bệnh đang ở POD này.`,
          'warning',
        )
        return
      }
    } catch (error) {
      console.error('Error checking patients for POD deletion:', error)
      showToast('Không thể kiểm tra người bệnh đang ở POD. Vui lòng thử lại.', 'error')
      return
    }

    // Check if POD has any meaningful content (beyond default values of 0)
    const hasContent =
      (pod.mealsPerDayMin && pod.mealsPerDayMin > 0) ||
      (pod.mealsPerDayMax && pod.mealsPerDayMax > 0) ||
      (pod.mealInstruction && pod.mealInstruction.trim().length > 0) ||
      (pod.volumePerMealMin && pod.volumePerMealMin > 0) ||
      (pod.volumePerMealMax && pod.volumePerMealMax > 0) ||
      (pod.volumeInstruction && pod.volumeInstruction.trim().length > 0) ||
      (pod.recommendedFoods && pod.recommendedFoods.length > 0) ||
      (pod.recommendedDrinks && pod.recommendedDrinks.length > 0)

    // Only show confirm if POD has content
    if (hasContent) {
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận xóa POD',
        message: `"${pod.label}" có dữ liệu. Bạn có chắc chắn muốn xóa?`,
        onConfirm: () => executeDeletePOD(podId),
      })
      return
    }

    // Delete directly if no content
    await executeDeletePOD(podId)
  }

  async function executeDeletePOD(podId: number) {
    if (!operationTypeId) return

    const pod = podProtocols.find((p) => p.podId === podId)
    if (!pod) return

    try {
      await deletePodProtocol(operationTypeId, podId)
      showToast(`Đã xóa ${pod.label}`, 'success')

      // Reload data and sort by podId
      const pods = await getPodProtocols(operationTypeId)
      const sortedPods = [...pods].sort((a, b) => a.podId - b.podId)
      setPodProtocols(sortedPods)

      // Select first POD if current one was deleted
      if (selectedPodId === podId && sortedPods.length > 0) {
        setSelectedPodId(sortedPods[0].podId)
      }

      setConfirmModal({ ...confirmModal, isOpen: false })
    } catch (error) {
      console.error('Error deleting POD:', error)
      showToast('Không thể xóa POD. Vui lòng thử lại.', 'error')
      setConfirmModal({ ...confirmModal, isOpen: false })
    }
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
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500"
            placeholder="Tìm kiếm phẫu thuật..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </>
    ),
    [searchQuery],
  )

  useHeaderActions(headerActions)

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Đang tải...</p>
        </div>
      ) : (
        <>
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-slate-500 mb-4 text-sm">
            <button onClick={() => navigate(-1)} className="hover:text-blue-600 transition-colors">
              Các loại phẫu thuật
            </button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-800 font-medium">{operationType?.name || 'Chi tiết'}</span>
          </nav>

          {/* Page Title */}
          <div className="flex flex-col gap-6 mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              {operationType?.name || 'Chi tiết loại phẫu thuật'}
            </h1>

            {/* POD Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
              {podProtocols.map((pod) => (
                <div
                  key={pod.podId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedPodId(pod.podId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedPodId(pod.podId)
                    }
                  }}
                  className={`flex items-center gap-2 px-8 py-2 rounded-lg font-semibold transition-all ${
                    selectedPodId === pod.podId
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{pod.label}</span>
                  {selectedPodId === pod.podId && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeletePOD(pod.podId)
                      }}
                      className="ml-1 hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                      title="Xóa POD"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={handleAddPOD}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all ml-4"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left: General Guidance */}
            <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-full">
              <div className="flex items-center gap-2 mb-6">
                <span
                  className="material-symbols-outlined text-blue-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  description
                </span>
                <h3 className="text-xl font-bold text-slate-800">Hướng dẫn chung</h3>
              </div>

              <div className="space-y-8">
                {/* Meal Count */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Số lượng bữa ăn
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-20 text-center px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      type="number"
                      value={mealCountMin}
                      onChange={(e) => setMealCountMin(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      className="w-20 text-center px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      type="number"
                      value={mealCountMax}
                      onChange={(e) => setMealCountMax(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-slate-600">bữa/ngày</span>
                  </div>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Chi tiết cho số lượng bữa ăn
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Nhập hướng dẫn chi tiết về lịch trình ăn uống..."
                    rows={6}
                    value={mealDetails}
                    onChange={(e) => setMealDetails(e.target.value)}
                  />
                </div>

                {/* Volume */}
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">
                    Thể tích mỗi bữa
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      className="w-24 text-center px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      type="number"
                      value={volumeMin}
                      onChange={(e) => setVolumeMin(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-slate-400">—</span>
                    <input
                      className="w-24 text-center px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      type="number"
                      value={volumeMax}
                      onChange={(e) => setVolumeMax(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-slate-600">ml</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Food & Drink Suggestions */}
            <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-full">
              <div className="flex items-center gap-2 mb-6">
                <span
                  className="material-symbols-outlined text-teal-600"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  restaurant
                </span>
                <h3 className="text-xl font-bold text-slate-800">Thực phẩm gợi ý</h3>
              </div>

              <div className="space-y-8">
                {/* Recommended Food */}
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block font-semibold text-slate-800 mb-4 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Món ăn khuyên dùng
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {foods.map((food, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-sm font-medium border border-blue-200"
                      >
                        <span>{food}</span>
                        <button
                          onClick={() => handleRemoveFood(index)}
                          className="material-symbols-outlined text-sm opacity-60 hover:opacity-100 cursor-pointer"
                        >
                          close
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddFood}
                      className="flex items-center gap-1 px-4 py-1 rounded-full border border-dashed border-blue-600 text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Thêm món
                    </button>
                  </div>
                </div>

                {/* Recommended Drinks */}
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="block font-semibold text-slate-800 mb-4 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-blue-600">
                      local_drink
                    </span>
                    Thức uống khuyên dùng
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {drinks.map((drink, index) => (
                      <div
                        key={index}
                        className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-sm font-medium border border-blue-200"
                      >
                        <span>{drink}</span>
                        <button
                          onClick={() => handleRemoveDrink(index)}
                          className="material-symbols-outlined text-sm opacity-60 hover:opacity-100 cursor-pointer"
                        >
                          close
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddDrink}
                      className="flex items-center gap-1 px-4 py-1 rounded-full border border-dashed border-blue-600 text-blue-600 hover:bg-blue-50 transition-all text-sm font-medium"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Thêm đồ uống
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions - Only show when there are changes */}
          {hasChanges && (
            <div className="mt-8 flex items-center justify-center gap-6 border-t border-slate-200 pt-8">
              <button
                onClick={handleCancel}
                className="px-8 py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 transition-all"
              >
                Hủy thay đổi
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Lưu cấu hình
              </button>
            </div>
          )}
        </>
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

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  )
}
