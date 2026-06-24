import {BrowserRouter as Router, useRoutes} from "react-router-dom"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {ToastContainer} from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {useEffect} from "react"
import {useAuthStore} from "./lib/authStore"
import routes from "@/routes";
import {config} from "@/config/runtime";

// Convert "#5CACE3" -> "92 172 227" for Tailwind's rgb(var(--x) / <alpha-value>) colors
function hexToChannels(hex: string): string | null {
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

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
    const {checkAuth} = useAuthStore()

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

        // Override brand colors from runtime config (empty value -> keep :root default)
        const brandVars: [string, string][] = [
            ['--brand', config.BRAND_COLOR],
            ['--brand-strong', config.BRAND_COLOR_STRONG],
            ['--brand-subtle', config.BRAND_COLOR_SUBTLE],
        ];
        brandVars.forEach(([name, hex]) => {
            const channels = hex && hexToChannels(hex);
            if (channels) {
                document.documentElement.style.setProperty(name, channels);
            }
        });
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

