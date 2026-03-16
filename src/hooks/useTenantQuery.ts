import {useQuery} from "@tanstack/react-query"
import api from "@/lib/axios"
import {useTenantStore} from "@/lib/tenantStore"
import {useAuthStore} from "@/lib/authStore"
import type {Tenant} from "@/types"

export function useTenantQuery() {
    const {tenantId} = useAuthStore()
    const {setCurrentTenant} = useTenantStore()

    const query = useQuery<Tenant>({
        queryKey: ["tenant", tenantId],
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}`)
            const tenant = response.data as Tenant
            setCurrentTenant(tenant)
            return tenant
        },
        enabled: !!tenantId,
        staleTime: 5 * 60 * 1000,
    })

    return query
}
