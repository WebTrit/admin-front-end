import type React from "react"
import {useState} from "react"
import {Pencil, Trash2} from "lucide-react"
import {useNavigate} from "react-router-dom"
import ConfirmationModal from "@/components/ui/ConfirmationModal.tsx";
import {CopyableText} from "@/components/ui/CopyableText.tsx";

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

interface SubtenantsListDesktopProps {
    subtenants: Subtenant[]
    deletingTenantId: string | null
    onDelete: (tenantId: string) => void
    onCancelDelete: () => void
    onDeleteClick: (tenantId: string) => void
    appliedFilters: Record<string, string>
    onClearFilters: () => void
}

export const SubtenantsListDesktop: React.FC<SubtenantsListDesktopProps> = (
    {
        subtenants,
        deletingTenantId,
        onDelete,
        onCancelDelete,
        appliedFilters,
        onClearFilters,
    }) => {
    const navigate = useNavigate()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [tenantToDelete, setTenantToDelete] = useState<Subtenant | null>(null)

    const handleDeleteClick = (tenant: Subtenant) => {
        setTenantToDelete(tenant)
        setIsModalOpen(true)
    }

    const handleConfirmDelete = () => {
        if (tenantToDelete) {
            onDelete(tenantToDelete.tenant_id)
            setIsModalOpen(false)
            setTenantToDelete(null)
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setTenantToDelete(null)
        onCancelDelete()
    }

    return (
        <>
            <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="pl-8 py-3 text-left text-sm font-medium text-gray-900">
                                Tenant ID
                            </th>
                            <th scope="col" className="pl-8 py-3 text-left text-sm font-medium text-gray-900">
                                Email
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                Company
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                Demo
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                PBX Info
                            </th>
                            <th scope="col" className="relative px-4 py-3 w-[100px]">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {subtenants.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                                    <p>No subtenants found</p>
                                    {Object.values(appliedFilters).some((value) => value) && (
                                        <button onClick={onClearFilters} className="mt-2 text-blue-600 text-sm">
                                            Clear filters
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            subtenants.map((tenant) => (
                                <tr key={tenant.tenant_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                        <CopyableText
                                            tooltip={tenant.tenant_id}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        <CopyableText
                                            tooltip={`${tenant.email}`}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{tenant.company_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {tenant.basic_demo ? (
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Yes
                                                </span>
                                        ) : (
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    No
                                                </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {tenant?.voip_system ? (
                                            <div>
                                                <div className="text-xs font-medium">{tenant.voip_system.type}</div>
                                                <div className="text-xs text-gray-400">
                                                    {tenant.sip?.host}:{tenant.sip?.port}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">No PBX configured</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-between gap-2">
                                            <button
                                                onClick={() => navigate(`/subtenants/${tenant.tenant_id}`)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <Pencil className="w-4 h-4"/>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(tenant)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                title="Delete Subtenant"
                description={
                    tenantToDelete
                        ? `Are you sure you want to delete tenant ${tenantToDelete.company_name} (${tenantToDelete.tenant_id})? This action cannot be undone.`
                        : ""
                }
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmDelete}
                isProcessing={deletingTenantId === tenantToDelete?.tenant_id}
                confirmText="Delete"
            />
        </>
    )
}
