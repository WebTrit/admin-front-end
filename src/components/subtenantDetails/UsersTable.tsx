import {useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import {Loader2, Pencil, Plus, Trash2, Users} from "lucide-react"
import api from "@/lib/axios"
import type {User} from "@/types"
import Button from "@/components/ui/Button"
import {useAppStore} from "@/lib/store"
import ConfirmationModal from "@/components/ui/ConfirmationModal.tsx"
import {CopyableText} from "@/components/ui/CopyableText.tsx"

interface UsersTableProps {
    maxUsers: number
}

export function UsersTable({maxUsers}: UsersTableProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const {tenantId} = useParams()

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const {setUsersList} = useAppStore()

    const DIALER_URL = import.meta.env.VITE_WEBTRIT_DIALER_URL

    const {
        data: usersData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["users", tenantId],
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}/users/`)
            setUsersList(response.data)
            return response.data
        },
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

    const users = usersData?.items || []
    const usersCount = users.length
    const canAddUsers = maxUsers > 0 && usersCount < maxUsers
    const hasReachedMaxUsers = maxUsers > 0 && usersCount >= maxUsers

    if (error) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex flex-col items-center justify-center min-h-[250px] text-gray-500">
                    <div className="rounded-full bg-red-100 p-3 mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-red-600"
                        >
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <p className="text-lg font-medium">Failed to load users</p>
                    <p className="text-sm mt-2">Please try again later</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => queryClient.invalidateQueries({queryKey: ["users"]})}
                    >
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center">
                        <Users className="h-5 w-5 text-primary-600 mr-2"/>
                        <h3 className="text-lg font-medium">Users Overview</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {hasReachedMaxUsers
                            ? `Maximum users reached (${maxUsers})`
                            : `Managing ${usersCount} ${usersCount === 1 ? "user" : "users"} (maximum users available ${maxUsers})`}
                    </p>
                </div>
                {canAddUsers && (
                    <Button className="w-full sm:w-auto mt-2 sm:mt-0"
                            onClick={() => navigate(`/subtenants/${tenantId}/users/new`)}>
                        <Plus className="h-4 w-4 mr-2"/>
                        Add User
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[200px]">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin"/>
                    <p className="text-gray-500 mt-4">Loading users...</p>
                </div>
            ) : (
                <>
                    {/* Desktop view */}
                    <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Name</th>
                                <th className="pl-8 py-3 text-left text-sm font-medium text-gray-900">Email</th>
                                <th className="pl-8 py-3 text-left text-sm font-medium text-gray-900">SIP Username</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Extension</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Login Link</th>
                                <th className="relative px-4 py-3 text-right text-sm font-medium text-gray-900 w-[100px]">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users className="h-8 w-8 mb-2 text-gray-400"/>
                                            <p>No users found</p>
                                            {canAddUsers && (
                                                <button
                                                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
                                                    onClick={() => navigate(`/subtenants/${tenantId}/users/new`)}
                                                >
                                                    Add your first user
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user: User) => (
                                    <tr key={user.user_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {user.first_name} {user.last_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px]">
                                            <CopyableText tooltip={user.email}/>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            <CopyableText tooltip={user.sip_username}/>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {user.ext_number ? (
                                                <span
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {user.ext_number}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[250px]">
                                            <CopyableText
                                                tooltip={`${DIALER_URL}/login?tenant=${user.tenant_id}&email=${user.main_number}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/subtenants/${tenantId}/users/${user.user_id}/edit`)}
                                                    aria-label="Edit user"
                                                >
                                                    <Pencil className="h-4 w-4"/>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(user)}
                                                    aria-label="Delete user"
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500"/>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile view */}
                    <div className="md:hidden space-y-4">
                        {users.length === 0 ? (
                            <div className="text-center py-6">
                                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400"/>
                                <p className="text-gray-500">No users found</p>
                                {canAddUsers && (
                                    <button
                                        className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2"
                                        onClick={() => navigate(`/subtenants/${tenantId}/users/new`)}
                                    >
                                        Add your first user
                                    </button>
                                )}
                            </div>
                        ) : (
                            users.map((user: User) => (
                                <div key={user.user_id} className="bg-white border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {user.first_name} {user.last_name}
                                            </h3>
                                            <p className="text-sm max-w-48 text-gray-500 mt-1">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate(`/subtenants/${tenantId}/users/${user.user_id}/edit`)}
                                                aria-label="Edit user"
                                            >
                                                <Pencil className="h-4 w-4"/>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteClick(user)}
                                                aria-label="Delete user"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500"/>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                                        <div className="text-gray-500">SIP Username</div>
                                        <div className="text-gray-900">{user.sip_username || '-'}</div>

                                        <div className="text-gray-500">Extension</div>
                                        <div>
                                            {user.ext_number ? (
                                                <span
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {user.ext_number}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>

                                        <div className="text-gray-500">Login Link</div>
                                        <div className="text-gray-900 break-all">
                                            <CopyableText
                                                tooltip={`${DIALER_URL}/login?tenant=${user.tenant_id}&email=${user.main_number}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

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

export default UsersTable
