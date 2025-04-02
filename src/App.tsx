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

