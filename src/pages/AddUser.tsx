import {useNavigate, useParams} from "react-router-dom"
import {useMutation} from "@tanstack/react-query"
import {toast} from "react-toastify"
import {useAuthStore} from "@/lib/authStore"
import {useTenantStore} from "@/lib/tenantStore"
import {UserForm, UserFormData} from "@/components/shared/UserForm.tsx"
import api from "@/lib/axios.ts"
import {ROUTES} from "@/routes/paths"

const AddUser = () => {
    const navigate = useNavigate()
    const {tenantId} = useParams()
    const {isSuperTenant} = useAuthStore()
    const {currentTenant} = useTenantStore()

    const addUserMutation = useMutation({
        mutationFn: async (data: UserFormData) => {
            if (!tenantId) throw new Error("Tenant ID not found.")

            const payload: Omit<UserFormData, 'use_phone_as_username'> & { basic_demo: boolean } = {
                ...data,
                basic_demo: !isSuperTenant && typeof currentTenant?.basic_demo === 'boolean'
                    ? currentTenant.basic_demo
                    : false,
            }

            const response = await api.post(`/tenants/${tenantId}/users`, payload)
            return response.data
        },
        onSuccess: () => {
            toast.success("User added successfully!")
            navigate(ROUTES.subtenant(tenantId!))
        },
        onError: () => {
            toast.error("Failed to add user. Please try again.")
        },
    })

    if (!tenantId) {
        return null
    }

    return (
        <UserForm
            onSubmit={async (data) => { await addUserMutation.mutateAsync(data) }}
            isSubmitting={addUserMutation.isPending}
            title="Add New User"
            submitButtonText="Add User"
        />
    )
}

export default AddUser
