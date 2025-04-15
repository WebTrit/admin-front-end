import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Input from "@/components/ui/Input.tsx";
import Button from "@/components/ui/Button.tsx";
import {useEffect, useState} from "react";
import {useAppStore} from "@/lib/store.ts";
import api from "@/lib/axios.ts";
import {toast} from "react-toastify";
import {useNavigate} from "react-router-dom";
import {ArrowLeft} from "lucide-react";

const inviteSchema = z.object({
    current_user: z.object({
        first_name: z.string().min(1, 'First name is required'),
        last_name: z.string().min(1, 'Last name is required'),
    }),
    invited_user: z.object({
        first_name: z.string().min(1, 'First name is required'),
        last_name: z.string().min(1, 'Last name is required'),
        email: z.string().email('Invalid email address'),
    }),
});

type InviteFormData = z.infer<typeof inviteSchema>;

function Invite() {
    const {currentUser, tenantId} = useAppStore();
    const navigate = useNavigate();
    const [invited, setInvited] = useState(false);

    const {
        register,
        handleSubmit,
        formState: {errors},
        setValue,
        resetField
    } = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            current_user: {
                first_name: currentUser?.first_name || '',
                last_name: currentUser?.last_name || '',
            },
        },
    });

    useEffect(() => {
        if (currentUser) {
            setValue('current_user.first_name', currentUser.first_name);
            setValue('current_user.last_name', currentUser.last_name);
        }
    }, [currentUser, setValue]);

    const onSubmit = async (data: InviteFormData) => {
        const fullName = `${data.current_user.first_name} ${data.current_user.last_name}`;

        const invite_msg = `Hello ${data.invited_user.first_name},
        You've received an invitation from ${fullName} to make free voice and video calls with WebTrit.
        Don't miss out! Download the WebTrit app for Android or iOS and start calling. Your friends and colleagues, including ${fullName}, are excited to hear from you, so don't keep them waiting.`;

        try {
            await api.post(`/tenants/${tenantId}/invite`, {
                ...data,
                invite_msg,
            });
            toast.success(`Invitation sent successfully to ${data.invited_user.email}!`);
            setInvited(true);
            resetField('invited_user.first_name');
            resetField('invited_user.last_name');
            resetField('invited_user.email');
        } catch (error: any) {
            if (error?.response?.status === 409) {
                toast.info(`The user with email ${data.invited_user.email} already uses WebTrit.`);
            } else {
                toast.error(`Failed to send invitation to ${data.invited_user.email}. Please try again.`);
            }
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center  mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex"
                >
                    <ArrowLeft className="w-6 h-6 mr-1"/>

                </button>
                <h1 className="text-2xl ml-2 font-bold">Invite User</h1>

            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4">Current User Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span>*</span>
                            </label>
                            <Input
                                {...register('current_user.first_name')}
                                error={!!errors.current_user?.first_name}
                            />
                            {errors.current_user?.first_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.current_user.first_name.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span>*</span>
                            </label>
                            <Input
                                {...register('current_user.last_name')}
                                error={!!errors.current_user?.last_name}
                            />
                            {errors.current_user?.last_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.current_user.last_name.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4">Invited User Details</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name <span>*</span>
                            </label>
                            <Input
                                {...register('invited_user.first_name')}
                                error={!!errors.invited_user?.first_name}
                            />
                            {errors.invited_user?.first_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.invited_user.first_name.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name <span>*</span>
                            </label>
                            <Input
                                {...register('invited_user.last_name')}
                                error={!!errors.invited_user?.last_name}
                            />
                            {errors.invited_user?.last_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.invited_user.last_name.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email <span>*</span>
                            </label>
                            <Input
                                type="email"
                                {...register('invited_user.email')}
                                error={!!errors.invited_user?.email}
                            />
                            {errors.invited_user?.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.invited_user.email.message}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center">
                    {invited && (
                        <Button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="mr-4"
                        >
                            I’m Done
                        </Button>
                    )}
                    <Button type="submit">
                        {invited ? 'Invite More Users' : 'Send Invitation'}
                    </Button>

                </div>
            </form>
        </div>
    );
}

export default Invite;