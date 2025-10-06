import type React from "react"
import {Code} from "lucide-react"
import Button from "@/components/ui/Button.tsx"

interface DeveloperAccessDialogProps {
    isOpen: boolean
    onClose: () => void
    isProcessing: boolean
}

function DeveloperAccessDialog(
    {
        isOpen,
        onClose,
        isProcessing,
    }: DeveloperAccessDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"/>
                <div
                    className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div
                                className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                                <Code className="h-6 w-6 text-blue-600"/>
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">Developer Access</h3>
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-gray-500">
                                        We're activating your developer's access. You will receive an email with
                                        instructions on accessing the development environment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <Button
                            variant="primary"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="w-full sm:w-auto"
                        >
                            OK
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeveloperAccessDialog
