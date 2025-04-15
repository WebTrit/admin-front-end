import type {UseFormRegister, FieldErrors} from "react-hook-form"
import Input from "@/components/ui/Input"
import {SignupFormData} from "@/types.ts"

interface PersonalInformationProps {
    register: UseFormRegister<SignupFormData>
    errors: FieldErrors<SignupFormData>
}

export const PersonalInformation = ({register, errors}: PersonalInformationProps) => {
    const VITE_IS_SIGNUP_PHONE_NUMBER = import.meta.env.VITE_IS_SIGNUP_PHONE_NUMBER === 'true';

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                            First Name *
                        </label>
                        <Input
                            id="first_name"
                            type="text"
                            className="bg-white"
                            error={!!errors.first_name}
                            {...register("first_name", {
                                required: "First name is required",
                            })}
                        />
                        {errors.first_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                            Last Name *
                        </label>
                        <Input
                            id="last_name"
                            type="text"
                            className="bg-white"
                            error={!!errors.last_name}
                            {...register("last_name", {
                                required: "Last name is required",
                            })}
                        />
                        {errors.last_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                        )}
                    </div>
                </div>

                {VITE_IS_SIGNUP_PHONE_NUMBER && <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                        Phone Number
                    </label>
                    <div className="flex items-center">
                        <Input
                            id="phone_number"
                            type="tel"
                            className="bg-white"
                            error={!!errors.phone_number}
                            {...register("phone_number")}
                        />
                    </div>
                    {errors.phone_number && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone_number.message}</p>
                    )}
                </div>}

            </div>
        </div>
    )
}//yk.120301+1234123@gmail.com