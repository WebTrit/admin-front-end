import {Navigate} from 'react-router-dom';
import {useAuthStore} from "@/lib/authStore";

function PrivateRouteGuard({children}: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>
    }

    return children;
}

export default PrivateRouteGuard;