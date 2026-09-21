import { useState, useRef, useEffect } from 'react'
import {
  useNurses,
  useRoomAssignment,
  useAssignNurseToRoom,
  useUnassignNurseFromRoom,
} from '../../nurses/api/nurses'

interface NurseAssignmentCellProps {
  roomCode: string
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  // Vietnamese name pattern: "Nguyen Van A" -> take last word + first word
  const firstName = parts[parts.length - 1]
  const lastName = parts[0]
  return (lastName[0] + firstName[0]).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
]

function getAvatarColor(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function NurseAssignmentCell({ roomCode }: NurseAssignmentCellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: assignedNurseIds = [] } = useRoomAssignment(roomCode)
  const { data: nursesResponse } = useNurses({ limit: 50 })
  const assignMutation = useAssignNurseToRoom()
  const unassignMutation = useUnassignNurseFromRoom()

  const nurses = nursesResponse?.data ?? []
  const assignedNurses = nurses.filter((n) => assignedNurseIds.includes(n.id))

  const isPending = assignMutation.isPending || unassignMutation.isPending

  // Filter nurses based on search query
  const filteredNurses = nurses.filter((n) =>
    n.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const MAX_VISIBLE_AVATARS = 3
  const visibleNurses = assignedNurses.slice(0, MAX_VISIBLE_AVATARS)
  const hiddenCount = Math.max(0, assignedNurses.length - MAX_VISIBLE_AVATARS)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function handleToggleAssignment(nurseId: number, isAssigned: boolean) {
    if (isAssigned) {
      unassignMutation.mutate({ nurseId, roomCode })
    } else {
      assignMutation.mutate({ nurseId, roomCode })
    }
  }

  function handleUnassignAll() {
    if (assignedNurseIds.length === 0) return
    // Unassign all nurses sequentially
    assignedNurseIds.forEach((nurseId) => {
      unassignMutation.mutate({ nurseId, roomCode })
    })
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 transition-colors text-xs w-full text-left min-h-[32px]"
        disabled={isPending}
      >
        {assignedNurses.length > 0 ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {visibleNurses.map((nurse) => (
              <div
                key={nurse.id}
                className={`relative flex items-center justify-center w-7 h-7 rounded-full text-white text-[10px] font-semibold ${getAvatarColor(nurse.fullName)} flex-shrink-0 group`}
                title={nurse.fullName}
              >
                {getInitials(nurse.fullName)}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 px-2 py-1 bg-slate-900 text-white text-[10px] rounded whitespace-nowrap pointer-events-none">
                  {nurse.fullName}
                </div>
              </div>
            ))}
            {hiddenCount > 0 && (
              <div
                className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-700 text-[10px] font-semibold flex-shrink-0"
                title={`${hiddenCount} điều dưỡng khác`}
              >
                +{hiddenCount}
              </div>
            )}
          </div>
        ) : (
          <span className="text-slate-400 italic">Chưa phân công</span>
        )}
        <span className="material-symbols-outlined text-[14px] text-slate-400 flex-shrink-0">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-[100] w-64 max-h-80 rounded-lg border border-slate-200 bg-white shadow-xl flex flex-col">
          {/* Header with search and unassign all */}
          <div className="p-2 border-b border-slate-200 space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">
                search
              </span>
            </div>
            {assignedNurses.length > 0 && (
              <button
                type="button"
                onClick={handleUnassignAll}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">person_remove</span>
                Bỏ phân công tất cả ({assignedNurses.length})
              </button>
            )}
          </div>

          {/* Nurses list */}
          <div className="overflow-y-auto flex-1">
            {filteredNurses.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                {searchQuery ? 'Không tìm thấy điều dưỡng' : 'Không có điều dưỡng nào'}
              </div>
            ) : (
              <ul className="py-1">
                {filteredNurses
                  .filter((n) => n.isActive)
                  .map((nurse) => {
                    const isAssigned = assignedNurseIds.includes(nurse.id)
                    return (
                      <li key={nurse.id}>
                        <button
                          type="button"
                          onClick={() => handleToggleAssignment(nurse.id, isAssigned)}
                          disabled={isPending}
                          className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                            isAssigned
                              ? 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
                              : 'hover:bg-slate-50 cursor-pointer'
                          } ${isPending ? 'opacity-50' : ''}`}
                        >
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-semibold flex-shrink-0 ${getAvatarColor(nurse.fullName)}`}
                          >
                            {getInitials(nurse.fullName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-sm text-slate-800 leading-tight">
                              {nurse.fullName}
                            </p>
                            <p className="truncate text-xs text-slate-500 leading-tight mt-0.5">
                              {nurse.roles.includes('Head_Nurse') ? 'Trưởng khoa' : 'Điều dưỡng'}
                            </p>
                          </div>
                          {isAssigned && (
                            <span className="material-symbols-outlined text-base text-blue-600 flex-shrink-0">
                              check_circle
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
