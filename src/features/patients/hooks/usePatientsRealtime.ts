import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { patientKeys } from '../api/patientApi'

const STATISTICS_SOCKET_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/statistics`
const PATIENTS_SOCKET_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/patients`

// Lắng nghe 2 namespace socket.io bên backend để làm mới danh sách bệnh nhân
// ngay khi có thay đổi từ app mobile — trước đây trang này không có kênh
// real-time nào nên phải F5 mới thấy dữ liệu mới:
// - '/statistics' (StatisticsGateway): patient tự nộp khảo sát, nurse/doctor
//   đánh giá lại, tạo/xoá/cập nhật case.
// - '/patients' (PatientGateway): khoá/mở mức ăn — nút "Tạm dừng ăn"/
//   "Tiếp tục ăn" bên mobile phát pod.locked/pod.unlocked trên namespace
//   RIÊNG này, không đi qua '/statistics'.
// Model theo useAnalyticsRealtime.ts. Chỉ mở kết nối khi PatientPage mount.
export function usePatientsRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const statisticsSocket = io(STATISTICS_SOCKET_URL, { transports: ['websocket'] })
    const patientsSocket = io(PATIENTS_SOCKET_URL, { transports: ['websocket'] })

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

    return () => {
      statisticsSocket.disconnect()
      patientsSocket.disconnect()
    }
  }, [queryClient])
}
