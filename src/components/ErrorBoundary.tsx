import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Label shown in the fallback UI, e.g. the page name — helps identify which panel crashed. */
  label?: string
  /** Small inline fallback (a single icon) instead of the full-page one — for small header/toolbar widgets like AlertBell. */
  compact?: boolean
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * This project uses <Routes>/<Route> (not createBrowserRouter), so React
 * Router's built-in `errorElement` isn't available — a manual class-based
 * boundary is the only way to catch render errors. Wrapped per-route in
 * routes/index.tsx so one page crashing (e.g. malformed API payload) doesn't
 * blank the entire dashboard for a nurse mid-shift.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info)
  }

  render() {
    if (this.state.error) {
      if (this.props.compact) {
        return (
          <span
            className="flex items-center justify-center p-1.5 text-slate-300"
            title={this.props.label ? `${this.props.label} gặp lỗi` : 'Đã xảy ra lỗi'}
          >
            <span className="material-symbols-outlined text-[22px]">error</span>
          </span>
        )
      }
      return (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="material-symbols-outlined text-[40px] text-red-400">error</span>
          <p className="font-semibold text-slate-700">
            {this.props.label ? `${this.props.label} gặp lỗi` : 'Đã xảy ra lỗi'}
          </p>
          <p className="max-w-md text-sm text-slate-400">
            Vui lòng tải lại trang. Nếu lỗi lặp lại, hãy báo cho quản trị viên.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded border border-blue-600 px-4 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            Tải lại trang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
