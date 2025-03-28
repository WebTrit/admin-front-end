import {Bell, User} from 'lucide-react';
import Button from './ui/Button';
import {useAppStore} from "@/lib/store.ts";

function Header() {
    const {clearAuth} = useAppStore()

    const handleLogout = () => {
        clearAuth()
    };

    return (
        <header className="bg-white shadow-sm">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-x-3">
                    <h1 className="text-2xl font-semibold text-gray-900">Tenant Portal</h1>
                </div>
                <div className="flex items-center gap-x-4">
                    <Button variant="ghost" size="sm">
                        <Bell className="h-5 w-5"/>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <User className="h-5 w-5"/>
                    </Button>
                </div>
            </div>
        </header>
    );
}

export default Header;