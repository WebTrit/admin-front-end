import {forwardRef, useEffect, useImperativeHandle} from "react"
import {useForm} from "react-hook-form"
import {Building2, Loader2} from "lucide-react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import type {TenantFormData} from "@/pages/SubtenantDetails.tsx"

export interface TenantInfoRef {
    submitForm: () => void
    resetForm: () => void
}

interface TenantInfoProps {
    tenantData: Partial<TenantFormData> | null
    onSubmit: (data: TenantFormData) => void
    isMutationPending: boolean
    isEditing: boolean
    handleEdit: (val: boolean) => void
    hideControls?: boolean
    validationErrors?: Record<string, string>
    setValidationErrors?: (errors: Record<string, string>) => void
}

export const TenantInfo = forwardRef<TenantInfoRef, TenantInfoProps>(
    (
        {
            tenantData,
            onSubmit,
            handleEdit,
            isMutationPending,
            isEditing,
            hideControls = false,
            validationErrors,
            setValidationErrors,
        },
        ref,
    ) => {
        const {
            register,
            handleSubmit,
            reset,
            formState: {errors},
        } = useForm<TenantFormData>({
            defaultValues: {
                company_name: "",
                first_name: "",
                last_name: "",
                email: "",
            },
        })

        useImperativeHandle(ref, () => ({
            submitForm: () => {
                handleSubmit(onSubmit)()
            },
            resetForm: () => {
                if (tenantData) {
                    setValidationErrors?.({})
                    reset({
                        company_name: tenantData.company_name || "",
                        first_name: tenantData.first_name || "",
                        last_name: tenantData.last_name || "",
                        email: tenantData.email || "",
                    })
                }
            },
        }))

        useEffect(() => {
            if (tenantData) {
                reset({
                    company_name: tenantData.company_name || "",
                    first_name: tenantData.first_name || "",
                    last_name: tenantData.last_name || "",
                    email: tenantData.email || "",
                })
            }
        }, [tenantData, reset])

        const handleCancel = () => {
            handleEdit(false)
            if (tenantData) {
                setValidationErrors?.({})
                reset({
                    company_name: tenantData.company_name || "",
                    first_name: tenantData.first_name || "",
                    last_name: tenantData.last_name || "",
                    email: tenantData.email || "",
                })
            }
        }

        const getFieldError = (field: keyof TenantFormData) =>
            errors[field]?.message || validationErrors?.[field]

        return (
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
                <div
                    className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-4">
                    <div className="flex items-center">
                        <Building2 className="h-6 w-6 text-primary-600 mr-2"/>
                        <h3 className="text-lg font-medium">Personal Information</h3>
                    </div>
                    {!hideControls && (
                        <div className="flex space-x-2">
                            {isEditing ? (
                                <>
                                    <Button type="button" variant="outline" onClick={handleCancel}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isMutationPending}>
                                        {isMutationPending ? (
                                            <>
                                                <Loader2 size={16} className="mr-2 animate-spin"/>
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Button type="button" onClick={() => handleEdit(true)}>
                                    Edit
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                            Company Name
                        </label>
                        <Input
                            id="company_name"
                            {...register("company_name")}
                            disabled={!isEditing}
                            error={!!getFieldError("company_name")}
                        />
                        {getFieldError("company_name") && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError("company_name")}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <Input
                            id="email"
                            {...register("email")}
                            type="email"
                            disabled={true}
                            className="bg-gray-50"
                            error={!!getFieldError("email")}
                        />
                        {getFieldError("email") && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError("email")}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                            First Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="first_name"
                            {...register("first_name")}
                            disabled={!isEditing}
                            error={!!getFieldError("first_name")}
                        />
                        {getFieldError("first_name") && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError("first_name")}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                            Last Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="last_name"
                            {...register("last_name")}
                            disabled={!isEditing}
                            error={!!getFieldError("last_name")}
                        />
                        {getFieldError("last_name") && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError("last_name")}</p>
                        )}
                    </div>
                </div>
            </form>
        )
    },
)

TenantInfo.displayName = "TenantInfo"
