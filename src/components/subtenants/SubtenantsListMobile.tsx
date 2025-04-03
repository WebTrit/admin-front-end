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

interface SubtenantsListDesktopViewProps {
    subtenants: Subtenant[]
    deletingTenantId: string | null
    onDelete: (tenantId: string) => void
    onCancelDelete: () => void
    onDeleteClick: (tenantId: string) => void
    appliedFilters: Record<string, string>
    onClearFilters: () => void
}

export const SubtenantsListMobile: React.FC<SubtenantsListDesktopViewProps> =
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
            <div className="md:hidden space-y-4">
                {subtenants.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <p className="text-gray-500">No subtenants found</p>
                        {Object.values(appliedFilters).some((value) => value) && (
                            <button onClick={onClearFilters} className="mt-2 text-blue-600 text-sm">
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    subtenants.map((tenant) => (
                        <div key={tenant.tenant_id} className="bg-white p-4 rounded-lg shadow-md">
                            <div className="flex justify-end gap-2 mb-2">
                                <button
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={() => navigate(`/subtenants/${tenant.tenant_id}`)}
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
                                        className="text-gray-500 hover:text-red-600"
                                        onClick={() => onDeleteClick(tenant.tenant_id)}
                                    >
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="text-xs font-medium text-gray-500">Tenant ID</div>
                                <div className="text-sm font-medium text-gray-900 truncate">
                                    {tenant.tenant_id}
                                </div>

                                <div className="text-xs font-medium text-gray-500">Email</div>
                                <div className="text-sm text-gray-700 truncate">{tenant.email}</div>

                                <div className="text-xs font-medium text-gray-500">Company</div>
                                <div className="text-sm text-gray-700">{tenant.company_name}</div>

                                <div className="text-xs font-medium text-gray-500">Demo</div>
                                <div className="text-sm text-gray-700">
                                    {tenant.basic_demo ? (
                                        <span
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Yes
                                    </span>
                                    ) : (
                                        <span
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        No
                                    </span>
                                    )}
                                </div>

                                <div className="text-xs font-medium text-gray-500">PBX Info</div>
                                <div className="text-sm text-gray-700">
                                    {tenant?.voip_system ? (
                                        <>
                                            <div className="font-medium">{tenant.voip_system.type}</div>
                                            <div className="text-xs text-gray-400">
                                                {tenant.sip?.host}:{tenant.sip?.port}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-gray-400">No PBX configured</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )
    }