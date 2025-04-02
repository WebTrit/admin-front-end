import React from "react";
import {X} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface FilterParams {
    tenant_id?: string;
    email?: string;
    except_tenant_id?: string;
    super_tenant_id?: string;
}

interface SubtenantsFilterProps {
    formValues: FilterParams;
    appliedFilters: FilterParams;
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFilterSubmit: (e: React.FormEvent) => void;
    onClearFilters: () => void;
    onRemoveFilter: (key: string) => void;
}

export const SubtenantsFilter: React.FC<SubtenantsFilterProps> = ({
                                                                      formValues,
                                                                      appliedFilters,
                                                                      onFilterChange,
                                                                      onFilterSubmit,
                                                                      onClearFilters,
                                                                      onRemoveFilter,
                                                                  }) => {
    return (
        <>
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                <form onSubmit={onFilterSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label htmlFor="tenant_id" className="block text-xs font-medium text-gray-500 mb-1">
                                Tenant ID
                            </label>
                            <Input
                                type="text"
                                id="tenant_id"
                                name="tenant_id"
                                value={formValues.tenant_id || ""}
                                onChange={onFilterChange}
                                placeholder="e.g. 1437633f-c62a-4ce6-aa4e-37faac122460"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-gray-500 mb-1">
                                Email
                            </label>
                            <Input
                                type="text"
                                id="email"
                                name="email"
                                value={formValues.email || ""}
                                onChange={onFilterChange}
                                placeholder="e.g. example@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="except_tenant_id" className="block text-xs font-medium text-gray-500 mb-1">
                                Except Tenant ID
                            </label>
                            <Input
                                type="text"
                                id="except_tenant_id"
                                name="except_tenant_id"
                                value={formValues.except_tenant_id || ""}
                                onChange={onFilterChange}
                                placeholder="Exclude this tenant ID"
                            />
                        </div>

                        <div>
                            <label htmlFor="super_tenant_id" className="block text-xs font-medium text-gray-500 mb-1">
                                Super Tenant ID
                            </label>
                            <Input
                                type="text"
                                id="super_tenant_id"
                                name="super_tenant_id"
                                value={formValues.super_tenant_id || ""}
                                onChange={onFilterChange}
                                placeholder="Filter by super tenant ID"
                            />
                        </div>

                        <div className="md:col-span-2 lg:col-span-4 flex gap-2">
                            <Button type="submit" variant="primary">
                                Apply Filters
                            </Button>
                            <Button type="button" variant="outline" onClick={onClearFilters}
                                    className="flex items-center gap-1">
                                <X className="w-4 h-4"/>
                                Clear
                            </Button>
                        </div>
                    </div>
                </form>
            </div>

            {Object.values(appliedFilters).some((value) => value) && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(appliedFilters).map(([key, value]) =>
                        value ? (
                            <div key={key} className="flex items-center bg-gray-100 px-2 py-1 rounded-md text-xs">
                                <span className="font-medium mr-1">{key}:</span>
                                <span className="truncate max-w-[150px]">{value}</span>
                                <button onClick={() => onRemoveFilter(key)} className="ml-1">
                                    <X className="w-3 h-3"/>
                                </button>
                            </div>
                        ) : null
                    )}
                </div>
            )}
        </>
    );
};
