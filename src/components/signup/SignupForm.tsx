import {useRef, useState} from "react"
import {useForm} from "react-hook-form"
import {useNavigate} from "react-router-dom"
import {Loader2} from "lucide-react"
import api from "@/lib/axios"
import Button from "@/components/ui/Button"
import {useAppStore} from "@/lib/store"
import {CompanyInformation} from "./CompanyInformation"
import {PersonalInformation} from "@/components/signup/PersonalInformation.tsx"
import {AccountInformation} from "@/components/signup/AccounInformation.tsx"
import {OTPVerification} from "@/components/signup/OTPVerification.tsx"
import {OTPFormData, SignupFormData} from "@/types.ts"
import axios from "axios"
import {toast} from "react-toastify";
import {config} from "@/config/runtime";

export const SignupForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showOTPField, setShowOTPField] = useState(false)
    const [submittedEmail, setSubmittedEmail] = useState("")
    const [otpId, setOtpId] = useState("")
    const [resendDisabled, setResendDisabled] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)
    const [formData, setFormData] = useState<SignupFormData | null>(null)
    const timer = useRef<number | null>(null)
    const isCompanyName = config.IS_SIGNUP_COMPANY_NAME;
    const isCompanySite = config.IS_SIGNUP_COMPANY_SITE;

    const navigate = useNavigate()
    const {setToken, setTenantId, setIsSuperTenant} = useAppStore()

    const {
        register: registerSignup,
        handleSubmit: handleSignupSubmit,
        formState: {errors: signupErrors},
        setError: setSignupError,
    } = useForm<SignupFormData>()

    const {
        register: registerOTP,
        handleSubmit: handleOTPSubmit,
        formState: {errors: otpErrors},
        setError,
        reset: resetOTPFields,
    } = useForm<OTPFormData>()

    const startResendTimer = () => {
        if (timer.current) {
            clearInterval(timer.current)
        }

        setResendDisabled(true)
        setResendTimer(30)

        timer.current = window.setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    if (timer.current) clearInterval(timer.current)
                    setResendDisabled(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const sendOTP = async (formData: SignupFormData) => {
        try {
            setIsSubmitting(true)

            const validateRes = await api.get("/info/email", {
                params: {email: formData.email},
            })

            if (!validateRes.data.status.toLowerCase().includes("ok")) {
                setSignupError("email", {
                    type: "manual",
                    message: `The email address did not pass the validation. The error message was: ${validateRes.data.message}`,
                })
                return
            }

            const {acceptTerms, ...cleanedFormData} = formData

            const {data} = await api.post("signup/tenants/otp/generate", cleanedFormData)
            setOtpId(data.otp_id)

            setSubmittedEmail(formData.email)
            setFormData(formData)
            setShowOTPField(true)
            startResendTimer()
        } catch (error) {
            console.error("Error sending OTP:", error)
            toast.error("Failed to create account. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }


    const handleResendOTP = async () => {
        if (!resendDisabled && formData) {
            await sendOTP(formData)
        }
    }

    const handleOTPVerify = async (data: OTPFormData) => {
        try {
            setIsSubmitting(true)
            const response = await api.post("signup/tenants/otp/validate", {
                otp_id: otpId,
                otp: data.otp,
            })
            if (response.data) {
                const {access_token, tenant_id} = response.data
                setToken(access_token)
                setTenantId(tenant_id)
                setIsSuperTenant(false)

                navigate(`/dashboard`, {replace: true})
            } else {
                setError("otp", {type: "manual", message: "Invalid temporary password. Please try again."})
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response && error.response.status === 401) {
                    if (error.response.data && error.response.data.message.includes('already exists')) {
                        setError("otp", {type: "manual", message: "User with this email already exists."})
                    } else {
                        setError("otp", {type: "manual", message: "Invalid OTP. Please try again."})
                    }
                } else {
                    setError("otp", {type: "manual", message: "An unexpected error occurred. Please try again later."})
                }
            } else {
                setError("otp", {type: "manual", message: "Failed to verify temporary password. Please try again."})
            }
            console.error("Error verifying temporary password:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetOTPForm = () => {
        setShowOTPField(false)
        setOtpId("")
        setSubmittedEmail("")
        setFormData(null)
    }

    return (
        <div className="mt-8 space-y-6">
            {!showOTPField ? (
                <form onSubmit={handleSignupSubmit(sendOTP)} className="space-y-6">
                    <div className="space-y-6">
                        {(isCompanyName || isCompanySite) &&
                            <CompanyInformation register={registerSignup} errors={signupErrors}/>}
                        <PersonalInformation register={registerSignup} errors={signupErrors}/>
                        <AccountInformation register={registerSignup} errors={signupErrors}/>
                    </div>

                    <div className="space-y-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4"/>
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleOTPSubmit(handleOTPVerify)}>
                    <OTPVerification
                        register={registerOTP}
                        errors={otpErrors}
                        submittedEmail={submittedEmail}
                        isSubmitting={isSubmitting}
                        resendDisabled={resendDisabled}
                        resendTimer={resendTimer}
                        onResend={handleResendOTP}
                        onChangeInfo={() => {
                            resetOTPForm()
                            resetOTPFields()
                            if (timer.current) {
                                clearInterval(timer.current)
                            }
                        }}
                    />
                </form>
            )}

        </div>
    )
}
