import React from "react"
import {Pencil, Trash2} from "lucide-react"
import {useNavigate} from "react-router-dom"

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

export const SubtenantsListDesktop: React.FC<SubtenantsListDesktopProps> =
    ({
         subtenants,
         deletingTenantId,
         onDelete,
         onCancelDelete,
         onDeleteClick,
         appliedFilters,
         onClearFilters,
     }) => {
        const navigate = useNavigate()

        return (
            <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                                Tenant ID
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-gray-900">
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
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium truncate max-w-[200px]">
                                        {tenant.tenant_id}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[200px]">
                                        {tenant.email}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {tenant.company_name}
                                    </td>
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
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => navigate(`/subtenants/${tenant.tenant_id}`)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <Pencil className="w-4 h-4"/>
                                            </button>
                                            {deletingTenantId === tenant.tenant_id ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                        onClick={() => onDelete(tenant.tenant_id)}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                                                        onClick={onCancelDelete}
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => onDeleteClick(tenant.tenant_id)}
                                                    className="text-gray-500 hover:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }