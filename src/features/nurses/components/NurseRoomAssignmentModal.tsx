import { useEffect, useState } from 'react'
import { useAssignNurseRooms, useHospitalRooms } from '../api/nurses'
import type { Nurse } from '../types'

interface NurseRoomAssignmentModalProps {
  isOpen: boolean
  nurse: Nurse | null
  onClose: () => void
}

export function NurseRoomAssignmentModal({
  isOpen,
  nurse,
  onClose,
}: NurseRoomAssignmentModalProps) {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])
  const [customRoom, setCustomRoom] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: hospitalRooms, isLoading: isLoadingRooms } = useHospitalRooms()
  const assignRoomsMutation = useAssignNurseRooms()

  useEffect(() => {
    if (nurse) {
      setSelectedRooms(nurse.assignedRooms ?? [])
      setErrorMsg('')
      setCustomRoom('')
    }
  }, [nurse, isOpen])

  if (!isOpen || !nurse) return null

  const handleToggleRoom = (roomCode: string) => {
    setSelectedRooms((prev) =>
      prev.includes(roomCode)
        ? prev.filter((r) => r !== roomCode)
        : [...prev, roomCode]
    )
  }

  const handleAddCustomRoom = () => {
    const trimmed = customRoom.trim().toUpperCase()
    if (!trimmed) return
    if (selectedRooms.includes(trimmed)) {
      setErrorMsg(`Phòng ${trimmed} đã có trong danh sách`)
      return
    }
    setSelectedRooms((prev) => [...prev, trimmed])
    setCustomRoom('')
    setErrorMsg('')
  }

  const handleRemoveRoom = (roomCode: string) => {
    setSelectedRooms((prev) => prev.filter((r) => r !== roomCode))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await assignRoomsMutation.mutateAsync({
        id: nurse.id,
        roomCodes: selectedRooms,
      })
      onClose()
    } catch (err: any) {
      console.error('Failed to assign rooms', err)
      setErrorMsg(err?.response?.data?.message || 'Không thể cập nhật phân công phòng bệnh')
    }
  }

  // Common standard rooms available in system or from backend
  const availableRoomsList = Array.from(
    new Set([
      'P502',
      'P504',
      'P506',
      'P508',
      'P510',
      ...(hospitalRooms?.map((r) => r.roomCode) ?? []),
    ])
  ).sort()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#00459a]">
              <span className="material-symbols-outlined text-[24px]">meeting_room</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Phân công phòng bệnh</h3>
              <p className="text-xs text-slate-500">
                Điều dưỡng: <span className="font-semibold text-slate-700">{nurse.fullName}</span> (Mã: ĐD{String(nurse.id).padStart(3, '0')})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto custom-scrollbar p-6 space-y-5">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {errorMsg}
            </div>
          )}

          {/* Currently Assigned Rooms Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Phòng đang phân công ({selectedRooms.length})
            </label>
            {selectedRooms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-center text-xs text-slate-400">
                Chưa phân công phòng nào cho điều dưỡng này.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                {selectedRooms.map((room) => (
                  <span
                    key={room}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#00459a] px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">door_front</span>
                    {room}
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(room)}
                      className="ml-1 rounded p-0.5 hover:bg-white/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Selection List */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Danh sách phòng bệnh tại khoa
            </label>
            {isLoadingRooms ? (
              <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableRoomsList.map((roomCode) => {
                  const isSelected = selectedRooms.includes(roomCode)
                  const roomData = hospitalRooms?.find((r) => r.roomCode === roomCode)
                  const patientCount = roomData?.patientCount ?? 0

                  return (
                    <button
                      key={roomCode}
                      type="button"
                      onClick={() => handleToggleRoom(roomCode)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-bold ${
                        isSelected
                          ? 'border-[#00459a] bg-blue-50/80 text-[#00459a] ring-2 ring-[#00459a]/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">
                          {isSelected ? 'check_box' : 'door_front'}
                        </span>
                        <span>Phòng {roomCode}</span>
                      </div>
                      {patientCount > 0 && (
                        <span className="mt-1 text-[10px] font-normal text-slate-400">
                          {patientCount} bệnh nhân
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Custom Room Code Input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-slate-600">Thêm mã phòng khác</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ví dụ: P512"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomRoom()
                  }
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#00459a] focus:bg-white focus:ring-2 focus:ring-[#00459a]/10"
              />
              <button
                type="button"
                onClick={handleAddCustomRoom}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={assignRoomsMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-[#00459a] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/10 transition-all hover:bg-blue-700 hover:shadow-blue-700/20 disabled:opacity-50"
            >
              {assignRoomsMutation.isPending && (
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              )}
              Lưu phân công
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
