import {useEffect, useState} from "react"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {z} from "zod"
import {Building2, Loader2} from "lucide-react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import {useParams} from "react-router-dom"

const tenantSchema = z.object({
    company_name: z.string().optional(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().optional(),
})

// Define type based on the schema
type TenantFormData = z.infer<typeof tenantSchema>

// Define props type
interface TenantInfoProps {
    tenantData: Partial<TenantFormData> | null
}

export function TenantInfo({tenantData}: TenantInfoProps) {
    const queryClient = useQueryClient()
    const {tenantId} = useParams()
    const [isEditing, setIsEditing] = useState(false)

    // Form setup
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors},
    } = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema),
        defaultValues: {
            company_name: "",
            first_name: "",
            last_name: "",
            email: "",
        },
    })

    // Update form values when tenant data is loaded
    useEffect(() => {
        if (tenantData) {
            reset({
                company_name: tenantData.company_name || "",
                first_name: tenantData.first_name || "",
                last_name: tenantData.last_name || "",
                email: tenantData.email || "",
            })
        }
    }, [tenantData, reset])

    // Mutation to update tenant
    const updateMutation = useMutation({
        mutationFn: async (updatedData: Partial<TenantFormData>) => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.patch(`/tenants/${tenantId}`, updatedData)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantId]})
            setIsEditing(false)
            toast.success("Tenant information updated successfully")
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update tenant information")
        },
    })

    // Handle form submission
    const onSubmit = (data: TenantFormData) => {
        if (!tenantData) return

        const changes: Partial<TenantFormData> = {}
        if (data.company_name !== tenantData.company_name) changes.company_name = data.company_name
        if (data.first_name !== tenantData.first_name) changes.first_name = data.first_name
        if (data.last_name !== tenantData.last_name) changes.last_name = data.last_name

        if (Object.keys(changes).length > 0) {
            updateMutation.mutate(changes)
        } else {
            setIsEditing(false)
        }
    }

    // Cancel editing
    const handleCancel = () => {
        setIsEditing(false)
        if (tenantData) {
            reset({
                company_name: tenantData.company_name || "",
                first_name: tenantData.first_name || "",
                last_name: tenantData.last_name || "",
                email: tenantData.email || "",
            })
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                <div className="flex items-center">
                    <Building2 className="h-6 w-6 text-primary-600 mr-2"/>
                    <h3 className="text-lg font-medium">Tenant Information</h3>
                </div>
                <div className="flex space-x-2">
                    {isEditing ? (
                        <>
                            <Button type="button" variant="outline" onClick={handleCancel}
                                    className="flex-1 sm:flex-none">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending} className="flex-1 sm:flex-none">
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                        Company Name
                    </label>
                    <Input id="company_name" {...register("company_name")} disabled={!isEditing}
                           error={!!errors.company_name}/>
                    {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>}
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <Input id="email" {...register("email")} type="email" disabled={true} className="bg-gray-50"/>
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        First Name <span>*</span>
                    </label>
                    <Input id="first_name" {...register("first_name")} disabled={!isEditing}
                           error={!!errors.first_name}/>
                    {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
                </div>
                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last Name <span>*</span>
                    </label>
                    <Input id="last_name" {...register("last_name")} disabled={!isEditing} error={!!errors.last_name}/>
                    {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
                </div>
            </div>
        </form>
    )
}