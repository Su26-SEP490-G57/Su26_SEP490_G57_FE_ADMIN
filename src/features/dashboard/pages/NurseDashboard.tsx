// Nurse Dashboard — converted from Stitch HTML template

const SYMPTOM_REPORTS = [
    {
        id: 1,
        name: 'Robert Chen (Rm 402)',
        time: '2m ago',
        description: 'Severe localized pain (8/10), increased heart rate.',
        status: 'CRITICAL',
        statusColor: 'bg-[#ba1a1a]',
        tags: [
            { label: 'CRITICAL', bg: 'bg-[#ffdad6]/20 text-[#ba1a1a]' },
            { label: 'POST-OP', bg: 'bg-[#e3e1ec] text-[#424753]' },
        ],
    },
    {
        id: 2,
        name: 'Sarah Miller (Rm 215)',
        time: '15m ago',
        description: 'Mild nausea reported following lunch intake.',
        status: 'STABLE',
        statusColor: 'bg-[#802f00]',
        tags: [{ label: 'STABLE', bg: 'bg-[#a73f00]/20 text-[#802f00]' }],
    },
    {
        id: 3,
        name: 'James Wilson (Rm 112)',
        time: '42m ago',
        description: 'Mobility exercises completed without fatigue.',
        status: 'IMPROVING',
        statusColor: 'bg-[#006a61]',
        tags: [{ label: 'IMPROVING', bg: 'bg-[#86f2e4]/20 text-[#006a61]' }],
    },
]

const PATIENTS = [
    {
        id: 1,
        name: 'Robert Chen',
        room: 'Rm 402 • ID: 8829',
        surgery: 'Hip Arthroplasty',
        pod: 'POD Day 2',
        score: 8.4,
        scorePercent: 84,
        scoreColor: 'text-[#ba1a1a]',
        barColor: 'bg-[#ba1a1a]',
        alert: 'CRITICAL',
        alertBg: 'bg-[#ffdad6] text-[#93000a]',
        critical: true,
    },
    {
        id: 2,
        name: 'Elena Rodriguez',
        room: 'Rm 405 • ID: 7721',
        surgery: 'Laparoscopy',
        pod: 'POD Day 1',
        score: 3.1,
        scorePercent: 31,
        scoreColor: 'text-[#802f00]',
        barColor: 'bg-[#802f00]',
        alert: 'STABLE',
        alertBg: 'bg-[#a73f00] text-[#ffd2c0]',
        critical: false,
    },
    {
        id: 3,
        name: 'Marcus Thorne',
        room: 'Rm 408 • ID: 9102',
        surgery: 'Cardiac Bypass',
        pod: 'POD Day 4',
        score: 1.8,
        scorePercent: 18,
        scoreColor: 'text-[#006a61]',
        barColor: 'bg-[#006a61]',
        alert: 'RECOVERING',
        alertBg: 'bg-[#86f2e4] text-[#006f66]',
        critical: false,
    },
]

const CHART_BARS = [
    { primary: 40, secondary: 60 },
    { primary: 55, secondary: 70 },
    { primary: 75, secondary: 85 },
    { primary: 90, secondary: 95 },
    { primary: 65, secondary: 80 },
]

