import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import {
    LayoutDashboard,
    Users,
    MapPin,
    Settings,
    Package,
    Server,
    X,
    Wifi,
    ChevronDown,
    ChevronLeft,
    Radio,
    Flame,
    Wallet,
    Smartphone,
    Banknote,
    PieChart,
    MessageSquare,
    Shield,
    // Finance icons
    TrendingUp,
    Receipt,
    BarChart3
} from "lucide-react";
import { tenantApi, type Tenant } from "../../services/tenantService";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS, type Permission } from "../../lib/permissions";
import { useAuthStore } from "../../store/authStore";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: Permission;
    children?: { name: string; href: string; icon: React.ComponentType<{ className?: string }>; permission?: Permission }[];
}

// Navigation items with optional children for submenus
const navigation: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW },
    {
        name: "Customers",
        icon: Users,
        permission: PERMISSIONS.CUSTOMERS_VIEW,
        children: [
            { name: "PPPoE", href: "/customers/pppoe", icon: Radio },
            { name: "Hotspot", href: "/customers/hotspot", icon: Flame },
        ]
    },
    {
        name: "Payments",
        icon: Wallet,
        permission: PERMISSIONS.PAYMENTS_VIEW,
        children: [
            { name: "Electronic Payments", href: "/payments/electronic", icon: Smartphone },
            { name: "Manual Recharge", href: "/payments/manual", icon: Banknote },
        ]
    },
    {
        name: "Finance",
        icon: PieChart,
        permission: PERMISSIONS.FINANCE_VIEW,
        children: [
            { name: "Dashboard", href: "/finance", icon: TrendingUp, permission: PERMISSIONS.FINANCE_DASHBOARD },
            { name: "Income", href: "/finance/income", icon: TrendingUp, permission: PERMISSIONS.FINANCE_VIEW },
            { name: "Expenses", href: "/finance/expenses", icon: Receipt, permission: PERMISSIONS.FINANCE_EXPENSES },
            { name: "Reports", href: "/finance/reports", icon: BarChart3, permission: PERMISSIONS.FINANCE_REPORTS },
        ]
    },
    { name: "SMS", href: "/sms", icon: MessageSquare, permission: PERMISSIONS.SMS_VIEW },
    { name: "Map", href: "/map", icon: MapPin, permission: PERMISSIONS.DASHBOARD_VIEW },
    { name: "Packages", href: "/packages", icon: Package, permission: PERMISSIONS.PACKAGES_VIEW },
    { name: "Routers / NAS", href: "/nas", icon: Server, permission: PERMISSIONS.ROUTERS_VIEW },
    { name: "Team", href: "/operators", icon: Users, permission: PERMISSIONS.OPERATORS_VIEW },
];

