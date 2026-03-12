import {Navigate} from 'react-router-dom';
import {useAuthStore} from "@/lib/authStore";
import {ROUTES} from "@/routes/paths";

function PrivateRouteGuard({children}: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to={ROUTES.LOGIN} replace/>
    }

    return children;
}

export default PrivateRouteGuard;