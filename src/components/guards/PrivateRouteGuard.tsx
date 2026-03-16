import {Navigate} from 'react-router-dom';
import {useAuthStore} from "@/lib/authStore";
import {isTokenExpired} from "@/lib/auth";
import {ROUTES} from "@/routes/paths";

function PrivateRouteGuard({children}: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const token = useAuthStore((state) => state.token)

    if (!isAuthenticated || !token || isTokenExpired(token)) {
        return <Navigate to={ROUTES.LOGIN} replace/>
    }

    return children;
}

export default PrivateRouteGuard;