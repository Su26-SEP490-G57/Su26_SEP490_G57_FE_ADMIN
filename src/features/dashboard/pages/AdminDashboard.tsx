// Admin Dashboard — converted from Stitch HTML template

import { useState } from 'react'

const CHART_BARS = [40, 65, 55, 85, 95, 70, 45, 60, 80, 90]

const ROLE_DISTRIBUTION = [
    { label: 'Medical Staff', value: 640, percent: 51, color: 'bg-[#00459a]' },
    { label: 'Administrative', value: 310, percent: 25, color: 'bg-[#006a61]' },
    { label: 'Specialist Units', value: 298, percent: 24, color: 'bg-[#802f00]' },
]

const USERS = [
    { initials: 'AM', name: 'Alice Morrison', email: 'a.morrison@hospital.org', role: 'Charge Nurse', lastActivity: '2 mins ago', status: 'Active', statusBg: 'bg-[#86f2e4]/30 text-[#006a61]', dotColor: 'bg-[#006a61]', avatarBg: 'bg-[#d8e2ff] text-[#00459a]' },
    { initials: 'RE', name: 'Robert Evans', email: 'r.evans@hospital.org', role: 'Lead Pharmacist', lastActivity: '14 mins ago', status: 'Active', statusBg: 'bg-[#86f2e4]/30 text-[#006a61]', dotColor: 'bg-[#006a61]', avatarBg: 'bg-[#89f5e7] text-[#006a61]' },
    { initials: 'SC', name: 'Sarah Chen', email: 's.chen@hospital.org', role: 'IT Administrator', lastActivity: '2 days ago', status: 'Offline', statusBg: 'bg-[#e3e1ec]/30 text-[#727785]', dotColor: 'bg-[#727785]', avatarBg: 'bg-[#e3e1ec] text-[#424753]' },
]

const AUDIT_LOGS = [
    { type: 'Security', typeColor: 'text-[#00459a]', borderColor: 'border-[#00459a]', message: 'New admin role assigned to s.chen', time: 'Today, 09:12 AM' },
    { type: 'System', typeColor: 'text-[#424753]', borderColor: 'border-[#c2c6d5]', message: 'Auto-backup successful (S3-EU-1)', time: 'Today, 03:00 AM' },
    { type: 'Alert', typeColor: 'text-[#ba1a1a]', borderColor: 'border-[#ba1a1a]', message: 'Login attempt failed: IP 192.168.1.1', time: 'Yesterday, 11:45 PM' },
    { type: 'Protocol', typeColor: 'text-[#424753]', borderColor: 'border-[#c2c6d5]', message: 'Updated Patient Safety Directives v4.2', time: 'Yesterday, 04:30 PM' },
]

const PERMISSIONS = [
    { module: 'Patient Records', admin: true, physician: true, nurse: true },
    { module: 'System Settings', admin: true, physician: false, nurse: false },
    { module: 'Billing Access', admin: true, physician: false, nurse: false },
]

const NOTIFICATION_CHANNELS = [
    { icon: 'mail', label: 'Email Notifications', sub: 'Urgent reports and system summaries', defaultOn: true },
    { icon: 'sms', label: 'SMS Bridge', sub: 'Critical physiological alert forwarding', defaultOn: false },
    { icon: 'terminal', label: 'Webhook Integrations', sub: 'Forward logs to external SIEM tools', defaultOn: true },
]

export function AdminDashboard() {
    const [toggles, setToggles] = useState(
        NOTIFICATION_CHANNELS.map((c) => c.defaultOn)
    )

    return (
        <div className="space-y-8 p-8">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="flex flex-col justify-between rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#005cc8]/20 text-[#00459a]">
                            <span className="material-symbols-outlined">person_search</span>
                        </div>
                        <span className="rounded-full bg-[#86f2e4]/30 px-2 py-0.5 text-[10px] font-semibold text-[#006a61]">+12% vs LY</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">Active Staff</h3>
                        <p className="text-3xl font-bold text-[#1a1b22]">1,248</p>
                    </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#86f2e4]/20 text-[#006a61]">
                            <span className="material-symbols-outlined">web_asset</span>
                        </div>
                        <span className="rounded-full bg-[#ffdad6]/30 px-2 py-0.5 text-[10px] font-semibold text-[#ba1a1a]">-3% live</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">Active Sessions</h3>
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
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">Total Critical Alerts</h3>
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
                            <span className="text-[10px] font-semibold">Optimal</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">System Health</h3>
                        <p className="text-3xl font-bold text-[#1a1b22]">99.9%</p>
                    </div>
                </div>
            </div>

            {/* Activity + Role Distribution */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-[#c2c6d5]/50 bg-white/70 p-8 shadow-sm backdrop-blur-md lg:col-span-2">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[#1a1b22]">Hospital-Wide Activity</h2>
                            <p className="text-xs text-[#424753]">Real-time throughput and resource allocation monitoring</p>
                        </div>
                        <select className="rounded-lg border border-[#c2c6d5] bg-white px-3 py-1.5 text-xs">
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
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
                    <h2 className="mb-8 text-lg font-semibold text-[#1a1b22]">Role Distribution</h2>
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
                        View Matrix
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* User Management + Audit Logs */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="overflow-hidden rounded-2xl border border-[#c2c6d5] bg-white shadow-sm lg:col-span-3">
                    <div className="flex items-center justify-between border-b border-[#c2c6d5] bg-[#f4f2fd]/30 p-6">
                        <h2 className="text-lg font-semibold text-[#1a1b22]">User Management</h2>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-1 rounded-lg border border-[#c2c6d5] px-3 py-1.5 text-xs text-[#424753] transition-colors hover:bg-[#e8e7f1]">
                                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                                Filter
                            </button>
                            <button className="rounded-lg bg-[#00459a] px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90">
                                Add User
                            </button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-[#f4f2fd]/50">
                            <tr>
                                {['Member', 'Role', 'Last Activity', 'Status', 'Action'].map((h) => (
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

                {/* Audit Logs */}
                <div className="flex flex-col rounded-2xl border border-[#c2c6d5] bg-[#e3e1ec]/30 shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#c2c6d5] p-6">
                        <h2 className="text-lg font-semibold text-[#1a1b22]">Audit Logs</h2>
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
                        View All Logs
                    </button>
                </div>
            </div>

            {/* Permissions + Notifications */}
            <div className="grid grid-cols-1 gap-6 pb-8 md:grid-cols-2">
                {/* Permissions Matrix */}
                <div className="rounded-2xl border border-[#c2c6d5] bg-white p-8 shadow-sm">
                    <h2 className="mb-6 text-lg font-semibold text-[#1a1b22]">Permissions Matrix</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 border-b border-[#c2c6d5] pb-2 text-[10px] font-bold uppercase text-[#424753]">
                            <div className="col-span-1">Module</div>
                            <div className="text-center">Admin</div>
                            <div className="text-center">Physician</div>
                            <div className="text-center">Nurse</div>
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

                {/* Notification Channels */}
                <div className="rounded-2xl border border-[#c2c6d5] bg-white p-8 shadow-sm">
                    <h2 className="mb-6 text-lg font-semibold text-[#1a1b22]">Notification Channels</h2>
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
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${toggles[i] ? 'translate-x-5' : 'translate-x-0.5'}`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
