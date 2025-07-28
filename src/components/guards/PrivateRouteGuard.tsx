import {Navigate} from 'react-router-dom';
import {useAppStore} from "@/lib/store.ts";
import {config} from "@/config/runtime";

function PrivateRouteGuard({children}: { children: React.ReactNode }) {
    const isAuthenticated = useAppStore((state) => state.isAuthenticated)
    const VITE_IS_SIGNUP = config.IS_SIGNUP

    if (!isAuthenticated && VITE_IS_SIGNUP) {
        return <Navigate to="/signup" replace/>
    } else if (!isAuthenticated && !VITE_IS_SIGNUP) {
        return <Navigate to="/login" replace/>
    }

    return children;
}

export default PrivateRouteGuard;