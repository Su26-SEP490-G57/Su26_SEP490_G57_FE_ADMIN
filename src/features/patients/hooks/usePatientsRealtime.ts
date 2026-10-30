import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { patientKeys } from '../api/patientApi'
import { vitalsKeys } from '../../vitals/api/vitals'
import { useAuthStore } from '../../auth/store/authStore'

const STATISTICS_SOCKET_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/statistics`
const PATIENTS_SOCKET_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/patients`

// Lắng nghe 2 namespace socket.io bên backend để làm mới danh sách bệnh nhân
// ngay khi có thay đổi từ app mobile — trước đây trang này không có kênh
// real-time nào nên phải F5 mới thấy dữ liệu mới:
// - '/statistics' (StatisticsGateway): patient tự nộp khảo sát, nurse/doctor
//   đánh giá lại, tạo/xoá/cập nhật case.
// - '/patients' (PatientGateway): khoá/mở mức ăn — nút "Tạm dừng ăn"/
//   "Tiếp tục ăn" bên mobile phát pod.locked/pod.unlocked trên namespace
//   RIÊNG này, không đi qua '/statistics'. Cùng namespace này còn phát
//   vital_signs.created mỗi khi có chỉ số sinh tồn mới — panel chi tiết bệnh
//   nhân (PatientDetailPanel/useVitalsHistory) trước đây phải F5 mới thấy.
// Mounted once at the app shell (MainLayout), not per-page — previously only
// PatientPage called this, so any other view (detail deep-link, a page left
// open across a shift) got zero realtime coverage until navigating back.
// 'connecting': initial handshake, not yet proven either way — don't warn the
// user for this one, only for a real 'disconnected' (a drop after having
// been up), or the UI would flash a false "mất kết nối" on every page load.
export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected'

export function usePatientsRealtime(): { status: RealtimeStatus } {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const [statsConnected, setStatsConnected] = useState(false)
  const [patientsConnected, setPatientsConnected] = useState(false)
  const [everConnected, setEverConnected] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    const statisticsSocket = io(STATISTICS_SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
    })
    const patientsSocket = io(PATIENTS_SOCKET_URL, {
      transports: ['websocket'],
      auth: { token: accessToken },
    })

    statisticsSocket.on('connect', () => {
      setEverConnected(true)
      setStatsConnected(true)
    })
    statisticsSocket.on('disconnect', () => setStatsConnected(false))
    statisticsSocket.on('connect_error', () => setStatsConnected(false))
    patientsSocket.on('connect', () => {
      setEverConnected(true)
      setPatientsConnected(true)
    })
    patientsSocket.on('disconnect', () => setPatientsConnected(false))
    patientsSocket.on('connect_error', () => setPatientsConnected(false))

    const invalidatePatients = () => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all })
    }

    statisticsSocket.on('createPatient', invalidatePatients)
    statisticsSocket.on('updatePatient', invalidatePatients)
    statisticsSocket.on('deletePatient', invalidatePatients)
    statisticsSocket.on('submitSurvey', invalidatePatients)
    statisticsSocket.on('assessment.submitted', invalidatePatients)

    patientsSocket.on('pod.locked', invalidatePatients)
    patientsSocket.on('pod.unlocked', invalidatePatients)
    patientsSocket.on('vital_signs.created', (payload: { caseId?: string } | undefined) => {
      if (payload?.caseId) {
        void queryClient.invalidateQueries({ queryKey: vitalsKeys.history(payload.caseId) })
      }
    })

    return () => {
      statisticsSocket.disconnect()
      patientsSocket.disconnect()
    }
  }, [queryClient, accessToken])

  const isFullyConnected = statsConnected && patientsConnected
  const status: RealtimeStatus = isFullyConnected
    ? 'connected'
    : everConnected
      ? 'disconnected'
      : 'connecting'

  return { status }
}
