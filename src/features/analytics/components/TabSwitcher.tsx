import { useRef } from 'react'

export interface TabSwitcherItem<T extends string> {
  id: T
  label: string
}

interface TabSwitcherProps<T extends string> {
  tabs: TabSwitcherItem<T>[]
  activeTab: T
  onChange: (tab: T) => void
  disabled?: boolean
  className?: string
}

// TabSwitcher generic — role="tablist" chuan a11y, dieu huong bang phim
// Left/Right (roving tabIndex), duoc dieu khien hoan toan tu props (khong co
// state noi bo) vi parent can dong bo active tab len URL.
//
// Visual style copy tu HeadNurseDashboard.tsx (hang tab hardcoded truoc day)
// — gio la 1 component that su hoat dong.
export function TabSwitcher<T extends string>({ tabs, activeTab, onChange, disabled = false, className = '' }: TabSwitcherProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  function focusAndSelect(index: number) {
    const wrapped = (index + tabs.length) % tabs.length
    const tab = tabs[wrapped]
    if (!tab) return
    onChange(tab.id)
    buttonRefs.current[wrapped]?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (disabled) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusAndSelect(index + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusAndSelect(index - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      focusAndSelect(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      focusAndSelect(tabs.length - 1)
    }
  }

  return (
    <div role="tablist" className={`flex h-full gap-8 text-xs font-medium text-slate-500 ${className}`}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            ref={(el) => {
              buttonRefs.current[index] = el
            }}
            type="button"
            role="tab"
            id={`analytics-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`analytics-tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={disabled}
            onClick={() => !disabled && onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`h-full py-4 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isActive ? 'border-b-2 border-blue-600 text-blue-600' : 'hover:text-blue-600'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
