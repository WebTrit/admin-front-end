import {useState} from "react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import {formatZodErrors} from "@/lib/validation"
import {voipConfigSchema, VoipFormData} from "@/lib/schemas"
import type {Tenant} from "@/types"

export function useVoipConfig(tenantId: string | undefined, tenantInfo: Tenant | null) {
    const queryClient = useQueryClient()
    const [isVoipEditing, setIsVoipEditing] = useState(false)
    const [voipValidationErrors, setVoipValidationErrors] = useState<Record<string, string>>({})
    const [isValidatingHost, setIsValidatingHost] = useState(false)

    const validateForm = (data: VoipFormData) => {
        const result = voipConfigSchema.safeParse(data)
        if (!result.success) {
            setVoipValidationErrors(formatZodErrors(result.error))
            return false
        }
        setVoipValidationErrors({})
        return true
    }

    const validateSipHostname = async (host: string, port: number, use_tcp: boolean) => {
        try {
            const response = await api.post("/info/hostname", {host, port, use_tcp}, {timeout: 30000})
            toast.info(response.data.message)
            return response.data.status.toLowerCase() === "ok"
        } catch {
            toast.error("Unable to reach the SIP host. Please check the address and try again.")
            return false
        }
    }

    const updateVoipMutation = useMutation({
        mutationFn: async (updatedData: Record<string, unknown>) => {
            if (!tenantId) throw new Error("No tenant ID found")

            const sipData = updatedData.sip
                ? {...tenantInfo?.sip, ...(updatedData.sip as object)}
                : tenantInfo?.sip
            if (updatedData.transport_protocol) {
                (sipData as Record<string, unknown>).use_tcp =
                    (updatedData.transport_protocol as string).toLowerCase() === "tcp"
            }

            const response = await api.patch(`/tenants/${tenantId}`, {
                ...updatedData,
                sip: sipData,
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantId]})
            setIsVoipEditing(false)
            setVoipValidationErrors({})
            toast.success("VoIP settings updated successfully")
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update VoIP settings")
        },
    })

    const onSubmitVoipConfig = async (data: VoipFormData) => {
        if (!validateForm(data)) return

        const port = Number.parseInt(data.port)
        const use_tcp = data.transport_protocol.toLowerCase() === "tcp"

        if (!data.skip_hostname_validation) {
            setIsValidatingHost(true)

            if (data.outbound_proxy_enabled && data.outbound_proxy_host?.trim()) {
                const proxyPort = data.outbound_proxy_port ? Number.parseInt(data.outbound_proxy_port) : 5060
                const isValid = await validateSipHostname(data.outbound_proxy_host, proxyPort, use_tcp)
                setIsValidatingHost(false)
                if (!isValid) {
                    setVoipValidationErrors((prev) => ({...prev, outbound_proxy_host: "Proxy server is not reachable or invalid"}))
                    return
                }
            } else {
                const isValid = await validateSipHostname(data.host, port, use_tcp)
                setIsValidatingHost(false)
                if (!isValid) {
                    setVoipValidationErrors((prev) => ({...prev, host: "SIP host is not reachable or invalid"}))
                    return
                }
            }
        }

        const changes: Record<string, unknown> = {}
        if (tenantInfo) {
            if (data.voip_system_type !== tenantInfo.voip_system?.type) changes.voip_system = {type: data.voip_system_type}
            if (data.transport_protocol !== tenantInfo.transport_protocol) changes.transport_protocol = data.transport_protocol

            const sipChanges: Record<string, unknown> = {}
            if (data.host !== tenantInfo.sip?.host) sipChanges.host = data.host
            if (String(data.port) !== String(tenantInfo.sip?.port)) sipChanges.port = data.port
            if (Object.keys(sipChanges).length > 0) changes.sip = sipChanges

            if (data.outbound_proxy_enabled && data.outbound_proxy_host?.trim()) {
                const outboundProxyPort = data.outbound_proxy_port ? Number.parseInt(data.outbound_proxy_port) : 5060
                const proxyConfig = {host: data.outbound_proxy_host, port: outboundProxyPort, use_tcp}
                const currentOutbound = tenantInfo.outbound_proxy_server
                if (!currentOutbound || currentOutbound.host !== proxyConfig.host || currentOutbound.port !== proxyConfig.port || currentOutbound.use_tcp !== proxyConfig.use_tcp) {
                    changes.outbound_proxy_server = proxyConfig
                }
                const currentRegistrar = tenantInfo.registrar_server
                if (!currentRegistrar || currentRegistrar.host !== proxyConfig.host || currentRegistrar.port !== proxyConfig.port || currentRegistrar.use_tcp !== proxyConfig.use_tcp) {
                    changes.registrar_server = proxyConfig
                }
            } else if (!data.outbound_proxy_enabled && (tenantInfo.outbound_proxy_server || tenantInfo.registrar_server)) {
                if (tenantInfo.outbound_proxy_server) changes.outbound_proxy_server = null
                if (tenantInfo.registrar_server) changes.registrar_server = null
            }
        }

        if (Object.keys(changes).length > 0) {
            updateVoipMutation.mutate(changes)
        } else {
            setIsVoipEditing(false)
        }
    }

    return {
        isVoipEditing,
        setIsVoipEditing,
        voipValidationErrors,
        setVoipValidationErrors,
        isValidatingHost,
        onSubmitVoipConfig,
        isMutationPending: updateVoipMutation.isPending,
    }
}
