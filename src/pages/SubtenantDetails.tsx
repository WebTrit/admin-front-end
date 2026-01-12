import {Loader2} from "lucide-react"
import {TenantInfo} from "@/components/shared/TenantInfo"
import {VoipConfig} from "@/components/shared/VoipConfig"
import {UsersTable} from "@/components/subtenantDetails/UsersTable"
import {SipLogs} from "@/components/subtenantDetails/SipLogs"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import api from "@/lib/axios.ts";
import {useParams} from "react-router-dom";
import {z} from "zod";
import {useState} from "react";
import {toast} from "react-toastify";

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
        if (!val || val === "") return true;
        const port = Number.parseInt(val)
        return !isNaN(port) && port >= 1 && port <= 65535
    }, "Port must be between 1 and 65535"),
}).superRefine((data, ctx) => {
    if (!data.skip_hostname_validation && !data.outbound_proxy_enabled) {
        if (!data.host || data.host.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "SIP Server Hostname / IP is required",
                path: ["host"],
            });
            return;
        }

        const hostnameRegex = /^(?:\d{1,3}\.){3}\d{1,3}$|^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*\.[a-zA-Z]{2,}$/;
        if (!hostnameRegex.test(data.host)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid SIP Server Hostname / IP",
                path: ["host"],
            });
        }
    }

    if (data.outbound_proxy_enabled && (!data.outbound_proxy_host || data.outbound_proxy_host.trim() === "")) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Outbound proxy host is required when outbound proxy is enabled",
            path: ["outbound_proxy_host"],
        });
    }
})

export type VoipFormData = z.infer<typeof voipConfigSchema>;

export const tenantSchema = z.object({
    company_name: z.string().optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().optional(),
    basic_demo: z.boolean().optional(),
})

export type TenantFormData = z.infer<typeof tenantSchema & typeof voipConfigSchema>

