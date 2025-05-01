import {useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import {TenantInfo, TenantInfoRef} from "@/components/shared/TenantInfo"
import {TenantFormData, tenantSchema} from "@/pages/SubtenantDetails"
import {useWizard} from "@/components/pbxSetupWizard/WizardContext.tsx";
import {useEffect, useRef, useState} from "react";

export function TenantInfoStep() {
    const {tenantData, setCurrentStep, setTenantFormRef, updateTenantData} = useWizard()
    const formRef = useRef<TenantInfoRef>(null)
    const queryClient = useQueryClient()
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // Set the form reference in the context
    useEffect(() => {
        setTenantFormRef(formRef)
        return () => setTenantFormRef(null)
    }, [setTenantFormRef])

    const updateTenantMutation = useMutation({
        mutationFn: async (updatedData: Partial<TenantFormData>) => {
            if (!tenantData.tenant_id) throw new Error("No tenant ID found")
            const response = await api.patch(`/tenants/${tenantData.tenant_id}`, updatedData)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantData.tenant_id]})
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

    const onSubmitTenant = (data: TenantFormData) => {
        if (!validateForm(data)) return

        if (!tenantData) return

        const changes: Partial<TenantFormData> = {}
        if (data.company_name !== tenantData.company_name) changes.company_name = data.company_name
        if (data.first_name !== tenantData.first_name) changes.first_name = data.first_name
        if (data.last_name !== tenantData.last_name) changes.last_name = data.last_name

        changes.sip = {port: '5060'}
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
