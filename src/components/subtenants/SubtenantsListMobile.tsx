import React, {useState} from "react"
import {Pencil, Trash2} from "lucide-react"
import {useNavigate} from "react-router-dom"
import {CopyableText} from "@/components/ui/CopyableText.tsx";
import ConfirmationModal from "@/components/ui/ConfirmationModal.tsx";
import {Tenant} from "@/types.ts";


interface SubtenantsListDesktopViewProps {
    subtenants: Tenant[]
    deletingTenantId: string | null
    onDelete: (tenantId: string) => void
    onCancelDelete: () => void
    appliedFilters: Record<string, string>
    onClearFilters: () => void
}

export const SubtenantsListMobile: React.FC<SubtenantsListDesktopViewProps> =
    ({
         subtenants,
         deletingTenantId,
         onDelete,
         onCancelDelete,
         appliedFilters,
         onClearFilters,
     }) => {
        const navigate = useNavigate();
        const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
        const [isModalOpen, setIsModalOpen] = useState(false);

        const handleDeleteClick = (tenant: Tenant) => {
            setTenantToDelete(tenant);
            setIsModalOpen(true);
        };

        const handleCloseModal = () => {
            setIsModalOpen(false);
            setTenantToDelete(null);
            onCancelDelete();
        };

        const handleConfirmDelete = () => {
            if (tenantToDelete) {
                onDelete(tenantToDelete.tenant_id);
            }
        };
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
                                <button
                                    className="text-gray-500 hover:text-red-600"
                                    onClick={() => handleDeleteClick(tenant)}
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-xs font-medium text-gray-500 col-span-1">Tenant ID</div>
                                <div className="text-sm font-medium text-gray-900 col-span-2">
                                    <CopyableText tooltip={tenant.tenant_id}/>
                                </div>

                                <div className="text-xs font-medium text-gray-500 col-span-1">Email</div>
                                <div className="text-sm text-gray-700 col-span-2">
                                    <CopyableText tooltip={tenant.email}/>
                                </div>

                                <div className="text-xs font-medium text-gray-500 col-span-1">Company</div>
                                <div className="text-sm pl-5 text-gray-700 col-span-2">{tenant.company_name}</div>

                                <div className="text-xs font-medium text-gray-500 col-span-1">Demo</div>
                                <div className="text-sm pl-5 text-gray-700 col-span-2">
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

                                <div className="text-xs font-medium text-gray-500 col-span-1">PBX Info</div>
                                <div className="text-sm pl-5 text-gray-700 col-span-2">
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
            </div>
        )
    }