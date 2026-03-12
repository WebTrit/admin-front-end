import type React from "react"
import {createContext, type ReactNode, useContext, useState} from "react"
import {TenantInfoRef} from "@/components/shared/TenantInfo.tsx";
import {VoipConfigRef} from "@/components/shared/VoipConfig.tsx";
import type {Tenant} from "@/types";

// Remove 'users' from the steps
type SetupStep = "intro" | "tenant-info" | "voip-config" | "users" | "complete"

interface WizardContextType {
    currentStep: SetupStep
    setCurrentStep: (step: SetupStep) => void
    tenantData: Partial<Tenant>
    updateTenantData: (data: Partial<Tenant>) => void
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    errors: Record<string, string>
    setErrors: (errors: Record<string, string>) => void
    // Use refs for the form components
    tenantFormRef: React.RefObject<TenantInfoRef> | null
    setTenantFormRef: (ref: React.RefObject<TenantInfoRef> | null) => void
    voipFormRef: React.RefObject<VoipConfigRef> | null
    setVoipFormRef: (ref: React.RefObject<VoipConfigRef> | null) => void

}

const WizardContext = createContext<WizardContextType | undefined>(undefined)

export function WizardProvider({children, initialData}: { children: ReactNode; initialData?: Partial<Tenant> }) {
    const [currentStep, setCurrentStep] = useState<SetupStep>("intro")
    const [tenantData, setTenantData] = useState<Partial<Tenant>>(initialData || {})
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [tenantFormRef, setTenantFormRef] = useState<React.RefObject<TenantInfoRef> | null>(null)
    const [voipFormRef, setVoipFormRef] = useState<React.RefObject<VoipConfigRef> | null>(null)

    const updateTenantData = (data: Partial<Tenant>) => {
        setTenantData((prev) => ({...prev, ...data}))
    }


    return (
        <WizardContext.Provider
            value={{
                currentStep,
                setCurrentStep,
                tenantData,
                updateTenantData,
                isLoading,
                setIsLoading,
                errors,
                setErrors,
                tenantFormRef,
                setTenantFormRef,
                voipFormRef,
                setVoipFormRef,
            }}
        >
            {children}
        </WizardContext.Provider>
    )
}

export function useWizard() {
    const context = useContext(WizardContext)
    if (context === undefined) {
        throw new Error("useWizard must be used within a WizardProvider")
    }
    return context
}
