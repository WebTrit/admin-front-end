import {create} from "zustand"
import {persist} from "zustand/middleware"
import {jwtDecode} from "jwt-decode"
import {User} from "@/types.ts";
import api from "@/lib/axios.ts";

// Define the store state type
interface AppState {
    isAuthenticated: boolean;
    usersList: any[];
    tenantId: string | null;
    token: string | null;
    isSuperTenant: boolean;
    isBasicDemo: boolean;
    currentUser: User | null;

    isTenantLoading: boolean;
    tenantError: string | null;

    setAuthenticated: (isAuthenticated: boolean) => void;
    setUsersList: (user: AppState["usersList"]) => void;
    setTenantId: (tenantId: string) => void;
    setToken: (token: string) => void;
    clearAuth: () => void;
    checkAuth: () => boolean;
    setIsSuperTenant: (isSuperTenant: boolean) => void;
    setIsBasicDemo: (isBasicDemo: boolean) => void;
    setCurrentUser: (user: User) => void;

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
            usersList: [],
            tenantId: localStorage.getItem("tenantId"),
            token: localStorage.getItem("token"),
            isSuperTenant: localStorage.getItem("isSuperTenant") === "true",
            isBasicDemo: localStorage.getItem("isBasicDemo") === "true",
            currentUser: null,

            isTenantLoading: false,
            tenantError: null,

            setAuthenticated: (isAuthenticated) => set({isAuthenticated}),
            setUsersList: (usersList) => set({usersList}),
            setIsSuperTenant: (isSuperTenant: boolean) => {
                if (!isSuperTenant) {
                    return
                }
                localStorage.setItem("isSuperTenant", isSuperTenant.toString());
                set({isSuperTenant});
            },
            setIsBasicDemo: (isBasicDemo: boolean) => {
                localStorage.setItem("isBasicDemo", isBasicDemo.toString());
                set({isBasicDemo});
            },
            setCurrentUser: (currentUser) => set({currentUser}),
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
                localStorage.removeItem("isBasicDemo");
                set({
                    isAuthenticated: false,
                    tenantId: null,
                    token: null,
                    isSuperTenant: false,
                    isBasicDemo: false,
                    currentUser: null,
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
                const {tenantId, setCurrentUser} = get();
                if (!tenantId) return;

                set({isTenantLoading: true, tenantError: null});
                try {
                    const response = await api.get(`/tenants/${tenantId}`);
                    setCurrentUser(response.data);
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
                isBasicDemo: state.isBasicDemo,
            }),
        }
    )
);