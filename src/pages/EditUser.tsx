import {useNavigate, useParams} from "react-router-dom"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import {Loader2} from "lucide-react"
import api from "../lib/axios"
import {UserForm, UserFormData} from "@/components/shared/UserForm.tsx";

const EditUser = () => {
    const {userId, tenantId} = useParams<{ userId: string; tenantId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const {
        data: userData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["user", tenantId, userId],
        queryFn: async () => {
            if (!tenantId) {
                throw new Error("Tenant ID not found. Please log in again.")
            }
            const response = await api.get(`/tenants/${tenantId}/users/${userId}`)
            return response.data
        },
        enabled: !!tenantId && !!userId,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const updateUserMutation = useMutation({
        mutationFn: async (data: UserFormData) => {
            if (!tenantId) {
                throw new Error("Tenant ID not found. Please log in again.")
            }
            return api.patch(`/tenants/${tenantId}/users/${userId}`, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["users", tenantId]})
            queryClient.invalidateQueries({queryKey: ["user", tenantId, userId]})
            toast.success("User updated successfully!")
            navigate(`/subtenants/${tenantId}`)
        },
        onError: (error) => {
            console.error("Error updating user:", error)
            toast.error("Failed to update user. Please try again.")
        },
    })

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-3xl flex justify-center items-center min-h-[50vh]">
                <div className="flex flex-col items-center">
                    <Loader2 size={40} className="animate-spin text-primary-600 mb-4"/>
                    <p className="text-gray-600">Loading user data...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 mb-4">
                        {error instanceof Error ? error.message : "Failed to load user data. Please try again."}
                    </p>
                    <button
                        onClick={() => navigate("/users")}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                        Back to Users
                    </button>
                </div>
            </div>
        )
    }

    return (
        <UserForm
            initialData={userData}
            onSubmit={updateUserMutation.mutate}
            isSubmitting={updateUserMutation.isPending}
            title="Edit User"
            submitButtonText="Update User"
        />
    )
}

export default EditUser