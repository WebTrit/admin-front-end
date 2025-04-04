import {create} from "zustand"
import {persist} from "zustand/middleware"
import {jwtDecode} from "jwt-decode"

// Define the store state type
interface AppState {
    // Auth state
    isAuthenticated: boolean
    usersList: any[]
    tenantId: string | null
    token: string | null
    isSuperTenant: boolean

    // Actions
    setAuthenticated: (isAuthenticated: boolean) => void
    setUsersList: (user: AppState["usersList"]) => void
    setTenantId: (tenantId: string) => void
    setToken: (token: string) => void
    clearAuth: () => void
    checkAuth: () => boolean
    setIsSuperTenant: (isSuperTenant: boolean) => void
}

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: any = jwtDecode(token)
        const currentTime = Date.now() / 1000
        return decoded.exp < currentTime
    } catch {
        return true
    }
}

// Create the store with persistence
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            // Initial state
            isAuthenticated: !!localStorage.getItem("token"),
            usersList: [],
            tenantId: localStorage.getItem("tenantId"),
            token: localStorage.getItem("token"),
            isSuperTenant: localStorage.getItem("isSuperTenant") === "true",

            // Actions
            setAuthenticated: (isAuthenticated) => set({isAuthenticated}),
            setUsersList: (usersList) => set({usersList}),
            setIsSuperTenant: (isSuperTenant: boolean) => {
                localStorage.setItem("isSuperTenant", isSuperTenant.toString())
                set({isSuperTenant})
            },
            setTenantId: (tenantId) => {
                localStorage.setItem("tenantId", tenantId)
                set({tenantId})
            },
            setToken: (token) => {
                localStorage.setItem("token", token)
                set({token, isAuthenticated: true})
            },
            clearAuth: () => {
                localStorage.removeItem("token")
                localStorage.removeItem("tenantId")
                localStorage.removeItem("isSuperTenant")
                set({isAuthenticated: false, tenantId: null, token: null, isSuperTenant: false})
            },
            checkAuth: () => {
                const {token} = get()

                if (!token) {
                    get().clearAuth()
                    return false
                }

                if (isTokenExpired(token)) {
                    get().clearAuth()
                    return false
                }

                return true
            },
        }),
        {
            name: "tenant-management-storage",
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                usersList: state.usersList,
                tenantId: state.tenantId,
                token: state.token,
                isSuperTenant: state.isSuperTenant,
            }), // also persist isSuperTenant
        },
    ),
)

