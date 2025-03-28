import {Trash2} from "lucide-react";
import Button from "@/components/ui/Button.tsx";
import {User} from "@/types.ts";

interface DeleteModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

function DeleteUserModal({user, isOpen, onClose, onConfirm, isDeleting}: DeleteModalProps) {
    if (!isOpen || !user) return null;

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
                                <Trash2 className="h-6 w-6 text-red-600"/>
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                                    Delete User
                                </h3>
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to delete this user? This action cannot be undone.
                                    </p>
                                    <div className="mt-2 rounded-md bg-gray-50 p-4">
                                        <dl className="space-y-1 text-sm">
                                            <div>
                                                <dt className="inline font-medium text-gray-900">Name:</dt>
                                                <dd className="inline">{user.first_name} {user.last_name}</dd>
                                            </div>
                                            <div>
                                                <dt className="inline font-medium text-gray-900">Email:</dt>
                                                <dd className="inline">{user.email}</dd>
                                            </div>
                                            <div>
                                                <dt className="inline font-medium text-gray-900">SIP Username:</dt>
                                                <dd className="inline">{user.sip_username}</dd>
                                            </div>
                                            {user.ext_number && (
                                                <div>
                                                    <dt className="inline font-medium text-gray-900">Extension:</dt>
                                                    <dd className="inline">{user.ext_number}</dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <Button
                            variant="primary"
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="w-full sm:ml-3 sm:w-auto"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="mt-3 w-full sm:mt-0 sm:w-auto"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DeleteUserModal;