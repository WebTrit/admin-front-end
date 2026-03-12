import {useState} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {toast} from "react-toastify"
import {useNavigate} from "react-router-dom"
import {ROUTES} from "@/routes/paths"
import {Loader2} from "lucide-react"
import {useAuthStore} from "@/lib/authStore"
import {formatZodErrors} from "@/lib/validation"
import Input from "@/components/ui/Input.tsx"
import axios from "axios";
import {config} from "@/config/runtime";
import {API_VERSION} from "@/lib/axios.ts";

const adminLoginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

const LoginAdmin = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const navigate = useNavigate()

    const {login} = useAuthStore()

    const {
        register,
        handleSubmit,
    } = useForm<AdminLoginFormData>({
        defaultValues: {
            username: "",
            password: "",
        },
    })

    const validateForm = (data: AdminLoginFormData) => {
        const result = adminLoginSchema.safeParse(data)
        if (!result.success) {
            setValidationErrors(formatZodErrors(result.error))
            return false
        }
        setValidationErrors({})
        return true
    }

    const onSubmit = async (formData: AdminLoginFormData) => {
        if (!validateForm(formData)) return

        const API_BASE_URL = config.BACKEND_URL;

        try {
            setIsSubmitting(true)

            const tokenApi = axios.create({
                baseURL: `${API_BASE_URL}${API_VERSION}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                timeout: 20000,
            });

            const data = new URLSearchParams({
                grant_type: 'password',
                username: formData.username,
                password: formData.password,
            });

            const response = await tokenApi.post("/token", data)
            const {access_token} = response.data

            if (!access_token) throw new Error("No access token")

            login({token: access_token, tenantId: null, isSuperTenant: false, isAdmin: true})
            toast.success("Admin login successful!")
            navigate(ROUTES.SUBTENANTS, {replace: true})
        } catch {
            toast.error("Invalid username or password.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Admin Sign In
                </h2>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <Input
                                id="username"
                                type="text"
                                {...register("username")}
                                error={!!validationErrors.username}
                                placeholder="Username"
                            />
                            {validationErrors.username && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password")}
                                error={!!validationErrors.password}
                                placeholder="Password"
                            />
                            {validationErrors.password && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin"/>
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default LoginAdmin