function SubtenantDetails() {
    const queryClient = useQueryClient();
    const {tenantId} = useParams()
    const [isVoipEditing, setIsVoipEditing] = useState(false);
    const [voipValidationErrors, setVoipValidationErrors] = useState<Record<string, string>>({});
    const [isValidatingHost, setIsValidatingHost] = useState(false);
    const [isTenantEditing, setIsTenantEditing] = useState(false)
    const [tenantValidationErrors, setTenantValidationErrors] = useState<Record<string, string>>({});

    const {data: tenantInfo, isLoading, error} = useQuery({
        //TODO cash tenants
        queryKey: ["tenant", tenantId],
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}`)
            return response.data
        },
    })

    const validateTenantForm = (data: TenantFormData) => {
        const result = tenantSchema.safeParse(data);
        if (!result.success) {
            const formattedErrors: Record<string, string> = {};
            result.error.errors.forEach((error) => {
                if (error.path.length > 0) {
                    formattedErrors[error.path[0].toString()] = error.message;
                }
            });
            setTenantValidationErrors(formattedErrors);
            return false;
        }
        setTenantValidationErrors({});
        return true;
    };

    const validateForm = (data: VoipFormData) => {
        const result = voipConfigSchema.safeParse(data);
        if (!result.success) {
            const formattedErrors: Record<string, string> = {};
            result.error.errors.forEach((error) => {
                if (error.path.length > 0) {
                    formattedErrors[error.path[0].toString()] = error.message;
                }
            });
            setVoipValidationErrors(formattedErrors);
            return false;
        }
        setVoipValidationErrors({});
        return true;
    };

    const validateSipHostname = async (host: string, port: number, use_tcp: boolean) => {
        try {
            const response = await api.post(
                "/info/hostname",
                {host, port, use_tcp},
                {timeout: 30000}
            );

            toast(response.data.message);

            return response.data.status.toLowerCase() === "ok";
        } catch (error) {
            return false;
        }
    };

    const onSubmitVoipConfig = async (data: VoipFormData) => {
        if (!validateForm(data)) return;

        const port = Number.parseInt(data.port);
        const use_tcp = data.transport_protocol.toLowerCase() === "tcp";

        if (!data.skip_hostname_validation) {
            setIsValidatingHost(true);

            if (data.outbound_proxy_enabled && data.outbound_proxy_host && data.outbound_proxy_host.trim() !== "") {
                const proxyPort = data.outbound_proxy_port ? Number.parseInt(data.outbound_proxy_port) : 5060;
                const isValidProxyHost = await validateSipHostname(data.outbound_proxy_host, proxyPort, use_tcp);
                setIsValidatingHost(false);
                if (!isValidProxyHost) {
                    setVoipValidationErrors((prev) => ({
                        ...prev,
                        outbound_proxy_host: "Proxy server is not reachable or invalid",
                    }));
                    return;
                }
            } else {
                const isValidHost = await validateSipHostname(data.host, port, use_tcp);
                setIsValidatingHost(false);
                if (!isValidHost) {
                    setVoipValidationErrors((prev) => ({
                        ...prev,
                        host: "SIP host is not reachable or invalid",
                    }));
                    return;
                }
            }
        }

        const changes: Record<string, any> = {};
        if (tenantInfo) {
            if (data.voip_system_type !== tenantInfo.voip_system?.type) {
                changes.voip_system = {type: data.voip_system_type}
            }
            if (data.transport_protocol !== tenantInfo.transport_protocol) {
                changes.transport_protocol = data.transport_protocol
            }

            const sipChanges: Record<string, any> = {}
            if (data.host !== tenantInfo.sip?.host) sipChanges.host = data.host
            if (String(data.port) !== String(tenantInfo.sip?.port)) sipChanges.port = data.port

            if (Object.keys(sipChanges).length > 0) changes.sip = sipChanges

            if (data.outbound_proxy_enabled && data.outbound_proxy_host && data.outbound_proxy_host.trim() !== "") {
                const outboundProxyPort = data.outbound_proxy_port ? Number.parseInt(data.outbound_proxy_port) : 5060;
                const useTcp = data.transport_protocol.toLowerCase() === "tcp";
                const newProxyConfig = {
                    host: data.outbound_proxy_host,
                    port: outboundProxyPort,
                    use_tcp: useTcp
                };

                const currentOutbound = tenantInfo.outbound_proxy_server;
                if (!currentOutbound ||
                    currentOutbound.host !== newProxyConfig.host ||
                    currentOutbound.port !== newProxyConfig.port ||
                    currentOutbound.use_tcp !== newProxyConfig.use_tcp) {
                    changes.outbound_proxy_server = newProxyConfig;
                }

                const currentRegistrar = tenantInfo.registrar_server;
                if (!currentRegistrar ||
                    currentRegistrar.host !== newProxyConfig.host ||
                    currentRegistrar.port !== newProxyConfig.port ||
                    currentRegistrar.use_tcp !== newProxyConfig.use_tcp) {
                    changes.registrar_server = newProxyConfig;
                }
            } else if (!data.outbound_proxy_enabled && (tenantInfo.outbound_proxy_server || tenantInfo.registrar_server)) {
                if (tenantInfo.outbound_proxy_server) {
                    changes.outbound_proxy_server = null;
                }
                if (tenantInfo.registrar_server) {
                    changes.registrar_server = null;
                }
            }
        }

        if (Object.keys(changes).length > 0) {
            updateVoipMutation.mutate(changes);
        } else {
            setIsVoipEditing(false);
        }
    };

    const updateVoipMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            if (!tenantId) throw new Error("No tenant ID found");

            const sipData = updatedData.sip ? {...tenantInfo.sip, ...updatedData.sip} : tenantInfo.sip;
            if (updatedData.transport_protocol) {
                sipData.use_tcp = updatedData.transport_protocol.toLowerCase() === "tcp";
            }

            const response = await api.patch(`/tenants/${tenantId}`, {
                ...updatedData,
                sip: sipData
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantId]});
            setIsVoipEditing(false);
            setVoipValidationErrors({});
            toast.success("VoIP settings updated successfully");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update VoIP settings");
        },
    });

    const updateTenantMutation = useMutation({
        mutationFn: async (updatedData: Partial<TenantFormData>) => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.patch(`/tenants/${tenantId}`, updatedData)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantId]})
            setIsTenantEditing(false)
            toast.success("Personal Information updated successfully")
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update Personal Information")
        },
    })

    const onSubmitTenant = (data: TenantFormData) => {
        if (!validateTenantForm(data)) return;
        if (!tenantInfo) return;

        const changes: Partial<TenantFormData> = {};
        if (data.company_name !== tenantInfo.company_name) changes.company_name = data.company_name;
        if (data.first_name !== tenantInfo.first_name) changes.first_name = data.first_name;
        if (data.last_name !== tenantInfo.last_name) changes.last_name = data.last_name;
        if (data.basic_demo !== tenantInfo.basic_demo) changes.basic_demo = data.basic_demo;

        if (Object.keys(changes).length > 0) {
            updateTenantMutation.mutate(changes);
        } else {
            setIsTenantEditing(false);
        }
    };


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
                isMutationPending={updateTenantMutation.isPending}
                onSubmit={onSubmitTenant}
                handleEdit={setIsTenantEditing}
                validationErrors={tenantValidationErrors}
            />

            <VoipConfig
                tenantData={tenantInfo}
                onSubmit={onSubmitVoipConfig}
                isMutationPending={updateVoipMutation.isPending}
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
