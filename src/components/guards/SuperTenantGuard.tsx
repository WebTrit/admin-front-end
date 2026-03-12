import {Navigate} from 'react-router-dom';
import {useAuthStore} from "@/lib/authStore";

function SuperTenantGuard({children}: { children: React.ReactNode }) {
    const isSuperTenant = useAuthStore((state) => state.isSuperTenant)
    const isAdmin = useAuthStore((state) => state.isAdmin)

    if (isAdmin) {
        return children;
    }

    if (!isSuperTenant) {
        return <Navigate to="/" replace/>
    }

    return children;
}

export default SuperTenantGuard;