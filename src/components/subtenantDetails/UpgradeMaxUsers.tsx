import {useState} from "react"
import {TrendingUp} from "lucide-react"
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query"
import {toast} from "react-toastify"
import Button from "@/components/ui/Button"
import {UpgradeRequestModal} from "./UpgradeRequestModal"
import type {AxiosError} from "axios"
import api from "@/lib/axios"

interface UpgradeMaxUsersProps {
    tenantId: string
    currentMaxUsers: number
}

export function UpgradeMaxUsers({
    tenantId,
    currentMaxUsers
}: UpgradeMaxUsersProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const queryClient = useQueryClient()

    const {data: usersData} = useQuery({
        queryKey: ["users", tenantId],
        queryFn: async () => {
            const response = await api.get(`/tenants/${tenantId}/users/`)
            return response.data as {items: unknown[], count: number}
        },
    })

    const currentUserCount = usersData?.count ?? 0

    const usagePercentage = currentMaxUsers > 0
        ? Math.min(100, Math.round((currentUserCount / currentMaxUsers) * 100))
        : 0

    const requestUpgradeMutation = useMutation({
        mutationFn: async (maxUsers: number) => {
            const response = await api.patch(`/tenants/${tenantId}/max_users`, {
                max_users: maxUsers
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["tenant", tenantId]})
            setIsModalOpen(false)
            toast.success("Upgrade request submitted! Check your email for DocuSign documents.")
        },
        onError: (error: AxiosError<{detail?: string; message?: string}>) => {
            const message = error.response?.data?.detail
                || error.response?.data?.message
                || error.message
                || "Failed to submit upgrade request"
            toast.error(message)
        }
    })

    const handleUpgradeSubmit = (maxUsers: number) => {
        requestUpgradeMutation.mutate(maxUsers)
    }

    return (
        <>
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100 rounded-full">
                        <TrendingUp className="h-5 w-5 text-primary-600"/>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Upgrade Your Plan</h3>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Current Plan:</span>
                        <span className="font-medium text-gray-700">{currentMaxUsers} users</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Users:</span>
                        <span className="font-medium text-gray-700">{currentUserCount} of {currentMaxUsers}</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${
                                usagePercentage >= 90 ? 'bg-red-500' :
                                usagePercentage >= 70 ? 'bg-yellow-500' :
                                'bg-primary-500'
                            }`}
                            style={{width: `${usagePercentage}%`}}
                        />
                    </div>
                    <p className="text-xs text-gray-500 text-right">{usagePercentage}% used</p>
                </div>

                <p className="mt-4 text-sm text-gray-600">
                    Need more users? Upgrade your plan to add more team members to your account.
                </p>

                <div className="mt-4 flex justify-end">
                    <Button
                        variant="primary"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Upgrade Now
                    </Button>
                </div>
            </div>

            <UpgradeRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleUpgradeSubmit}
                isProcessing={requestUpgradeMutation.isPending}
                currentMaxUsers={currentMaxUsers}
            />
        </>
    )
}
