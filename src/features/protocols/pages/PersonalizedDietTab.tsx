import { useState, useEffect, useRef } from 'react'
import {
  getCustomDietGuidance,
  getDietLevelProtocols,
  upsertCustomDietGuidance,
  toggleCustomDietStatus,
} from '../api/dietGuidanceApi'
import type { CustomDietGuidanceResponse } from '../api/dietGuidanceApi'
import { getPatients } from '../../patients/api/patientApi'
import type { PatientListItem } from '../../patients/types'
import { PromptModal } from '../../../components/PromptModal'

interface PersonalizedDietTabProps {
  operationTypeId: number
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

function patientDisplayName(patient: PatientListItem): string {
  return (
    patient.fullName ??
    patient.account?.fullName ??
    patient.nameInitials ??
    `Bệnh nhân #${patient.caseId}`
  )
}

function formatGender(gender?: string | null): string {
  if (!gender) return '—'
  const g = gender.trim().toLowerCase()
  if (g === 'male' || g === 'm' || g === 'nam') return 'Nam'
  if (g === 'female' || g === 'f' || g === 'nữ' || g === 'nu') return 'Nữ'
  return gender
}

export function PersonalizedDietTab({ operationTypeId, showToast }: PersonalizedDietTabProps) {
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCase, setSelectedCase] = useState<PatientListItem | null>(null)
  const [customGuidanceMap, setCustomGuidanceMap] = useState<
    Record<string, CustomDietGuidanceResponse | null>
  >({})
  const [loadingCustomData, setLoadingCustomData] = useState(false)

  // Modal edit state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [savingForm, setSavingForm] = useState(false)
  const [formData, setFormData] = useState({
    mealCountMin: 3,
    mealCountMax: 5,
    mealDetails: '',
    volumeMin: 150,
    volumeMax: 250,
    foods: [] as string[],
    drinks: [] as string[],
    forbiddenFoods: [] as string[],
    forbiddenDrinks: [] as string[],
    doctorNotes: '',
    isActive: true,
  })

  // Modal nhỏ thay cho window.prompt() khi thêm 1 món ăn/đồ uống vào danh sách.
  const [addItemModal, setAddItemModal] = useState<{
    title: string
    onAdd: (value: string) => void
  } | null>(null)

  const [filterScope, setFilterScope] = useState<'current' | 'all'>('current')
  const [hoveredCardCaseId, setHoveredCardCaseId] = useState<string | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  const handleCardMouseEnter = (caseId: string) => {
    clearHoverTimer()
    setHoveredCardCaseId(caseId)
  }

  const handleCardMouseLeave = () => {
    clearHoverTimer()
    // Grace period (350ms) to allow smooth movement from card to dropdown overlay
    hoverTimer.current = setTimeout(() => {
      setHoveredCardCaseId(null)
    }, 350)
  }

