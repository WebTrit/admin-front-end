import React, {useEffect, useState} from 'react';
import {ArrowLeft, ArrowRight, Check, User, UserPlus} from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import api from "@/lib/axios.ts";
import {toast} from "react-toastify";
import {useAppStore} from "@/lib/store.ts";
import {useNavigate} from "react-router-dom";

type UserDetails = {
    first_name: string;
    last_name: string;
    email?: string;
};

function Invite() {
    const {currentTenant, tenantId} = useAppStore(); // Get currentUser from the store
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [currentUser, setCurrentTenant] = useState<UserDetails>({
        first_name: currentTenant?.first_name || '',
        last_name: currentTenant?.last_name || '',
    });
    const [invitedUser, setInvitedUser] = useState<UserDetails>({
        first_name: '',
        last_name: '',
        email: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setCurrentTenant({first_name: currentTenant?.first_name || '', last_name: currentTenant?.last_name || ''});
    }, [currentTenant]);

    const validateStep = (stepNumber: number) => {

        const newErrors: Record<string, string> = {};

        if (stepNumber === 1) {
            if (!currentUser.first_name) newErrors.current_first_name = 'First name is required';
            if (!currentUser.last_name) newErrors.current_last_name = 'Last name is required';
        } else if (stepNumber === 2) {
            if (!invitedUser.first_name) newErrors.invited_first_name = 'First name is required';
            if (!invitedUser.last_name) newErrors.invited_last_name = 'Last name is required';
            if (!invitedUser.email) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedUser.email)) {
                newErrors.email = 'Invalid email address';
            }
        }

        console.log('Step:', stepNumber, 'Errors:', newErrors);

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateStep(2)) {
            const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
            const data = {
                current_user: currentUser,
                invited_user: invitedUser,
                invite_msg: `Hello ${invitedUser.first_name},
          You've received an invitation from ${fullName} to make free voice and video calls with WebTrit.
          Don't miss out! Download the WebTrit app for Android or iOS and start calling. Your friends and colleagues, including ${fullName}, are excited to hear from you, so don't keep them waiting.`
            };

            try {
                await api.post(`/tenants/${tenantId}/invite`, data);
                toast.success(`Invitation sent successfully to ${invitedUser.email}!`);
                setStep(3);
            } catch (error: any) {
                if (error?.response?.status === 409) {
                    toast.info(`The user with email ${invitedUser.email} already uses WebTrit.`);
                } else {
                    toast.error(`Failed to send invitation to ${invitedUser.email}. Please try again.`);
                }
            }
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                    <User className="w-4 h-4"/>
                </div>
                <div className={`w-20 h-1 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}/>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                    <UserPlus className="w-4 h-4"/>
                </div>
                <div className={`w-20 h-1 ${step === 3 ? 'bg-blue-500' : 'bg-gray-200'}`}/>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step === 3 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                    <Check className="w-4 h-4"/>
                </div>
            </div>
        </div>
    );

    const renderStep1 = () => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Your Details</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                        value={currentUser.first_name}
                        onChange={(e) => setCurrentTenant({...currentUser, first_name: e.target.value})}
                        error={!!errors.current_first_name}
                    />
                    {errors.current_first_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.current_first_name}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                        value={currentUser.last_name}
                        onChange={(e) => setCurrentTenant({...currentUser, last_name: e.target.value})}
                        error={!!errors.current_last_name}
                    />
                    {errors.current_last_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.current_last_name}</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Invite Someone</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                        value={invitedUser.first_name}
                        onChange={(e) => setInvitedUser({...invitedUser, first_name: e.target.value})}
                        error={!!errors.invited_first_name}
                    />
                    {errors.invited_first_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.invited_first_name}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                        value={invitedUser.last_name}
                        onChange={(e) => setInvitedUser({...invitedUser, last_name: e.target.value})}
                        error={!!errors.invited_last_name}
                    />
                    {errors.invited_last_name && (
                        <p className="text-red-500 text-sm mt-1">{errors.invited_last_name}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="email"
                        value={invitedUser.email}
                        onChange={(e) => setInvitedUser({...invitedUser, email: e.target.value})}
                        error={!!errors.email}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500"/>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Invitation Sent!</h2>
            <p className="text-gray-600 mb-6">
                We've sent an invitation to {invitedUser.email}
            </p>
            <Button className="mr-4"
                    onClick={() => navigate('/dashboard')}
            >
                To dashboard
            </Button>
            <Button
                onClick={() => {
                    setStep(2);
                    setInvitedUser({first_name: '', last_name: '', email: ''});
                }}
            >
                Invite Another Person
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen">
            <div className="max-w-2xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-center mb-2">Invite Users</h1>
                    {step === 1 &&
                        <p className="text-gray-600 text-center">In order to prevent the invitation from being flagged
                            as
                            spam or ignored, please provide <b>your name</b> so that we can include it in the email
                            invitation,
                            that the recipient knows it is authentic.</p>}
                    {step === 2 &&
                        <p className="text-gray-600 text-center">Your contact will receive an email with the link to
                            download & install the WebTrit app.

                            To prevent spam and ensure proper addressing, please include their name.</p>}
                </div>

                {renderStepIndicator()}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}

                    {step !== 3 && (
                        <div className='flex justify-between items-center'>

                            <Button
                                variant="ghost"
                                type="button"
                                onClick={step === 1 ? () => navigate('/dashboard') : handleBack}
                                className="flex items-center"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2"/>
                                Back
                            </Button>

                            <div className="flex justify-end items-center">
                                {step === 1 && (
                                    <Button
                                        onClick={handleNext}
                                        className="ml-auto flex items-center"
                                    >
                                        Next
                                        <ArrowRight className="w-4 h-4 ml-2"/>
                                    </Button>
                                )}

                                {step === 2 && (
                                    <Button
                                        type="submit"
                                        className="ml-auto flex items-center"
                                    >
                                        Send Invitation
                                    </Button>
                                )}
                            </div>

                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default Invite;