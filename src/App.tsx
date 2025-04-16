import {BrowserRouter as Router, useRoutes} from "react-router-dom"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {ToastContainer} from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {useEffect} from "react"
import {useAppStore} from "./lib/store"
import routes from "@/routes";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const AppRoutes = () => {
    return useRoutes(routes)
}

function App() {
    const {checkAuth} = useAppStore()

    // Check authentication on app load
    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    console.log('VITE Environment Variables:');
    console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
    console.log('VITE_WEBTRIT_URL:', import.meta.env.VITE_WEBTRIT_URL);
    console.log('VITE_WEBTRIT_GOOGLE_PLAY_URL:', import.meta.env.VITE_WEBTRIT_GOOGLE_PLAY_URL);
    console.log('VITE_WEBTRIT_APP_STORE_URL:', import.meta.env.VITE_WEBTRIT_APP_STORE_URL);

    console.log('VITE_IS_SIGNUP_COMPANY_SITE:', import.meta.env.VITE_IS_SIGNUP_COMPANY_SITE);
    console.log('VITE_IS_SIGNUP_COMPANY_NAME:', import.meta.env.VITE_IS_SIGNUP_COMPANY_NAME);
    console.log('VITE_IS_SIGNUP_PHONE_NUMBER:', import.meta.env.VITE_IS_SIGNUP_PHONE_NUMBER);

    console.log('VITE_APP_TITLE:', import.meta.env.VITE_APP_TITLE);
    console.log('VITE_APP_IS_DASHBOARD_INVITE:', import.meta.env.VITE_APP_IS_DASHBOARD_INVITE);
    console.log('VITE_APP_IS_DASHBOARD_CONNECT_PBX:', import.meta.env.VITE_APP_IS_DASHBOARD_CONNECT_PBX);
    console.log('VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS:', import.meta.env.VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS);


    return (
        <QueryClientProvider client={queryClient}>
            <Router>
                <AppRoutes/>
            </Router>
            <ToastContainer position="top-right" autoClose={5000}/>
        </QueryClientProvider>
    )
}

export default App

