import {useState} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {toast} from "react-toastify"
import {useNavigate} from "react-router-dom"
import {Loader2} from "lucide-react"
import api from "@/lib/axios"
import {useAppStore} from "@/lib/store"
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";
import {config} from "@/config/runtime";

const loginSchema = z.object({
    login: z.string(),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const navigate = useNavigate()
    const isSignupLink = config.IS_SIGNUP;

    const {setTenantId, setToken, setIsSuperTenant} = useAppStore()

    const {
        register,
        handleSubmit,
        getValues
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

            const response = await api.post("/tenants/login", data)
            const {access_token, tenant_id} = response.data

            if (!access_token) {
                throw new Error("No access token received")
            }

            setToken(access_token)
            toast.success("Login successful!")

            if (tenant_id) {
                setTenantId(tenant_id)

                try {
                    const {data: currentUserData} = await api.get(`/tenants/${tenant_id}`)
                    console.log("Current user data:", currentUserData)
                    setIsSuperTenant(currentUserData.is_super_tenant)

                    if (currentUserData.basic_demo) {
                        navigate('/dashboard', {replace: true})
                        return
                    }

                    if (currentUserData.is_super_tenant) {
                        navigate("/subtenants", {replace: true})
                    } else {
                        navigate(`/subtenants/${tenant_id}`, {replace: true})
                    }
                } catch (err) {
                    console.error("Failed to fetch tenant details:", err)
                    toast.error("Failed to verify tenant status.")
                    navigate(`/subtenants/${tenant_id}`, {replace: true})
                }
            } else {
                navigate(`/subtenants/${tenant_id}`, {replace: true})
            }
        } catch (error) {
            console.error("Login error:", error)
            toast.error("Invalid login or password. Please try again.")
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
                {isSignupLink && <div>
                    <div>If you don't have an account click here to {' '}
                        <span
                            onClick={() => navigate('/signup', {replace: true})}
                            className="text-blue-400 underline cursor-pointer"
                        >
                            sign up
                        </span>
                    </div>
                </div>}
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
                        <Button
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
                        </Button>
                        <div className="text-center mt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full hover:bg-transparent active:bg-transparent text-sm text-primary-500 hover:underline disabled:text-gray-400 disabled:no-underline"
                                onClick={() => {
                                    const email = getValues("login")
                                    navigate(`/password-reset?email=${encodeURIComponent(email)}`)
                                }}>
                                Forgot password? Click here to reset.
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default Login