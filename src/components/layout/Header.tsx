import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../providers/ThemeProvider";
import { LogOut, Moon, Sun, Bell, Menu, ChevronDown, User, Building2 } from "lucide-react";
import { tenantApi, type Tenant } from "../../services/tenantService";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
    onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { user, logout } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch tenant info
    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const data = await tenantApi.getTenant();
                setTenant(data);
            } catch (error) {
                console.error("Failed to fetch tenant:", error);
            }
        };
        fetchTenant();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-white/95 dark:bg-slate-900/95 md:bg-white/80 md:dark:bg-slate-900/80 md:backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
            {/* Left Section */}
            <div className="flex items-center gap-3">
                {/* Hamburger Menu - Mobile only */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="hidden sm:block">
                    <h1 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white">
                        Welcome, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.name || "User"}</span>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 hidden md:block">
                        Here's what's happening today
                    </p>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2">
                {/* Notifications */}
                <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Divider - Hidden on mobile */}
                <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg shadow-cyan-500/20">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform hidden sm:block ${showDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 animate-fade-in z-50">
                            {/* User Info */}
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                        {user?.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                                            {user?.role}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tenant Info */}
                            {tenant && (
                                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Building2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">{tenant.businessName}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 ml-6">
                                        {tenant.status === "ACTIVE" ? (
                                            <span className="text-green-500">● Active</span>
                                        ) : (
                                            <span className="text-orange-500">● {tenant.status}</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Menu Items */}
                            <div className="py-1">
                                <button
                                    onClick={() => { navigate("/settings"); setShowDropdown(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <User className="w-4 h-4" />
                                    Account Settings
                                </button>
                            </div>

                            {/* Logout */}
                            <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
