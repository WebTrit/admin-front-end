import axios, {AxiosError} from 'axios';
import {toast} from 'react-toastify';
import {jwtDecode} from 'jwt-decode';
import {useAppStore} from './store';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000
});

// 🔹 Проверка истечения токена
const isTokenExpired = (token: string) => {
    try {
        const decoded = jwtDecode(token);

        if (!decoded.exp) {
            return true;

        }

        return decoded.exp < Date.now() / 1000;
    } catch {
        return true;
    }
};

// 🔹 Интерцептор запросов
api.interceptors.request.use((config) => {
    const token = useAppStore.getState().token;
    if (token) {
        if (isTokenExpired(token)) {
            useAppStore.getState().clearAuth();
            throw new Error('Session expired. Please log in again.');
        }
        config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('🚀 API Request:', {
        backendURL: API_BASE_URL,
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: {
            ...config.headers,
        }
    });

    return config;
});

// 🔹 Интерцептор ответов
api.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.status, response.data);
        return response;
    },
    (error: AxiosError) => {
        const status = error.response?.status || 'Unknown';
        console.error(`❌ API Error ${status}:`, error.message);

        if (status === 401) {
            useAppStore.getState().clearAuth();
            toast.error('Session expired. Please log in again.');
        } else {
            toast.error(`Request failed: ${error.message}`);
        }

        return Promise.reject(error);
    }
);

export default api;