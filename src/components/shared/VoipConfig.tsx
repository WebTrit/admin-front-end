import {forwardRef, useEffect, useImperativeHandle} from "react"
import {useForm} from "react-hook-form"
import {Loader2, Server} from "lucide-react"
import {TRANSPORT_PROTOCOLS, VOIP_SYSTEM_TYPES} from "@/constants"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select.tsx"
import type {VoipFormData} from "@/pages/SubtenantDetails"

export interface VoipConfigRef {
    submitForm: () => void
    resetForm: () => void
}

interface VoipConfigProps {
    tenantData: any
    onSubmit: (data: VoipFormData) => Promise<void>
    isMutationPending: boolean
    isEditing: boolean
    handleEdit: (val: boolean) => void
    isValidatingHost: boolean
    validationErrors: any
    setValidationErrors: (errors: any) => void
    hideControls?: boolean
}

export const VoipConfig = forwardRef<VoipConfigRef, VoipConfigProps>(
    (
        {
            tenantData,
            onSubmit,
            handleEdit,
            isMutationPending,
            isEditing,
            isValidatingHost,
            validationErrors,
            setValidationErrors,
            hideControls = false,
        },
        ref,
    ) => {
        const {
            register,
            handleSubmit,
            watch,
            reset,
            setError,
            formState: {errors},
        } = useForm<VoipFormData & { custom_voip_type?: string }>({
            defaultValues: {
                voip_system_type: "",
                host: "",
                port: "5060",
                transport_protocol: tenantData?.transport_protocol,
                custom_voip_type: "",
                skip_hostname_validation: false,
                outbound_proxy_enabled: false,
                outbound_proxy_host: "",
                outbound_proxy_port: "5060",
            },
        })
        //TODO fix schema mismatch

        const isOtherVoip = tenantData?.voip_system?.type && !VOIP_SYSTEM_TYPES.includes(tenantData.voip_system.type)
        const voipSystemType = watch("voip_system_type")
        const skipHostnameValidation = watch("skip_hostname_validation")
        const outboundProxyEnabled = watch("outbound_proxy_enabled")


        useImperativeHandle(ref, () => ({
            submitForm: () => {
                handleSubmit(handleFormSubmit)();
            },
            resetForm: () => {
                setValidationErrors({})
                if (tenantData) {
                    const hasOutboundProxy = tenantData.outbound_proxy_server?.host;
                    reset({
                        voip_system_type: tenantData.voip_system?.type || "",
                        host: tenantData.sip?.host || "",
                        port: String(tenantData.sip?.port || ""),
                        transport_protocol: tenantData?.transport_protocol,
                        outbound_proxy_enabled: !!hasOutboundProxy,
                        outbound_proxy_host: tenantData.outbound_proxy_server?.host || "",
                        outbound_proxy_port: String(tenantData.outbound_proxy_server?.port || "5060"),
                    })
                }
            },
        }))

        useEffect(() => {
            if (tenantData) {
                const hasOutboundProxy = tenantData.outbound_proxy_server?.host;
                reset({
                    voip_system_type: isOtherVoip ? "Other - not listed here" : tenantData.voip_system?.type || "",
                    custom_voip_type: isOtherVoip ? tenantData.voip_system?.type : "",
                    host: tenantData.sip?.host || "",
                    port: String(tenantData.sip?.port || ""),
                    transport_protocol: tenantData?.transport_protocol,
                    outbound_proxy_enabled: !!hasOutboundProxy,
                    outbound_proxy_host: tenantData.outbound_proxy_server?.host || "",
                    outbound_proxy_port: String(tenantData.outbound_proxy_server?.port || "5060"),
                })
            }
        }, [tenantData, reset])

        useEffect(() => {
            if (outboundProxyEnabled && skipHostnameValidation) {
                reset((formValues) => ({
                    ...formValues,
                    skip_hostname_validation: false,
                }))
            }
        }, [outboundProxyEnabled, skipHostnameValidation, reset])

        const handleCancel = () => {
            handleEdit(false)
            setValidationErrors({})
            if (tenantData) {
                const hasOutboundProxy = tenantData.outbound_proxy_server?.host;
                reset({
                    voip_system_type: isOtherVoip ? "Other - not listed here" : tenantData.voip_system?.type || "",
                    custom_voip_type: isOtherVoip ? tenantData.voip_system?.type : "",
                    host: tenantData.sip?.host || "",
                    port: String(tenantData.sip?.port || ""),
                    transport_protocol: tenantData?.transport_protocol,
                    outbound_proxy_enabled: !!hasOutboundProxy,
                    outbound_proxy_host: tenantData.outbound_proxy_server?.host || "",
                    outbound_proxy_port: String(tenantData.outbound_proxy_server?.port || "5060"),
                })
            }
        }
        if (isMutationPending) {
            return (
                <div className="bg-white shadow rounded-lg p-6 flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 text-primary-600 animate-spin"/>
                </div>
            )
        }

        function handleFormSubmit(data: any) {
            if (data.voip_system_type === "Other - not listed here" && !data.custom_voip_type?.trim()) {
                setError("custom_voip_type", {
                    type: "manual",
                    message: "Please specify the VoIP System Type",
                })
                return
            }

            const finalData: VoipFormData = {
                ...data,
                voip_system_type:
                    data.voip_system_type === "Other - not listed here" && data.custom_voip_type
                        ? data.custom_voip_type
                        : data.voip_system_type,
            }

            onSubmit(finalData)
        }


        return (
            <form onSubmit={handleSubmit(handleFormSubmit)}
                  className="bg-white shadow rounded-lg p-6">
                <div
                    className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                    <div className="flex items-center">
                        <Server className="h-6 w-6 text-primary-600 mr-2"/>
                        <h3 className="text-lg font-medium">VoIP PBX Configuration</h3>
                    </div>
                    {!hideControls && (
                        <div className="flex space-x-2">
                            {isEditing ? (
                                <>
                                    <Button type="button" variant="outline" onClick={handleCancel}
                                            className="flex-1 sm:flex-none">
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isMutationPending || isValidatingHost}
                                        className="flex-1 sm:flex-none"
                                    >
                                        {isMutationPending || isValidatingHost ? (
                                            <>
                                                <Loader2 size={16} className="mr-2 animate-spin"/>
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button type="button" onClick={() => handleEdit(true)} className="sm:w-auto">
                                    Edit
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div
                        className={`grid ${voipSystemType === "Other - not listed here" ? "grid-cols-1 sm:grid-cols-2 gap-4" : ""}`}>
                        <div className={`${voipSystemType === "Other - not listed here" ? "" : "col-span-full"}`}>
                            <label htmlFor="voip_system_type" className="block text-sm font-medium text-gray-700">
                                VoIP System Type <span className="text-red-500">*</span>
                            </label>
                            <Select
                                id="voip_system_type"
                                error={!!validationErrors.voip_system_type}
                                disabled={!isEditing}
                                {...register("voip_system_type")}
                            >
                                {VOIP_SYSTEM_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </Select>
                            {validationErrors.voip_system_type && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.voip_system_type}</p>
                            )}
                        </div>

                        {voipSystemType === "Other - not listed here" && (
                            <div>
                                <label htmlFor="custom_voip_type" className="block text-sm font-medium text-gray-700">
                                    Specify VoIP System Type <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="custom_voip_type"
                                    {...register("custom_voip_type")}
                                    disabled={!isEditing}
                                    error={!!validationErrors.custom_voip_type}
                                />
                                {errors.custom_voip_type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.custom_voip_type.message}</p>
                                )}
                            </div>
                        )}
                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="host" className="block text-sm font-medium text-gray-700">
                                {outboundProxyEnabled ? "SIP Domain" : "SIP Server Hostname / IP"}{" "}
                                {!outboundProxyEnabled && <span className="text-red-500">*</span>}
                            </label>
                            <Input id="host" {...register("host")} disabled={!isEditing}
                                   error={!!validationErrors.host}/>
                            {validationErrors.host &&
                                <p className="mt-1 text-sm text-red-600">{validationErrors.host}</p>}
                        </div>
                        <div>
                            <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                                SIP Port <span className="text-red-500">*</span>
                            </label>
                            <Input
                                id="port"
                                type="number"
                                min="1"
                                max="65535"
                                {...register("port")}
                                disabled={!isEditing}
                                error={!!validationErrors.port}
                            />
                            {validationErrors.port &&
                                <p className="mt-1 text-sm text-red-600">{validationErrors.port}</p>}
                        </div>
                        <div>
                            <label htmlFor="transport_protocol" className="block text-sm font-medium text-gray-700">
                                SIP Protocol <span className="text-red-500">*</span>
                            </label>
                            <Select
                                id="transport_protocol"
                                error={!!validationErrors.transport_protocol}
                                disabled={!isEditing}
                                {...register("transport_protocol")}
                            >
                                <option value="">Select Protocol</option>
                                {TRANSPORT_PROTOCOLS.map((protocol) => (
                                    <option key={protocol} value={protocol}>
                                        {protocol}
                                    </option>
                                ))}
                            </Select>
                            {validationErrors.transport_protocol && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.transport_protocol}</p>
                            )}
                        </div>
                    </div>

                    {isEditing && !outboundProxyEnabled && (
                        <div className="pt-2 space-y-2">
                            <div className="flex items-center">
                                <input
                                    id="skip_hostname_validation"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    {...register("skip_hostname_validation")}
                                />
                                <label htmlFor="skip_hostname_validation" className="ml-2 block text-sm text-gray-700">
                                    Skip hostname validation
                                </label>
                            </div>
                            {skipHostnameValidation && (
                                <div className="ml-6 p-2 bg-amber-50 border-l-4 border-amber-400">
                                    <p className="text-xs text-amber-800">
                                        <strong>Warning:</strong> Configuration may not work if hostname/port/protocol
                                        are
                                        incorrect
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-4 mt-4 border-t border-gray-200">
                        <div className="flex items-start mb-3">
                            <input
                                id="outbound_proxy_enabled"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                                disabled={!isEditing}
                                {...register("outbound_proxy_enabled")}
                            />
                            <div className="ml-3">
                                <label htmlFor="outbound_proxy_enabled"
                                       className="block text-sm font-medium text-gray-900">
                                    Outbound SIP Proxy
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Send SIP REGISTER / INVITE requests to this SIP proxy
                                </p>
                            </div>
                        </div>

                        {outboundProxyEnabled && (
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="outbound_proxy_host"
                                               className="block text-sm font-medium text-gray-700">
                                            Proxy Server Hostname / IP <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            id="outbound_proxy_host"
                                            {...register("outbound_proxy_host")}
                                            disabled={!isEditing}
                                            placeholder="proxy.example.com"
                                            error={!!validationErrors.outbound_proxy_host}
                                        />
                                        {validationErrors.outbound_proxy_host && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.outbound_proxy_host}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="outbound_proxy_port"
                                               className="block text-sm font-medium text-gray-700">
                                            Proxy Server Port
                                        </label>
                                        <Input
                                            id="outbound_proxy_port"
                                            type="number"
                                            min="1"
                                            max="65535"
                                            {...register("outbound_proxy_port")}
                                            disabled={!isEditing}
                                            placeholder="5060"
                                            error={!!validationErrors.outbound_proxy_port}
                                        />
                                        {validationErrors.outbound_proxy_port && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.outbound_proxy_port}</p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 italic">
                                    Protocol will match the SIP Protocol setting above
                                    ({watch("transport_protocol") || "UDP"})
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        )
    },
)

VoipConfig.displayName = "VoipConfig"
