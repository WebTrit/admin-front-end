import {Loader2} from "lucide-react"
import {TenantInfo} from "@/components/shared/TenantInfo"
import {VoipConfig} from "@/components/shared/VoipConfig"
import {UsersTable} from "@/components/subtenantDetails/UsersTable"
import {SipLogs} from "@/components/subtenantDetails/SipLogs"
import {useQuery} from "@tanstack/react-query"
import api from "@/lib/axios.ts"
import {useParams} from "react-router-dom"
import {useVoipConfig} from "@/hooks/useVoipConfig"
import {useTenantInfo} from "@/hooks/useTenantInfo"

function SubtenantDetails() {
    const {tenantId} = useParams()

    const {data: tenantInfo, isLoading, error} = useQuery({
        queryKey: ["tenant", tenantId],
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}`)
            return response.data
        },
    })

    const {
        isTenantEditing, setIsTenantEditing, tenantValidationErrors, onSubmitTenant,
        isMutationPending: isTenantMutationPending,
    } = useTenantInfo(tenantId, tenantInfo ?? null)

    const {
        isVoipEditing, setIsVoipEditing, voipValidationErrors, setVoipValidationErrors,
        isValidatingHost, onSubmitVoipConfig, isMutationPending: isVoipMutationPending,
    } = useVoipConfig(tenantId, tenantInfo ?? null)

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
                <Loader2 className="w-8 h-8 text-brand animate-spin"/>
                <p className="text-gray-500 mt-4">Loading tenant details...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tenant details</h2>
            <TenantInfo
                tenantData={tenantInfo}
                isEditing={isTenantEditing}
                isMutationPending={isTenantMutationPending}
                onSubmit={onSubmitTenant}
                handleEdit={setIsTenantEditing}
                validationErrors={tenantValidationErrors}
            />
            <VoipConfig
                tenantData={tenantInfo}
                onSubmit={onSubmitVoipConfig}
                isMutationPending={isVoipMutationPending}
                isEditing={isVoipEditing}
                handleEdit={setIsVoipEditing}
                validationErrors={voipValidationErrors}
                isValidatingHost={isValidatingHost}
                setValidationErrors={setVoipValidationErrors}
            />
            <SipLogs tenantId={tenantId!} sipDomain={tenantInfo.sip?.host || ''}/>
            <UsersTable maxUsers={tenantInfo.max_users || 0}/>
        </div>
    )
}

export default SubtenantDetails
