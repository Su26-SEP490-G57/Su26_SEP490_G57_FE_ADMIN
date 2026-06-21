import type { Patient } from '../types'
import { useState } from 'react'

const patients: Patient[] = [
  {
    researchCode: 'BN001',
    fullName: 'Nguyễn Văn An',
    age: 58,
    gender: 'Nam',
    height: 160,
    weight: 70,
    bmi: 27.3,
    diagnosis: 'Ung thư dạ dày',
    surgeryGroup: 'Dạ dày',
    surgeryType: 'Cắt bán phần dạ dày',
    surgeryMethod: 'Nội soi',
    hasDigestiveAnastomosis: true,
    surgeryDate: '2025-05-12',
    pod: 1,
    pathway: 'Gastric Pathway',
    roomBed: 'P301-G02',
    assignedNurse: 'Điều dưỡng Nguyễn Thị Hoa',
    riskLevel: 'Đỏ',
    note: '',
  },
  {
    researchCode: 'BN002',
    fullName: 'Trần Thị Bình',
    age: 47,
    gender: 'Nữ',
    height: 155,
    weight: 58,
    bmi: 24.1,
    diagnosis: 'Ung thư dạ dày giai đoạn sớm',
    surgeryGroup: 'Dạ dày',
    surgeryType: 'Cắt toàn bộ dạ dày',
    surgeryMethod: 'Nội soi',
    hasDigestiveAnastomosis: true,
    surgeryDate: '2025-05-10',
    pod: 3,
    pathway: 'Gastric Pathway',
    roomBed: 'P302-G05',
    assignedNurse: 'Điều dưỡng Trần Minh Anh',
    riskLevel: 'Đỏ',
    note: 'Theo dõi dung nạp đường miệng',
  },

  {
    researchCode: 'BN003',
    fullName: 'Lê Văn Cường',
    age: 64,
    gender: 'Nam',
    height: 168,
    weight: 72,
    bmi: 25.5,
    diagnosis: 'Ung thư đại tràng sigma',
    surgeryGroup: 'Đại trực tràng',
    surgeryType: 'Cắt đoạn đại tràng sigma',
    surgeryMethod: 'Nội soi',
    hasDigestiveAnastomosis: true,
    surgeryDate: '2025-05-08',
    pod: 5,
    pathway: 'Colorectal Pathway',
    roomBed: 'P401-G03',
    assignedNurse: 'Điều dưỡng Nguyễn Thị Hoa',
    riskLevel: 'Vàng',
    note: 'Đã vận động tốt',
  },

  {
    researchCode: 'BN004',
    fullName: 'Phạm Thị Dung',
    age: 55,
    gender: 'Nữ',
    height: 150,
    weight: 61,
    bmi: 27.1,
    diagnosis: 'Ung thư trực tràng thấp',
    surgeryGroup: 'Đại trực tràng',
    surgeryType: 'Cắt trước thấp trực tràng',
    surgeryMethod: 'Mổ mở',
    hasDigestiveAnastomosis: true,
    surgeryDate: '2025-05-11',
    pod: 2,
    pathway: 'Colorectal Pathway',
    roomBed: 'P402-G01',
    assignedNurse: 'Điều dưỡng Lê Thu Hà',
    riskLevel: 'Xanh',
    note: 'Đau sau mổ mức độ cao',
  },

  {
    researchCode: 'BN005',
    fullName: 'Hoàng Văn Đức',
    age: 60,
    gender: 'Nam',
    height: 170,
    weight: 68,
    bmi: 23.5,
    diagnosis: 'Ung thư dạ dày hang vị',
    surgeryGroup: 'Dạ dày',
    surgeryType: 'Cắt bán phần dạ dày',
    surgeryMethod: 'Robot hỗ trợ',
    hasDigestiveAnastomosis: true,
    surgeryDate: '2025-05-09',
    pod: 4,
    pathway: 'Gastric Pathway',
    roomBed: 'P303-G04',
    assignedNurse: 'Điều dưỡng Trần Minh Anh',
    riskLevel: 'Xanh',
    note: 'Tiến triển thuận lợi',
  },
]

const summaryCards = [
  { title: 'Tổng số người bệnh', value: 24, subtitle: 'Đang theo dõi' },
  { title: 'Xanh', value: 15 },
  { title: 'Vàng', value: 6 },
  { title: 'Đỏ', value: 3 },
  { title: 'Alert chưa xử lý', value: 2 },
  { title: 'Đánh giá hôm nay', value: '18/24' },
]

