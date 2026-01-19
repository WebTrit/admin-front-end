import {useState} from "react"
import {ArrowRight, CheckCircle, FileSignature, Mail, X} from "lucide-react"
import Button from "@/components/ui/Button"
import {MAX_USERS_OPTIONS} from "@/constants"

interface UpgradeRequestModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (requestedMaxUsers: number) => void
    isProcessing: boolean
    currentMaxUsers: number
}

export function UpgradeRequestModal({
                                        isOpen,
                                        onClose,
                                        onSubmit,
                                        isProcessing,
                                        currentMaxUsers
                                    }: UpgradeRequestModalProps) {
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [error, setError] = useState<string>("")

    if (!isOpen) return null

    const validateAndSubmit = () => {
        setError("")

        if (selectedOption === null) {
            setError("Please select an option")
            return
        }

        if (selectedOption <= currentMaxUsers) {
            setError(`Must be greater than current limit (${currentMaxUsers})`)
            return
        }

        onSubmit(selectedOption)
    }

    const handleClose = () => {
        if (!isProcessing) {
            setSelectedOption(null)
            setError("")
            onClose()
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}/>
                <div
                    className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">Upgrade Your Plan</h3>
                        <button
                            onClick={handleClose}
                            disabled={isProcessing}
                            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                        >
                            <X className="h-5 w-5"/>
                        </button>
                    </div>

                    <div className="px-6 py-4">
                        <p className="text-sm text-gray-600 mb-4">Select the number of users you need:</p>

                        <div className="space-y-2">
                            {MAX_USERS_OPTIONS.map((option) => {
                                const isDisabled = option.value <= currentMaxUsers
                                return (
                                    <label
                                        key={option.value}
                                        className={`flex items-center p-3 border rounded-lg transition-colors ${
                                            isDisabled
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'cursor-pointer'
                                        } ${
                                            selectedOption === option.value
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="maxUsers"
                                            value={option.value}
                                            checked={selectedOption === option.value}
                                            onChange={() => setSelectedOption(option.value)}
                                            disabled={isDisabled}
                                            className="h-4 w-4 text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700">
                                            {option.label}
                                        </span>
                                        {isDisabled && (
                                            <span className="ml-auto text-xs text-gray-400">Current or lower</span>
                                        )}
                                    </label>
                                )
                            })}
                        </div>

                        {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}

                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Current:</span>
                                <span className="font-medium text-gray-700">{currentMaxUsers} users</span>
                            </div>
                            {selectedOption && (
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-gray-500">New:</span>
                                    <span className="font-medium text-primary-600 flex items-center">
                                        <ArrowRight className="h-3 w-3 mr-1"/>
                                        {selectedOption} users
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-sm font-medium text-blue-800 mb-2">What happens next:</p>
                            <ul className="space-y-2 text-sm text-blue-700">
                                <li className="flex items-start">
                                    <Mail className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/>
                                    <span>You'll receive 2 DocuSign emails: Service Agreement and Plan Upgrade Agreement</span>
                                </li>
                                <li className="flex items-start">
                                    <FileSignature className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/>
                                    <span>Sign both documents to complete the upgrade</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/>
                                    <span>Your account will be upgraded automatically</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isProcessing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={validateAndSubmit}
                            disabled={isProcessing || selectedOption === null}
                        >
                            {isProcessing ? "Processing..." : "Request Upgrade"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
