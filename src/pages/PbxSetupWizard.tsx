import {useNavigate} from "react-router-dom"
import {ArrowLeft, ArrowRight, Loader2} from "lucide-react"
import Button from "@/components/ui/Button"

import {useAppStore} from "@/lib/store"
import {useWizard, WizardProvider} from "@/components/pbxSetupWizard/WizardContext.tsx";
import {PbxSetupIntro} from "@/components/pbxSetupWizard/PbxSetupIntro.tsx";
import {VoipConfigStep} from "@/components/pbxSetupWizard/VoipConfigStep.tsx";
import {TenantInfoStep} from "@/components/pbxSetupWizard/TenantInfoStep.tsx";
import {UsersStep} from "@/components/pbxSetupWizard/UsersStep.tsx";

function WizardContent() {
    const navigate = useNavigate()
    const {currentStep, setCurrentStep, tenantFormRef, voipFormRef, isLoading} = useWizard()
    const {currentTenant} = useAppStore()


    const handleProceedFromIntro = async () => {
        setCurrentStep("tenant-info")
    };

    const handleCancel = () => {
        navigate(-1)
    }

    // Handle next button click - now submits the form
    const handleNext = () => {
        if (currentStep === "tenant-info" && tenantFormRef?.current) {
            // Submit the tenant form
            tenantFormRef.current.submitForm()
        } else if (currentStep === "voip-config" && voipFormRef?.current) {
            // Submit the VoIP form
            voipFormRef.current.submitForm()
            //TODO fix type errors
        } else if (currentStep === "complete") {
            navigate("/dashboard")
        }
    }

    // Handle back button click - now resets the form
    const handleBack = () => {
        switch (currentStep) {
            case "tenant-info":
                if (tenantFormRef?.current) {
                    tenantFormRef.current.resetForm()
                }
                setCurrentStep("intro")
                break
            case "voip-config":
                if (voipFormRef?.current) {
                    voipFormRef.current.resetForm()
                }
                setCurrentStep("tenant-info")
                break
            case "users":
                setCurrentStep("voip-config")
                break
            case "complete":
                setCurrentStep("users")
                break
        }
    }

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case "intro":
                return (
                    <PbxSetupIntro
                        userData={{
                            email: currentTenant?.email || "user@example.com",
                            firstName: currentTenant?.first_name || "",
                            lastName: currentTenant?.last_name || "",
                            userCount: 0,
                        }}
                        onProceed={handleProceedFromIntro}
                        onCancel={handleCancel}
                    />
                )
            case "tenant-info":
                return <TenantInfoStep/>
            case "voip-config":
                return <VoipConfigStep/>
            case "users":
                return <UsersStep/>
            case "complete":
                return (
                    <div className="bg-white shadow rounded-lg p-6 text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Setup Complete!</h2>
                        <p className="text-gray-600 mb-6">
                            Your WebTrit environment has been successfully configured to connect to your cloud PBX.
                        </p>
                        <p className="text-gray-600 mb-8">Users can now log in to the WebTrit app with their updated
                            settings.</p>
                        <Button onClick={() => navigate(`/subtenants/${currentTenant?.tenant_id}`)} className="px-8">
                            Go to Configuration
                        </Button>
                    </div>
                )
            default:
                return <div>Unknown step</div>
        }
    }

    // Render step indicator
    const renderStepIndicator = () => {
        if (currentStep === "intro" || currentStep === "complete") return null

        // Remove users step from the indicator
        const steps = [
            {id: "tenant-info", label: "Personal Information"},
            {id: "voip-config", label: "VoIP Configuration"},
            {id: "users", label: "Users Configuration"},
        ]

        const currentIndex = steps.findIndex((step) => step.id === currentStep)

        return (
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                    currentStep === step.id
                                        ? "bg-blue-500 text-white"
                                        : index < currentIndex
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-200 text-gray-600"
                                }`}
                            >
                                {index < currentIndex ? "✓" : index + 1}
                            </div>
                            <span
                                className={`ml-2 text-sm ${currentStep === step.id ? "font-medium text-blue-500" : "text-gray-500"}`}
                            >
                {step.label}
              </span>
                            {index < steps.length - 1 && (
                                <div
                                    className={`h-1 w-16 mx-2 ${index < currentIndex ? "bg-green-500" : "bg-gray-200"}`}></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Render navigation buttons - now always visible except on intro and complete
    const renderNavigation = () => {
        if (currentStep === "intro" || currentStep === "complete" || currentStep === "users") return null

        return (
            <div className="flex justify-between mt-8">
                <Button type="button" variant="outline" onClick={handleBack} className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2"/>
                    Back
                </Button>

                <Button type="button" onClick={handleNext} disabled={isLoading} className="flex items-center">
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                            Processing...
                        </>
                    ) : (
                        <>
                            Next <ArrowRight
                            className="w-4 h-4 ml-2"/>

                        </>
                    )}
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Connect WebTrit to your own cloud PBX</h1>
            </div>

            {renderStepIndicator()}
            {renderStepContent()}
            {renderNavigation()}
        </div>
    )
}

export function PbxSetupWizard() {
    const {currentTenant} = useAppStore()
    if (!currentTenant) {
        return
    }
    return (
        <WizardProvider initialData={currentTenant}>
            <WizardContent/>
        </WizardProvider>
    )
}
