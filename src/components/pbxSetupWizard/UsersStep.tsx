import {useRef, useState} from "react"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {ArrowLeft, ArrowRight, Loader2, Users} from "lucide-react"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import {useAppStore} from "@/lib/store"
import Button from "@/components/ui/Button"
import {UserForm, type UserFormData} from "@/components/shared/UserForm"
import {useWizard} from "@/components/pbxSetupWizard/WizardContext.tsx"
import type {TenantInfoRef} from "@/components/shared/TenantInfo.tsx"
import {z} from "zod"
import ConfirmationModal from "@/components/ui/ConfirmationModal.tsx";
import {User} from "@/types.ts";

// Add the userSchema definition (copy from UserForm.tsx)
const userSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    main_number: z.string().min(1, "Main number is required"),
    password: z.string().min(8, "Password length must be at least 8 characters"),
    ext_number: z.string().optional(),
    sip_username: z.string().optional(),
    sip_password: z.string().min(8, "Password length must be at least 8 characters"),
    use_phone_as_username: z.boolean().default(true),
})

export function UsersStep() {
    const {tenantId, usersList, currentTenant, setUsersList} = useAppStore()
    const {setCurrentStep} = useWizard()
    const [currentUserIndex, setCurrentTenantIndex] = useState(0)
    const queryClient = useQueryClient()
    const formRef = useRef<TenantInfoRef>(null)
    const [isUserUpdating, setIsUserUpdating] = useState(false)

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const {isLoading, error} = useQuery({
        queryKey: ["users", tenantId],
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}/users/`)
            setUsersList(response.data)
            return response.data.items
        },
        enabled: !!tenantId,
    })

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            if (!tenantId) throw new Error("No tenant ID found")
            await api.delete(`/tenants/${tenantId}/users/${userId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["users"]})
            toast.success("User deleted successfully")
            setDeleteModalOpen(false)
            setUserToDelete(null)
        },
    })

    //TODO refactor duplicated code fragment (create delete user hook)

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user)
        setDeleteModalOpen(true)
    }
    const handleDeleteConfirm = async () => {
        if (!userToDelete) return
        setIsDeleting(true)
        try {
            await deleteMutation.mutateAsync(userToDelete.user_id)
        } catch (e) {
            toast.error("Failed to delete user")
        } finally {
            setIsDeleting(false)
        }
    }


    const updateUserMutation = useMutation({
        mutationFn: async (data: UserFormData) => {
            if (!tenantId) {
                throw new Error("Tenant ID not found. Please log in again.")
            }
            setIsUserUpdating(true)
            const result = userSchema.safeParse(data)
            if (!result.success) {
                throw new Error("Validation failed")
            }

            const updatedUserList = {
                ...usersList,
                items: usersList.items.map((user) => {
                    if (user.user_id === data.user_id) {
                        return {...user, ...data}
                    }
                    return user
                }),
            }
            setUsersList(updatedUserList)

            return api.patch(`/tenants/${tenantId}/users/${data.user_id}`, {...data, basic_demo: false});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["users"]})
            setIsUserUpdating(false)
            toast.success("User updated successfully!")

            if (currentUserIndex === usersList.items.length - 1) {
                setCurrentStep("complete")
                return
            }

            setCurrentTenantIndex(currentUserIndex + 1)
        },
        onError: (error) => {
            setIsUserUpdating(false)
            console.error("Error updating user:", error)
            if (error instanceof Error && error.message === "Validation failed") {
                toast.error("Please fix validation errors before proceeding")
            } else {
                toast.error("Failed to update user. Please try again.")
            }
        },
    })


    const handleSaveUser = async () => {
        if (usersList.items && currentUserIndex < usersList.items.length) {
            const isValid = await formRef.current.submitForm()
            if (!isValid) {
                toast.error("Please fix validation errors before proceeding")
            }
        }
    }


    const handlePrevious = () => {
        if (currentUserIndex > 0) {
            setCurrentTenantIndex(currentUserIndex - 1)
        }
    }

    // If loading users
    if (isLoading) {
        return (
            <div className="bg-white shadow rounded-lg p-6 flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin"/>
            </div>
        )
    }

    // If error loading users
    if (error) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center py-8">
                    <p className="text-red-600">Failed to load users. Please try again.</p>
                    <Button onClick={() => queryClient.invalidateQueries({queryKey: ["users", tenantId]})}
                            className="mt-4">
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    if (!usersList.items || usersList.items.length === 0) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center mb-4">
                    <Users className="h-6 w-6 text-primary-600 mr-2"/>
                    <h3 className="text-lg font-medium">User Management</h3>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-600">No users found</p>
                    <p className="text-gray-500 text-sm mt-2">You can add users after completing the setup</p>
                    <Button onClick={() => setCurrentStep("complete")} className="mt-6">
                        Complete Setup
                    </Button>
                </div>
            </div>
        )
    }

    // If user data is available
    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Users className="h-6 w-6 text-primary-600 mr-2"/>
                    <h3 className="text-lg font-medium">
                        {usersList.items[currentUserIndex].email === currentTenant?.email ? "Setup your main user to connect PBX" : "Connect demo user to connect PBX"} {currentUserIndex + 1} of {usersList.items.length}
                    </h3>
                </div>
                <div className="text-sm text-gray-500">
                    {usersList.items[currentUserIndex].first_name} {usersList.items[currentUserIndex].last_name}
                </div>
            </div>


            {usersList.items.length !== 1 && <div className="mb-6 w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{width: `${((currentUserIndex + 1) / usersList.items.length) * 100}%`}}
                ></div>
            </div>
            }
            {usersList.items[currentUserIndex] && (
                <UserForm
                    ref={formRef}
                    initialData={usersList.items[currentUserIndex]}
                    onSubmit={updateUserMutation.mutate}
                    isSubmitting={updateUserMutation.isPending}
                    tenantId={tenantId || ""}
                    hideControls={true}
                />
            )}

            <div className="mt-6 flex justify-between">
                {currentUserIndex === 0 ?
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep('voip-config')}
                        className="flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Back to Voip configuration
                    </Button> :
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        className="flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Previous User
                    </Button>
                }

                {isUserUpdating ? (
                    <Button disabled variant="outline" className="flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                        Processing...
                    </Button>
                ) : (
                    <div className="flex items-center">
                        {usersList.items[currentUserIndex].email !== currentTenant?.email && (
                            <Button
                                onClick={() => handleDeleteClick(usersList.items[currentUserIndex])}
                                className="mr-4 bg-red-600 hover:bg-red-500"
                            >
                                Delete User
                            </Button>
                        )}

                        <Button onClick={handleSaveUser} className="flex items-center">
                            {currentUserIndex === usersList.items.length - 1 ? 'Complete setup' : 'Save and proceed'}
                            <ArrowRight className="h-4 w-4 ml-2"/>
                        </Button>
                    </div>
                )}

            </div>

            <ConfirmationModal
                title="Delete User"
                description={userToDelete ? `Are you sure you want to delete ${userToDelete.first_name} ${userToDelete.last_name}? This action cannot be undone.` : ""}
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false)
                    setUserToDelete(null)
                }}
                onConfirm={handleDeleteConfirm}
                isProcessing={isDeleting}
                confirmText="Delete"
            />
        </div>
    )
}
