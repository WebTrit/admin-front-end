import {useState} from "react"
import {useMutation, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import api from "@/lib/axios"
import {User} from "@/types"

export function useDeleteUser(tenantId: string | undefined | null) {
    const queryClient = useQueryClient()

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const deleteMutation = useMutation({
        mutationFn: async (userId: string) => {
            if (!tenantId) throw new Error("No tenant ID found")
            await api.delete(`/tenants/${tenantId}/users/${userId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["users", tenantId]})
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
        } catch {
            toast.error("Failed to delete user")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false)
        setUserToDelete(null)
    }

    return {
        deleteModalOpen,
        userToDelete,
        isDeleting,
        handleDeleteClick,
        handleDeleteConfirm,
        handleCloseDeleteModal,
    }
}
