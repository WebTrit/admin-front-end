import {Navigate, type RouteObject} from "react-router-dom";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import SubtenantDetails from "@/pages/SubtenantDetails.tsx";
import AddUser from "@/pages/AddUser";
import EditUser from "@/pages/EditUser";
import Subtenants from "@/pages/Subtenants";
import Layout from "@/components/Layout";
import AddTenant from "@/pages/AddTenant.tsx";
import Dashboard from "@/pages/Dashboard";
import {useAppStore} from "@/lib/store.ts";
import PrivateRouteGuard from "@/components/guards/PrivateRouteGuard.tsx";
import SuperTenantGuard from "@/components/guards/SuperTenantGuard.tsx";
import Invite from "@/pages/Invite.tsx";
import LoginAdmin from "@/pages/LoginAdmin.tsx";

// Public routes (accessible without authentication)
export const publicRoutes: RouteObject[] = [
    {
        path: "/login",
        element: <Login/>
    },
    {
        path: "/login-admin",
        element: <LoginAdmin/>
    },
    {
        path: "/signup",
        element: <Signup/>
    },
];

// Protected routes (require authentication)
export const protectedRoutes: RouteObject[] = [
    {
        element: (
            <PrivateRouteGuard>
                <Layout/>
            </PrivateRouteGuard>
        ),
        children: [
            {
                path: "/dashboard",
                element: <Dashboard/>,
            },
            {
                path: "/subtenants",
                element: (
                    <SuperTenantGuard>
                        <Subtenants/>
                    </SuperTenantGuard>
                ),
            },
            {
                path: "/subtenants/:tenantId",
                element: <SubtenantDetails/>,
            },
            {
                path: "/subtenants/:tenantId/users/new",
                element: <AddUser/>,
            },
            {
                path: "/subtenants/:tenantId/users/:userId/edit",
                element: <EditUser/>,
            },
            {
                path: "/add-subtenant",
                element: (
                    <SuperTenantGuard>
                        <AddTenant/>
                    </SuperTenantGuard>),
            },
            {
                path: "/invite",
                element: <Invite/>,
            },
        ],
    },
];

// Redirect routes
export const redirectRoutes: RouteObject[] = [
    {
        path: "/",
        element: (() => {
            const {isSuperTenant, isAdmin, tenantId, isBasicDemo} = useAppStore.getState();

            if (isAdmin) {
                return <Navigate to="/subtenants" replace/>
            }

            if (isBasicDemo) {
                return <Navigate to="/dashboard" replace/>
            }

            return (isSuperTenant) ? (
                <Navigate to="/subtenants" replace/>
            ) : (
                <Navigate to={`/subtenants/${tenantId}`} replace/>
            );
        })(),
    },
    {
        path: "*",
        element: <Navigate to={'/dashboard'} replace/>
    },
];

// Combine all routes
const routes: RouteObject[] = [...publicRoutes, ...protectedRoutes, ...redirectRoutes];

export default routes;