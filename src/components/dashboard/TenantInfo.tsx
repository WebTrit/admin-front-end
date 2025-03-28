import React from "react"

import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {z} from "zod"
import {Building2, Loader2} from "lucide-react"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import {useAppStore} from "@/lib/store"
import {useState} from "react"

// Define the schema for tenant data validation
const tenantSchema = z.object({
    company_name: z.string().min(1, "Company name is required"),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format").optional(),
})

// Define the type based on the schema
type TenantFormData = z.infer<typeof tenantSchema>

export function TenantInfo() {
    const queryClient = useQueryClient()
    const {tenantId} = useAppStore()
    const [isEditing, setIsEditing] = useState(false)

    // Fetch tenant data
    const {data: tenantData, isLoading} = useQuery({
        queryKey: ["tenant", tenantId],
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}`)
            return response.data
        },
        enabled: !!tenantId,
    })

    // Setup form with react-hook-form and zod validation
    const {
        register,
        handleSubmit,
        reset,
        formState: {errors, isDirty, isValid},
        watch,
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
    React.useEffect(() => {
        if (tenantData) {
            reset({
                company_name: tenantData.company_name || "",
                first_name: tenantData.first_name || "",
                last_name: tenantData.last_name || "",
                email: tenantData.email || "",
            })
        }
    }, [tenantData, reset])

    // Update mutation
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

    // Form submission handler
    const onSubmit = (data: TenantFormData) => {
        // Only send changed fields to the API
        const changes: Partial<TenantFormData> = {}

        if (tenantData) {
            if (data.company_name !== tenantData.company_name) {
                changes.company_name = data.company_name
            }
            if (data.first_name !== tenantData.first_name) {
                changes.first_name = data.first_name
            }
            if (data.last_name !== tenantData.last_name) {
                changes.last_name = data.last_name
            }
        }

        if (Object.keys(changes).length > 0) {
            updateMutation.mutate(changes)
        } else {
            setIsEditing(false)
        }
    }

    // Cancel editing handler
    const handleCancel = () => {
        setIsEditing(false)
        // Reset form to original values
        if (tenantData) {
            reset({
                company_name: tenantData.company_name || "",
                first_name: tenantData.first_name || "",
                last_name: tenantData.last_name || "",
                email: tenantData.email || "",
            })
        }
    }

    if (isLoading) {
        return (
            <div className="bg-white shadow rounded-lg p-6 flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin"/>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <Building2 className="h-6 w-6 text-primary-600 mr-2"/>
                    <h3 className="text-lg font-medium">Tenant Information</h3>
                </div>
                <div className="flex space-x-2">
                    {isEditing ? (
                        <>
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!isDirty || !isValid || updateMutation.isPending}>
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
                        First Name
                    </label>
                    <Input id="first_name" {...register("first_name")} disabled={!isEditing}
                           error={!!errors.first_name}/>
                    {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
                </div>
                <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last Name
                    </label>
                    <Input id="last_name" {...register("last_name")} disabled={!isEditing} error={!!errors.last_name}/>
                    {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
                </div>
            </div>
        </form>
    )
}

