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
import {useAuthStore} from "@/lib/authStore";
import {useTenantStore} from "@/lib/tenantStore";
import PrivateRouteGuard from "@/components/guards/PrivateRouteGuard.tsx";
import SuperTenantGuard from "@/components/guards/SuperTenantGuard.tsx";
import Invite from "@/pages/Invite.tsx";
import LoginAdmin from "@/pages/LoginAdmin.tsx";
import {PbxSetupWizard} from "@/pages/PbxSetupWizard.tsx";
import PasswordReset from "@/pages/PasswordReset.tsx";
import {ROUTES} from "@/routes/paths";

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
        path: "/password-reset",
        element: <PasswordReset/>
    },
    {
        path: "/signup",
        element: <Signup/>
    },
];
//TODO create name based navigation

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
            }, {
                path: "/pbx-setup",
                element: <PbxSetupWizard/>,
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
            const {isSuperTenant, isAdmin, tenantId} = useAuthStore.getState();
            const {currentTenant} = useTenantStore.getState();

            if (isAdmin) {
                return <Navigate to={ROUTES.SUBTENANTS} replace/>
            }

            if (currentTenant?.basic_demo) {
                return <Navigate to={ROUTES.DASHBOARD} replace/>
            }

            return (isSuperTenant) ? (
                <Navigate to={ROUTES.SUBTENANTS} replace/>
            ) : (
                <Navigate to={ROUTES.subtenant(tenantId!)} replace/>
            );
        })(),
    },
    {
        path: "*",
        element: <Navigate to={ROUTES.DASHBOARD} replace/>
    },
];

// Combine all routes
const routes: RouteObject[] = [...publicRoutes, ...protectedRoutes, ...redirectRoutes];

export default routes;