// Settings section separate
const settingsNavigation: NavItem[] = [
    { name: "Settings", href: "/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_GENERAL },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const { can } = usePermissions();
    const [expandedItems, setExpandedItems] = useState<string[]>(["Customers"]); // Default expanded
    const [collapsed, setCollapsed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    // Filter navigation based on permissions
    const visibleNavigation = navigation.filter(item => !item.permission || can(item.permission));
    const visibleSettings = settingsNavigation.filter(item => !item.permission || can(item.permission));

    // Fetch tenant info on mount
    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const data = await tenantApi.getTenant();
                setTenant(data);
            } catch (error) {
                // Use fallback - will show EasyISP
                console.error("Failed to fetch tenant:", error);
            }
        };
        fetchTenant();
    }, []);

    const toggleExpand = (name: string) => {
        setExpandedItems(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    const isChildActive = (children: { href: string }[]) => {
        return children.some(child => location.pathname.startsWith(child.href));
    };

    // Display name - tenant's business name or fallback to EasyISP
    const displayName = tenant?.businessName || "EasyISP";
    const displayLogo = tenant?.logo;

    // Show expanded state: on mobile when open (isOpen), OR on desktop when not collapsed OR hovered
    const sidebarExpanded = isOpen || !collapsed || hovered;

    return (
        <aside
            className={cn(
                "fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col",
                "bg-slate-900/70 backdrop-blur-xl backdrop-saturate-150",
                "border-r border-slate-700/50",
                "transition-all duration-300 ease-in-out",
                sidebarExpanded ? "w-72 lg:w-64" : "w-20",
                // Add shadow when expanded via hover
                hovered && collapsed && "shadow-2xl shadow-black/50",
                // Mobile: slide in/out
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
            onMouseEnter={() => collapsed && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Logo/Branding Section */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
                <div className="flex items-center gap-3 min-w-0">
                    {displayLogo ? (
                        <img
                            src={displayLogo}
                            alt={displayName}
                            className="w-10 h-10 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
                            <Wifi className="w-5 h-5 text-white" />
                        </div>
                    )}
                    {sidebarExpanded && (
                        <span className="text-lg font-bold text-cyan-400 truncate">
                            {displayName.toUpperCase()}
                        </span>
                    )}
                </div>
                {/* Collapse button - desktop only */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
                </button>
                {/* Close button - mobile only */}
                <button
                    onClick={onClose}
                    className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {visibleNavigation.map((item, index) => {
                    const hasChildren = 'children' in item && item.children;
                    const isExpanded = expandedItems.includes(item.name);
                    const isActive = hasChildren
                        ? isChildActive(item.children!)
                        : location.pathname === item.href;

                    if (hasChildren) {
                        return (
                            <div key={item.name} style={{ animationDelay: `${index * 50} ms` }} className="animate-fade-in">
                                {/* Parent item with toggle */}
                                <button
                                    onClick={() => toggleExpand(item.name)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl",
                                        "transition-all duration-200 group",
                                        isActive
                                            ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={cn(
                                            "w-5 h-5 transition-colors",
                                            isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"
                                        )} />
                                        {sidebarExpanded && <span className="font-medium">{item.name}</span>}
                                    </div>
                                    {sidebarExpanded && (
                                        <ChevronDown className={cn(
                                            "w-4 h-4 transition-transform duration-200",
                                            isExpanded && "rotate-180"
                                        )} />
                                    )}
                                </button>

                                {/* Children items */}
                                {isExpanded && sidebarExpanded && (
                                    <div className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-3">
                                        {item.children!.map((child) => (
                                            <NavLink
                                                key={child.href}
                                                to={child.href}
                                                onClick={onClose}
                                                className={({ isActive }) =>
                                                    cn(
                                                        "flex items-center gap-3 px-3 py-2 rounded-lg",
                                                        "transition-all duration-200 text-sm",
                                                        isActive
                                                            ? "bg-blue-600/20 text-blue-400"
                                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                                    )
                                                }
                                            >
                                                <child.icon className="w-4 h-4" />
                                                <span>{child.name}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    // Regular navigation item (no children)
                    return (
                        <NavLink
                            key={item.name}
                            to={item.href!}
                            onClick={onClose}
                            style={{ animationDelay: `${index * 50} ms` }}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl animate-fade-in",
                                    "transition-all duration-200 group",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg shadow-blue-500/5"
                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn(
                                        "w-5 h-5 transition-colors",
                                        isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"
                                    )} />
                                    {sidebarExpanded && <span className="font-medium">{item.name}</span>}
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Super Admin Section - Only visible to SaaS owner */}
            {useAuthStore.getState().user?.email === import.meta.env.VITE_SAAS_OWNER_EMAIL && (
                <div className="px-3 py-4 border-t border-slate-800">
                    {sidebarExpanded && (
                        <p className="px-3 mb-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">
                            Super Admin
                        </p>
                    )}
                    <NavLink
                        to="/super-admin"
                        onClick={onClose}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                                "transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <Shield className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-amber-400" : "text-slate-500 group-hover:text-amber-400"
                                )} />
                                {sidebarExpanded && <span className="font-medium">Tenant Management</span>}
                            </>
                        )}
                    </NavLink>
                </div>
            )}

            {/* Settings Section */}
            <div className="px-3 py-4 border-t border-slate-800">
                {sidebarExpanded && (
                    <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Settings
                    </p>
                )}
                {visibleSettings.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href || "/"}
                        onClick={onClose}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                                "transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive ? "text-blue-400" : "text-slate-500 group-hover:text-blue-400"
                                )} />
                                {sidebarExpanded && <span className="font-medium">{item.name}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </aside>
    );
}
