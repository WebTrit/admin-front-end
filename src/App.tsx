import {BrowserRouter as Router, useRoutes} from "react-router-dom"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {ToastContainer} from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {useEffect} from "react"
import {useAppStore} from "./lib/store"
import routes from "@/routes";
import {config} from "@/config/runtime";

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
    
    // Update document title and meta tags from runtime config
    useEffect(() => {
        if (config.APP_TITLE) {
            document.title = config.APP_TITLE;
        }
        
        // Update meta description
        if (config.APP_DESCRIPTION) {
            let metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', config.APP_DESCRIPTION);
            }
        }
        
        // Update meta keywords
        if (config.APP_KEYWORDS) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (metaKeywords) {
                metaKeywords.setAttribute('content', config.APP_KEYWORDS);
            }
        }
        
        // Update favicon
        if (config.FAVICON_URL) {
            let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (favicon) {
                favicon.href = config.FAVICON_URL;
            }
        }
    }, [])

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

