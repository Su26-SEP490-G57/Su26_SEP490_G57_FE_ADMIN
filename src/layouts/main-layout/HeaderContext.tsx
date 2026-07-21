import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface HeaderContextType {
    actions: ReactNode
    setActions: (actions: ReactNode) => void
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined)

export function HeaderProvider({ children }: { children: ReactNode }) {
    const [actions, setActions] = useState<ReactNode>(null)

    return (
        <HeaderContext.Provider value={{ actions, setActions }}>
            {children}
        </HeaderContext.Provider>
    )
}

export function useHeaderContext() {
    const context = useContext(HeaderContext)
    if (!context) {
        throw new Error('useHeaderContext must be used within HeaderProvider')
    }
    return context
}

// Hook để child pages có thể inject actions vào header
export function useHeaderActions(actions: ReactNode) {
    const { setActions } = useHeaderContext()

    useEffect(() => {
        setActions(actions)
        return () => setActions(null)
    }, [actions, setActions])
}
