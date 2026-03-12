import {create} from "zustand"
import type {Tenant, User} from "@/types"

interface TenantState {
    currentTenant: Tenant | null
    usersList: {items: User[]; count: number}
    setCurrentTenant: (tenant: Tenant) => void
    setUsersList: (usersList: {items: User[]; count: number}) => void
    reset: () => void
}

export const useTenantStore = create<TenantState>()((set) => ({
    currentTenant: null,
    usersList: {items: [], count: 0},
    setCurrentTenant: (currentTenant) => set({currentTenant}),
    setUsersList: (usersList) => set({usersList}),
    reset: () => set({currentTenant: null, usersList: {items: [], count: 0}}),
}))
