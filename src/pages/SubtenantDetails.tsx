import {Loader2} from "lucide-react"
import {TenantInfo} from "@/components/subtenantDetails/TenantInfo"
import {VoipConfig} from "@/components/subtenantDetails/VoipConfig"
import {UsersTable} from "@/components/subtenantDetails/UsersTable"
import {useAppStore} from "@/lib/store.ts"

function SubtenantDetails() {
    const {currentUser, isTenantLoading, tenantError} = useAppStore()

    if (tenantError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
                <p className="text-lg font-medium">Failed to load tenant details</p>
                <p className="text-sm mt-2">Please try again later</p>
            </div>
        )
    }

    if (isTenantLoading || !currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin"/>
                <p className="text-gray-500 mt-4">Loading tenant details...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Tenant details</h2>
            <TenantInfo tenantData={currentUser}/>
            <VoipConfig tenantData={currentUser}/>
            <UsersTable maxUsers={currentUser.max_users || 0}/>
        </div>
    )
}

export default SubtenantDetails
