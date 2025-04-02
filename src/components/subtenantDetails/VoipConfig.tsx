import {useState, useEffect} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {Server, Loader2} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "react-toastify";
import api from "@/lib/axios";
import {TRANSPORT_PROTOCOLS, VOIP_SYSTEM_TYPES} from "@/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {useParams} from "react-router-dom";
import Select from "@/components/ui/Select.tsx";

// Define the schema for VoIP configuration validation
const voipConfigSchema = z.object({
    voip_system_type: z.string().min(1, "VoIP system type is required"),
    host: z.string().min(1, "SIP hostname is required"),
    port: z.string().refine((val) => {
        const port = Number.parseInt(val);
        return !isNaN(port) && port >= 1 && port <= 65535;
    }, "Port must be between 1 and 65535"),
    transport_protocol: z.string().min(1, "Transport protocol is required"),
});

type VoipFormData = z.infer<typeof voipConfigSchema>;

interface VoipConfigProps {
    tenantData: any;
}

export function VoipConfig({tenantData}: VoipConfigProps) {
    const queryClient = useQueryClient();
    const {tenantId} = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Setup form with react-hook-form
    const {
        register,
        handleSubmit,
        reset,
    } = useForm<VoipFormData>({
        defaultValues: {
            voip_system_type: "",
            host: "",
            port: "",
            transport_protocol: "",
        },
    });

    // Update form values when tenant data is loaded
    useEffect(() => {
        if (tenantData) {
            reset({
                voip_system_type: tenantData.voip_system?.type || "",
                host: tenantData.sip?.host || "",
                port: String(tenantData.sip?.port || ""),
                transport_protocol: tenantData.transport_protocol || "",
            });
        }
    }, [tenantData, reset]);

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async (updatedData: any) => {
            if (!tenantId) throw new Error("No tenant ID found");
            console.log(updatedData)
            const response = await api.patch(`/tenants/${tenantId}`, {
                ...updatedData,
                sip: {...tenantData.sip, ...updatedData.sip}
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantId]});
            setIsEditing(false);
            setValidationErrors({});
            toast.success("VoIP settings updated successfully");
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update VoIP settings");
        },
    });

    // Validate form data using Zod
    const validateForm = (data: VoipFormData) => {
        const result = voipConfigSchema.safeParse(data);
        if (!result.success) {
            const formattedErrors: Record<string, string> = {};
            result.error.errors.forEach((error) => {
                if (error.path.length > 0) {
                    formattedErrors[error.path[0].toString()] = error.message;
                }
            });
            setValidationErrors(formattedErrors);
            return false;
        }
        setValidationErrors({});
        return true;
    };

    // Form submission handler
    const onSubmit = (data: VoipFormData) => {
        // Validate form data
        if (!validateForm(data)) {
            return;
        }

        const port = Number.parseInt(data.port);

        const changes: Record<string, any> = {};

        // Only include changed fields
        if (tenantData) {
            if (data.voip_system_type !== tenantData.voip_system?.type) {
                changes.voip_system = {type: data.voip_system_type};
            }

            const sipChanges: Record<string, any> = {};
            if (data.host !== tenantData.sip?.host) {
                sipChanges.host = data.host;
            }
            if (String(port) !== String(tenantData.sip?.port)) {
                sipChanges.port = port;
            }
            if (data.transport_protocol !== tenantData.sip?.transport_protocol) {
                sipChanges.transport_protocol = data.transport_protocol;
            }

            if (Object.keys(sipChanges).length > 0) {
                changes.sip = sipChanges;
            }
        }

        if (Object.keys(changes).length > 0) {
            updateMutation.mutate(changes);
        } else {
            setIsEditing(false);
        }
    };

    // Cancel editing handler
    const handleCancel = () => {
        setIsEditing(false);
        setValidationErrors({});
        // Reset form to original values
        if (tenantData) {
            reset({
                voip_system_type: tenantData.voip_system?.type || "",
                host: tenantData.sip?.host || "",
                port: String(tenantData.sip?.port || ""),
                transport_protocol: tenantData.sip?.transport_protocol || "",
            });
        }
    };

    if (updateMutation.isPending) {
        return (
            <div className="bg-white shadow rounded-lg p-6 flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin"/>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Server className="h-6 w-6 text-primary-600 mr-2"/>
                    <h3 className="text-lg font-medium">VoIP PBX Configuration</h3>
                </div>
                <div className="flex space-x-2">
                    {isEditing ? (
                        <>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? (
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
                        <Button type="button" onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="voip_system_type" className="block text-sm font-medium text-gray-700">
                        VoIP System Type
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="host" className="block text-sm font-medium text-gray-700">
                            SIP Hostname
                        </label>
                        <Input id="host" {...register("host")} disabled={!isEditing}
                               error={!!validationErrors.host}/>
                        {validationErrors.host &&
                            <p className="mt-1 text-sm text-red-600">{validationErrors.host}</p>}
                    </div>
                    <div>
                        <label htmlFor="port" className="block text-sm font-medium text-gray-700">
                            SIP Port
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
                            SIP Protocol
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
    );
}
