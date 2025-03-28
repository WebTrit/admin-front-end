import {useState} from "react"
import {Users, Plus, Pencil, Trash2} from "lucide-react"
import {useNavigate} from "react-router-dom"
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import type {User} from "@/types"
import Button from "@/components/ui/Button.tsx";
import DeleteUserModal from "@/components/DeleteUserModal.tsx";
import {useAppStore} from "@/lib/store.ts";

interface UsersTableProps {
    maxUsers: number
}

export function UsersTable({maxUsers}: UsersTableProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const tenantId = localStorage.getItem("tenantId")

    // State for delete modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const {setUsersList} = useAppStore()

    // Fetch users data
    const {data: usersData} = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            if (!tenantId) throw new Error("No tenant ID found")
            const response = await api.get(`/tenants/${tenantId}/users/`)
            setUsersList(response.data)
            return response.data
        },
    })

    // Delete user mutation
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
        } catch (error) {
            toast.error("Failed to delete user")
        } finally {
            setIsDeleting(false)
        }
    }

    const users = usersData?.items || []
    const usersCount = users.length
    const canAddUsers = maxUsers > 0 && usersCount < maxUsers
    const hasReachedMaxUsers = maxUsers > 0 && usersCount >= maxUsers

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Users className="h-6 w-6 text-primary-600 mr-2"/>
                    <h3 className="text-lg font-medium">Users Overview</h3>
                </div>
                {canAddUsers && (
                    <Button onClick={() => navigate("/users/new")}>
                        <Plus className="h-5 w-5 mr-2"/>
                        Add User
                    </Button>
                )}
            </div>

            {hasReachedMaxUsers &&
                <p className="mb-4 text-sm text-gray-500">Maximum number of users reached ({maxUsers})</p>}

            <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                            <tr>
                                <th scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                    Name
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Email
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    SIP Username
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                    Extension
                                </th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {users.map((user: User) => (
                                <tr key={user.user_id}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                        {user.first_name} {user.last_name}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.sip_username}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.ext_number || "-"}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm"
                                                    onClick={() => navigate(`/users/${user.user_id}/edit`)}>
                                                <Pencil className="h-4 w-4"/>
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(user)}>
                                                <Trash2 className="h-4 w-4 text-red-500"/>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        {users.length === 0 && <div className="text-center py-6 text-gray-500">No users found</div>}
                    </div>
                </div>
            </div>

            <DeleteUserModal
                user={userToDelete}
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false)
                    setUserToDelete(null)
                }}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </div>
    )
}

