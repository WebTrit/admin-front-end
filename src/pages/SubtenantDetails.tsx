import {Loader2} from "lucide-react"
import {TenantInfo} from "@/components/subtenantDetails/TenantInfo"
import {VoipConfig} from "@/components/subtenantDetails/VoipConfig"
import {UsersTable} from "@/components/subtenantDetails/UsersTable"
import {useQuery} from "@tanstack/react-query";
import api from "@/lib/axios.ts";
import {useParams} from "react-router-dom";

function SubtenantDetails() {
    const {tenantId} = useParams()

    const {data: tenantInfo, isLoading, error} = useQuery({
        queryKey: ["tenant", tenantId],
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}`)
            return response.data
        },
    })
    //TODO cash tenants

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <p className="text-lg font-medium">Failed to load tenant details</p>
                <p className="text-sm mt-2">Please try again later</p>
            </div>
        )
    }

    if (isLoading || !tenantInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
                <p className="text-gray-500 mt-4">Loading tenant details...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tenant details</h2>
            <TenantInfo tenantData={tenantInfo}/>
            <VoipConfig tenantData={tenantInfo}/>
            <UsersTable maxUsers={tenantInfo.max_users || 0}/>
        </div>
    )
}

export default SubtenantDetails
