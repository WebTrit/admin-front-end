import {User, Home, LogOut, Settings} from 'lucide-react';
import {useAppStore} from "@/lib/store.ts";
import {useNavigate, useLocation} from "react-router-dom";
import {useState, useRef, useEffect} from 'react';

function Header() {
    const {clearAuth, isSuperTenant, isBasicDemo, currentUser, isTenantLoading, tenantId, fetchTenant} = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigationItems = [
        {
            name: 'Home',
            path: '/dashboard',
            icon: Home,
            isAvailable: true,
        },
        {
            name: 'Configuration',
            path: isSuperTenant ? '/subtenants' : `/subtenants/${tenantId}`,
            icon: Settings,
            isAvailable: !isBasicDemo,
        }
    ];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!currentUser && tenantId) {
            fetchTenant();
        }

    }, [tenantId]);


    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        clearAuth();
        setIsDropdownOpen(false);
    };


    return (
        <header className="bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-x-8">
                    <div
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-x-3 cursor-pointer"
                    >
                        <h1 className="text-2xl font-semibold text-gray-900">Tenant Portal</h1>
                    </div>
                    <nav className="hidden md:flex items-center gap-x-4">
                        {navigationItems
                            .filter((item) => item.isAvailable && currentUser && !isTenantLoading)
                            .map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.path)}
                                        className={`flex items-center gap-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                                        ${isActive(item.path)
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4"/>
                                        {item.name}
                                    </button>
                                );
                            })}
                    </nav>
                </div>
                <div className="flex items-center relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="h-9 w-9 p-0 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                        <User className="h-5 w-5"/>
                    </button>
                    {isDropdownOpen && (
                        <div
                            className="absolute right-0 top-full mt-1 w-36 py-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <LogOut className="h-4 w-4"/>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* Mobile Navigation */}
            <nav className="md:hidden flex items-center gap-x-2 px-4 pb-4">
                {navigationItems
                    .filter((item) => item.isAvailable && currentUser && !isTenantLoading)
                    .map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors flex-1
                                ${isActive(item.path)
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                <Icon className="h-4 w-4"/>
                                {item.name}
                            </button>
                        );
                    })}
            </nav>
        </header>
    );
}

export default Header;
