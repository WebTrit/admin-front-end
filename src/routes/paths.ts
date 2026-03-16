export const ROUTES = {
    LOGIN: '/login',
    LOGIN_ADMIN: '/login-admin',
    PASSWORD_RESET: '/password-reset',
    SIGNUP: '/signup',
    DASHBOARD: '/dashboard',
    SUBTENANTS: '/subtenants',
    ADD_SUBTENANT: '/add-subtenant',
    INVITE: '/invite',
    PBX_SETUP: '/pbx-setup',
    subtenant: (tenantId: string) => `/subtenants/${tenantId}`,
    addUser: (tenantId: string) => `/subtenants/${tenantId}/users/new`,
    editUser: (tenantId: string, userId: string) => `/subtenants/${tenantId}/users/${userId}/edit`,
} as const
