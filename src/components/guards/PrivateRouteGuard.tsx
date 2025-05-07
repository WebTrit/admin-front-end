import {Navigate} from 'react-router-dom';
import {useAppStore} from "@/lib/store.ts";

function PrivateRouteGuard({children}: { children: React.ReactNode }) {
    const isAuthenticated = useAppStore((state) => state.isAuthenticated)
    const VITE_IS_SIGNUP = import.meta.env.VITE_IS_SIGNUP === 'true'

    if (!isAuthenticated && VITE_IS_SIGNUP) {
        return <Navigate to="/signup" replace/>
    } else if (!isAuthenticated && !VITE_IS_SIGNUP) {
        return <Navigate to="/login" replace/>
    }

    return children;
}

export default PrivateRouteGuard;