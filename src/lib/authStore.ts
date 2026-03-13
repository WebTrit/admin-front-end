import {create} from "zustand"
import {persist} from "zustand/middleware"
import {useTenantStore} from "./tenantStore"
import {isTokenExpired} from "./auth"

export interface LoginParams {
    token: string
    tenantId: string | null
    isSuperTenant: boolean
    isAdmin: boolean
}

interface AuthState {
    isAuthenticated: boolean
    token: string | null
    tenantId: string | null
    isSuperTenant: boolean
    isAdmin: boolean
    login: (params: LoginParams) => void
    setToken: (token: string) => void
    setTenantId: (tenantId: string) => void
    setIsSuperTenant: (isSuperTenant: boolean) => void
    setIsAdmin: (isAdmin: boolean) => void
    clearAuth: () => void
    checkAuth: () => boolean
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            token: null,
            tenantId: null,
            isSuperTenant: false,
            isAdmin: false,
            login: ({token, tenantId, isSuperTenant, isAdmin}) =>
                set({isAuthenticated: true, token, tenantId, isSuperTenant, isAdmin}),
            setToken: (token) => set({token, isAuthenticated: !isTokenExpired(token)}),
            setTenantId: (tenantId) => set({tenantId}),
            setIsSuperTenant: (isSuperTenant) => set({isSuperTenant}),
            setIsAdmin: (isAdmin) => set({isAdmin}),
            clearAuth: () => {
                useTenantStore.getState().reset()
                set({isAuthenticated: false, token: null, tenantId: null, isSuperTenant: false, isAdmin: false})
            },
            checkAuth: () => {
                const {token} = get()
                if (!token || isTokenExpired(token)) {
                    get().clearAuth()
                    return false
                }
                return true
            },
        }),
        {name: "auth-storage"}
    )
)
