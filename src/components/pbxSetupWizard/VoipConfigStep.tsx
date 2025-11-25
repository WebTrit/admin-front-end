import {useEffect, useRef, useState} from "react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import {VoipConfig, VoipConfigRef} from "@/components/shared/VoipConfig"
import {voipConfigSchema, VoipFormData} from "@/pages/SubtenantDetails"
import {useWizard} from "@/components/pbxSetupWizard/WizardContext.tsx";
import {useAppStore} from "@/lib/store.ts";


export function VoipConfigStep() {
    const {tenantData, setCurrentStep, setVoipFormRef, setIsLoading, updateTenantData} = useWizard()
    const formRef = useRef<VoipConfigRef>(null)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [isValidatingHost, setIsValidatingHost] = useState(false)
    const queryClient = useQueryClient()
    const {currentTenant, setCurrentTenant} = useAppStore()

    useEffect(() => {
        setVoipFormRef(formRef)
        return () => setVoipFormRef(null)
    }, [setVoipFormRef])

    const validateForm = (data: VoipFormData) => {
        const result = voipConfigSchema.safeParse(data)
        if (!result.success) {
            const formattedErrors: Record<string, string> = {}
            result.error.errors.forEach((error) => {
                if (error.path.length > 0) {
                    formattedErrors[error.path[0].toString()] = error.message
                }
            })
            setValidationErrors(formattedErrors)
            return false
        }
        setValidationErrors({})
        return true
    }

    const validateSipHostname = async (host: string, port: number, use_tcp: boolean) => {
        try {
            setIsValidatingHost(true)
            setIsLoading(true)
            const response = await api.post("/info/hostname", {host, port, use_tcp}, {timeout: 30000})
            toast(response.data.message)
            return response.data.status.toLowerCase() === "ok"
        } catch (error) {
            return false
        } finally {
            setIsValidatingHost(false)
            setIsLoading(false)
        }
    }

    const updateVoipMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            if (!tenantData.tenant_id) throw new Error("No tenant ID found")
            const response = await api.post(`/tenants/${tenantData.tenant_id}/convert-to-pbx`, {
                ...currentTenant,
                ...updatedData,
            })

            setCurrentTenant({
                ...currentTenant,
                ...updatedData,
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantData.tenant_id]})
            setValidationErrors({})
            toast.success("VoIP settings updated successfully")
            setCurrentStep("users")
            setIsLoading(false)
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
            if (data.outbound_proxy_enabled && data.outbound_proxy_host && data.outbound_proxy_host.trim() !== "") {
                const proxyPort = data.outbound_proxy_port ? Number.parseInt(data.outbound_proxy_port) : 5060
                const isValidProxyHost = await validateSipHostname(data.outbound_proxy_host, proxyPort, use_tcp)
                if (!isValidProxyHost) {
                    setValidationErrors((prev) => ({
                        ...prev,
                        outbound_proxy_host: "Proxy server is not reachable or invalid",
                    }))
                    return
                }
            } else {
                const isValidHost = await validateSipHostname(data.host, port, use_tcp)
                if (!isValidHost) {
                    setValidationErrors((prev) => ({
                        ...prev,
                        host: "SIP host is not reachable or invalid",
                    }))
                    return
                }
            }
        }

        const changes: Record<string, any> = {}

        if (tenantData) {
            if (data.voip_system_type !== tenantData.voip_system?.type) {
                changes.voip_system = {type: data.voip_system_type}
            }
            if (data.transport_protocol !== tenantData.transport_protocol) {
                changes.transport_protocol = data.transport_protocol
            }
            const sipChanges: Record<string, any> = {}
            if (data.host !== tenantData.sip?.host) sipChanges.host = data.host
            if (String(data.port) !== String(tenantData.sip?.port)) sipChanges.port = data.port

            if (Object.keys(sipChanges).length > 0) changes.sip = sipChanges

            if (data.outbound_proxy_enabled && data.outbound_proxy_host && data.outbound_proxy_host.trim() !== "") {
                const outboundProxyPort = data.outbound_proxy_port ? Number.parseInt(data.outbound_proxy_port) : 5060;
                const useTcp = data.transport_protocol.toLowerCase() === "tcp";
                const proxyConfig = {
                    host: data.outbound_proxy_host,
                    port: outboundProxyPort,
                    use_tcp: useTcp
                };

                changes.outbound_proxy_server = proxyConfig;
                changes.registrar_server = proxyConfig;
            }
        }

        const finalData: Record<string, any> = {
            voip_system: {type: changes.voip_system?.type ?? tenantData.voip_system?.type},
            sip: {
                host: changes.sip?.host ?? tenantData.sip?.host,
                port: String(changes.sip?.port ?? tenantData.sip?.port),
                use_tcp: data.transport_protocol.toLowerCase() === "tcp"
            },
            transport_protocol: data.transport_protocol ?? tenantData.sip?.transport_protocol,
            basic_demo: false
        }

        if (changes.outbound_proxy_server) {
            finalData.outbound_proxy_server = changes.outbound_proxy_server;
        }
        if (changes.registrar_server) {
            finalData.registrar_server = changes.registrar_server;
        }

        updateTenantData(finalData)
        if (Object.keys(changes).length > 0) {
            setIsLoading(true)
            updateVoipMutation.mutate(finalData)


        } else {
            setCurrentStep("users")
        }
    }

    return (
        <VoipConfig
            ref={formRef}
            tenantData={tenantData}
            onSubmit={onSubmitVoipConfig}
            isMutationPending={updateVoipMutation.isPending}
            isEditing={true}
            handleEdit={() => {
            }}
            validationErrors={validationErrors}
            isValidatingHost={isValidatingHost}
            setValidationErrors={setValidationErrors}
            hideControls={true}
        />
    )
}
