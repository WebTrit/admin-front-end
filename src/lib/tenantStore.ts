import {create} from "zustand"
import api from "@/lib/axios"
import type {Tenant, User} from "@/types"

interface TenantState {
    currentTenant: Tenant | null
    isTenantLoading: boolean
    tenantError: string | null
    usersList: {items: User[]; count: number}
    setCurrentTenant: (tenant: Tenant) => void
    fetchTenant: (tenantId: string) => Promise<void>
    setUsersList: (usersList: {items: User[]; count: number}) => void
    reset: () => void
}

export const useTenantStore = create<TenantState>()((set) => ({
    currentTenant: null,
    isTenantLoading: false,
    tenantError: null,
    usersList: {items: [], count: 0},
    setCurrentTenant: (currentTenant) => set({currentTenant}),
    fetchTenant: async (tenantId: string) => {
        set({isTenantLoading: true, tenantError: null})
        try {
            const response = await api.get(`/tenants/${tenantId}`)
            set({currentTenant: response.data})
        } catch (error: unknown) {
            set({tenantError: error instanceof Error ? error.message : "Failed to fetch tenant"})
        } finally {
            set({isTenantLoading: false})
        }
    },
    setUsersList: (usersList) => set({usersList}),
    reset: () => set({currentTenant: null, isTenantLoading: false, tenantError: null, usersList: {items: [], count: 0}}),
}))
