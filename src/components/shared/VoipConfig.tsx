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
                transport_protocol: tenantData?.sip?.use_tcp ? "TCP" : "UDP",
                custom_voip_type: "",
            },
        })
        //TODO fix schema mismatch

        const isOtherVoip = tenantData?.voip_system?.type && !VOIP_SYSTEM_TYPES.includes(tenantData.voip_system.type)
        const voipSystemType = watch("voip_system_type")


        useImperativeHandle(ref, () => ({
            submitForm: () => {
                handleSubmit(handleFormSubmit)();
            },
            resetForm: () => {
                setValidationErrors({})
                if (tenantData) {
                    reset({
                        voip_system_type: tenantData.voip_system?.type || "",
                        host: tenantData.sip?.host || "",
                        port: String(tenantData.sip?.port || ""),
                        transport_protocol: tenantData?.sip?.use_tcp ? "TCP" : "UDP",
                    })
                }
            },
        }))

        useEffect(() => {
            if (tenantData) {
                reset({
                    voip_system_type: isOtherVoip ? "Other - not listed here" : tenantData.voip_system?.type || "",
                    custom_voip_type: isOtherVoip ? tenantData.voip_system?.type : "",
                    host: tenantData.sip?.host || "",
                    port: String(tenantData.sip?.port || ""),
                    transport_protocol: tenantData?.sip?.use_tcp ? "TCP" : "UDP",
                })
            }
        }, [tenantData, reset])

        const handleCancel = () => {
            handleEdit(false)
            setValidationErrors({})
            if (tenantData) {
                reset({
                    voip_system_type: isOtherVoip ? "Other - not listed here" : tenantData.voip_system?.type || "",
                    custom_voip_type: isOtherVoip ? tenantData.voip_system?.type : "",
                    host: tenantData.sip?.host || "",
                    port: String(tenantData.sip?.port || ""),
                    transport_protocol: tenantData?.sip?.use_tcp ? "TCP" : "UDP",
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
                                SIP Hostname <span className="text-red-500">*</span>
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
                </div>
            </form>
        )
    },
)

VoipConfig.displayName = "VoipConfig"
