// Store has been split into authStore and tenantStore.
// This file is kept as a compatibility shim — migrate imports to the specific stores.
export {useAuthStore as useAppStore} from "./authStore"
