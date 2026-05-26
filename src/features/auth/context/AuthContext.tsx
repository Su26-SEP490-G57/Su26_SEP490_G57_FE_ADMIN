import type { User } from 'firebase/auth'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../../../lib/firebase'

interface AuthContextValue {
    user: User | null
    isLoading: boolean
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Firebase listener — tự động cập nhật khi auth state thay đổi
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser)
            setIsLoading(false)
        })

        return unsubscribe
    }, [])

    async function logout() {
        await signOut(auth)
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
