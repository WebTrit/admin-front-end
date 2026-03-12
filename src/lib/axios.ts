import axios, {AxiosError} from 'axios';
import {toast} from 'react-toastify';
import {useAuthStore} from './authStore';
import {config} from '../config/runtime';
import {isTokenExpired} from './auth';

const API_BASE_URL = config.BACKEND_URL;
export const API_VERSION = '/api/v1.0';

const api = axios.create({
    baseURL: `${API_BASE_URL}${API_VERSION}`,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 20000
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;

    if (token) {
        if (isTokenExpired(token)) {
            toast.error('Session expired. Please log in again.');
            useAuthStore.getState().clearAuth();
        }
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const status = error.response?.status || 'Unknown';

        if (status === 401) {
            useAuthStore.getState().clearAuth();
        } else if (status === 404 || String(status).startsWith("50")) {
            toast.error('We are having difficulties connecting to WebTrit servers. Try a bit later and if the problem persists - please let us know at contact@webtrit.com')
        }

        return Promise.reject(error);
    }
);

export default api;
