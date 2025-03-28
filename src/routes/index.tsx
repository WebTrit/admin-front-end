import {Navigate, type RouteObject} from "react-router-dom"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import AddUser from "@/pages/AddUser"
import EditUser from "@/pages/EditUser"
import Layout from "@/components/Layout"
import PrivateRoute from "@/components/PrivateRoute"

// Public routes (accessible without authentication)
export const publicRoutes: RouteObject[] = [
    {
        path: "/login",
        element: <Login/>,
    },
]

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
                path: "/dashboard",
                element: <Dashboard/>,
            },
            {
                path: "/users",
                children: [
                    {
                        path: "new",
                        element: <AddUser/>,
                    },
                    {
                        path: ":userId/edit",
                        element: <EditUser/>,
                    },
                ],
            },
        ],
    },
]

// Redirect routes
export const redirectRoutes: RouteObject[] = [
    {
        path: "/",
        element: <Navigate to="/dashboard" replace/>,
    },
    {
        path: "*",
        element: <Navigate to="/dashboard" replace/>,
    },
]

// Combine all routes
const routes: RouteObject[] = [...publicRoutes, ...protectedRoutes, ...redirectRoutes]

export default routes

