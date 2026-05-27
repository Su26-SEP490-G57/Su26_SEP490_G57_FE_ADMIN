// Dashboard Quản trị viên

import { useState } from 'react'

const CHART_BARS = [40, 65, 55, 85, 95, 70, 45, 60, 80, 90]

const ROLE_DISTRIBUTION = [
    { label: 'Nhân viên y tế', value: 640, percent: 51, color: 'bg-[#00459a]' },
    { label: 'Hành chính', value: 310, percent: 25, color: 'bg-[#006a61]' },
    { label: 'Đơn vị chuyên khoa', value: 298, percent: 24, color: 'bg-[#802f00]' },
]

const USERS = [
    { initials: 'AN', name: 'Nguyễn Thị An', email: 'an.nguyen@hospital.org', role: 'Điều dưỡng trưởng', lastActivity: '2 phút trước', status: 'Đang hoạt động', statusBg: 'bg-[#86f2e4]/30 text-[#006a61]', dotColor: 'bg-[#006a61]', avatarBg: 'bg-[#d8e2ff] text-[#00459a]' },
    { initials: 'BM', name: 'Trần Văn Minh', email: 'minh.tran@hospital.org', role: 'Dược sĩ trưởng', lastActivity: '14 phút trước', status: 'Đang hoạt động', statusBg: 'bg-[#86f2e4]/30 text-[#006a61]', dotColor: 'bg-[#006a61]', avatarBg: 'bg-[#89f5e7] text-[#006a61]' },
    { initials: 'LH', name: 'Lê Thị Hương', email: 'huong.le@hospital.org', role: 'Quản trị CNTT', lastActivity: '2 ngày trước', status: 'Ngoại tuyến', statusBg: 'bg-[#e3e1ec]/30 text-[#727785]', dotColor: 'bg-[#727785]', avatarBg: 'bg-[#e3e1ec] text-[#424753]' },
]

const AUDIT_LOGS = [
    { type: 'Bảo mật', typeColor: 'text-[#00459a]', borderColor: 'border-[#00459a]', message: 'Gán quyền quản trị cho huong.le', time: 'Hôm nay, 09:12' },
    { type: 'Hệ thống', typeColor: 'text-[#424753]', borderColor: 'border-[#c2c6d5]', message: 'Sao lưu tự động thành công (S3-EU-1)', time: 'Hôm nay, 03:00' },
    { type: 'Cảnh báo', typeColor: 'text-[#ba1a1a]', borderColor: 'border-[#ba1a1a]', message: 'Đăng nhập thất bại: IP 192.168.1.1', time: 'Hôm qua, 23:45' },
    { type: 'Phác đồ', typeColor: 'text-[#424753]', borderColor: 'border-[#c2c6d5]', message: 'Cập nhật Chỉ thị An toàn Bệnh nhân v4.2', time: 'Hôm qua, 16:30' },
]

const PERMISSIONS = [
    { module: 'Hồ sơ bệnh nhân', admin: true, physician: true, nurse: true },
    { module: 'Cài đặt hệ thống', admin: true, physician: false, nurse: false },
    { module: 'Truy cập thanh toán', admin: true, physician: false, nurse: false },
]

const NOTIFICATION_CHANNELS = [
    { icon: 'mail', label: 'Thông báo qua Email', sub: 'Báo cáo khẩn và tóm tắt hệ thống', defaultOn: true },
    { icon: 'sms', label: 'Cầu nối SMS', sub: 'Chuyển tiếp cảnh báo sinh lý nghiêm trọng', defaultOn: false },
    { icon: 'terminal', label: 'Tích hợp Webhook', sub: 'Chuyển nhật ký đến công cụ SIEM bên ngoài', defaultOn: true },
]

