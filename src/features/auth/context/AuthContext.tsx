import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect } from 'react'
import { auth } from '../../../lib/firebase'
import { useAuthStore } from '../store/authStore'

interface AuthContextValue {
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
    const { setUser, setLoading, clearSession } = useAuthStore()

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                // TODO: fetch role from Firebase custom claims or BE
                // const token = await firebaseUser.getIdTokenResult()
                // setRole(token.claims.role as UserRole)
            } else {
                clearSession()
            }
            setLoading(false)
        })

        return unsubscribe
    }, [setUser, setLoading, clearSession])

    async function logout() {
        await signOut(auth)
        clearSession()
    }

    return (
        <AuthContext.Provider value={{ logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
