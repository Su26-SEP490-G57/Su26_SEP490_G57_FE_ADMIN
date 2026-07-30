import type { PatientListItem } from '../features/patients/types'

// Gom bệnh nhân theo phòng (tách từ `roomBed`, phần trước dấu '/').
// Sắp xếp theo số phòng tăng dần khi tên phòng là số; phòng không xác định
// định được (rơi vào 'Chưa phân phòng') luôn xếp cuối cùng.
export interface RoomGroup {
  room: string
  patients: PatientListItem[]
}

const UNASSIGNED_ROOM = 'Chưa phân phòng'

export function groupPatientsByRoom(patients: PatientListItem[]): RoomGroup[] {
  const byRoom = new Map<string, PatientListItem[]>()

  for (const patient of patients) {
    const room = patient.roomBed?.split('/')[0]?.trim() || UNASSIGNED_ROOM
    const bucket = byRoom.get(room)
    if (bucket) {
      bucket.push(patient)
    } else {
      byRoom.set(room, [patient])
    }
  }

  const groups = Array.from(byRoom.entries()).map(([room, roomPatients]) => ({
    room,
    patients: roomPatients,
  }))

  groups.sort((a, b) => {
    if (a.room === UNASSIGNED_ROOM) return 1
    if (b.room === UNASSIGNED_ROOM) return -1

    const numA = Number(a.room.replace(/\D/g, ''))
    const numB = Number(b.room.replace(/\D/g, ''))
    const aIsNumeric = a.room.replace(/\D/g, '').length > 0
    const bIsNumeric = b.room.replace(/\D/g, '').length > 0

    if (aIsNumeric && bIsNumeric && numA !== numB) return numA - numB
    return a.room.localeCompare(b.room, 'vi')
  })

  return groups
}
