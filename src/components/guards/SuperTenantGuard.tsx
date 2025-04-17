import {Navigate} from 'react-router-dom';
import {useAppStore} from "@/lib/store.ts";

function SuperTenantGuard({children}: { children: React.ReactNode }) {
    const isSuperTenant = useAppStore((state) => state.isSuperTenant)
    const isAdmin = useAppStore((state) => state.isAdmin)

    if (isAdmin) {
        return children;
    }

    if (!isSuperTenant) {
        return <Navigate to="/" replace/>
    }

    return children;
}

export default SuperTenantGuard;