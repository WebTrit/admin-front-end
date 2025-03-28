import axios, {AxiosError} from 'axios';
import {toast} from 'react-toastify';
import {jwtDecode} from 'jwt-decode';

const api = axios.create({
    baseURL: "https://rest-api-84689730896.europe-west3.run.app/api/v1.0",
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    // Default timeout for most requests
    timeout: 10000
});

// Mask token for logging
const maskToken = (token: string) => {
    if (token.length < 8) return '***';
    return token.substring(0, 4) + '...' + token.substring(token.length - 4);
};

// Check if token is expired
const isTokenExpired = (token: string) => {
    try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch {
        return true;
    }
};

// Request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    // Check token expiration before making the request
    if (token) {
        if (isTokenExpired(token)) {
            localStorage.removeItem('token');
            localStorage.removeItem('tenantId');
            window.location.href = '/login';
            throw new Error('Session expired. Please log in again.');
        }
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Set longer timeout for hostname validation
    if (config.url?.includes('/info/hostname')) {
        config.timeout = 30000; // 30 seconds
    }

    const serverName = new URL(config.baseURL || '').hostname;
    const fullUrl = `${config.baseURL}${config.url}`;

    // Log request details including masked auth header
    console.log('🚀 API Request:', {
        server: serverName,
        method: config.method?.toUpperCase(),
        endpoint: config.url,
        fullUrl,
        headers: {
            ...config.headers,
            Authorization: config.headers.Authorization
                ? `Bearer ${maskToken(config.headers.Authorization.split(' ')[1])}`
                : undefined
        }
    });

    return config;
});

// Response interceptor
api.interceptors.response.use(
    (response) => {
        const serverName = new URL(response.config.baseURL || '').hostname;
        const fullUrl = `${response.config.baseURL}${response.config.url}`;
        console.log('✅ API Response:', {
            server: serverName,
            method: response.config.method?.toUpperCase(),
            status: response.status,
            endpoint: response.config.url,
            fullUrl,
            data: response.data
        });
        return response;
    },
    (error: AxiosError) => {
        const serverName = new URL(error.config?.baseURL || '').hostname;
        const fullUrl = `${error.config?.baseURL}${error.config?.url}`;
        const method = error.config?.method?.toUpperCase();

        // Format error details for logging and display
        const errorDetails = {
            server: serverName,
            method,
            endpoint: error.config?.url,
            fullUrl,
            headers: {
                ...error.config?.headers,
                Authorization: error.config?.headers?.Authorization
                    ? `Bearer ${maskToken(error.config.headers.Authorization.split(' ')[1])}`
                    : undefined
            },
            errorName: error.name,
            errorCode: error.code,
            status: error.response?.status || 'No HTTP status',
            statusText: error.response?.statusText,
            message: error.message
        };

        // Handle different types of errors
        if (error.code === 'ERR_NETWORK') {
            // True network errors (no response received)
            console.error('❌ Connection Error:', errorDetails);
            toast.error(
                `Connection failed to ${serverName}. Please check your network connection or try again later.`
            );
        } else if (error.response) {
            // HTTP error responses (response received with error status)
            console.error('❌ HTTP Error:', {
                ...errorDetails,
                response: error.response.data
            });

            const status = error.response.status;
            const statusText = error.response.statusText;
            const detail = error.response.data?.detail || error.message;

            // Format the error message to always show HTTP status code
            const errorMessage = `${status} ${statusText}: ${detail}`;

            switch (status) {
                case 401:
                    if (localStorage.getItem('token')) {
                        toast.error('Session expired. Please log in again.');
                        localStorage.removeItem('token');
                        localStorage.removeItem('tenantId');
                        window.location.href = '/login';
                    }
                    break;
                case 403:
                    toast.error(`Access denied - ${errorMessage}`);
                    break;
                case 404:
                    toast.error(`Resource not found - ${errorMessage}`);
                    break;
                case 429:
                    toast.error(`Too many requests - ${errorMessage}`);
                    break;
                case 500:
                case 501:
                case 502:
                case 503:
                case 504:
                    toast.error(`Server error - ${errorMessage}`);
                    break;
                default:
                    toast.error(`Request failed - ${errorMessage}`);
            }
        } else {
            // Other errors
            console.error('❌ Request Error:', errorDetails);
            toast.error(
                `Request failed [${method}]: ${error.message}`
            );
        }

        return Promise.reject(error);
    }
);

export default api;