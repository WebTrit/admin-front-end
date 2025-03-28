import {useQuery} from "@tanstack/react-query"
import api from "@/lib/axios"
import {TenantInfo} from "@/components/dashboard/TenantInfo"
import {VoipConfig} from "@/components/dashboard/VoipConfig"
import {UsersTable} from "@/components/dashboard/UsersTable"
import {useAppStore} from "@/lib/store.ts";

function Dashboard() {
    const tenantId = useAppStore((state) => state.tenantId)

    const {data: tenantInfo, isLoading} = useQuery({
        queryKey: ["tenant"],
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}`)
            return response.data
        },
    })

    if (isLoading || !tenantInfo) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <TenantInfo tenantData={tenantInfo}/>
            <VoipConfig tenantData={tenantInfo}/>
            <UsersTable maxUsers={tenantInfo.max_users || 0}/>
        </div>
    )
}

export default Dashboard

