/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHasRole } from '../../auth/hooks/useRole'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { Toast } from '../../../components/Toast'
import { useHeaderActions } from '../../../layouts/main-layout/HeaderContext'
import { getPatients } from '../../patients/api/patientApi'
import {
  createDietLevelProtocol,
  deleteDietLevelProtocol,
  getDietLevelProtocols,
  getOperationTypeById,
  updateDietLevelProtocol,
} from '../api/dietGuidanceApi'
import type { DietLevelProtocolResponseDto, OperationTypeResponseDto } from '../types'
import { PersonalizedDietTab } from './PersonalizedDietTab'

export function NutritionGuidePage() {
  const navigate = useNavigate()
  const { protocolId } = useParams<{ protocolId: string }>()
  const operationTypeId = protocolId ? parseInt(protocolId) : 0
  const isDoctor = useHasRole('doctor')

  const [loading, setLoading] = useState(true)
  const [operationType, setOperationType] = useState<OperationTypeResponseDto | null>(null)
  const [dietLevelProtocols, setDietLevelProtocols] = useState<DietLevelProtocolResponseDto[]>([])
  const [selectedDietLevelId, setSelectedDietLevelId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mainTab, setMainTab] = useState<'standard' | 'personalized'>('standard')

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

  // Get current diet level protocol config
  const currentDietLevel = dietLevelProtocols.find((p) => p.dietLevelId === selectedDietLevelId)

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
        const [opType, protocols] = await Promise.all([
          getOperationTypeById(operationTypeId),
          getDietLevelProtocols(operationTypeId),
        ])
        setOperationType(opType)

        // Sort diet level protocols by podId to ensure correct order
        const sortedProtocols = [...protocols].sort((a, b) => a.dietLevelId - b.dietLevelId)
        setDietLevelProtocols(sortedProtocols)

        // Select first diet level by default
        if (sortedProtocols.length > 0) {
          setSelectedDietLevelId(sortedProtocols[0].dietLevelId)
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
    const protocol = dietLevelProtocols.find((p) => p.dietLevelId === selectedDietLevelId)
    if (protocol) {
      const newValues = {
        mealCountMin: protocol.mealsPerDayMin || 0,
        mealCountMax: protocol.mealsPerDayMax || 0,
        mealDetails: protocol.mealInstruction || '',
        volumeMin: protocol.volumePerMealMin || 0,
        volumeMax: protocol.volumePerMealMax || 0,
        foods: protocol.recommendedFoods || [],
        drinks: protocol.recommendedDrinks || [],
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
  }, [selectedDietLevelId, dietLevelProtocols])

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
    if (!currentDietLevel || !operationTypeId) return

    try {
      await updateDietLevelProtocol(operationTypeId, currentDietLevel.dietLevelId, {
        label: currentDietLevel.label,
        mealsPerDayMin: mealCountMin,
        mealsPerDayMax: mealCountMax,
        mealInstruction: mealDetails || undefined,
        volumePerMealMin: volumeMin,
        volumePerMealMax: volumeMax,
        recommendedFoods: foods,
        recommendedDrinks: drinks,
      })

      showToast(`Đã lưu cấu hình ${currentDietLevel.label}`, 'success')

      // Reload data and sort by podId
      const protocols = await getDietLevelProtocols(operationTypeId)
      const sortedProtocols = [...protocols].sort((a, b) => a.dietLevelId - b.dietLevelId)
      setDietLevelProtocols(sortedProtocols)

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
      console.error('Error saving diet level protocol:', error)
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

  async function handleAddDietLevel() {
    if (!operationTypeId) return

    // Tính nextDietLevel = max(dietLevel) + 1 để tránh duplicate khi có protocol bị xóa
    const maxDietLevel =
      dietLevelProtocols.length > 0 ? Math.max(...dietLevelProtocols.map((p) => p.dietLevel)) : 0
    const nextDietLevel = maxDietLevel + 1
    const newLabel = `Mức ${nextDietLevel}`

    try {
      await createDietLevelProtocol(operationTypeId, {
        label: newLabel,
        dietLevel: nextDietLevel,
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
      const protocols = await getDietLevelProtocols(operationTypeId)
      const sortedProtocols = [...protocols].sort((a, b) => a.dietLevelId - b.dietLevelId)
      setDietLevelProtocols(sortedProtocols)

      // Select the newly created diet level (should be last after sorting)
      if (sortedProtocols.length > 0) {
        setSelectedDietLevelId(sortedProtocols[sortedProtocols.length - 1].dietLevelId)
      }
    } catch (error) {
      console.error('Error creating diet level:', error)
      showToast('Không thể thêm mức ăn. Vui lòng thử lại.', 'error')
    }
  }

  async function handleDeleteDietLevel(dietLevelIdToDelete: number) {
    if (!operationTypeId) return

    const protocol = dietLevelProtocols.find((p) => p.dietLevelId === dietLevelIdToDelete)
    if (!protocol) return

    const dietLevelNumber = protocol.dietLevel ?? 0

    try {
      const response = await getPatients({ operationTypeId, limit: 9999 })
      const patientCount = response.data.filter(
        (patient) => (patient.currentDietLevel ?? 0) === dietLevelNumber,
      ).length

      if (patientCount > 0) {
        showToast(
          `Không thể xóa ${protocol.label}: hiện có ${patientCount} người bệnh đang ở mức ăn này.`,
          'warning',
        )
        return
      }
    } catch (error) {
      console.error('Error checking patients for diet level deletion:', error)
      showToast('Không thể kiểm tra người bệnh đang ở mức ăn. Vui lòng thử lại.', 'error')
      return
    }

    // Check if diet level has any meaningful content (beyond default values of 0)
    const hasContent =
      (protocol.mealsPerDayMin && protocol.mealsPerDayMin > 0) ||
      (protocol.mealsPerDayMax && protocol.mealsPerDayMax > 0) ||
      (protocol.mealInstruction && protocol.mealInstruction.trim().length > 0) ||
      (protocol.volumePerMealMin && protocol.volumePerMealMin > 0) ||
      (protocol.volumePerMealMax && protocol.volumePerMealMax > 0) ||
      (protocol.volumeInstruction && protocol.volumeInstruction.trim().length > 0) ||
      (protocol.recommendedFoods && protocol.recommendedFoods.length > 0) ||
      (protocol.recommendedDrinks && protocol.recommendedDrinks.length > 0)

    // Only show confirm if diet level has content
    if (hasContent) {
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận xóa mức ăn',
        message: `"${protocol.label}" có dữ liệu. Bạn có chắc chắn muốn xóa?`,
        onConfirm: () => executeDeleteDietLevel(dietLevelIdToDelete),
      })
      return
    }

    // Delete directly if no content
    await executeDeleteDietLevel(dietLevelIdToDelete)
  }

  async function executeDeleteDietLevel(dietLevelIdToDelete: number) {
    if (!operationTypeId) return

    const protocol = dietLevelProtocols.find((p) => p.dietLevelId === dietLevelIdToDelete)
    if (!protocol) return

    try {
      await deleteDietLevelProtocol(operationTypeId, dietLevelIdToDelete)
      showToast(`Đã xóa ${protocol.label}`, 'success')

      // Reload data and sort by dietLevelId
      const protocols = await getDietLevelProtocols(operationTypeId)
      const sortedProtocols = [...protocols].sort((a, b) => a.dietLevelId - b.dietLevelId)
      setDietLevelProtocols(sortedProtocols)

      // Select first diet level if current one was deleted
      if (selectedDietLevelId === dietLevelIdToDelete && sortedProtocols.length > 0) {
        setSelectedDietLevelId(sortedProtocols[0].dietLevelId)
      }

      setConfirmModal({ ...confirmModal, isOpen: false })
    } catch (error) {
      console.error('Error deleting diet level:', error)
      showToast('Không thể xóa mức ăn. Vui lòng thử lại.', 'error')
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

            {/* Tab Chuyển đổi Hướng dẫn chung / Cá nhân hóa */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setMainTab('standard')}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  mainTab === 'standard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span className="material-symbols-outlined text-base">menu_book</span>
                Hướng dẫn ăn chung
              </button>
              {isDoctor && (
                <button
                  type="button"
                  onClick={() => setMainTab('personalized')}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                    mainTab === 'personalized'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">person_pin</span>
                  Hướng dẫn ăn cá nhân hóa
                </button>
              )}
            </div>

            {mainTab === 'standard' && (
              /* Mức ăn tabs */
              <div className="relative">
                <div
                  className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {dietLevelProtocols.map((pod) => (
                    <div
                      key={pod.dietLevelId}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDietLevelId(pod.dietLevelId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setSelectedDietLevelId(pod.dietLevelId)
                        }
                      }}
                      className={`flex items-center gap-2 px-8 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                        selectedDietLevelId === pod.dietLevelId
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{pod.label}</span>
                      {selectedDietLevelId === pod.dietLevelId && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDeleteDietLevel(pod.dietLevelId)
                          }}
                          className="ml-1 hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                          title="Xóa mức ăn"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddDietLevel}
                    className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all flex-shrink-0 ml-2"
                    title=" thêm mức ăn"
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-slate-100 to-transparent pointer-events-none"></div>
              </div>
            )}
          </div>

          {mainTab === 'standard' ? (
            <>
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
                        Số lượng bữa ăn:
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
                        Mô tả chi tiết:
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
                        Thể tích mỗi bữa:
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
          ) : isDoctor ? (
            <PersonalizedDietTab operationTypeId={operationTypeId} showToast={showToast} />
          ) : null}
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