export function PatientPage() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  console.log(selectedPatient)
  return (
    <div className="p-4">
      {/* Summary cards */}
      <div className="mb-4 flex gap-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="flex-1 rounded-lg border bg-white p-4">
            <p>{card.title}</p>
            <p>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex gap-4">
        <button className="rounded-lg border bg-white px-4 py-2">+ Thêm mới</button>

        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="flex-1 rounded-lg border bg-white px-4 py-2"
        />

        <select className="rounded-lg border bg-white px-4 py-2">
          <option>Loại phẫu thuật</option>
        </select>

        <select className="rounded-lg border bg-white px-4 py-2">
          <option>Mức độ</option>
        </select>
      </div>

      {/* Main content */}
      <div className="flex gap-4">
        <div
          className={`rounded-lg border bg-white p-4 min-h-[600px]
            ${selectedPatient ? 'w-3/5' : 'w-full'}
            `}
        >
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">Mã BN</th>
                <th className="p-3 text-left">Tên bệnh nhân</th>
                <th className="p-3 text-left">POD</th>
                <th className="p-3 text-left">Loại phẫu thuật</th>
                <th className="p-3 text-left">Mức độ</th>
              </tr>
            </thead>

            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.researchCode}
                  onClick={() => setSelectedPatient(patient)}
                  className={`
                        cursor-pointer border-b
                        ${
                          selectedPatient?.researchCode === patient.researchCode
                            ? 'bg-blue-200 border-l-4 border-blue-500'
                            : 'hover:bg-slate-100'
                        }
                    `}
                >
                  <td className="p-3">{patient.researchCode}</td>
                  <td className="p-3">{patient.fullName}</td>
                  <td className="p-3">POD {patient.pod}</td>
                  <td className="p-3">{patient.surgeryType}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-3 py-1 text-white text-sm
                        ${
                          patient.riskLevel === 'Đỏ'
                            ? 'bg-red-600'
                            : patient.riskLevel === 'Vàng'
                              ? 'bg-yellow-500'
                              : 'bg-green-600'
                        }
                        `}
                    >
                      {patient.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedPatient && (
          <div className="w-2/5 rounded-lg border bg-white p-4 min-h-[600px]">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Thông tin bệnh nhân</h2>

                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-2xl text-slate-500 hover:text-red-500"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Mã nghiên cứu</span>
                <span>{selectedPatient.researchCode}</span>

                <span className="text-slate-500">Họ tên</span>
                <span>{selectedPatient.fullName}</span>

                <span className="text-slate-500">Tuổi</span>
                <span>{selectedPatient.age}</span>

                <span className="text-slate-500">Giới tính</span>
                <span>{selectedPatient.gender}</span>

                <span className="text-slate-500">BMI</span>
                <span>{selectedPatient.bmi}</span>
              </div>
              <div className="mb-6 mt-6">
                <h3 className="mb-3 font-bold">Thông tin phẫu thuật</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Chẩn đoán</span>
                <span>{selectedPatient.diagnosis}</span>

                <span className="text-slate-500">Nhóm phẫu thuật</span>
                <span>{selectedPatient.surgeryGroup}</span>

                <span className="text-slate-500">Loại phẫu thuật</span>
                <span>{selectedPatient.surgeryType}</span>

                <span className="text-slate-500">Phương pháp mổ</span>
                <span>{selectedPatient.surgeryMethod}</span>

                <span className="text-slate-500">Có miệng nối tiêu hoá</span>
                <span>{selectedPatient.hasDigestiveAnastomosis ? 'Có' : 'Không'}</span>
              </div>
              <div className="mb-6 mt-6">
                <h3 className="mb-3 font-bold">Thông tin điều trị</h3>
              </div>
              <div className="grid grid-cols-2 gap-y-2">
                <span className="text-slate-500">Ngày phẫu thuật</span>
                <span>{selectedPatient.surgeryDate}</span>

                <span className="text-slate-500">POD hiện tại</span>
                <span>POD {selectedPatient.pod}</span>

                <span className="text-slate-500">Pathway áp dụng</span>
                <span>{selectedPatient.pathway}</span>

                <span className="text-slate-500">Buồng/giường</span>
                <span>{selectedPatient.roomBed}</span>

                <span className="text-slate-500">Điều dưỡng phụ trách</span>
                <span>{selectedPatient.assignedNurse}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
