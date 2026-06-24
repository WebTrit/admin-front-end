import {SignupForm} from "@/components/signup/SignupForm.tsx";
import {useNavigate, useSearchParams} from "react-router-dom";
import {ROUTES} from "@/routes/paths";
import {config} from "@/config/runtime";
import {useEffect} from "react";

const Signup = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    useEffect(() => {
        const developerParam = searchParams.get('developer')
        if (developerParam === 'true' || developerParam === '1') {
            sessionStorage.setItem('pendingDeveloperAccess', 'true')
        }
    }, [searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-0 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-6">
                <div className="hidden lg:block">
                    <div className="flex justify-center">
                        <img src={config.LOGO_URL} alt="Logo" className="h-10 w-12"/>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
                </div>
                <div>
                    <div>If you already have an account click here to {' '}
                        <span
                            onClick={() => navigate(ROUTES.LOGIN, {replace: true})}
                            className="text-primary-500 underline cursor-pointer"
                        >
                            login
                        </span>
                    </div>
                </div>
                <SignupForm/>
            </div>
        </div>
    )
}
export default Signup
