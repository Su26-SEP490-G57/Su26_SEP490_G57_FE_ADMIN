import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmailAndPassword } from 'firebase/auth'
import {
    BarChart2,
    Eye,
    EyeOff,
    FileText,
    Loader2,
    Lock,
    LogIn,
    ShieldCheck,
    User,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ROUTES } from '../../../constants/routes'
import { auth } from '../../../lib/firebase'

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberDevice: z.boolean().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ---------------------------------------------------------------------------
// Stat card — left panel
// ---------------------------------------------------------------------------
function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-blue-200">{label}</span>
            <span className={`text-2xl font-bold tracking-tight ${highlight ? 'text-emerald-300' : 'text-white'}`}>
                {value}
            </span>
        </div>
    )
}

// ---------------------------------------------------------------------------
// LoginPage
// ---------------------------------------------------------------------------
export function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [authError, setAuthError] = useState<string | null>(null)

    const navigate = useNavigate()
    const location = useLocation()
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.DASHBOARD

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { rememberDevice: false },
    })

    async function onSubmit(values: LoginFormValues) {
        setIsLoading(true)
        setAuthError(null)
        try {
            await signInWithEmailAndPassword(auth, values.email, values.password)
            navigate(from, { replace: true })
        } catch {
            setAuthError('Invalid email or password. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh w-full font-sans">
            {/* Left panel */}
            <div className="animated-gradient relative hidden w-1/2 shrink-0 flex-col justify-between overflow-hidden p-10 lg:flex">
                {/* Radial glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />

                {/* Logo */}
                <div className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                        <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className="text-base font-semibold text-white">POMS</p>
                        <p className="text-[11px] font-medium uppercase tracking-widest text-blue-200">
                            Post-Operative Monitoring
                        </p>
                    </div>
                </div>

                {/* Dashboard preview card */}
                <div className="relative">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-blue-200" />
                                <span className="text-sm font-medium text-white">System Performance</span>
                            </div>
                            <div className="flex gap-1">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/40" />
                                ))}
                            </div>
                        </div>

                        {/* Fake chart bars */}
                        <div className="mb-5 flex h-20 items-end gap-1.5">
                            {[40, 65, 50, 80, 60, 90, 70, 85, 75, 95, 80, 88].map((h, i) => (
                                <div key={i} className="flex-1 rounded-sm bg-white/20" style={{ height: `${h}%` }} />
                            ))}
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                            <StatCard label="Surgical Unit" value="98.2%" />
                            <StatCard label="Recovery" value="+12%" highlight />
                            <StatCard label="Alerts" value="0" />
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <h2 className="text-2xl font-bold text-white">Post-Operative Care</h2>
                        <p className="mt-2 text-sm leading-relaxed text-blue-200">
                            Empowering clinicians with real-time recovery analytics
                            <br />
                            and streamlined patient flow management.
                        </p>
                    </div>
                </div>

                {/* Bottom badge */}
                <div className="relative flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-300" />
                    <span className="text-xs font-medium text-blue-200">ISO 27001 Certified Enterprise Platform</span>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-1 flex-col items-center justify-center bg-[#fbf8ff] px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Personnel Access</h1>
                        <p className="mt-1.5 text-sm text-gray-500">
                            Authenticated gateway for Thanh Nhan Hospital — Surgical Dept.
                        </p>
                    </div>

                    {/* Form card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Staff Email or ID
                                </label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </span>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="staff@hospital.org"
                                        {...register('email')}
                                        className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${errors.email ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                                            }`}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                        Secure Password
                                    </label>
                                    <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                        Reset Credentials?
                                    </button>
                                </div>
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                                        <Lock className="h-4 w-4 text-gray-400" />
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        {...register('password')}
                                        className={`w-full rounded-lg border bg-gray-50 py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${errors.password ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                            </div>

                            {/* Remember device */}
                            <label className="flex cursor-pointer items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    {...register('rememberDevice')}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Trust this workstation for 12 hours</span>
                            </label>

                            {/* Auth error */}
                            {authError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                    {authError}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-2.5 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Authorizing...
                                    </>
                                ) : (
                                    <>
                                        Authorize Session
                                        <LogIn className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Security notice */}
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                            <ShieldCheck className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Secure System</p>
                            <p className="text-xs text-gray-500">All access is logged and encrypted in real-time.</p>
                        </div>
                    </div>

                    {/* Legal */}
                    <p className="mt-4 text-center text-[11px] leading-relaxed text-gray-400">
                        Authorized Use Only. Unauthorized access attempts are monitored and will be prosecuted
                        under applicable data protection statutes.
                    </p>

                    {/* Footer links */}
                    <div className="mt-6 flex items-center justify-center gap-4">
                        {['Privacy Policy', 'Terms of Service', 'System Status'].map((link, i, arr) => (
                            <span key={link} className="flex items-center gap-4">
                                <button type="button" className="text-xs text-gray-400 hover:text-gray-600">
                                    {link}
                                </button>
                                {i < arr.length - 1 && <span className="h-1 w-1 rounded-full bg-gray-300" />}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
