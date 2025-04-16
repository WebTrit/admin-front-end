import {Navigate, type RouteObject} from "react-router-dom";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import SubtenantDetails from "@/pages/SubtenantDetails.tsx";
import AddUser from "@/pages/AddUser";
import EditUser from "@/pages/EditUser";
import Subtenants from "@/pages/Subtenants";
import Layout from "@/components/Layout";
import AddSubtenant from "@/pages/AddSubtenant.tsx";
import Dashboard from "@/pages/Dashboard";
import {useAppStore} from "@/lib/store.ts";
import PrivateRouteGuard from "@/components/guards/PrivateRouteGuard.tsx";
import SuperTenantGuard from "@/components/guards/SuperTenantGuard.tsx";
import Invite from "@/pages/Invite.tsx";

// Public routes (accessible without authentication)
export const publicRoutes: RouteObject[] = [
    {
        path: "/login",
        element: <Login/>
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
                element: <AddSubtenant/>,
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
            const {isSuperTenant, tenantId, isBasicDemo} = useAppStore.getState();

            if (isBasicDemo) {
                return <Navigate to="/dashboard" replace/>
            }

            return isSuperTenant ? (
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