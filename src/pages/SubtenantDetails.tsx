import {Loader2} from "lucide-react"
import {TenantInfo} from "@/components/shared/TenantInfo"
import {VoipConfig} from "@/components/shared/VoipConfig"
import {UsersTable} from "@/components/subtenantDetails/UsersTable"
import {SipLogs} from "@/components/subtenantDetails/SipLogs"
import {useQuery} from "@tanstack/react-query"
import api from "@/lib/axios.ts"
import {useParams} from "react-router-dom"
import {z} from "zod"
import {useVoipConfig} from "@/hooks/useVoipConfig"
import {useTenantInfo} from "@/hooks/useTenantInfo"

export const voipConfigSchema = z.object({
    voip_system_type: z.string().min(1, "VoIP system type is required"),
    host: z.string(),
    port: z.string().refine((val) => {
        const port = Number.parseInt(val)
        return !isNaN(port) && port >= 1 && port <= 65535
    }, "Port must be between 1 and 65535"),
    transport_protocol: z.string().min(1, "Transport protocol is required"),
    skip_hostname_validation: z.boolean().default(false),
    outbound_proxy_enabled: z.boolean().default(false),
    outbound_proxy_host: z.string().optional(),
    outbound_proxy_port: z.string().optional().refine((val) => {
        if (!val || val === "") return true
        const port = Number.parseInt(val)
        return !isNaN(port) && port >= 1 && port <= 65535
    }, "Port must be between 1 and 65535"),
}).superRefine((data, ctx) => {
    if (!data.skip_hostname_validation && !data.outbound_proxy_enabled) {
        if (!data.host || data.host.trim().length === 0) {
            ctx.addIssue({code: z.ZodIssueCode.custom, message: "SIP Server Hostname / IP is required", path: ["host"]})
            return
        }
        const hostnameRegex = /^(?:\d{1,3}\.){3}\d{1,3}$|^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*\.[a-zA-Z]{2,}$/
        if (!hostnameRegex.test(data.host)) {
            ctx.addIssue({code: z.ZodIssueCode.custom, message: "Invalid SIP Server Hostname / IP", path: ["host"]})
        }
    }
    if (data.outbound_proxy_enabled && (!data.outbound_proxy_host || data.outbound_proxy_host.trim() === "")) {
        ctx.addIssue({code: z.ZodIssueCode.custom, message: "Outbound proxy host is required when outbound proxy is enabled", path: ["outbound_proxy_host"]})
    }
})

export type VoipFormData = z.infer<typeof voipConfigSchema>

export const tenantSchema = z.object({
    company_name: z.string().optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().optional(),
    basic_demo: z.boolean().optional(),
})

export type TenantFormData = z.infer<typeof tenantSchema & typeof voipConfigSchema>

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
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
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
