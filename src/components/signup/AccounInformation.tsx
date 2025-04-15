import type {UseFormRegister, FieldErrors} from "react-hook-form";
import Input from "@/components/ui/Input";
import {SignupFormData} from "@/types.ts";

interface AccountInformationProps {
    register: UseFormRegister<SignupFormData>;
    errors: FieldErrors<SignupFormData>;
}

export const AccountInformation = ({register, errors}: AccountInformationProps) => {
    return (
        <div>
            <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
            <div className="mt-4 space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                    </label>
                    <div className="flex items-center">
                        <Input
                            id="email"
                            type="email"
                            className="bg-white"
                            error={!!errors.email}
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password *
                    </label>
                    <Input
                        id="password"
                        type="password"
                        className="bg-white"
                        error={!!errors.password}
                        {...register("password", {
                            required: "Password is required",
                            minLength: {
                                value: 8,
                                message: "Password must be at least 8 characters"
                            }
                        })}
                    />
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password *
                    </label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        className="bg-white"
                        error={!!errors.confirmPassword}
                        {...register("confirmPassword", {
                            required: "Please confirm your password",
                            validate: (value, formValues) =>
                                value === formValues.password || "Passwords do not match"
                        })}
                    />
                    {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <div className="flex items-center">
                    <div className="flex items-center h-5">
                        <input
                            id="terms"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            {...register("acceptTerms", {
                                required: "You must accept the Terms and Conditions"
                            })}
                        />
                    </div>
                    <div className="ml-3">
                        <label htmlFor="terms" className="text-sm text-gray-700">
                            I accept WebTrit's{" "}
                            <a
                                href="https://webtrit.com/legal/terms-of-use/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-500 underline"
                            >
                                Terms and Conditions
                            </a>
                       
                        </label>
                        {errors.acceptTerms && (
                            <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}