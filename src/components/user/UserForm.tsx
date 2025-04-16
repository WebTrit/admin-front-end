import {useState, useEffect} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {ArrowLeft, Loader2} from "lucide-react"
import {useNavigate} from "react-router-dom"
import Input from "@/components/ui/Input.tsx";

// Define the form schema with Zod
const userSchema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    main_number: z.string().min(1, "Main number is required"),
    ext_number: z.string().optional(),
    sip_username: z.string().optional(),
    sip_password: z.string().min(8, "Password length must be at least 8 characters"),
    use_phone_as_username: z.boolean().default(true),
})

export type UserFormData = {
    first_name: string
    last_name: string
    email: string
    ext_number: string
    main_number: string
    sip_username: string
    sip_password: string
    use_phone_as_username: boolean
}

interface UserFormProps {
    initialData?: UserFormData
    onSubmit: (data: UserFormData) => Promise<void>
    isSubmitting: boolean
    title: string
    submitButtonText: string
    tenantId: string
}

export const UserForm = ({
                             initialData,
                             onSubmit,
                             isSubmitting,
                             title,
                             submitButtonText,
                         }: UserFormProps) => {
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const navigate = useNavigate()

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
            ...initialData,
        },
    })

    useEffect(() => {
        if (initialData) {
            reset(initialData)
        }
    }, [initialData, reset])

    const usePhoneAsUsername = watch("use_phone_as_username")

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

    const handleFormSubmit = async (data: UserFormData) => {
        if (!validateForm(data)) {
            return
        }
        await onSubmit(data)
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="mr-4 p-2 rounded-full hover:bg-gray-100"
                    aria-label="Go back"
                >
                    <ArrowLeft size={20}/>
                </button>
                <h1 className="text-2xl font-bold">{title}</h1>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                                First Name <span className='text-red-500'>*</span>
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
                                Last Name <span className='text-red-500'>*</span>
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
                            Email Address <span className='text-red-500'>*</span>
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
                                Main Phone Number <span className='text-red-500'>*</span>
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
                            SIP Password <span className='text-red-500'>*</span>
                        </label>
                        <Input
                            id="sip_password"
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
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin"/>
                                    Saving...
                                </>
                            ) : (
                                submitButtonText
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}