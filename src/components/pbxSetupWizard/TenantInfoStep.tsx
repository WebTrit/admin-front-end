import {useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import {formatZodErrors} from "@/lib/validation"
import {TenantInfo, TenantInfoRef} from "@/components/shared/TenantInfo"
import {TenantFormData, tenantSchema} from "@/lib/schemas"
import type {Tenant} from "@/types"

import {useWizard} from "@/components/pbxSetupWizard/WizardContext.tsx";
import {useEffect, useRef, useState} from "react";
import {useAuthStore} from "@/lib/authStore";

export function TenantInfoStep() {
    const {tenantData, setCurrentStep, setTenantFormRef, updateTenantData} = useWizard()
    const {tenantId} = useAuthStore()
    const formRef = useRef<TenantInfoRef>(null)
    const queryClient = useQueryClient()
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // Set the form reference in the context
    useEffect(() => {
        setTenantFormRef(formRef)
        return () => setTenantFormRef(null)
    }, [setTenantFormRef])

    const updateTenantMutation = useMutation({
        mutationFn: async (updatedData: Partial<Tenant>) => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.patch(`/tenants/${tenantId}`, updatedData)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantId]})
            toast.success("Personal Information updated successfully")
            setCurrentStep("voip-config")
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to update Personal Information")
        },
    })

    const validateForm = (data: TenantFormData) => {
        const result = tenantSchema.safeParse(data)
        if (!result.success) {
            setValidationErrors(formatZodErrors(result.error))
            return false
        }
        setValidationErrors({})
        return true
    }

    const onSubmitTenant = (data: TenantFormData) => {
        if (!validateForm(data)) return

        if (!tenantData) return

        const changes: Partial<Tenant> = {}
        if (data.company_name !== tenantData.company_name) changes.company_name = data.company_name
        if (data.first_name !== tenantData.first_name) changes.first_name = data.first_name
        if (data.last_name !== tenantData.last_name) changes.last_name = data.last_name

        changes.sip = {port: 5060, host: '', use_tcp: false}
        updateTenantData({...changes})

        if (Object.keys(changes).length > 0) {
            updateTenantMutation.mutate(changes)
        } else {
            setCurrentStep("voip-config")
        }
    }

    return (
        <TenantInfo
            ref={formRef}
            tenantData={tenantData}
            isEditing={true} // Always in edit mode
            isMutationPending={updateTenantMutation.isPending}
            onSubmit={onSubmitTenant}
            handleEdit={() => {
            }} // Empty function since we don't need edit button
            hideControls={true} // Hide the control buttons
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
        />
    )
}
