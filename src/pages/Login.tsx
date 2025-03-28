import {useState} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {toast} from "react-toastify"
import {useNavigate} from "react-router-dom"
import {Loader2} from "lucide-react"
import api from "@/lib/axios"
import {useAppStore} from "@/lib/store"
import Input from "@/components/ui/Input.tsx";

// Define the form schema with Zod
const loginSchema = z.object({
    login: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const navigate = useNavigate()

    // Get store actions
    const {setTenantId, setToken} = useAppStore()

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<LoginFormData>({
        defaultValues: {
            login: "",
            password: "",
        },
    })

    const validateForm = (data: LoginFormData) => {
        const result = loginSchema.safeParse(data)
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

    const onSubmit = async (data: LoginFormData) => {
        if (!validateForm(data)) {
            return
        }

        try {
            setIsSubmitting(true)

            // Replace with your actual API endpoint
            const response = await api.post("/tenants/login", data)

            const token = response.data.access_token

            // Save token to store
            setToken(token)

            // Decode token to get user info if available

            // Set tenant ID
            if (response.data.tenant_id) {
                setTenantId(response.data.tenant_id)
            }

            toast.success("Login successful!")
            navigate("/dashboard")
        } catch (error) {
            console.error("Login error:", error)
            toast.error("Invalid email or password. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                {...register("login")}
                                error={!!validationErrors.login}
                                placeholder="Email address"
                            />
                            {validationErrors.login &&
                                <p className="text-red-500 text-xs mt-1">{validationErrors.login}</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                {...register("password")}
                                error={!!validationErrors.password}
                                placeholder="Password"
                            />
                            {validationErrors.password &&
                                <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Login

