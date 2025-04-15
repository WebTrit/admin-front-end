import {Phone, Globe, Code, Download, Loader2, ExternalLink} from "lucide-react";
import {DashboardCard} from "@/components/dashboard/DashboardCard.tsx";
import {useAppStore} from "@/lib/store.ts";
import {toast} from "react-toastify";
import api from "@/lib/axios.ts";
import Button from "@/components/ui/Button.tsx";

const Dashboard = () => {
    const WEBTRIT_URL = import.meta.env.VITE_WEBTRIT_URL;
    const WEBTRIT_GOOGLE_PLAY_URL = import.meta.env.VITE_WEBTRIT_GOOGLE_PLAY_URL;
    const WEBTRIT_APP_STORE_URL = import.meta.env.VITE_WEBTRIT_APP_STORE_URL;

    const IS_INVITE_ENABLED = import.meta.env.VITE_APP_IS_DASHBOARD_INVITE === 'true';
    const IS_CONNECT_PBX_ENABLED = import.meta.env.VITE_APP_IS_DASHBOARD_CONNECT_PBX === 'true';
    const IS_DEVELOPER_ACCESS_ENABLED = import.meta.env.VITE_APP_IS_DASHBOARD_DEVELOPER_ACCESS === 'true';


    const {
        tenantId,
        currentUser,
        isTenantLoading,
        tenantError,
    } = useAppStore();

    const handleEnableDeveloperAccess = async () => {
        if (!tenantId || !currentUser?.email) return;

        try {
            await api.put(`/api/v1.0/tenants/${tenantId}/developer`, {
                email: currentUser.email,
            });

            toast.success("Developer access enabled! Check your email for credentials.");
        } catch (error: any) {
            toast.error(error?.response?.data?.message || `Failed to enable developer access to user with email ${currentUser?.email}`);
        }
    };

    return (
        <div className="bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isTenantLoading ? (
                    <div className="w-full h-full flex justify-center">
                        <Loader2 size={40} className="mr-2 animate-spin"/>
                    </div>
                ) : tenantError ? (
                    <div className="text-red-600 text-center">{tenantError}</div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                                Start your WebTrit journey now!
                            </h1>
                            <p className="mt-3 text-xl text-gray-600">
                                Hi {currentUser?.first_name}, how would you like to use WebTrit today?
                            </p>
                        </div>

                        <div className="grid gap-8">
                            <DashboardCard
                                title="Useful links"
                                description="Use email address as username to get started with WebTrit"
                                icon={Globe}
                                imageUrl="https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80&w=400&h=300"
                                additionalContent={
                                    <div>
                                        <div className="flex flex-wrap gap-4 mt-4">
                                            <a
                                                href={WEBTRIT_GOOGLE_PLAY_URL}
                                                target="_blank"
                                                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                                            >
                                                <Download className="w-5 h-5"/>
                                                App Store
                                            </a>
                                            <a
                                                href={WEBTRIT_APP_STORE_URL}
                                                target="_blank"
                                                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                                            >
                                                <Download className="w-5 h-5"/>
                                                Google Play
                                            </a>
                                        </div>
                                        <a
                                            href={`${WEBTRIT_URL}/login?tenant=${tenantId}&email=${currentUser?.email}`}
                                            target="_blank"
                                            className="mt-4 inline-flex items-center text-primary-500 hover:text-primary-600 font-medium"
                                        >
                                            Click to try Web Dialer
                                            <ExternalLink className="ml-2 w-4 h-4"/>
                                        </a>
                                    </div>
                                }
                            />

                            {IS_INVITE_ENABLED && (
                                <DashboardCard
                                    title="Simple Demo: App to App calling"
                                    description="Make voice or video calls to other people that also have the WebTrit App or WebTrit web-dialer installed."
                                    icon={Phone}
                                    linkText="Invite your friends"
                                    linkUrl="#"
                                    imageUrl="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=400&h=300"
                                />
                            )}

                            {IS_CONNECT_PBX_ENABLED && (
                                <DashboardCard
                                    title="Connect WebTrit to your own PBX"
                                    description="Make and receive calls on WebTrit via your own PBX. You can add up to five users (SIP accounts) for free."
                                    icon={Globe}
                                    linkText="Connect to your own PBX"
                                    linkUrl="#"
                                    imageUrl="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400&h=300"
                                    additionalContent={
                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-500">
                                            <p>
                                                To ensure calls go through - if you have a firewall on your PBX, please
                                                add
                                                the IP address of WebTrit's - 35.207.181.165 to the list of allowed IPs
                                                for
                                                SIP & RTP traffic.
                                            </p>
                                        </div>
                                    }
                                />
                            )}

                            {IS_DEVELOPER_ACCESS_ENABLED && (
                                <DashboardCard
                                    title="Developer's access"
                                    description="Use the demo system's API to develop your own voice / video applications."
                                    icon={Code}
                                    linkUrl="#"
                                    imageUrl="https://images.unsplash.com/photo-1555066931-bf19f8fd1085?auto=format&fit=crop&q=80&w=400&h=300"
                                    additionalContent={
                                        <div className="mt-4 text-sm text-gray-600 space-y-3">
                                            <p>
                                                This will enable API access for your account and send you an email with
                                                required credentials and detailed instructions.
                                            </p>
                                            <Button
                                                onClick={handleEnableDeveloperAccess}
                                            >
                                                Enable Developer Access
                                            </Button>
                                        </div>
                                    }
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
