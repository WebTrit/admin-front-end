import type {UseFormRegister, FieldErrors} from "react-hook-form"
import {Loader2} from "lucide-react"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import {OTPFormData} from "@/types.ts";

interface OTPVerificationProps {
    register: UseFormRegister<OTPFormData>
    errors: FieldErrors<OTPFormData>
    submittedEmail: string
    isSubmitting: boolean
    resendDisabled: boolean
    resendTimer: number
    onResend: () => void
    onChangeInfo: () => void
}

export const OTPVerification = (
    {
        register,
        errors,
        submittedEmail,
        isSubmitting,
        resendDisabled,
        resendTimer,
        onResend,
        onChangeInfo,
    }: OTPVerificationProps) => {

    return (
        <div>
            <div>
                <p className="text-sm text-gray-600 mb-4">
                    A temporary password has been sent to {submittedEmail}. Please check your email and enter it below.
                </p>
                <p className="text-sm text-gray-600 mb-4"> If you don't see it, please check your spam folder or contact
                    administrator.</p>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Enter temporary password
                </label>
                <Input
                    id="otp"
                    type="text"
                    error={!!errors.otp}
                    placeholder="Enter 6-digit password"
                    maxLength={6}
                    className="bg-white"
                    {...register("otp", {
                        required: "Temporary password is required",
                        pattern: {
                            value: /^[0-9]{6}$/,
                            message: "Password must be 6 digits",
                        },
                    })}
                />
                {errors.otp && <p className="mt-2 text-sm text-red-600">{errors.otp.message}</p>}
            </div>

            <div className="mt-6 space-y-4">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4"/>
                            Verifying...
                        </>
                    ) : (
                        "Verify"
                    )}
                </Button>

                <div className="text-center space-y-2">
                    <Button type="button" variant="ghost" disabled={resendDisabled} onClick={onResend}
                            className="w-full">
                        {resendDisabled ? `Resend in ${resendTimer}s` : "Resend temporary password"}
                    </Button>

                    <Button type="button" variant="ghost" onClick={onChangeInfo}>
                        Change information
                    </Button>
                </div>
            </div>
        </div>
    )
}
