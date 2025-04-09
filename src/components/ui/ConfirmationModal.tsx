import type React from "react"

import {Trash2} from "lucide-react"
import Button from "@/components/ui/Button.tsx"

interface ConfirmationModalProps {
    title: string
    description: string
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isProcessing: boolean
    confirmText?: string
    cancelText?: string
    icon?: React.ReactNode
}

function ConfirmationModal(
    {
        title,
        description,
        isOpen,
        onClose,
        onConfirm,
        isProcessing,
        confirmText = "Confirm",
        cancelText = "Cancel",
        icon = <Trash2 className="h-6 w-6 text-red-600"/>,
    }: ConfirmationModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}/>
                <div
                    className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div
                                className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                {icon}
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">{title}</h3>
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-gray-500">{description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <Button variant="primary" onClick={onConfirm} disabled={isProcessing}
                                className="w-full sm:ml-3 sm:w-auto">
                            {isProcessing ? "Processing..." : confirmText}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isProcessing}
                            className="mt-3 w-full sm:mt-0 sm:w-auto"
                        >
                            {cancelText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationModal
