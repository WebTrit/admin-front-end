import type React from "react"
import {useState} from "react"
import {useQuery} from "@tanstack/react-query"
import {Loader2, Plus} from "lucide-react"
import {useNavigate} from "react-router-dom"
import api from "@/lib/axios"
import {SubtenantsFilter} from "@/components/subtenants/SubtenantsFilter.tsx"
import {SubtenantsListMobile} from "@/components/subtenants/SubtenantsListMobile.tsx"
import {SubtenantsListDesktop} from "@/components/subtenants/SubtenantsListDesktop.tsx"

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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const {
        data: allSubtenants,
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

    // Client-side pagination logic
    const totalItems = allSubtenants?.length || 0
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    // Get current page items
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = allSubtenants?.slice(indexOfFirstItem, indexOfLastItem) || []

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
        // Reset to first page when applying new filters
        setCurrentPage(1)
        refetch()
    }

    const clearFilters = () => {
        setFormValues({})
        setAppliedFilters({})
        // Reset to first page when clearing filters
        setCurrentPage(1)
        refetch()
    }

    const handleDelete = async (tenantId: string) => {
        try {
            await api.delete(`/tenants/${tenantId}`)
            setDeletingTenantId(null)
            refetch()
        } catch (error) {
            console.error("Error deleting tenant:", error)
        }
    }

    const handleRemoveFilter = (key: string) => {
        const newFilters = {...appliedFilters, [key]: ""}
        setFormValues(newFilters)
        setAppliedFilters(newFilters)
        // Reset to first page when removing filters
        setCurrentPage(1)
        refetch()
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
    }

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setItemsPerPage(Number(e.target.value))
        setCurrentPage(1) // Reset to first page when changing items per page
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
                        subtenants={currentItems}
                        deletingTenantId={deletingTenantId}
                        onDelete={handleDelete}
                        onCancelDelete={() => setDeletingTenantId(null)}
                        onDeleteClick={(tenantId) => setDeletingTenantId(tenantId)}
                        appliedFilters={appliedFilters}
                        onClearFilters={clearFilters}
                    />
                    <SubtenantsListMobile
                        subtenants={currentItems}
                        deletingTenantId={deletingTenantId}
                        onDelete={handleDelete}
                        onCancelDelete={() => setDeletingTenantId(null)}
                        onDeleteClick={(tenantId) => setDeletingTenantId(tenantId)}
                        appliedFilters={appliedFilters}
                        onClearFilters={clearFilters}
                    />

                    {/* Pagination Controls */}
                    {totalItems > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} subtenants
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center mr-4">
                                    <span className="text-sm mr-2">Rows per page:</span>
                                    <select
                                        className="border rounded px-2 py-1 text-sm"
                                        value={itemsPerPage}
                                        onChange={handleItemsPerPageChange}
                                    >
                                        <option value="5">5</option>
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        className={`border rounded p-1 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        aria-label="Previous page"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <span aria-hidden="true">&laquo;</span>
                                    </button>

                                    {/* Page numbers */}
                                    <div className="flex items-center">
                                        {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                                            // Show pages around current page
                                            let pageNum: number
                                            if (totalPages <= 5) {
                                                pageNum = i + 1
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i
                                            } else {
                                                pageNum = currentPage - 2 + i
                                            }

                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`w-8 h-8 mx-1 rounded ${
                                                        currentPage === pageNum ? "bg-primary-500 text-white" : "border hover:bg-gray-100"
                                                    }`}
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <button
                                        className={`border rounded p-1 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        aria-label="Next page"
                                    >
                                        <span className="sr-only">Next</span>
                                        <span aria-hidden="true">&raquo;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default Subtenants
//TODO fix table moving on pagination