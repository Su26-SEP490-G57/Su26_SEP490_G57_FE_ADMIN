// Head Nurse (Doctor) Dashboard — converted from Stitch HTML template

const HEATMAP_OPACITIES = [0.1, 0.3, 0.6, 0.9, 1.0, 0.3, 0.6,
    0.9, 0.1, 0.6, 1.0, 0.3, 0.9, 0.6,
    0.1, 1.0, 0.3, 0.6, 0.9, 0.1, 0.3,
    0.6, 0.9, 1.0, 0.1, 0.6, 0.3, 0.9,
    0.1, 0.6, 1.0, 0.3, 0.9, 0.6, 0.1]

const TOLERANCE_PATIENTS = [
    { id: 'PT-9042', procedure: 'Lap. Cholecystectomy', risk: 'Critical', riskColor: 'bg-[#ba1a1a]', tolerance: 15, action: 'Revise Protocol', actionStyle: 'text-[#00459a] font-bold hover:underline' },
    { id: 'PT-8831', procedure: 'Hip Arthroplasty', risk: 'Stable', riskColor: 'bg-[#006a61]', tolerance: 92, action: 'Monitor', actionStyle: 'text-[#424753] hover:text-[#1a1b22]' },
    { id: 'PT-7649', procedure: 'Colectomy', risk: 'Warning', riskColor: 'bg-[#a73f00]', tolerance: 55, action: 'Intervene', actionStyle: 'text-[#00459a] font-bold hover:underline' },
]