export function AdminDashboard() {
    const [toggles, setToggles] = useState(
        NOTIFICATION_CHANNELS.map((c) => c.defaultOn)
    )

    return (
        <div className="space-y-8 p-8">
            {/* Thống kê */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="flex flex-col justify-between rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005cc8]/20 text-[#00459a]">
                            <span className="material-symbols-outlined">person_search</span>
                        </div>
                        <span className="rounded-full bg-[#86f2e4]/30 px-2 py-0.5 text-[10px] font-semibold text-[#006a61]">+12% so với năm trước</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">Nhân viên đang hoạt động</h3>
                        <p className="text-3xl font-bold text-[#1a1b22]">1.248</p>
                    </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#86f2e4]/20 text-[#006a61]">
                            <span className="material-symbols-outlined">web_asset</span>
                        </div>
                        <span className="rounded-full bg-[#ffdad6]/30 px-2 py-0.5 text-[10px] font-semibold text-[#ba1a1a]">-3% trực tiếp</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">Phiên đang hoạt động</h3>
                        <p className="text-3xl font-bold text-[#1a1b22]">432</p>
                    </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[#c2c6d5] border-l-4 border-l-[#ba1a1a] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffdad6]/20 text-[#ba1a1a]">
                            <span className="material-symbols-outlined">report_problem</span>
                        </div>
                        <div className="h-6 w-6 animate-pulse rounded-full border-2 border-white bg-[#ba1a1a]" />
                    </div>
                    <div className="mt-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">Tổng cảnh báo nghiêm trọng</h3>
                        <p className="text-3xl font-bold text-[#ba1a1a]">14</p>
                    </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a73f00]/20 text-[#802f00]">
                            <span className="material-symbols-outlined">dns</span>
                        </div>
                        <div className="flex items-center gap-1 text-[#006a61]">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span className="text-[10px] font-semibold">Tối ưu</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">Tình trạng hệ thống</h3>
                        <p className="text-3xl font-bold text-[#1a1b22]">99.9%</p>
                    </div>
                </div>
            </div>

            {/* Hoạt động + Phân phối vai trò */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-[#c2c6d5]/50 bg-white/70 p-8 shadow-sm backdrop-blur-md lg:col-span-2">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[#1a1b22]">Hoạt động toàn bệnh viện</h2>
                            <p className="text-xs text-[#424753]">Giám sát thông lượng và phân bổ nguồn lực theo thời gian thực</p>
                        </div>
                        <select className="rounded-lg border border-[#c2c6d5] bg-white px-3 py-1.5 text-xs">
                            <option>24 giờ qua</option>
                            <option>7 ngày qua</option>
                        </select>
                    </div>
                    <div className="relative flex h-64 items-end gap-2 px-2">
                        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2 opacity-20">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-px w-full border-t border-[#727785]" />
                            ))}
                        </div>
                        {CHART_BARS.map((h, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-t transition-all duration-300 hover:bg-[#00459a] ${i === 9 ? 'border-t-2 border-[#00459a] bg-[#00459a]/30' : 'bg-[#00459a]/20'}`}
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col rounded-2xl border border-[#c2c6d5] bg-white p-8 shadow-sm">
                    <h2 className="mb-8 text-lg font-semibold text-[#1a1b22]">Phân phối vai trò</h2>
                    <div className="flex flex-1 flex-col justify-center gap-6">
                        {ROLE_DISTRIBUTION.map((r) => (
                            <div key={r.label} className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-[#424753]">{r.label}</span>
                                    <span className="font-bold text-[#1a1b22]">{r.value}</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-[#e3e1ec]">
                                    <div className={`h-full ${r.color}`} style={{ width: `${r.percent}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="mt-8 flex items-center gap-1 text-xs font-bold text-[#00459a] transition-all hover:gap-2">
                        Xem ma trận
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Quản lý người dùng + Nhật ký kiểm tra */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="overflow-hidden rounded-2xl border border-[#c2c6d5] bg-white shadow-sm lg:col-span-3">
                    <div className="flex items-center justify-between border-b border-[#c2c6d5] bg-[#f4f2fd]/30 p-6">
                        <h2 className="text-lg font-semibold text-[#1a1b22]">Quản lý người dùng</h2>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-1 rounded-lg border border-[#c2c6d5] px-3 py-1.5 text-xs text-[#424753] transition-colors hover:bg-[#e8e7f1]">
                                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                                Lọc
                            </button>
                            <button className="rounded-lg bg-[#00459a] px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90">
                                Thêm người dùng
                            </button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-[#f4f2fd]/50">
                            <tr>
                                {['Thành viên', 'Vai trò', 'Hoạt động gần nhất', 'Trạng thái', 'Thao tác'].map((h) => (
                                    <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#424753]">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#c2c6d5]">
                            {USERS.map((u) => (
                                <tr key={u.email} className="transition-colors hover:bg-[#f4f2fd]/30">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${u.avatarBg}`}>
                                                {u.initials}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-[#1a1b22]">{u.name}</div>
                                                <div className="text-xs text-[#424753]">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#1a1b22]">{u.role}</td>
                                    <td className="px-6 py-4 text-sm text-[#424753]">{u.lastActivity}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${u.statusBg}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${u.dotColor}`} />
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="material-symbols-outlined text-[#727785] transition-colors hover:text-[#00459a]">
                                            more_horiz
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Nhật ký kiểm tra */}
                <div className="flex flex-col rounded-2xl border border-[#c2c6d5] bg-[#e3e1ec]/30 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#c2c6d5] p-6">
                        <h2 className="text-lg font-semibold text-[#1a1b22]">Nhật ký kiểm tra</h2>
                        <span className="material-symbols-outlined text-[20px] text-[#727785]">history</span>
                    </div>
                    <div className="custom-scrollbar max-h-[450px] flex-1 space-y-4 overflow-y-auto p-6">
                        {AUDIT_LOGS.map((log, i) => (
                            <div key={i} className={`border-l-2 pb-4 pl-4 ${log.borderColor}`}>
                                <div className={`text-[10px] font-bold ${log.typeColor}`}>{log.type}</div>
                                <div className="text-sm font-medium text-[#1a1b22]">{log.message}</div>
                                <div className="text-xs text-[#424753]">{log.time}</div>
                            </div>
                        ))}
                    </div>
                    <button className="border-t border-[#c2c6d5] p-6 text-center text-xs font-bold text-[#424753] transition-colors hover:bg-[#e8e7f1]">
                        Xem tất cả nhật ký
                    </button>
                </div>
            </div>

            {/* Phân quyền + Kênh thông báo */}
            <div className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-2">
                {/* Ma trận phân quyền */}
                <div className="rounded-2xl border border-[#c2c6d5] bg-white p-8 shadow-sm">
                    <h2 className="mb-6 text-lg font-semibold text-[#1a1b22]">Ma trận phân quyền</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 border-b border-[#c2c6d5] pb-2 text-[10px] font-bold uppercase text-[#424753]">
                            <div className="col-span-1">Phân hệ</div>
                            <div className="text-center">Quản trị</div>
                            <div className="text-center">Bác sĩ</div>
                            <div className="text-center">Điều dưỡng</div>
                        </div>
                        {PERMISSIONS.map((p) => (
                            <div key={p.module} className="grid grid-cols-4 items-center gap-4 py-1">
                                <div className="col-span-1 text-sm font-medium text-[#1a1b22]">{p.module}</div>
                                {[p.admin, p.physician, p.nurse].map((allowed, i) => (
                                    <div key={i} className="flex justify-center">
                                        <span className={`material-symbols-outlined text-[20px] ${allowed ? 'text-[#006a61]' : 'text-[#c2c6d5]'}`}>
                                            {allowed ? 'check_circle' : 'cancel'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kênh thông báo */}
                <div className="rounded-2xl border border-[#c2c6d5] bg-white p-8 shadow-sm">
                    <h2 className="mb-6 text-lg font-semibold text-[#1a1b22]">Kênh thông báo</h2>
                    <div className="space-y-8">
                        {NOTIFICATION_CHANNELS.map((channel, i) => (
                            <div key={channel.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e8e7f1]">
                                        <span className="material-symbols-outlined text-[#00459a]">{channel.icon}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-[#1a1b22]">{channel.label}</div>
                                        <div className="text-xs text-[#424753]">{channel.sub}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setToggles((prev) => prev.map((v, idx) => idx === i ? !v : v))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${toggles[i] ? 'bg-[#00459a]' : 'bg-[#c2c6d5]'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${toggles[i] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
