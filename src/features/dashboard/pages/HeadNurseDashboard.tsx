// Dashboard Điều dưỡng trưởng — ERAS Hậu phẫu
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend)

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const PRIORITY_PATIENTS = [
    { id: 'BN001', name: 'Nguyễn Văn A', pod: 'POD 2', pathway: 'Dạ dày', level: 'RED', symptoms: 'Buồn nôn nhiều, chướng bụng', time: '08:20', nurse: 'ĐD. Nguyễn Thị Hoa' },
    { id: 'BN008', name: 'Trần Thị B', pod: 'POD 1', pathway: 'Đại trực tràng', level: 'RED', symptoms: 'Nôn 2 lần, chưa trung tiện', time: '07:55', nurse: 'ĐD. Nguyễn Thị Hoa' },
    { id: 'BN012', name: 'Lê Văn C', pod: 'POD 2', pathway: 'Dạ dày', level: 'YELLOW', symptoms: 'Ăn uống kém', time: '07:40', nurse: 'ĐD. Trần Văn Nam' },
]

const ALERTS = [
    { time: '12/05/2025 08:20', id: 'BN001', content: 'Buồn nôn nhiều, chướng bụng nhiều', pod: 'POD 2 - Sáng', level: 'RED', status: 'Chưa xử lý', nurse: '-' },
    { time: '12/05/2025 07:55', id: 'BN008', content: 'Nôn 2 lần, chưa trung tiện', pod: 'POD 1 - Sáng', level: 'RED', status: 'Chưa xử lý', nurse: '-' },
    { time: '11/05/2025 15:10', id: 'BN015', content: 'Ăn uống kém, chướng bụng', pod: 'POD 2 - Chiều', level: 'YELLOW', status: 'Đã xử lý', nurse: 'ĐD. Trần Văn Nam' },
]

const POD_ROWS = [
    { pod: 0, date: '10/05', morning: null, afternoon: null, total: null, level: null, status: 'Chưa đánh giá' },
    { pod: 1, date: '11/05', morning: '3/10', afternoon: '3/10', total: 3, level: 'YELLOW', status: 'Đã đánh giá' },
    { pod: 2, date: '12/05', morning: '6/10', afternoon: null, total: 6, level: 'RED', status: 'Đang theo dõi', current: true },
    { pod: 3, date: '13/05', morning: null, afternoon: null, total: null, level: null, status: 'Chưa đánh giá' },
    { pod: 4, date: '14/05', morning: null, afternoon: null, total: null, level: null, status: 'Chưa đánh giá' },
]

// ---------------------------------------------------------------------------
// Chart configs
// ---------------------------------------------------------------------------
const donutData = {
    datasets: [{ data: [15, 6, 3], backgroundColor: ['#22c55e', '#fbbf24', '#ef4444'], borderWidth: 0 }],
}
const donutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' } as const

const barData = {
    labels: ['Phòng 301', 'Phòng 302', 'Phòng 303', 'Phòng 304', 'Phòng 305'],
    datasets: [{ data: [4, 5, 6, 4, 5], backgroundColor: ['#3b82f6', '#14b8a6', '#6366f1', '#eab308', '#ef4444'], borderRadius: 4, barThickness: 16 }],
}
const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 8 } } }, x: { grid: { display: false }, ticks: { font: { size: 8 } } } },
} as const

