"use client"

import {useEffect, useRef, useState} from "react"
import {useForm} from "react-hook-form"
import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import {toast} from "react-toastify"
import {useLocation, useNavigate} from "react-router-dom"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import api from "@/lib/axios"
import {useAppStore} from "@/lib/store.ts"

const emailSchema = z.object({
    email: z.string().email("Invalid email address"),
})

const resetSchema = z
    .object({
        code: z.string().min(1, "Verification code is required"),
        new_password: z.string().min(8, "Password must be at least 8 characters"),
        confirm_password: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.new_password === data.confirm_password, {
        message: "Passwords don't match",
        path: ["confirm_password"],
    })

type EmailFormData = z.infer<typeof emailSchema>
type ResetFormData = z.infer<typeof resetSchema>

const PasswordReset = () => {
    const {setTenantId, setToken} = useAppStore()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState<"request" | "verify">("request")
    const [userEmail, setUserEmail] = useState("")
    const [otpId, setOtpId] = useState("")

    const navigate = useNavigate()
    const location = useLocation()

    const emailForm = useForm<EmailFormData>({
        resolver: zodResolver(emailSchema),
    })

    const resetForm = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
    })

    const handleEmailSubmit = async (data: EmailFormData) => {
        setIsSubmitting(true)
        try {
            const response = await api.post("/tenants/pwd_reset", {
                email: data.email,
            })

            setUserEmail(data.email)
            setOtpId(response.data.otp_id)
            setStep("verify")
            toast.success("Reset code sent! Check your email.")
        } catch (err) {
            console.error("Password reset request failed:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResetSubmit = async (data: ResetFormData) => {
        setIsSubmitting(true)
        try {
            const response = await api.put("/api/v1.0/tenants/pwd_reset", {
                code: data.code,
                new_password: data.new_password,
                otp_id: otpId,
            })

            const {access_token, tenant_id} = response.data

            setToken(access_token)

            if (tenant_id) {
                setTenantId(tenant_id)
            }

            toast.success("Password reset successful!")
            navigate("/login", {replace: true})
        } catch (err) {
            console.error("Password reset verification failed:", err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleBackToEmail = () => {
        setStep("request")
    }

    const hasRunRef = useRef(false)

    useEffect(() => {
        if (hasRunRef.current) return

        const params = new URLSearchParams(location.search)
        const email = params.get("email")

        if (email && emailSchema.safeParse({email}).success) {
            hasRunRef.current = true
            emailForm.setValue("email", email)
            emailForm.handleSubmit(handleEmailSubmit)()
        }
    }, [location.search])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full">
                <h2 className="text-center text-2xl font-semibold text-gray-800">Reset Password</h2>

                {step === "request" ? (
                    <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <Input type="email" {...emailForm.register("email")} placeholder="Email"/>
                            {emailForm.formState.errors.email && (
                                <p className="text-red-500 text-xs mt-1">
                                    {emailForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>
                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Sending..." : "Send Reset Code"}
                        </Button>
                        <div className="text-center mt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full hover:bg-transparent text-sm text-primary-500 hover:underline disabled:text-gray-400 disabled:no-underline"
                                onClick={() => navigate("/login")}
                            >
                                To login page
                            </Button>
                        </div>
                    </form>
                ) : (
                    <>
                        <p className="text-center mt-4 text-gray-600">
                            We've sent a verification code to{" "}
                            <span className="font-medium">{userEmail}</span>
                        </p>
                        <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700 mt-4">Verification
                                    Code</label>
                                <Input type="text" {...resetForm.register("code")} placeholder="Enter code"/>
                                {resetForm.formState.errors.code && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {resetForm.formState.errors.code.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">New Password</label>
                                <Input type="password" {...resetForm.register("new_password")}
                                       placeholder="New password"/>
                                {resetForm.formState.errors.new_password && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {resetForm.formState.errors.new_password.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Confirm Password</label>
                                <Input type="password" {...resetForm.register("confirm_password")}
                                       placeholder="Confirm password"/>
                                {resetForm.formState.errors.confirm_password && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {resetForm.formState.errors.confirm_password.message}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col space-y-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Resetting..." : "Reset Password"}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleBackToEmail}
                                    className="bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-300"
                                >
                                    Use Different Email
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}

export default PasswordReset
