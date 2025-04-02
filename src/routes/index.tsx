import {Navigate, type RouteObject} from "react-router-dom";
import Login from "@/pages/Login";
import SubtenantDetails from "@/pages/SubtenantDetails.tsx";
import AddUser from "@/pages/AddUser";
import EditUser from "@/pages/EditUser";
import Subtenants from "@/pages/Subtenants";
import Layout from "@/components/Layout";
import PrivateRoute from "@/components/PrivateRoute";
import AddSubtenant from "@/pages/AddSubtenant.tsx";
import {useAppStore} from "@/lib/store.ts";

// Public routes (accessible without authentication)
export const publicRoutes: RouteObject[] = [
    {
        path: "/login",
        element: <Login/>,
    },
];

// Protected routes (require authentication)
export const protectedRoutes: RouteObject[] = [
    {
        element: (
            <PrivateRoute>
                <Layout/>
            </PrivateRoute>
        ),
        children: [
            {
                path: "/subtenants",
                element: <Subtenants/>,
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
        ],
    },
];

// Redirect routes
export const redirectRoutes: RouteObject[] = [
    {
        path: "/",
        element: (() => {
            const {isSuperTenant, tenantId} = useAppStore.getState();
            return isSuperTenant ? (
                <Navigate to="/subtenants" replace/>
            ) : (
                <Navigate to={`/subtenants/${tenantId}`} replace/>
            );
        })(),
    },
    {
        path: "*",
        element: (() => {
            const {isSuperTenant, tenantId} = useAppStore.getState();
            return isSuperTenant ? (
                <Navigate to="/subtenants" replace/>
            ) : (
                <Navigate to={`/subtenants/${tenantId}`} replace/>
            );
        })(),
    },
];

// Combine all routes
const routes: RouteObject[] = [...publicRoutes, ...protectedRoutes, ...redirectRoutes];

export default routes;
