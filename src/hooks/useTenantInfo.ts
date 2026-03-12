import {useState} from "react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import {formatZodErrors} from "@/lib/validation"
import {tenantSchema, TenantFormData} from "@/lib/schemas"
import type {Tenant} from "@/types"

export function useTenantInfo(tenantId: string | undefined, tenantInfo: Tenant | null) {
    const queryClient = useQueryClient()
    const [isTenantEditing, setIsTenantEditing] = useState(false)
    const [tenantValidationErrors, setTenantValidationErrors] = useState<Record<string, string>>({})

    const validateTenantForm = (data: TenantFormData) => {
        const result = tenantSchema.safeParse(data)
        if (!result.success) {
            setTenantValidationErrors(formatZodErrors(result.error))
            return false
        }
        setTenantValidationErrors({})
        return true
    }

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
        if (!validateTenantForm(data)) return
        if (!tenantInfo) return

        const changes: Partial<TenantFormData> = {}
        if (data.company_name !== tenantInfo.company_name) changes.company_name = data.company_name
        if (data.first_name !== tenantInfo.first_name) changes.first_name = data.first_name
        if (data.last_name !== tenantInfo.last_name) changes.last_name = data.last_name
        if (data.basic_demo !== tenantInfo.basic_demo) changes.basic_demo = data.basic_demo

        if (Object.keys(changes).length > 0) {
            updateTenantMutation.mutate(changes)
        } else {
            setIsTenantEditing(false)
        }
    }

    return {
        isTenantEditing,
        setIsTenantEditing,
        tenantValidationErrors,
        onSubmitTenant,
        isMutationPending: updateTenantMutation.isPending,
    }
}
