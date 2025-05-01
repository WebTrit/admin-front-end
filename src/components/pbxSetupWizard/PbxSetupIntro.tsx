import {Info, Loader2} from "lucide-react"
import Button from "@/components/ui/Button"
import {useAppStore} from "@/lib/store.ts";

interface PbxSetupIntroProps {
    userData: {
        email: string
        firstName: string
        lastName: string
        userCount?: number
    }
    onProceed: () => void
    onCancel: () => void
    isLoading: boolean
}

export function PbxSetupIntro({userData, onProceed, onCancel, isLoading}: PbxSetupIntroProps) {
    const {currentTenant} = useAppStore()
    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
                <p className="text-lg font-medium text-gray-800">
                    You are about to start the process of re-configuring your WebTrit environment to connect to your own
                    cloud
                    PBX.
                </p>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0"/>
                        <div>
                            <p className="text-sm text-gray-700">
                                You are allowed to have <span
                                className="font-semibold">{currentTenant?.max_users}</span> users in your
                                environment free of
                                charge.
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                                Currently in your environment you have <span
                                className="font-semibold">{userData?.userCount || 0}</span>{" "}
                                users.
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                                You will be able to either convert or delete any of them - as well as add new users.
                            </p>
                        </div>
                    </div>
                </div>

                {userData.email && (
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">{userData.email}</span>
                            <span className="font-medium">{userData.firstName}</span>
                        </div>
                    </div>
                )}

                <div className="bg-red-50 p-4 rounded-lg border border-red-100 mt-6">
                    <p className="text-red-600 font-medium">
                        Once you start the process, users will no longer be able to use the service until you complete
                        re-configuration of their settings and they re-login into WebTrit app.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button type="button" onClick={onProceed} disabled={isLoading} className="w-full sm:w-auto">
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin"/>
                                Processing...
                            </>
                        ) : (
                            "Proceed"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