const lineData = {
    labels: ['POD 1 (S)', 'POD 1 (C)', 'POD 2 (S)'],
    datasets: [
        { label: 'Buồn nôn', data: [1.2, 0.8, 3.1], borderColor: '#ef4444', tension: 0, pointRadius: 3, borderWidth: 1.5 },
        { label: 'Nôn', data: [0.5, 0.5, 2.5], borderColor: '#eab308', tension: 0, pointRadius: 3, borderWidth: 1.5 },
        { label: 'Chướng bụng', data: [1, 0.8, 2], borderColor: '#a855f7', tension: 0, pointRadius: 3, borderWidth: 1.5 },
        { label: 'Ăn uống', data: [2, 2.1, 1.3], borderColor: '#3b82f6', tension: 0, pointRadius: 3, borderWidth: 1.5 },
        { label: 'Trung tiện', data: [0, 0.1, 0.2], borderColor: '#14b8a6', tension: 0, pointRadius: 3, borderWidth: 1.5 },
    ],
}
const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
        y: { beginAtZero: true, max: 4, ticks: { stepSize: 1, font: { size: 8 } }, grid: { color: '#f1f5f9' } },
        x: { ticks: { font: { size: 8 } }, grid: { display: false } },
    },
} as const

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
function LevelBadge({ level }: { level: string }) {
    const map: Record<string, string> = {
        RED: 'bg-red-500 text-white',
        YELLOW: 'bg-yellow-400 text-white',
        GREEN: 'bg-green-500 text-white',
    }
    return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${map[level] ?? 'bg-slate-200 text-slate-600'}`}>{level}</span>
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function HeadNurseDashboard() {
    return (
        <div className="p-6 space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-end gap-4">
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <span className="material-symbols-outlined text-[18px] text-blue-600">calendar_today</span>
                    <span className="text-sm font-medium">Hôm nay, 12/05/2025</span>
                    <span className="material-symbols-outlined cursor-pointer text-[14px] text-slate-400">sync</span>
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">
                    <span className="material-symbols-outlined text-[18px] text-slate-500">filter_list</span>
                    Bộ lọc
                    <span className="material-symbols-outlined text-[14px] text-slate-400">expand_more</span>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {/* Tổng số */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <span className="material-symbols-outlined text-[22px]">group</span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Tổng số người bệnh</p>
                        <p className="text-2xl font-bold">24</p>
                        <p className="text-[10px] text-blue-600">Đang theo dõi</p>
                    </div>
                </div>
                {/* GREEN */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-500">
                        <span className="material-symbols-outlined text-[22px]">check_circle</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                            <span className="text-[10px] font-bold text-green-600">GREEN</span>
                            <span className="text-xl font-bold">15</span>
                        </div>
                        <p className="text-[10px] text-slate-400">62.5%</p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-green-500" style={{ width: '62.5%' }} /></div>
                    </div>
                </div>
                {/* YELLOW */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-500">
                        <span className="material-symbols-outlined text-[22px]">error</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                            <span className="text-[10px] font-bold text-yellow-600">YELLOW</span>
                            <span className="text-xl font-bold">6</span>
                        </div>
                        <p className="text-[10px] text-slate-400">25.0%</p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-yellow-400" style={{ width: '25%' }} /></div>
                    </div>
                </div>
                {/* RED */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <span className="material-symbols-outlined text-[22px]">warning</span>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                            <span className="text-[10px] font-bold text-red-600">RED</span>
                            <span className="text-xl font-bold">3</span>
                        </div>
                        <p className="text-[10px] text-slate-400">12.5%</p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-red-500" style={{ width: '12.5%' }} /></div>
                    </div>
                </div>
                {/* Alert */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <span className="material-symbols-outlined text-[22px]">notifications</span>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500">Alert chưa xử lý</p>
                        <p className="text-2xl font-bold">2</p>
                        <a href="#" className="flex items-center gap-1 text-[10px] text-blue-600 hover:underline">Xem chi tiết <span className="material-symbols-outlined text-[12px]">arrow_forward</span></a>
                    </div>
                </div>
                {/* Đánh giá */}
                <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <span className="material-symbols-outlined text-[22px]">assignment</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-medium text-slate-500">Đánh giá hôm nay</p>
                        <p className="text-2xl font-bold">18/24</p>
                        <p className="text-[10px] text-slate-400">75% hoàn thành</p>
                    </div>
                </div>
            </div>

            {/* Priority table + Charts */}
            <div className="grid grid-cols-12 gap-6">
                {/* Priority Patients Table */}
                <div className="col-span-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 p-4">
                        <h3 className="flex items-center gap-2 font-bold text-slate-800">
                            Người bệnh cần ưu tiên
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">3</span>
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                                <tr>
                                    {['Mã BN', 'Họ tên', 'POD', 'Pathway', 'Mức AI', 'Triệu chứng nổi bật', 'Thời gian', 'Điều dưỡng phụ trách', ''].map((h) => (
                                        <th key={h} className="px-4 py-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {PRIORITY_PATIENTS.map((p) => (
                                    <tr key={p.id}>
                                        <td className={`px-4 py-3 font-bold ${p.level === 'RED' ? 'text-red-500' : 'text-yellow-500'}`}>{p.id}</td>
                                        <td className="px-4 py-3">{p.name}</td>
                                        <td className="px-4 py-3">{p.pod}</td>
                                        <td className="px-4 py-3 text-xs">{p.pathway}</td>
                                        <td className="px-4 py-3"><LevelBadge level={p.level} /></td>
                                        <td className="px-4 py-3 text-xs">{p.symptoms}</td>
                                        <td className="px-4 py-3 text-xs">{p.time}</td>
                                        <td className="px-4 py-3 text-xs">{p.nurse}</td>
                                        <td className="px-4 py-3 text-center text-slate-400 cursor-pointer">
                                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-slate-100 p-3 text-center">
                        <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                            Xem tất cả <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                    </div>
                </div>

                {/* Charts */}
                <div className="col-span-4 grid grid-cols-2 gap-4">
                    {/* Donut */}
                    <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="mb-4 w-full text-xs font-bold text-slate-700">Phân bố mức AI</h4>
                        <div className="relative mb-4 h-28 w-28">
                            <Doughnut data={donutData} options={donutOptions} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold">24</span>
                                <span className="text-[8px] text-slate-400">người bệnh</span>
                            </div>
                        </div>
                        <div className="w-full space-y-1 px-2">
                            {[{ color: 'bg-green-500', label: 'GREEN', val: '15 (62.5%)' }, { color: 'bg-yellow-400', label: 'YELLOW', val: '6 (25.0%)' }, { color: 'bg-red-500', label: 'RED', val: '3 (12.5%)' }].map((item) => (
                                <div key={item.label} className="flex items-center justify-between text-[10px]">
                                    <div className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${item.color}`} />{item.label}:</div>
                                    <span className="font-medium">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Bar */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h4 className="mb-4 text-xs font-bold text-slate-700">Phân bố theo phòng</h4>
                        <div className="h-44"><Bar data={barData} options={barOptions} /></div>
                    </div>
                </div>
            </div>

            {/* Patient Detail Card */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {/* Tabs */}
                <div className="flex items-center border-b border-slate-200 px-6">
                    <h3 className="mr-6 flex items-center gap-2 py-4 font-bold text-slate-800">
                        Chi tiết người bệnh: BN001 - Nguyễn Văn A
                        <LevelBadge level="RED" />
                    </h3>
                    <div className="flex h-full gap-8 text-xs font-medium text-slate-500">
                        {['Tổng quan', 'Timeline POD', 'Biểu đồ triệu chứng', 'Đánh giá', 'Alert & Xử trí', 'Ghi chú điều dưỡng', 'Hồ sơ'].map((tab, i) => (
                            <button key={tab} className={`h-full py-4 hover:text-blue-600 ${i === 0 ? 'border-b-2 border-blue-600 text-blue-600' : ''}`}>{tab}</button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6 p-6">
                    {/* General Info */}
                    <div className="col-span-3">
                        <h4 className="mb-4 flex items-center gap-2 text-xs font-bold text-blue-600">Thông tin chung</h4>
                        <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-xs">
                            {[
                                ['Mã người bệnh', 'BN001'], ['Họ tên', 'Nguyễn Văn A'], ['Tuổi', '58'], ['Giới tính', 'Nam'],
                                ['Ngày phẫu thuật', '10/05/2025'], ['Pathway', 'Gastric pathway'], ['BMI', '22.1'],
                                ['Điều dưỡng phụ trách', 'ĐD. Nguyễn Thị Hoa'], ['Bác sĩ phụ trách', 'BS. Trần Văn Nam'],
                            ].map(([label, value]) => (
                                <div key={label} className="flex justify-between">
                                    <span className="text-slate-500">{label}</span>
                                    <span className="font-medium">{value}</span>
                                </div>
                            ))}
                            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-blue-600 py-2 text-xs font-bold text-blue-600">
                                Xem hồ sơ đầy đủ
                            </button>
                        </div>
                    </div>

                    {/* POD Table */}
                    <div className="col-span-4">
                        <h4 className="mb-4 text-xs font-bold text-blue-600">Tiến trình đánh giá</h4>
                        <div className="overflow-hidden rounded-lg border border-slate-100">
                            <table className="w-full text-[10px]">
                                <thead className="border-b border-slate-100 bg-slate-50 font-bold text-slate-500">
                                    <tr>
                                        {['POD', 'Sáng', 'Chiều', 'Tổng điểm', 'Mức AI', 'Trạng thái'].map((h) => (
                                            <th key={h} className="p-2 text-center">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-center">
                                    {POD_ROWS.map((row) => (
                                        <tr key={row.pod} className={row.current ? 'bg-blue-50' : ''}>
                                            <td className="p-2 font-bold">{row.pod}<br /><span className={`font-normal ${row.current ? 'text-red-500' : 'text-slate-400'}`}>{row.date}</span></td>
                                            <td className={`p-2 ${row.current ? 'bg-red-50 font-bold text-red-600' : ''}`}>{row.morning ?? '-'}</td>
                                            <td className="p-2">{row.afternoon ?? (row.current ? <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white"><span className="material-symbols-outlined text-[10px]">add</span></div> : '-')}</td>
                                            <td className={`p-2 font-bold ${row.level === 'RED' ? 'text-red-600' : ''}`}>{row.total ?? '-'}</td>
                                            <td className="p-2">{row.level ? <LevelBadge level={row.level} /> : '-'}</td>
                                            <td className={`p-2 font-medium ${row.status === 'Đã đánh giá' ? 'text-green-600' : row.status === 'Đang theo dõi' ? 'text-red-600' : 'text-slate-400'}`}>{row.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Line Chart */}
                    <div className="col-span-3">
                        <h4 className="mb-4 text-xs font-bold text-blue-600">Biểu đồ triệu chứng (POD 1 → POD 2 sáng)</h4>
                        <div className="relative mb-2 h-44"><Line data={lineData} options={lineOptions} /></div>
                        <div className="mt-4 flex flex-wrap gap-2 text-[8px] text-slate-500">
                            {[['bg-red-500', 'Buồn nôn'], ['bg-yellow-500', 'Nôn'], ['bg-purple-500', 'Chướng bụng'], ['bg-blue-500', 'Ăn uống'], ['bg-teal-500', 'Trung tiện']].map(([color, label]) => (
                                <div key={label} className="flex items-center gap-1"><span className={`h-0.5 w-4 ${color}`} />{label}</div>
                            ))}
                        </div>
                        <p className="mt-2 text-[9px] text-slate-400">Giải thích: 0 = Không, 1 = Nhẹ, 2 = Vừa, 3 = Nhiều</p>
                    </div>

                    {/* Alert + Quick Actions */}
                    <div className="col-span-2 space-y-4">
                        <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                            <div className="mb-2 flex items-start justify-between">
                                <span className="text-[10px] font-bold text-red-600">Alert mới nhất</span>
                                <LevelBadge level="RED" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-700">12/05/2025 08:20 (POD 2 - Sáng)</p>
                            <p className="mb-2 text-[10px] text-slate-600">Buồn nôn nhiều, chướng bụng nhiều</p>
                            <p className="text-[10px] font-bold">Tổng điểm: 6/10</p>
                            <button className="mt-2 w-full text-[10px] font-bold text-blue-600 hover:underline">Xem chi tiết alert</button>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-700">Hành động nhanh</p>
                            <button className="flex w-full items-center justify-center gap-2 rounded bg-green-600 py-1.5 text-[10px] font-bold text-white">
                                <span className="material-symbols-outlined text-[14px]">play_circle</span> Tiếp tục theo dõi
                            </button>
                            <button className="flex w-full items-center justify-center gap-2 rounded bg-yellow-500 py-1.5 text-[10px] font-bold text-white">
                                <span className="material-symbols-outlined text-[14px]">pause_circle</span> Giữ POD hiện tại
                            </button>
                            <button className="flex w-full items-center justify-center gap-2 rounded bg-red-600 py-1.5 text-[10px] font-bold text-white">
                                <span className="material-symbols-outlined text-[14px]">medical_services</span> Báo bác sĩ
                            </button>
                            <button className="flex w-full items-center justify-center gap-2 rounded border border-slate-300 py-1.5 text-[10px] font-bold text-slate-700">
                                <span className="material-symbols-outlined text-[14px]">edit_note</span> Ghi chú điều dưỡng
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Alert List */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h3 className="flex items-center gap-2 font-bold text-slate-800">
                        Danh sách alert
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">3</span>
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                            <tr>
                                {['Thời gian', 'Mã BN', 'Nội dung', 'POD', 'Mức độ', 'Trạng thái', 'Điều dưỡng xử lý', 'Thao tác'].map((h) => (
                                    <th key={h} className="px-6 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {ALERTS.map((a, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4">{a.time}</td>
                                    <td className="px-6 py-4 font-bold">{a.id}</td>
                                    <td className="px-6 py-4">{a.content}</td>
                                    <td className="px-6 py-4">{a.pod}</td>
                                    <td className="px-6 py-4"><LevelBadge level={a.level} /></td>
                                    <td className={`px-6 py-4 font-bold ${a.status === 'Chưa xử lý' ? 'text-red-500' : 'text-green-600'}`}>{a.status}</td>
                                    <td className="px-6 py-4">{a.nurse}</td>
                                    <td className="px-6 py-4 text-center">
                                        {a.status === 'Chưa xử lý'
                                            ? <button className="rounded border border-red-500 px-3 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50">Xử lý</button>
                                            : <button className="text-[10px] font-bold text-blue-600 hover:underline">Xem</button>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-slate-100 p-3 text-center">
                    <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
                        Xem tất cả alert <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </a>
                </div>
            </section>
        </div>
    )
}
