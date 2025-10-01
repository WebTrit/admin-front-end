import {forwardRef, useEffect, useImperativeHandle, useState} from "react"
import {useForm, useWatch} from "react-hook-form"
import {z} from "zod"
import {ArrowLeft, Loader2} from "lucide-react"
import {useNavigate} from "react-router-dom"
import Input from "@/components/ui/Input.tsx"

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
    user_id: z.string().optional(),
}).refine((data) => {
    if (!data.use_phone_as_username && !data.sip_username) {
        return false;
    }
    return true;
}, {
    message: "SIP Username is required when 'Use phone number as SIP username' is unchecked",
    path: ["sip_username"],
});


export type UserFormData = z.infer<typeof userSchema>

export interface UserFormRef {
    submitForm: () => void
    resetForm: () => void
}

//todo merge types and zod schema
interface UserFormProps {
    initialData?: UserFormData
    isSubmitting: boolean
    onSubmit: (data: UserFormData) => Promise<void>
    title?: string
    submitButtonText?: string
    hideControls?: boolean
}

export const UserForm = forwardRef<UserFormRef, UserFormProps>(
    (
        {
            initialData,
            onSubmit,
            isSubmitting,
            title,
            submitButtonText,
            hideControls = false
        }, ref
    ) => {
        const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
        const navigate = useNavigate()

        const {register, handleSubmit, setValue, reset, control} = useForm<UserFormData>({
            defaultValues: {
                first_name: "",
                last_name: "",
                email: "",
                ext_number: "",
                main_number: "",
                password: "",
                sip_username: "",
                sip_password: "",
                use_phone_as_username: initialData?.sip_username === initialData?.main_number,
                ...initialData,
            },
        })
        const usePhoneAsUsername = useWatch({name: "use_phone_as_username", control})
        const mainNumber = useWatch({name: "main_number", control})

        useEffect(() => {
            if (initialData) {
                const transformedData = Object.keys(initialData).reduce((acc, key) => {
                    acc[key] = initialData[key] === null ? "" : initialData[key];
                    return acc;
                }, {} as UserFormData);

                reset(transformedData);
                setValue("ext_number", transformedData?.ext_number || "");
                setValue("use_phone_as_username", transformedData?.sip_username === initialData?.main_number);
            }
        }, [initialData, reset, setValue]);

        useEffect(() => {
            if (usePhoneAsUsername && mainNumber) {
                setValue("sip_username", mainNumber);
            }
        }, [usePhoneAsUsername, mainNumber, setValue]);

        useImperativeHandle(ref, () => ({
            submitForm: () => {
                // Create a promise that will resolve with the validation result
                return new Promise((resolve) => {
                    handleSubmit(
                        async (data) => {
                            // On success (validation passed)
                            const result = validateForm(data)
                            if (result) {
                                await onSubmit(data)
                            }
                            resolve(result)
                        },
                        (errors) => {
                            // On error (validation failed)
                            console.log("Validation errors:", errors)
                            resolve(false)
                        },
                    )()
                })
            },
            resetForm: () => {
                reset(initialData || {})
                setValidationErrors({})
            },
        }))


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
            const isValid = validateForm(data)
            if (!isValid) {
                return false
            }
            await onSubmit(data)
            return true
        }

        return (
            <div>
                {!hideControls && (
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
                )}

                <div className={`bg-white rounded-lg ${!hideControls && 'shadow-md p-6'}`}>
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                                    First Name <span className="text-red-500">*</span>
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
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="last_name"
                                    {...register("last_name")}
                                    error={!!validationErrors.last_name}
                                    placeholder="Enter last name"
                                />
                                {validationErrors.last_name && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.last_name}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address <span className="text-red-500">*</span>
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
                                    Main Phone Number <span className="text-red-500">*</span>
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

                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password for app login <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    id="password"
                                    {...register("password")}
                                    error={!!validationErrors.password}
                                    placeholder="Enter main phone number"
                                />
                                {validationErrors.password &&
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input
                                    id="use_phone_as_username"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    {...register("use_phone_as_username")}
                                />
                                <label htmlFor="use_phone_as_username" className="ml-2 block text-sm text-gray-700">
                                    Use phone number as SIP username
                                </label>
                            </div>
                        </div>

                        {typeof usePhoneAsUsername === 'boolean' && !usePhoneAsUsername && (<div className="space-y-2">
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
                                SIP Password <span className="text-red-500">*</span>
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

                        {!hideControls && (
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
                        )}
                    </form>
                </div>
            </div>
        )
    },
)
