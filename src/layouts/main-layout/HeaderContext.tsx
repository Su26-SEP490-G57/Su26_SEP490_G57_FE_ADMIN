import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface HeaderContextType {
  actions: ReactNode
  setActions: (actions: ReactNode) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null)

  return <HeaderContext.Provider value={{ actions, setActions }}>{children}</HeaderContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHeaderContext() {
  const context = useContext(HeaderContext)
  if (!context) {
    throw new Error('useHeaderContext must be used within HeaderProvider')
  }
  return context
}

// Hook để child pages có thể inject actions vào header
// Sử dụng useRef để tránh setActions lặp lại khi actions reference thay đổi nhưng nội dung giống nhau
// eslint-disable-next-line react-refresh/only-export-components
export function useHeaderActions(actions: ReactNode) {
  const { setActions } = useHeaderContext()
  const prevActionsRef = useRef<ReactNode>(null)

  useEffect(() => {
    // Chỉ cập nhật nếu actions thực sự khác (reference khác)
    if (prevActionsRef.current !== actions) {
      prevActionsRef.current = actions
      setActions(actions)
    }
    return () => {
      // Chỉ clear nếu actions hiện tại vẫn là của component này
      if (prevActionsRef.current === actions) {
        setActions(null)
        prevActionsRef.current = null
      }
    }
  }, [actions, setActions])
}
