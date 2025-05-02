import {create} from "zustand"
import {persist} from "zustand/middleware"
import {jwtDecode} from "jwt-decode"
import {Tenant, User} from "@/types.ts";
import api from "@/lib/axios.ts";

// Define the store state type
interface AppState {
    isAuthenticated: boolean;
    usersList: { items: User[], count: number };
    tenantId: string | null;
    token: string | null;
    isSuperTenant: boolean;
    isAdmin: boolean; // Add isAdmin here
    currentTenant: Tenant | null;

    isTenantLoading: boolean;
    tenantError: string | null;

    setAuthenticated: (isAuthenticated: boolean) => void;
    setUsersList: (user: AppState["usersList"]) => void;
    setTenantId: (tenantId: string) => void;
    setToken: (token: string) => void;
    clearAuth: () => void;
    checkAuth: () => boolean;
    setIsSuperTenant: (isSuperTenant: boolean) => void;
    setIsAdmin: (isAdmin: boolean) => void; // Add setter for isAdmin
    setCurrentTenant: (user: Tenant) => void;
    fetchTenant: () => Promise<void>;
}


// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
    try {
        const decoded: any = jwtDecode(token)
        const currentTime = Date.now() / 1000
        return decoded.exp < currentTime
    } catch {
        return true
    }
}
//TODo add login as unified function
//TODO remove redundant data from local storage

// Create the store with persistence
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            isAuthenticated: !!localStorage.getItem("token"),
            usersList: {items: [], count: 0},
            tenantId: localStorage.getItem("tenantId"),
            token: localStorage.getItem("token"),
            isSuperTenant: localStorage.getItem("isSuperTenant") === "true",
            isAdmin: localStorage.getItem("isAdmin") === "true",
            currentTenant: null,

            isTenantLoading: false,
            tenantError: null,

            setAuthenticated: (isAuthenticated) => set({isAuthenticated}),
            setUsersList: (usersList) => set({usersList}),
            setIsSuperTenant: (isSuperTenant: boolean) => {
                if (!isSuperTenant) {
                    return;
                }
                localStorage.setItem("isSuperTenant", isSuperTenant.toString());
                set({isSuperTenant});
            },
            setIsAdmin: (isAdmin: boolean) => { // Add setter for isAdmin
                localStorage.setItem("isAdmin", isAdmin.toString());
                set({isAdmin});
            },
            setCurrentTenant: (currentTenant) => set({currentTenant}),
            setTenantId: (tenantId) => {
                localStorage.setItem("tenantId", tenantId);
                set({tenantId});
            },
            setToken: (token) => {
                localStorage.setItem("token", token);
                set({token, isAuthenticated: true});
            },
            clearAuth: () => {
                localStorage.removeItem("token");
                localStorage.removeItem("tenantId");
                localStorage.removeItem("isSuperTenant");
                localStorage.removeItem("isAdmin");

                set({
                    isAuthenticated: false,
                    tenantId: null,
                    token: null,
                    isSuperTenant: false,
                    isAdmin: false,
                    currentTenant: null,
                    usersList: {items: [], count: 0},
                });
            },
            checkAuth: () => {
                const {token} = get();
                if (!token || isTokenExpired(token)) {
                    get().clearAuth();
                    return false;
                }
                return true;
            },
            fetchTenant: async () => {
                const {tenantId, setCurrentTenant} = get();
                if (!tenantId) return;

                set({isTenantLoading: true, tenantError: null});
                try {
                    const response = await api.get(`/tenants/${tenantId}`);
                    setCurrentTenant(response.data);
                } catch (error: any) {
                    set({tenantError: error.message || "Failed to fetch tenant"});
                } finally {
                    set({isTenantLoading: false});
                }
            },
        }),
        {
            name: "tenant-management-storage",
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                usersList: state.usersList,
                tenantId: state.tenantId,
                token: state.token,
                isSuperTenant: state.isSuperTenant,
                isAdmin: state.isAdmin, // Persist isAdmin as well
            }),
        }
    )
);
//Todo split into two stores and rename variables