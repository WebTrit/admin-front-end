import {useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import {toast} from "react-toastify"
import {UserForm, type UserFormData} from "../components//user/UserForm"
import api from "@/lib/axios"

const AddUser = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()
    const {tenantId} = useParams()

    const handleSubmit = async (data: UserFormData) => {
        try {
            setIsSubmitting(true)

            if (!tenantId) {
                toast.error("Tenant ID not found. Please log in again.")
                return
            }

            await api.post(`/tenants/${tenantId}/users`, data)
            toast.success("User added successfully!")
            navigate(`/subtenants/${tenantId}`)
        } catch (error) {
            console.error("Error adding user:", error)
            toast.error("Failed to add user. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!tenantId) {
        return null
    }
    return (
        <UserForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            title="Add New User"
            submitButtonText="Add User"
            tenantId={tenantId}
        />
    )
}

export default AddUser