export function HeadNurseDashboard() {
    return (
        <div className="space-y-8 bg-[#f4f2fd] p-8">
            {/* Executive Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {[
                    { label: 'ERAS Compliance', value: '94.2%', badge: '+2.4%', badgeBg: 'bg-[#86f2e4] text-[#006a61]', icon: 'check_circle', iconColor: 'text-[#00459a]', sub: 'Average across 128 active protocols' },
                    { label: 'Complication Risk', value: '3.8%', badge: '-1.2%', badgeBg: 'bg-[#ffdad6] text-[#ba1a1a]', icon: 'warning', iconColor: 'text-[#ba1a1a]', sub: 'System-wide critical alerts (4 active)' },
                    { label: 'Recovery Pace', value: '1.2d', badge: 'Target: 1.5d', badgeBg: 'bg-[#eeedf7] text-[#424753]', icon: 'speed', iconColor: 'text-[#006a61]', sub: 'Mean duration until mobility milestone' },
                    { label: 'Readmission Prev.', value: '98.5%', badge: 'Optimal', badgeBg: 'bg-[#86f2e4] text-[#006a61]', icon: 'shield', iconColor: 'text-[#802f00]', sub: '30-day efficacy threshold maintained' },
                ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-[#c2c6d5] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                        <div className="mb-4 flex items-start justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#424753]">{stat.label}</span>
                            <span className={`material-symbols-outlined text-[20px] ${stat.iconColor}`}>{stat.icon}</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-5xl font-bold text-[#00459a]">{stat.value}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stat.badgeBg}`}>{stat.badge}</span>
                        </div>
                        <p className="mt-1 text-xs text-[#424753]">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Main bento grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Recovery Trajectory Chart */}
                <div className="col-span-12 flex flex-col rounded-xl border border-[#c2c6d5] bg-white p-6 shadow-sm lg:col-span-8">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h4 className="text-lg font-semibold text-[#1a1b22]">Recovery Trajectory Analytics</h4>
                            <p className="text-xs text-[#424753]">Post-operative physiological stabilization vs. expected baseline</p>
                        </div>
                        <div className="flex gap-2">
                            {['Vitals', 'Mobility', 'Tolerance'].map((tab, i) => (
                                <button
                                    key={tab}
                                    className={`rounded-full px-4 py-1 text-xs font-semibold ${i === 0 ? 'bg-[#d8e2ff] text-[#001a42]' : 'border border-[#c2c6d5] bg-white text-[#424753] hover:bg-[#eeedf7]'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="relative flex-1 group" style={{ minHeight: 200 }}>
                        <svg className="h-full w-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="line-grad" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#00459a" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#00459a" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <line x1="0" y1="50" x2="800" y2="50" stroke="#f1f1f1" strokeWidth="1" />
                            <line x1="0" y1="125" x2="800" y2="125" stroke="#f1f1f1" strokeWidth="1" />
                            <line x1="0" y1="200" x2="800" y2="200" stroke="#f1f1f1" strokeWidth="1" />
                            <path
                                d="M0,250 C100,230 150,180 200,190 C250,200 300,100 400,110 C500,120 600,50 700,70 L800,40"
                                fill="none"
                                stroke="#00459a"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <path
                                d="M0,250 C100,230 150,180 200,190 C250,200 300,100 400,110 C500,120 600,50 700,70 L800,40 L800,300 L0,300 Z"
                                fill="url(#line-grad)"
                            />
                            <circle cx="400" cy="110" r="6" fill="#00459a" className="animate-pulse" />
                        </svg>
                    </div>
                    <div className="mt-4 flex justify-between px-4 text-[10px] text-[#727785]">
                        {['Pre-Op', 'Day 0', 'Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5+'].map((d) => (
                            <span key={d}>{d}</span>
                        ))}
                    </div>
                </div>

                {/* Intervention Delta */}
                <div className="relative col-span-12 flex flex-col justify-between overflow-hidden rounded-xl bg-[#00459a] p-6 text-white lg:col-span-4">
                    <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <h4 className="text-lg font-semibold">Intervention Delta</h4>
                            <span className="material-symbols-outlined text-[#cfdcff]">bolt</span>
                        </div>
                        <p className="mt-1 text-xs opacity-80">Impact of Early Mobilization Prot.</p>
                        <div className="mt-8 space-y-4">
                            {[
                                { label: 'VTE Reduction', value: 88 },
                                { label: 'Fluid Balance', value: 72 },
                                { label: 'Opioid Sparing', value: 94 },
                            ].map((item) => (
                                <div key={item.label} className="rounded-lg border border-white/20 bg-white/10 p-4">
                                    <div className="mb-1 flex justify-between">
                                        <span className="text-xs">{item.label}</span>
                                        <span className="text-xs font-bold">{item.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                                        <div className="h-full rounded-full bg-[#89f5e7]" style={{ width: `${item.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button className="relative z-10 mt-8 w-full rounded-lg bg-white py-2 text-xs font-bold text-[#00459a] transition-colors hover:bg-white/90">
                        Apply Strategy to Unit B
                    </button>
                </div>

                {/* Compliance Heatmap */}
                <div className="col-span-12 overflow-hidden rounded-xl border border-[#c2c6d5] bg-white p-6 shadow-sm lg:col-span-4">
                    <div className="mb-6 flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-[#1a1b22]">Unit Compliance Grid</h4>
                        <button className="material-symbols-outlined text-[#424753] hover:text-[#00459a]">more_vert</button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {HEATMAP_OPACITIES.map((opacity, i) => (
                            <div
                                key={i}
                                className="aspect-square cursor-pointer rounded-sm transition-all hover:scale-110"
                                style={{ backgroundColor: `rgba(0, 90, 196, ${opacity})` }}
                            />
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-[#727785]">
                        <span>Low Compliance</span>
                        <div className="flex gap-0.5">
                            {[0.1, 0.4, 0.7, 1].map((o) => (
                                <div key={o} className="h-3 w-3 rounded-sm" style={{ backgroundColor: `rgba(0, 90, 196, ${o})` }} />
                            ))}
                        </div>
                        <span>Benchmark Met</span>
                    </div>
                    <p className="mt-6 text-xs italic text-[#424753]">
                        "Late-night medication delays observed in Ward 4 protocol adherence."
                    </p>
                </div>

                {/* Patient Tolerance Analytics */}
                <div className="col-span-12 rounded-xl border border-[#c2c6d5] bg-white p-6 shadow-sm lg:col-span-8">
                    <h4 className="mb-6 text-lg font-semibold text-[#1a1b22]">Patient Tolerance Analytics</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-[#c2c6d5] text-[10px] font-bold uppercase tracking-wider text-[#424753]">
                                <tr>
                                    {['Patient ID', 'Procedure', 'Risk Factor', 'Tolerance Level', 'Recommendation'].map((h) => (
                                        <th key={h} className="py-4 pr-6">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f4f2fd] text-sm text-[#1a1b22]">
                                {TOLERANCE_PATIENTS.map((p) => (
                                    <tr key={p.id} className="transition-colors hover:bg-[#f4f2fd]">
                                        <td className="py-4 pr-6 font-bold">{p.id}</td>
                                        <td className="py-4 px-6">{p.procedure}</td>
                                        <td className="py-4 px-6">
                                            <span className="flex items-center gap-1">
                                                <span className={`h-4 w-1 rounded-full ${p.riskColor}`} />
                                                {p.risk}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#e3e1ec]">
                                                <div className={`h-full ${p.riskColor}`} style={{ width: `${p.tolerance}%` }} />
                                            </div>
                                        </td>
                                        <td className="py-4 pl-6">
                                            <button className={`text-xs ${p.actionStyle}`}>{p.action}</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between py-8 text-[10px] text-[#727785]">
                <p>POMS Reporting System v1.0 • Encryption Active • Unit Central Branch</p>
                <div className="flex gap-6">
                    <span>Data Refresh: 1m ago</span>
                    <span className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#006a61]" />
                        Network Stable
                    </span>
                </div>
            </div>
        </div>
    )
}
