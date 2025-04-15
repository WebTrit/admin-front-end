import React, {useState} from "react"
import {useQuery} from "@tanstack/react-query"
import {Loader2, Plus} from "lucide-react"
import {useNavigate} from "react-router-dom"
import api from "@/lib/axios"
import {SubtenantsFilter} from "@/components/subtenants/SubtenantsFilter.tsx";
import {SubtenantsListMobile} from "@/components/subtenants/SubtenantsListMobile.tsx";
import {SubtenantsListDesktop} from "@/components/subtenants/SubtenantsListDesktop.tsx";

interface Subtenant {
    tenant_id: string
    email: string
    login: string
    company_name: string
    basic_demo: boolean
    sip: { host: string; port: number } | null
    registrar_server: string | null
    transport_protocol: string
    voip_system?: { type: string }
}

interface FilterParams {
    tenant_id?: string
    email?: string
    except_tenant_id?: string
    super_tenant_id?: string
}


const Subtenants = () => {
    const navigate = useNavigate()
    const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null)
    const [formValues, setFormValues] = useState<FilterParams>({})
    const [appliedFilters, setAppliedFilters] = useState<FilterParams>({})

    const {
        data: subtenants,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["subtenants", appliedFilters],
        queryFn: async () => {
            const params = new URLSearchParams()
            Object.entries(appliedFilters).forEach(([key, value]) => {
                if (value) params.append(key, value)
            })

            const queryString = params.toString() ? `?${params.toString()}` : ""
            const response = await api.get(`/tenants/${queryString}`)
            return response.data.items as Subtenant[]
        },
    })

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target
        setFormValues((prev) => ({
            ...prev,
            [name]: value.trim(),
        }))
    }

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setAppliedFilters(formValues)
        refetch()
    }

    const clearFilters = () => {
        setFormValues({})
        setAppliedFilters({})
        refetch()
    }

    const handleDelete = async (tenantId: string) => {
        try {
            await api.delete(`/tenants/${tenantId}`)
            setDeletingTenantId(null)
            refetch()
        } catch (error) {
            console.error('Error deleting tenant:', error)
        }
    }

    const handleRemoveFilter = (key: string) => {
        const newFilters = {...appliedFilters, [key]: ""}
        setFormValues(newFilters)
        setAppliedFilters(newFilters)
        refetch()
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-red-500 p-4 text-center">
                Error loading subtenants {error?.message}
            </div>
        )
    }

    return (
        <div className="mx-auto px-2 py-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Subtenants</h1>
                <button
                    onClick={() => navigate("/add-subtenant")}
                    className="bg-primary-500 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 hover:bg-primary-600"
                >
                    <Plus className="w-4 h-4"/>
                    Add Tenant
                </button>
            </div>

            <SubtenantsFilter
                formValues={formValues}
                appliedFilters={appliedFilters}
                onFilterChange={handleFilterChange}
                onFilterSubmit={handleFilterSubmit}
                onClearFilters={clearFilters}
                onRemoveFilter={handleRemoveFilter}
            />

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="w-6 h-6 animate-spin"/>
                </div>
            ) : (
                <>
                    <SubtenantsListDesktop
                        subtenants={subtenants || []}
                        deletingTenantId={deletingTenantId}
                        onDelete={handleDelete}
                        onCancelDelete={() => setDeletingTenantId(null)}
                        onDeleteClick={(tenantId) => setDeletingTenantId(tenantId)}
                        appliedFilters={appliedFilters}
                        onClearFilters={clearFilters}
                    />
                    <SubtenantsListMobile
                        subtenants={subtenants || []}
                        deletingTenantId={deletingTenantId}
                        onDelete={handleDelete}
                        onCancelDelete={() => setDeletingTenantId(null)}
                        onDeleteClick={(tenantId) => setDeletingTenantId(tenantId)}
                        appliedFilters={appliedFilters}
                        onClearFilters={clearFilters}
                    />
                </>
            )}
        </div>
    )
}

export default Subtenants