  // Load patients list and their custom diet status
  useEffect(() => {
    let cancelled = false
    async function fetchPatients() {
      try {
        setLoadingPatients(true)
        // Lấy danh sách bệnh nhân toàn viện (hoặc theo phạm vi) để không bỏ sót người bệnh ăn riêng
        const response = await getPatients({ page: 1, limit: 200 })
        if (response && response.data && !cancelled) {
          const patientList = response.data
          // Lấy custom guidance cho các bệnh nhân để xác định ai đang áp dụng ăn riêng
          const guidanceResults = await Promise.all(
            patientList.map(async (p) => {
              try {
                const guidance = await getCustomDietGuidance(p.caseId)
                return { caseId: p.caseId, guidance }
              } catch {
                return { caseId: p.caseId, guidance: null }
              }
            }),
          )

          if (!cancelled) {
            const map: Record<string, CustomDietGuidanceResponse | null> = {}
            guidanceResults.forEach(({ caseId, guidance }) => {
              map[caseId] = guidance
            })
            setCustomGuidanceMap(map)
            setPatients(patientList)
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách bệnh nhân:', err)
      } finally {
        if (!cancelled) {
          setLoadingPatients(false)
        }
      }
    }
    fetchPatients()
    return () => {
      cancelled = true
    }
  }, [operationTypeId])

  // Click on patient card opens modal form directly
  const handleOpenEditModal = async (patient: PatientListItem) => {
    const caseId = patient.caseId
    setSelectedCase(patient)
    setIsModalOpen(true)

    try {
      setLoadingCustomData(true)

      // Lấy custom guidance + hướng dẫn chung theo đúng mức ăn hiện tại của BN song song
      const patientOpTypeId = patient.operationTypeId ?? operationTypeId
      const patientDietLevel = patient.currentDietLevel

      const [protocols, customGuidance] = await Promise.all([
        // General: lấy tất cả diet level protocols của loại phẫu thuật, tìm đúng mức hiện tại
        patientOpTypeId > 0
          ? getDietLevelProtocols(patientOpTypeId).catch(() => [])
          : Promise.resolve([]),
        // Custom: dùng cache nếu đã có, không thì fetch
        customGuidanceMap[caseId] !== undefined
          ? Promise.resolve(customGuidanceMap[caseId])
          : getCustomDietGuidance(caseId).catch(() => null),
      ])

      if (customGuidance) {
        setCustomGuidanceMap((prev) => ({ ...prev, [caseId]: customGuidance }))
      }

      // Tìm protocol đúng mức ăn hiện tại của bệnh nhân
      const generalProtocol =
        patientDietLevel != null
          ? (protocols.find((p) => p.dietLevel === patientDietLevel) ?? protocols[0])
          : protocols[0]

      // Phát hiện record tự động tạo khi toggle (chưa được doctor điền):
      // Backend set sẵn default numbers (3,5,150,250) nhưng text fields vẫn là null/[]
      const isAutoCreated =
        customGuidance !== null &&
        customGuidance.mealInstruction === null &&
        customGuidance.doctorNotes === null &&
        customGuidance.recommendedFoods.length === 0 &&
        customGuidance.recommendedDrinks.length === 0 &&
        customGuidance.forbiddenFoods.length === 0 &&
        customGuidance.forbiddenDrinks.length === 0

      if (isAutoCreated || customGuidance === null) {
        // Chưa configure → lấy toàn bộ từ hướng dẫn chung theo mức ăn hiện tại
        setFormData({
          mealCountMin: generalProtocol?.mealsPerDayMin ?? 0,
          mealCountMax: generalProtocol?.mealsPerDayMax ?? 0,
          mealDetails: generalProtocol?.mealInstruction ?? '',
          volumeMin: generalProtocol?.volumePerMealMin ?? 0,
          volumeMax: generalProtocol?.volumePerMealMax ?? 0,
          foods: generalProtocol?.recommendedFoods ?? [],
          drinks: generalProtocol?.recommendedDrinks ?? [],
          forbiddenFoods: generalProtocol?.forbiddenFoods ?? [],
          forbiddenDrinks: generalProtocol?.forbiddenDrinks ?? [],
          doctorNotes: '',
          isActive: customGuidance?.isActive ?? true,
        })
      } else {
        // Doctor đã configure → merge: custom non-null override general
        setFormData({
          mealCountMin: customGuidance.mealsPerDayMin ?? generalProtocol?.mealsPerDayMin ?? 0,
          mealCountMax: customGuidance.mealsPerDayMax ?? generalProtocol?.mealsPerDayMax ?? 0,
          mealDetails: customGuidance.mealInstruction ?? generalProtocol?.mealInstruction ?? '',
          volumeMin: customGuidance.volumePerMealMin ?? generalProtocol?.volumePerMealMin ?? 0,
          volumeMax: customGuidance.volumePerMealMax ?? generalProtocol?.volumePerMealMax ?? 0,
          foods: customGuidance.recommendedFoods.length
            ? customGuidance.recommendedFoods
            : (generalProtocol?.recommendedFoods ?? []),
          drinks: customGuidance.recommendedDrinks.length
            ? customGuidance.recommendedDrinks
            : (generalProtocol?.recommendedDrinks ?? []),
          forbiddenFoods: customGuidance.forbiddenFoods.length
            ? customGuidance.forbiddenFoods
            : (generalProtocol?.forbiddenFoods ?? []),
          forbiddenDrinks: customGuidance.forbiddenDrinks.length
            ? customGuidance.forbiddenDrinks
            : (generalProtocol?.forbiddenDrinks ?? []),
          doctorNotes: customGuidance.doctorNotes ?? '',
          isActive: customGuidance.isActive,
        })
      }
    } catch (err) {
      console.error('Lỗi khi tải chỉ định ăn riêng:', err)
    } finally {
      setLoadingCustomData(false)
    }
  }

  // Toggle active status
  const handleToggleStatus = async (caseId: string, currentStatus: boolean) => {
    try {
      const updated = await toggleCustomDietStatus(caseId, !currentStatus)
      setCustomGuidanceMap((prev) => ({ ...prev, [caseId]: updated }))
      if (selectedCase && selectedCase.caseId === caseId) {
        setFormData((prev) => ({ ...prev, isActive: updated.isActive }))
      }
      showToast(
        updated.isActive
          ? 'Đã chuyển sang hướng dẫn ăn riêng!'
          : 'Đã chuyển về hướng dẫn chung của protocol.',
        'success',
      )
    } catch (err) {
      console.error(err)
      showToast('Không thể cập nhật trạng thái!', 'error')
    }
  }

  // Save custom diet guidance
  const handleSaveCustom = async () => {
    if (!selectedCase) return
    const caseId = selectedCase.caseId

    try {
      setSavingForm(true)
      const saved = await upsertCustomDietGuidance(caseId, {
        mealsPerDayMin: Number(formData.mealCountMin),
        mealsPerDayMax: Number(formData.mealCountMax),
        mealInstruction: formData.mealDetails,
        volumePerMealMin: Number(formData.volumeMin),
        volumePerMealMax: Number(formData.volumeMax),
        recommendedFoods: formData.foods,
        recommendedDrinks: formData.drinks,
        forbiddenFoods: formData.forbiddenFoods,
        forbiddenDrinks: formData.forbiddenDrinks,
        doctorNotes: formData.doctorNotes,
        isActive: formData.isActive,
      })
      setCustomGuidanceMap((prev) => ({ ...prev, [caseId]: saved }))
      showToast('Đã lưu chỉ định ăn riêng cho bệnh nhân!', 'success')
      setIsModalOpen(false)
    } catch (err) {
      console.error(err)
      showToast('Có lỗi xảy ra khi lưu chỉ định ăn riêng!', 'error')
    } finally {
      setSavingForm(false)
    }
  }

  const handleAddFood = () => {
    setAddItemModal({
      title: 'Thêm món ăn khuyên dùng',
      onAdd: (item) => setFormData((prev) => ({ ...prev, foods: [...prev.foods, item] })),
    })
  }

  const handleAddDrink = () => {
    setAddItemModal({
      title: 'Thêm thức uống khuyên dùng',
      onAdd: (item) => setFormData((prev) => ({ ...prev, drinks: [...prev.drinks, item] })),
    })
  }

  const handleRemoveFood = (idx: number) => {
    setFormData((prev) => ({ ...prev, foods: prev.foods.filter((_, i) => i !== idx) }))
  }

  const handleRemoveDrink = (idx: number) => {
    setFormData((prev) => ({ ...prev, drinks: prev.drinks.filter((_, i) => i !== idx) }))
  }

  const handleAddForbiddenFood = () => {
    setAddItemModal({
      title: 'Thêm món ăn cần hạn chế',
      onAdd: (item) =>
        setFormData((prev) => ({ ...prev, forbiddenFoods: [...prev.forbiddenFoods, item] })),
    })
  }

  const handleAddForbiddenDrink = () => {
    setAddItemModal({
      title: 'Thêm thức uống cần hạn chế',
      onAdd: (item) =>
        setFormData((prev) => ({ ...prev, forbiddenDrinks: [...prev.forbiddenDrinks, item] })),
    })
  }

  const handleRemoveForbiddenFood = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      forbiddenFoods: prev.forbiddenFoods.filter((_, i) => i !== idx),
    }))
  }

  const handleRemoveForbiddenDrink = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      forbiddenDrinks: prev.forbiddenDrinks.filter((_, i) => i !== idx),
    }))
  }

  // CHỈ LỌC các bệnh nhân ĐÃ ĐƯỢC CHUYỂN SANG ĂN RIÊNG (isActive === true)
  const customizedPatients = patients.filter((p) => {
    const customData = customGuidanceMap[p.caseId]
    if (!customData || customData.isActive !== true) return false
    if (filterScope === 'current' && operationTypeId > 0) {
      return p.operationTypeId === operationTypeId
    }
    return true
  })

  // Filter patients by search keyword
  const filteredPatients = customizedPatients.filter((p) => {
    const name = patientDisplayName(p)
    const room = p.roomBed || ''
    const q = searchKeyword.toLowerCase()
    return (
      name.toLowerCase().includes(q) ||
      room.toLowerCase().includes(q) ||
      p.caseId.toLowerCase().includes(q)
    )
  })

  return (
    <div className="relative">
      {/* Search & Filter Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Chỉ định hướng dẫn ăn riêng cho từng bệnh nhân
          </h2>
          <p className="text-sm text-gray-500">
            Danh sách người bệnh đang áp dụng thực đơn cá nhân hóa (Bác sĩ chỉ định)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Scope filter: Phẫu thuật hiện tại vs Tất cả phẫu thuật */}
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setFilterScope('current')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                filterScope === 'current'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Phẫu thuật hiện tại
            </button>
            <button
              type="button"
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                filterScope === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tất cả phẫu thuật
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Tìm kiếm bệnh nhân, số phòng..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-1.5 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="material-symbols-outlined absolute left-3 top-2 text-gray-400 text-lg">
              search
            </span>
          </div>
        </div>
      </div>

      {/* Patient Cards Grid */}
      {loadingPatients ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-3"></div>
          <p className="text-sm">Đang tải danh sách người bệnh ăn riêng...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center bg-white shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
            <span className="material-symbols-outlined text-3xl">restaurant</span>
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {searchKeyword
              ? 'Không tìm thấy người bệnh nào phù hợp'
              : 'Chưa có người bệnh nào được chuyển sang chế độ ăn riêng'}
          </h3>
          <p className="mt-1.5 text-sm text-gray-500 max-w-md mx-auto">
            {searchKeyword
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc kiểm tra lại tên, số phòng.'
              : 'Để chuyển người bệnh sang ăn riêng, Bác sĩ hãy vào màn "Danh sách người bệnh" và bấm chọn nút "Riêng" trên thẻ người bệnh.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredPatients.map((patient) => {
            const caseId = patient.caseId
            const isHovered = hoveredCardCaseId === caseId
            const customData = customGuidanceMap[caseId]
            const hasCustomActive = customData?.isActive === true

            return (
              <div
                key={patient.caseId}
                className="group relative flex flex-col rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-sm transition-all duration-200 cursor-pointer"
                onMouseEnter={() => handleCardMouseEnter(caseId)}
                onMouseLeave={handleCardMouseLeave}
                onClick={() => handleOpenEditModal(patient)}
              >
                {/* Compact Card Header - Kích thước thu nhỏ bằng 1/2 */}
                <div className="p-2">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-semibold text-slate-800 text-[12.5px] truncate group-hover:text-blue-600 transition-colors">
                      {patientDisplayName(patient)}
                    </h3>
                    <span className="text-[10px] font-mono font-medium text-slate-400 shrink-0">
                      #{patient.caseId}
                    </span>
                  </div>

                  <p className="text-[11px] text-blue-600 font-medium truncate mt-0.5">
                    {patient.operationType?.name || 'Chưa phân loại'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span className="truncate">P: {patient.roomBed || '—'}</span>
                    <span className="font-semibold text-slate-700 shrink-0">
                      POD {patient.currentPod ?? 1}
                    </span>
                  </div>
                </div>

                {/* Dropdown / Overlay Section on Hover */}
                {isHovered && (
                  <div
                    className="absolute left-0 top-full z-30 pt-1 pointer-events-auto min-w-[260px]"
                    onMouseEnter={() => handleCardMouseEnter(caseId)}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenEditModal(patient)
                    }}
                  >
                    <div className="rounded-xl border border-blue-200 bg-white p-3 shadow-xl text-xs space-y-2.5 transition-all">
                      <div className="grid grid-cols-2 gap-2 text-slate-600">
                        <div>
                          <span className="font-medium text-slate-400">Tuổi:</span>{' '}
                          <span className="font-semibold text-slate-800">{patient.age || '—'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-400">Giới tính:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {formatGender(patient.gender)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-400">POD:</span>{' '}
                          <span className="font-semibold text-blue-600">
                            POD {patient.currentPod ?? 1}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-400">Mức ăn hiện tại:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {patient.currentDietLevel !== undefined &&
                            patient.currentDietLevel !== null
                              ? `Mức ${patient.currentDietLevel}`
                              : 'Chưa xác định'}
                          </span>
                        </div>
                      </div>

                      {/* Trạng thái áp dụng: Segmented Control [Chung | Riêng] giống hệt màn DS người bệnh */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                        <div
                          className="flex items-center space-x-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className={`inline-flex items-center rounded-full p-0.5 border shadow-inner transition-colors ${
                              hasCustomActive
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-100 border-slate-200/80'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (hasCustomActive) {
                                  void handleToggleStatus(caseId, true)
                                }
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-150 ${
                                !hasCustomActive
                                  ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60'
                                  : 'text-slate-400 hover:text-slate-600'
                              } cursor-pointer`}
                            >
                              Chung
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!hasCustomActive) {
                                  void handleToggleStatus(caseId, false)
                                }
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-150 flex items-center gap-1 ${
                                hasCustomActive
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-slate-600'
                              } cursor-pointer`}
                            >
                              {hasCustomActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse inline-block" />
                              )}
                              <span>Riêng</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Popup for Customized Diet Guidance (Matching Form Chung UI) */}
      {isModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex flex-col max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <span className="material-symbols-outlined text-xl">restaurant</span>
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Chỉ định hướng dẫn ăn riêng: {patientDisplayName(selectedCase)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>Mã: #{selectedCase.caseId}</span>
                    <span>•</span>
                    <span>Phòng/Giường: {selectedCase.roomBed || 'Chưa xếp'}</span>
                    <span>•</span>
                    <span className="font-semibold text-blue-600">
                      POD {selectedCase.currentPod ?? 1}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      Mức ăn hiện tại:{' '}
                      {selectedCase.currentDietLevel != null
                        ? `Mức ${selectedCase.currentDietLevel}`
                        : 'Chưa xác định'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Segmented Control [Chung | Riêng] in Modal Header */}
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex items-center rounded-full p-0.5 border shadow-inner transition-colors ${
                    formData.isActive
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-slate-100 border-slate-200/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 ${
                      !formData.isActive
                        ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/60'
                        : 'text-slate-400 hover:text-slate-600'
                    } cursor-pointer`}
                  >
                    Chung
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1 ${
                      formData.isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-600'
                    } cursor-pointer`}
                  >
                    {formData.isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-200 animate-pulse inline-block" />
                    )}
                    <span>Riêng</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Đóng"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body - 2 Column Layout Matching "Hướng dẫn ăn chung" */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {loadingCustomData ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-2" />
                  <p className="text-xs">Đang tải cấu hình chỉ định...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: General Guidance Form (Meal count, volume, details) */}
                  <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-5">
                        <span
                          className="material-symbols-outlined text-blue-600"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          description
                        </span>
                        <h4 className="text-base font-bold text-slate-800">Thông số bữa ăn</h4>
                      </div>

                      <div className="space-y-5">
                        {/* Số lượng bữa ăn */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Số lượng bữa ăn trong ngày:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              className="w-20 text-center px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              type="number"
                              min="1"
                              max="10"
                              value={formData.mealCountMin}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  mealCountMin: parseInt(e.target.value) || 0,
                                }))
                              }
                            />
                            <span className="text-slate-400">—</span>
                            <input
                              className="w-20 text-center px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              type="number"
                              min="1"
                              max="10"
                              value={formData.mealCountMax}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  mealCountMax: parseInt(e.target.value) || 0,
                                }))
                              }
                            />
                            <span className="text-xs text-slate-600">bữa/ngày</span>
                          </div>
                        </div>

                        {/* Thể tích mỗi bữa */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Thể tích mỗi bữa (ml):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              className="w-24 text-center px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              type="number"
                              min="0"
                              step="10"
                              value={formData.volumeMin}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  volumeMin: parseInt(e.target.value) || 0,
                                }))
                              }
                            />
                            <span className="text-slate-400">—</span>
                            <input
                              className="w-24 text-center px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              type="number"
                              min="0"
                              step="10"
                              value={formData.volumeMax}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  volumeMax: parseInt(e.target.value) || 0,
                                }))
                              }
                            />
                            <span className="text-xs text-slate-600">ml</span>
                          </div>
                        </div>

                        {/* Mô tả chi tiết */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                            Mô tả chi tiết:
                          </label>
                          <textarea
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Nhập hướng dẫn chi tiết về lịch trình ăn uống..."
                            rows={4}
                            value={formData.mealDetails}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, mealDetails: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Ghi chú của Bác sĩ */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">priority_high</span>
                        Lưu ý riêng của Bác sĩ (Dặn dò người bệnh):
                      </label>
                      <textarea
                        className="w-full px-3 py-1.5 text-sm border border-amber-200 bg-amber-50/50 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                        placeholder="Ví dụ: Ăn chậm nhai kỹ, không uống sữa tươi, theo dõi chướng bụng..."
                        rows={2}
                        value={formData.doctorNotes}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, doctorNotes: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  {/* Right Column: Recommended Foods & Drinks (Matching Form Chung UI) */}
                  <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-5">
                        <span
                          className="material-symbols-outlined text-teal-600"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          restaurant
                        </span>
                        <h4 className="text-base font-bold text-slate-800">Thực phẩm gợi ý</h4>
                      </div>

                      <div className="space-y-6">
                        {/* Recommended Food */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <label className="block text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-emerald-600">
                              check_circle
                            </span>
                            Món ăn khuyên dùng
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {formData.foods.map((food, idx) => (
                              <div
                                key={idx}
                                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-medium border border-blue-200"
                              >
                                <span>{food}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFood(idx)}
                                  className="material-symbols-outlined text-xs opacity-60 hover:opacity-100 cursor-pointer"
                                >
                                  close
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={handleAddFood}
                              className="flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-blue-600 text-blue-600 hover:bg-blue-50 transition-all text-xs font-medium cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">add</span>
                              Thêm món
                            </button>
                          </div>
                        </div>

                        {/* Recommended Drinks */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <label className="block text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-blue-600">
                              local_drink
                            </span>
                            Thức uống khuyên dùng
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {formData.drinks.map((drink, idx) => (
                              <div
                                key={idx}
                                className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-medium border border-blue-200"
                              >
                                <span>{drink}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDrink(idx)}
                                  className="material-symbols-outlined text-xs opacity-60 hover:opacity-100 cursor-pointer"
                                >
                                  close
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={handleAddDrink}
                              className="flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-blue-600 text-blue-600 hover:bg-blue-50 transition-all text-xs font-medium cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">add</span>
                              Thêm đồ uống
                            </button>
                          </div>
                        </div>

                        {/* Forbidden Food */}
                        <div className="p-4 rounded-xl bg-red-50/50 border border-red-200">
                          <label className="block text-xs font-semibold text-red-700 mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">no_food</span>
                            Thực phẩm hạn chế
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {formData.forbiddenFoods.map((food, idx) => (
                              <div
                                key={idx}
                                className="bg-red-50 text-red-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-medium border border-red-200"
                              >
                                <span>{food}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveForbiddenFood(idx)}
                                  className="material-symbols-outlined text-xs opacity-60 hover:opacity-100 cursor-pointer"
                                >
                                  close
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={handleAddForbiddenFood}
                              className="flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-red-600 text-red-600 hover:bg-red-50 transition-all text-xs font-medium cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">add</span>
                              Thêm món cần hạn chế
                            </button>
                          </div>
                        </div>

                        {/* Forbidden Drinks */}
                        <div className="p-4 rounded-xl bg-red-50/50 border border-red-200">
                          <label className="block text-xs font-semibold text-red-700 mb-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">no_drinks</span>
                            Đồ uống hạn chế
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {formData.forbiddenDrinks.map((drink, idx) => (
                              <div
                                key={idx}
                                className="bg-red-50 text-red-700 px-3 py-1 rounded-full inline-flex items-center gap-1 text-xs font-medium border border-red-200"
                              >
                                <span>{drink}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveForbiddenDrink(idx)}
                                  className="material-symbols-outlined text-xs opacity-60 hover:opacity-100 cursor-pointer"
                                >
                                  close
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={handleAddForbiddenDrink}
                              className="flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-red-600 text-red-600 hover:bg-red-50 transition-all text-xs font-medium cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">add</span>
                              Thêm đồ uống cần hạn chế
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                disabled={savingForm}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {savingForm && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                Lưu chỉ định ăn riêng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Food/Drink Prompt Modal */}
      <PromptModal
        key={addItemModal?.title ?? 'closed'}
        isOpen={addItemModal !== null}
        title={addItemModal?.title ?? ''}
        placeholder="Nhập tên..."
        onConfirm={(value) => {
          addItemModal?.onAdd(value)
          setAddItemModal(null)
        }}
        onCancel={() => setAddItemModal(null)}
      />
    </div>
  )
}
