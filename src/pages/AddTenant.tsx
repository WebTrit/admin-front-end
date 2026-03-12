import {useState} from "react";
import {ArrowLeft, Loader2} from "lucide-react";
import {useMutation} from "@tanstack/react-query";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {useNavigate} from "react-router-dom";
import {v4 as uuid} from "uuid";
import {ROUTES} from "@/routes/paths";
import {useAuthStore} from "@/lib/authStore";
import {addTenantSchema, type AddTenantFormData} from "@/lib/schemas";
import {formatZodErrors} from "@/lib/validation";

export default function AddTenant() {
    const {tenantId, isAdmin} = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<AddTenantFormData>({
        company_name: "",
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        is_super_tenant: false,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const createTenantMutation = useMutation({
        mutationFn: async (formData: AddTenantFormData) => {
            const {is_super_tenant, ...tenantData} = formData;
            const requestData = is_super_tenant ? formData : tenantData

            const response = await api.post("/tenants", {
                ...requestData,
                tenant_id: uuid(),
                super_tenant_id: is_super_tenant ? null : tenantId,
                email_validated: false,
                password_reset_requested: false,
                custom_attributes: {signedup_via: "Web portal"},
                basic_demo: false,
                special_user: false,
                max_users: 5,
            });
            return response.data;
        },
        onSuccess: () => {
            navigate(ROUTES.SUBTENANTS);
        },
        onError: (error: unknown) => {
            const axiosError = error as { response?: { data?: { errors?: Record<string, string> } } };
            if (axiosError.response?.data?.errors) {
                setErrors(axiosError.response.data.errors);
            } else {
                setErrors({form: "Failed to create subtenant. Please try again."});
            }
        },
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const result = addTenantSchema.safeParse(formData);
        if (!result.success) {
            setErrors(formatZodErrors(result.error));
            return false;
        }
        setErrors({});
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            createTenantMutation.mutate(formData);
        }
    };

    return (
        <div className="mx-auto px-2 py-4 max-w-md">
            <div className="flex items-center mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
                    <ArrowLeft className="w-4 h-4"/>
                </Button>
                <h1 className="text-xl font-bold">Add New tenant</h1>
            </div>

            {errors.form && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                    {errors.form}
                </div>
            )}

            <form autoComplete="off" onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Company Name <span className='text-red-500'>*</span>
                        </label>
                        <Input
                            id="company_name"
                            name="company_name"
                            placeholder="Enter company name"
                            value={formData.company_name}
                            onChange={handleInputChange}
                            error={!!errors.company_name}
                        />
                        {errors.company_name && <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>}
                    </div>

                    <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                            First Name <span className='text-red-500'>*</span>
                        </label>
                        <Input
                            id="first_name"
                            name="first_name"
                            placeholder="Enter first name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            error={!!errors.first_name}
                        />
                        {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>}
                    </div>

                    <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name <span className='text-red-500'>*</span>
                        </label>
                        <Input
                            id="last_name"
                            name="last_name"
                            placeholder="Enter last name"
                            value={formData.last_name}
                            onChange={handleInputChange}
                            error={!!errors.last_name}
                        />
                        {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>}
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className='text-red-500'>*</span>
                        </label>
                        <Input
                            id="email"
                            name="email"
                            type="text"
                            placeholder="example@company.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            error={!!errors.email}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password <span className='text-red-500'>*</span>
                        </label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={formData.password}
                            onChange={handleInputChange}
                            error={!!errors.password}
                        />
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>

                    {isAdmin &&
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is_super_tenant"
                                name="is_super_tenant"
                                checked={formData.is_super_tenant}
                                onChange={handleInputChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor="is_super_tenant" className="text-sm font-medium text-gray-700">
                                Create as Super Tenant
                            </label>
                        </div>
                    }
                    <Button type="submit" className="w-full mt-6" disabled={createTenantMutation.isPending}>
                        {createTenantMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                Creating...
                            </>
                        ) : (
                            "Create tenant"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
