// Runtime configuration that can be set via Cloud Run environment variables
declare global {
    interface Window {
        __RUNTIME_CONFIG__?: {
            VITE_BACKEND_URL: string;
            VITE_WEBTRIT_GOOGLE_PLAY_URL?: string;
            VITE_WEBTRIT_APP_STORE_URL?: string;
            VITE_IS_SIGNUP_COMPANY_SITE?: string;
            VITE_IS_SIGNUP_COMPANY_NAME?: string;
            VITE_IS_SIGNUP_PHONE_NUMBER?: string;
            VITE_APP_TITLE?: string;
            VITE_APP_IS_DASHBOARD_INVITE?: string;
            VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS?: string;
            VITE_WEBTRIT_DIALER_URL?: string;
            VITE_IS_SIGNUP?: string;
            VITE_APP_IS_DASHBOARD_CONNECT_PBX?: string;
            VITE_APP_DESCRIPTION?: string;
            VITE_APP_KEYWORDS?: string;
            VITE_FAVICON_URL?: string;
            VITE_SHARE_IMAGE_URL?: string;
        };
    }
}

// Helper function to get config value with fallback to build-time env
export function getConfig(key: string): string {
    // First check runtime config
    const runtimeValue = window.__RUNTIME_CONFIG__?.[key as keyof typeof window.__RUNTIME_CONFIG__];

    // Skip runtime config if it contains template syntax (not replaced)
    if (runtimeValue && !runtimeValue.includes('${') && runtimeValue !== '') {
        return runtimeValue;
    }

    // Fallback to build-time env
    return import.meta.env[key] || '';
}

// Helper to parse boolean config values
export function getBooleanConfig(key: string): boolean {
    const value = getConfig(key);
    return value === 'true';
}

// Export commonly used config values
export const config = {
    BACKEND_URL: getConfig('VITE_BACKEND_URL'),
    WEBTRIT_GOOGLE_PLAY_URL: getConfig('VITE_WEBTRIT_GOOGLE_PLAY_URL'),
    WEBTRIT_APP_STORE_URL: getConfig('VITE_WEBTRIT_APP_STORE_URL'),
    IS_SIGNUP_COMPANY_SITE: getBooleanConfig('VITE_IS_SIGNUP_COMPANY_SITE'),
    IS_SIGNUP_COMPANY_NAME: getBooleanConfig('VITE_IS_SIGNUP_COMPANY_NAME'),
    IS_SIGNUP_PHONE_NUMBER: getBooleanConfig('VITE_IS_SIGNUP_PHONE_NUMBER'),
    APP_TITLE: getConfig('VITE_APP_TITLE'),
    APP_IS_DASHBOARD_INVITE: getBooleanConfig('VITE_APP_IS_DASHBOARD_INVITE'),
    APP_IS_DASHBOARD_DEVELOPER_ACCESS: getBooleanConfig('VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS'),
    WEBTRIT_DIALER_URL: getConfig('VITE_WEBTRIT_DIALER_URL'),
    IS_SIGNUP: getBooleanConfig('VITE_IS_SIGNUP'),
    APP_IS_DASHBOARD_CONNECT_PBX: getBooleanConfig('VITE_APP_IS_DASHBOARD_CONNECT_PBX'),
    APP_DESCRIPTION: getConfig('VITE_APP_DESCRIPTION'),
    APP_KEYWORDS: getConfig('VITE_APP_KEYWORDS'),
    FAVICON_URL: getConfig('VITE_FAVICON_URL'),
    SHARE_IMAGE_URL: getConfig('VITE_SHARE_IMAGE_URL'),
};