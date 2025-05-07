import {Home, LogOut, Settings, User} from 'lucide-react';
import {useAppStore} from "@/lib/store.ts";
import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from 'react';

function Header() {
    const {
        clearAuth,
        isSuperTenant,
        isAdmin,
        currentTenant,
        isTenantLoading,
        tenantId,
        fetchTenant
    } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigationItems = [
        {
            name: 'Home',
            path: '/dashboard',
            icon: Home,
            isAvailable: !isAdmin,
        },
        {
            name: 'Configuration',
            path: configurationPath(),
            icon: Settings,
            isAvailable: !currentTenant?.basic_demo,
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
        if (!currentTenant && tenantId) {
            fetchTenant();
        }

    }, [tenantId]);


    function configurationPath() {
        if (isAdmin) {
            return '/subtenants'
        }

        return isSuperTenant ? '/subtenants' : `/subtenants/${tenantId}`
    }

    const isActive = (path: string) => {
        return location.pathname.includes(path);
    };

    const handleLogout = () => {
        clearAuth();
        setIsDropdownOpen(false);
        navigate('/');
    };

    function menuItemsFilter(item: any) {
        if (isAdmin && item.name !== 'Home') {
            return true;
        }
        return item.isAvailable && currentTenant && !isTenantLoading;
    }

    // todo replace any with the actual type
    return (
        <header className="bg-white shadow-sm fixed w-full z-40">
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
                            .filter(menuItemsFilter)
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


                <div className="flex items-center gap-x-4">
                    {!isAdmin && currentTenant?.basic_demo && (
                        <div className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                            Demo Mode
                        </div>
                    )}
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
            </div>
            {/* Mobile Navigation */}
            <nav className="md:hidden flex items-center gap-x-2 px-4 pb-4">
                {navigationItems
                    .filter(menuItemsFilter)
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
