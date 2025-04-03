//example page To test AI generation can be modified or deleted
import {useState, useEffect} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {toast} from "react-toastify"
import {ArrowLeft, Loader2} from "lucide-react"
import {useNavigate, useParams} from "react-router-dom"
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query"
import Input from "@/components/ui/Input.tsx";
import api from "@/lib/axios.ts";

// Define the form schema with Zod
const userSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    ext_number: z.string().optional(),
    main_number: z.string().optional(),
    sip_username: z.string().optional(),
    sip_password: z.string().min(8, "Password length must be at least 8 characters"),
    use_phone_as_username: z.boolean().default(true),
})

type UserFormData = {
    first_name: string
    last_name: string
    email: string
    ext_number: string
    main_number: string
    sip_username: string
    sip_password: string
    use_phone_as_username: boolean
}

const EditUser = () => {
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const navigate = useNavigate()
    const {userId, tenantId} = useParams<{ userId: string, tenantId: string }>()

    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
    } = useForm<UserFormData>({
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            ext_number: "",
            main_number: "",
            sip_username: "",
            sip_password: "",
            use_phone_as_username: true,
        },
    })

    const usePhoneAsUsername = watch("use_phone_as_username")

    // Fetch user data with react-query
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

    // Update form when user data is loaded
    useEffect(() => {
        if (userData) {
            reset({
                first_name: userData.first_name || "",
                last_name: userData.last_name || "",
                email: userData.email || "",
                ext_number: userData.ext_number || "",
                main_number: userData.main_number || "",
                sip_username: userData.sip_username || "",
                sip_password: userData.sip_password || "",
                use_phone_as_username: userData.use_phone_as_username !== false, // Default to true if not specified
            })
        }
    }, [userData, reset])

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: async (data: UserFormData) => {
            if (!tenantId) {
                throw new Error("Tenant ID not found. Please log in again.")
            }

            return api.put(`/tenants/${tenantId}/users/${userId}`, data)
        },
        onSuccess: () => {
            // Invalidate and refetch
            queryClient.invalidateQueries({queryKey: ["users", tenantId]})
            queryClient.invalidateQueries({queryKey: ["user", tenantId, userId]})

            toast.success("User updated successfully!")
            navigate(`/subtenants/${tenantId}`) // Assuming you have a users list page
        },
        onError: (error) => {
            console.error("Error updating user:", error)
            toast.error("Failed to update user. Please try again.")
        },
    })

    const validateForm = (data: UserFormData) => {
        const result = userSchema.safeParse(data)
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

    const onSubmit = async (data: UserFormData) => {
        if (!validateForm(data)) {
            return
        }

        updateUserMutation.mutate(data)
    }

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
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100"
                        aria-label="Go back">
                    <ArrowLeft size={20}/>
                </button>
                <h1 className="text-2xl font-bold">Edit User</h1>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                                First Name *
                            </label>
                            <Input
                                id="first_name"
                                {...register("first_name")}
                                error={!!validationErrors.first_name}
                                placeholder="Enter first name"
                            />
                            {validationErrors.first_name && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.first_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                                Last Name *
                            </label>
                            <Input
                                id="last_name"
                                {...register("last_name")}
                                error={!!validationErrors.last_name}
                                placeholder="Enter last name"
                            />
                            {validationErrors.last_name &&
                                <p className="text-red-500 text-xs mt-1">{validationErrors.last_name}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address *
                        </label>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            error={!!validationErrors.email}
                            placeholder="Enter email address"
                        />
                        {validationErrors.email &&
                            <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="main_number" className="block text-sm font-medium text-gray-700">
                                Main Phone Number
                            </label>
                            <Input
                                id="main_number"
                                {...register("main_number")}
                                error={!!validationErrors.main_number}
                                placeholder="Enter main phone number"
                            />
                            {validationErrors.main_number && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.main_number}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="ext_number" className="block text-sm font-medium text-gray-700">
                                Extension Number
                            </label>
                            <Input
                                id="ext_number"
                                {...register("ext_number")}
                                error={!!validationErrors.ext_number}
                                placeholder="Enter extension number"
                            />
                            {validationErrors.ext_number && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.ext_number}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center">
                            <input
                                id="use_phone_as_username"
                                type="checkbox"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                {...register("use_phone_as_username")}
                                onChange={(e) => {
                                    setValue("use_phone_as_username", e.target.checked)
                                    if (e.target.checked) {
                                        setValue("sip_username", "")
                                    }
                                }}
                            />
                            <label htmlFor="use_phone_as_username" className="ml-2 block text-sm text-gray-700">
                                Use phone number as SIP username
                            </label>
                        </div>
                    </div>

                    {!usePhoneAsUsername && (
                        <div className="space-y-2">
                            <label htmlFor="sip_username" className="block text-sm font-medium text-gray-700">
                                SIP Username
                            </label>
                            <Input
                                id="sip_username"
                                {...register("sip_username")}
                                error={!!validationErrors.sip_username}
                                placeholder="Enter SIP username"
                            />
                            {validationErrors.sip_username && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.sip_username}</p>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label htmlFor="sip_password" className="block text-sm font-medium text-gray-700">
                            SIP Password *
                        </label>
                        <Input
                            id="sip_password"
                            type="password"
                            {...register("sip_password")}
                            error={!!validationErrors.sip_password}
                            placeholder="Enter SIP password"
                        />
                        {validationErrors.sip_password && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors.sip_password}</p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updateUserMutation.isPending}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {updateUserMutation.isPending ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin"/>
                                    Saving...
                                </>
                            ) : (
                                "Update User"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditUser

