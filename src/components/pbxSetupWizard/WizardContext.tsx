import type React from "react"
import {createContext, type ReactNode, useContext, useState} from "react"
import type {TenantFormData} from "@/pages/SubtenantDetails"
import {TenantInfoRef} from "@/components/shared/TenantInfo.tsx";

// Remove 'users' from the steps
type SetupStep = "intro" | "tenant-info" | "voip-config" | "users" | "complete"

class VoipConfigRef {
}

interface WizardContextType {
    currentStep: SetupStep
    setCurrentStep: (step: SetupStep) => void
    tenantData: any
    updateTenantData: (data: any) => void
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

export function WizardProvider({children, initialData}: { children: ReactNode; initialData?: any }) {
    const [currentStep, setCurrentStep] = useState<SetupStep>("intro")
    const [tenantData, setTenantData] = useState(initialData || {})
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [tenantFormRef, setTenantFormRef] = useState<React.RefObject<TenantInfoRef> | null>(null)
    const [voipFormRef, setVoipFormRef] = useState<React.RefObject<VoipConfigRef> | null>(null)

    const updateTenantData = (data: Partial<TenantFormData>) => {
        setTenantData((prev: any) => ({...prev, ...data}))
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
