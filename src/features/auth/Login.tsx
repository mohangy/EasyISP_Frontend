import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Wifi, Eye, EyeOff, Shield, UserCheck, Headphones, Wrench } from "lucide-react";
import type { User } from "../../types";

// Mock users for testing different roles
const MOCK_USERS: { user: User; icon: React.ReactNode; color: string }[] = [
    {
        user: {
            id: "super-admin-1",
            email: "superadmin@easyisp.com",
            name: "Super Admin",
            role: "SUPER_ADMIN",
            tenantId: "tenant-1",
            addedPermissions: [],
            removedPermissions: [],
        },
        icon: <Shield className="w-4 h-4" />,
        color: "from-purple-600 to-pink-600",
    },
    {
        user: {
            id: "admin-1",
            email: "admin@easyisp.com",
            name: "Admin User",
            role: "ADMIN",
            tenantId: "tenant-1",
            addedPermissions: [],
            removedPermissions: [],
        },
        icon: <UserCheck className="w-4 h-4" />,
        color: "from-blue-600 to-cyan-600",
    },
    {
        user: {
            id: "care-1",
            email: "care@easyisp.com",
            name: "Customer Care",
            role: "CUSTOMER_CARE",
            tenantId: "tenant-1",
            addedPermissions: [],
            removedPermissions: [],
        },
        icon: <Headphones className="w-4 h-4" />,
        color: "from-green-600 to-emerald-600",
    },
    {
        user: {
            id: "tech-1",
            email: "tech@easyisp.com",
            name: "Field Technician",
            role: "FIELD_TECH",
            tenantId: "tenant-1",
            addedPermissions: [],
            removedPermissions: [],
        },
        icon: <Wrench className="w-4 h-4" />,
        color: "from-orange-600 to-amber-600",
    },
];

export function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            if (email && password) {
                login(
                    {
                        id: "1",
                        email,
                        name: "Test User",
                        role: "ADMIN",
                        tenantId: "tenant-1",
                        addedPermissions: [],
                        removedPermissions: [],
                    },
                    "mock-token"
                );
                navigate("/dashboard");
            }
            setIsLoading(false);
        }, 1000);
    };

    const handleQuickLogin = (mockUser: typeof MOCK_USERS[0]) => {
        login(mockUser.user, "mock-token");
        navigate("/dashboard");
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <Wifi className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-3xl font-bold text-white">EasyISP</span>
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
                        Manage your ISP with
                        <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            simplicity & power
                        </span>
                    </h1>

                    <p className="text-lg text-slate-400 max-w-md">
                        Streamline your internet service provider operations with our comprehensive management platform.
                        Handle customers, routers, and billing all in one place.
                    </p>

                    <div className="mt-12 flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">10K+</p>
                            <p className="text-sm text-slate-400">Customers Managed</p>
                        </div>
                        <div className="w-px h-12 bg-slate-700"></div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">500+</p>
                            <p className="text-sm text-slate-400">Active Routers</p>
                        </div>
                        <div className="w-px h-12 bg-slate-700"></div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">99.9%</p>
                            <p className="text-sm text-slate-400">Uptime</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Wifi className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            EasyISP
                        </span>
                    </div>

                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700/50">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Welcome back
                            </h2>
                            <p className="mt-2 text-slate-500 dark:text-slate-400">
                                Sign in to access your dashboard
                            </p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <Input
                                id="email"
                                label="Email address"
                                type="email"
                                required
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <div className="relative">
                                <Input
                                    id="password"
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-slate-600 dark:text-slate-300">Remember me</span>
                                </label>
                                <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                                    Forgot password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                                isLoading={isLoading}
                            >
                                Sign in
                            </Button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            Don't have an account?{" "}
                            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                                Create one now
                            </Link>
                        </p>

                        {/* Quick Login for Testing */}
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-center text-slate-400 dark:text-slate-500 uppercase font-semibold mb-4">
                                Quick Login (Testing)
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {MOCK_USERS.map((mock) => (
                                    <button
                                        key={mock.user.id}
                                        type="button"
                                        onClick={() => handleQuickLogin(mock)}
                                        className={`flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r ${mock.color} text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity shadow-md`}
                                    >
                                        {mock.icon}
                                        {mock.user.role.replace("_", " ")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
