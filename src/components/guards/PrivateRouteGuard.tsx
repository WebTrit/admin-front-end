import {Navigate} from 'react-router-dom';
import {useAppStore} from "@/lib/store.ts";

function PrivateRouteGuard({children}: { children: React.ReactNode }) {
    const isAuthenticated = useAppStore((state) => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>
    }

    return children;
}

export default PrivateRouteGuard;