import {useState} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {toast} from "react-toastify"
import {useNavigate} from "react-router-dom"
import {Loader2} from "lucide-react"
import {useAppStore} from "@/lib/store"
import Input from "@/components/ui/Input.tsx"
import axios from "axios";

// Zod schema for admin login
const adminLoginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

const LoginAdmin = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const navigate = useNavigate()

    const {setToken, setIsAdmin} = useAppStore()

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

    const onSubmit = async (data: AdminLoginFormData) => {
        if (!validateForm(data)) return

        const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
        const TOKEN_BASE_URL = API_BASE_URL.replace(/\/api\/v\d+(\.\d+)?$/, '');

        try {
            setIsSubmitting(true)

            const tokenApi = axios.create({
                baseURL: TOKEN_BASE_URL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                timeout: 10000,
            });

            const data = new URLSearchParams({
                grant_type: 'password',
                username: 'webtrit',
                password: 'Kyiv2025!',
                scope: '',
                client_id: 'string',
                client_secret: 'string',
            });

            const response = await tokenApi.post("/token", data)
            const {access_token} = response.data

            if (!access_token) throw new Error("No access token")

            setToken(access_token)
            setIsAdmin(true)

            toast.success("Admin login successful!")
            navigate("/dashboard", {replace: true}) // adjust path
        } catch (error) {
            console.error("Admin login error:", error)
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
