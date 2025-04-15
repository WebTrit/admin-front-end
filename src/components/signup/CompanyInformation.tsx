import type {UseFormRegister, FieldErrors} from "react-hook-form"
import Input from "@/components/ui/Input"
import {SignupFormData} from "@/types.ts";

interface CompanyInformationProps {
    register: UseFormRegister<SignupFormData>
    errors: FieldErrors<SignupFormData>
}

export const CompanyInformation = ({register, errors}: CompanyInformationProps) => {
    const isCompanyName = import.meta.env.VITE_IS_SIGNUP_COMPANY_NAME === 'true';
    const isCompanySite = import.meta.env.VITE_IS_SIGNUP_COMPANY_SITE === 'true';

    return (
        <div>
            <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
            <div className="mt-4 space-y-4">
                {isCompanyName && (<div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                        Company Name
                    </label>
                    <Input
                        id="company_name"
                        type="text"
                        className="bg-white"
                        error={!!errors.company_name}
                        {...register("company_name")}
                    />
                    {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>}
                </div>)}
                
                {isCompanySite && (<div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Website
                    </label>
                    <div className="flex items-center">
                        <Input
                            id="website"
                            type="url"
                            className="bg-white"
                            error={!!errors.website}
                            placeholder="https://example.com"
                            {...register("website")}
                        />
                    </div>
                    {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>}
                </div>)}
            </div>
        </div>
    )
}