export function NurseDashboard() {
    return (
        <div className="space-y-8 p-8">
            {/* Stats grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Active Patients */}
                <div className="rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-[#005cc8]/10 p-2">
                            <span className="material-symbols-outlined text-[#00459a]">bed</span>
                        </div>
                        <span className="text-xs font-bold text-[#006a61]">+4 since 08:00</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#424753]">Active Patients</p>
                    <h2 className="text-5xl font-bold text-[#1a1b22]">24</h2>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-[#e3e1ec]">
                        <div className="h-1.5 w-3/4 rounded-full bg-[#00459a]" />
                    </div>
                </div>

                {/* Unresolved Alerts */}
                <div className="rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-[#ffdad6]/20 p-2">
                            <span className="material-symbols-outlined text-[#ba1a1a]">warning</span>
                        </div>
                        <span className="pulse-indicator rounded-full bg-[#ba1a1a] px-2 py-0.5 text-[10px] font-bold text-white">
                            3 CRITICAL
                        </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#424753]">Unresolved Alerts</p>
                    <h2 className="text-5xl font-bold text-[#1a1b22]">12</h2>
                    <p className="mt-2 text-xs text-[#ba1a1a]">Avg. response time: 2.4m</p>
                </div>

                {/* High-Risk Patients */}
                <div className="rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-[#a73f00]/10 p-2">
                            <span className="material-symbols-outlined text-[#802f00]">assignment_late</span>
                        </div>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#424753]">High-Risk Patients</p>
                    <h2 className="text-5xl font-bold text-[#1a1b22]">08</h2>
                    <div className="mt-2 flex -space-x-2 overflow-hidden">
                        {['AM', 'JW', 'RC', '+5'].map((initials, i) => (
                            <div
                                key={i}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#e3e1ec] text-[9px] font-bold text-[#424753]"
                            >
                                {initials}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Discharges Today */}
                <div className="rounded-2xl border border-[#c2c6d5] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                        <div className="rounded-lg bg-[#86f2e4]/20 p-2">
                            <span className="material-symbols-outlined text-[#006a61]">event_available</span>
                        </div>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#424753]">Discharges Today</p>
                    <h2 className="text-5xl font-bold text-[#1a1b22]">05</h2>
                    <p className="mt-2 text-xs text-[#006a61]">92% Compliance rate</p>
                </div>
            </div>

            {/* Symptom stream + Patient table */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Symptom Stream */}
                <div className="flex h-[500px] flex-col overflow-hidden rounded-2xl border border-[#c2c6d5] bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#c2c6d5] p-6">
                        <h3 className="text-lg font-semibold text-[#1a1b22]">Symptom Stream</h3>
                        <span className="rounded bg-[#005cc8]/10 px-2 py-1 text-xs text-[#00459a]">Real-time</span>
                    </div>
                    <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto p-6">
                        {SYMPTOM_REPORTS.map((report) => (
                            <div
                                key={report.id}
                                className="flex cursor-pointer items-start gap-4 rounded-xl border border-[#c2c6d5] bg-[#f4f2fd] p-4 transition-colors hover:border-[#00459a]"
                            >
                                <div className={`h-12 w-2 flex-shrink-0 rounded-full ${report.statusColor}`} />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="text-xs font-bold text-[#1a1b22]">{report.name}</p>
                                        <span className="text-[10px] text-[#424753]">{report.time}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-[#424753]">{report.description}</p>
                                    <div className="mt-2 flex gap-1">
                                        {report.tags.map((tag) => (
                                            <span key={tag.label} className={`rounded px-2 py-0.5 text-[10px] font-bold ${tag.bg}`}>
                                                {tag.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Patient Oversight Table */}
                <div className="overflow-hidden rounded-2xl border border-[#c2c6d5] bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-[#c2c6d5] p-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[#1a1b22]">Patient Oversight</h3>
                            <p className="text-xs text-[#424753]">Unit A: Floor 4 North</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-1 rounded-lg bg-[#e8e7f1] px-4 py-2 text-xs font-bold text-[#1a1b22]">
                                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                                Filter
                            </button>
                            <button className="rounded-lg bg-[#00459a] px-4 py-2 text-xs font-bold text-white">
                                Export Logs
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#c2c6d5] bg-[#f4f2fd]">
                                    {['PATIENT NAME', 'SURGERY / POD', 'SYMPTOMS', 'ALERT', 'ACTIONS'].map((h) => (
                                        <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#424753]">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {PATIENTS.map((p) => (
                                    <tr
                                        key={p.id}
                                        className={`border-b border-[#c2c6d5] transition-colors hover:bg-[#f4f2fd] ${p.critical ? 'critical-glow' : ''}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#d8e2ff] text-sm font-bold text-[#00459a] ${p.critical ? 'grayscale' : ''}`}>
                                                        {p.name[0]}
                                                    </div>
                                                    {p.critical && (
                                                        <div className="pulse-indicator absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-[#ba1a1a]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#1a1b22]">{p.name}</p>
                                                    <p className="text-xs text-[#424753]">{p.room}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-[#1a1b22]">{p.surgery}</p>
                                            <p className="text-xs text-[#424753]">{p.pod}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xl font-bold ${p.scoreColor}`}>{p.score}</span>
                                                <div className="h-2 w-16 rounded-full bg-[#e3e1ec]">
                                                    <div className={`h-2 rounded-full ${p.barColor}`} style={{ width: `${p.scorePercent}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${p.alertBg}`}>
                                                {p.alert}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="rounded p-2 text-[#00459a] transition-colors hover:bg-[#e8e7f1]">
                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                            </button>
                                            <button className={`rounded p-2 transition-colors hover:bg-[#e8e7f1] ${p.critical ? 'text-[#ba1a1a]' : 'text-[#424753]'}`}>
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {p.critical ? 'emergency' : 'call'}
                                                </span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recovery Velocity Chart */}
            <div className="flex h-72 flex-col rounded-2xl border border-[#c2c6d5] bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#1a1b22]">Unit Recovery Velocity</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-full bg-[#00459a]" />
                            <span className="text-xs text-[#424753]">Pain Mgmt</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-3 w-3 rounded-full bg-[#006a61]" />
                            <span className="text-xs text-[#424753]">Mobility</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-1 items-end justify-between gap-6 px-4">
                    {CHART_BARS.map((bar, i) => (
                        <div key={i} className="relative flex h-full flex-1 rounded-lg bg-[#f4f2fd]">
                            <div
                                className="absolute bottom-0 left-1/4 w-4 rounded-t-sm bg-[#00459a]/60"
                                style={{ height: `${bar.primary}%` }}
                            />
                            <div
                                className="absolute bottom-0 right-1/4 w-4 rounded-t-sm bg-[#006a61]/60"
                                style={{ height: `${bar.secondary}%` }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
