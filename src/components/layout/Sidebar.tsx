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
    X,           // Used
    ChevronDown, // Used
    ChevronLeft, // Used
    Wallet,
    Smartphone,
    Banknote,
    MessageSquare,
    Shield,      // Used (Super Admin)
    // Finance icons
    Ticket, // Tickets/Vouchers
    HardDrive, // Equipment
    UserCog,
} from "lucide-react";
import { tenantApi, type Tenant } from "../../services/tenantService";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS, type Permission } from "../../lib/permissions";
import { useAuthStore } from "../../store/authStore";
import { dashboardApi } from "../../services/dashboardService";
import { packageService } from "../../services/packageService";
import { nasApi } from "../../services/nasService"; // Corrected import path

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface NavItem {
    name: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: Permission;
    badge?: number | string;
    badgeColor?: string; // e.g. "bg-amber-100 text-amber-600"
    children?: NavItem[];
}

interface NavSection {
    title?: string;
    items: NavItem[];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();
    const { can } = usePermissions();
    const [collapsed, setCollapsed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Stats State
    const [stats, setStats] = useState({
        activeUsers: 0,
        totalUsers: 0,
        pppoeUsers: 0,
        hotspotUsers: 0,
        packages: 0,
        routers: 0,
        vouchers: 0,
        tickets: 0, // Placeholder
        leads: 0,   // Placeholder
        campaigns: 0, // Placeholder
    });

    // Fetch tenant and stats on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Tenant
                const tenantData = await tenantApi.getTenant().catch(() => null);
                if (tenantData) setTenant(tenantData);

                // Dashboard Stats
                const dashStats = await dashboardApi.getStats().catch(() => null);

                // Packages count
                const pkgs = await packageService.getPackages().catch(() => []);

                // Routers count
                const routersResponse = await nasApi.getRouters().catch(() => null);
                const routerCount = routersResponse ? routersResponse.total : 0;

                setStats({
                    activeUsers: dashStats?.activeSessions || 0,
                    totalUsers: dashStats?.totalCustomers || 0,
                    pppoeUsers: dashStats?.pppoeCustomers || 0,
                    hotspotUsers: dashStats?.hotspotCustomers || 0,
                    vouchers: (dashStats?.activeVouchers || 0) + (dashStats?.usedVouchers || 0),
                    packages: pkgs.length,
                    routers: routerCount,
                    tickets: 0,
                    leads: 0,
                    campaigns: 0
                });

            } catch (error) {
                console.error("Failed to load sidebar data:", error);
            }
        };
        loadData();
    }, []);

    const toggleExpand = (name: string) => {
        setExpandedItems(prev =>
            prev.includes(name)
                ? prev.filter(item => item !== name)
                : [...prev, name]
        );
    };

    const isChildActive = (children: NavItem[]) => {
        return children.some(child => child.href && location.pathname.startsWith(child.href));
    };

    // Filter Navigation Logic
    // We define sections inside render or useMemo to access 'can'
    const rawSections: NavSection[] = [
        {
            items: [
                { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW }
            ]
        },
        {
            title: "Users",
            items: [
                {
                    name: "Users",
                    href: "/customers/pppoe",
                    icon: Users,
                    permission: PERMISSIONS.PPPOE_VIEW, // Default to PPPoE permission
                    badge: stats.pppoeUsers,
                    badgeColor: "bg-amber-500/10 text-amber-500"
                },
                {
                    name: "Hotspot",
                    href: "/customers/hotspot",
                    icon: Ticket,
                    permission: PERMISSIONS.HOTSPOT_VIEW,
                    badge: stats.hotspotUsers,
                    badgeColor: "bg-amber-500/10 text-amber-500"
                },
                {
                    name: "Teams",
                    href: "/operators",
                    icon: UserCog,
                    permission: PERMISSIONS.OPERATORS_VIEW,
                },
                // Placeholders disabled or require future permissions
                {
                    name: "Tickets",
                    href: "#",
                    icon: Ticket,
                    badge: stats.tickets,
                    badgeColor: "bg-amber-500/10 text-amber-500"
                },
            ]
        },
        {
            title: "Finance",
            items: [
                {
                    name: "Packages",
                    href: "/packages",
                    icon: Package,
                    permission: PERMISSIONS.PACKAGES_VIEW,
                    badge: stats.packages,
                    badgeColor: "bg-amber-500/10 text-amber-500"
                },
                {
                    name: "Payments",
                    icon: Wallet,
                    // No permission on parent, children have permissions
                    children: [
                        { name: "Electronic", href: "/payments/electronic", icon: Smartphone, permission: PERMISSIONS.PAYMENTS_VIEW_ELECTRONIC },
                        { name: "Manual", href: "/payments/manual", icon: Banknote, permission: PERMISSIONS.PAYMENTS_VIEW_MANUAL },
                    ]
                },
            ]
        },
        {
            title: "Communication",
            items: [
                { name: "Messages", href: "/sms", icon: MessageSquare, permission: PERMISSIONS.SMS_VIEW },
            ]
        },
        {
            title: "Devices",
            items: [
                {
                    name: "MikroTik",
                    href: "/nas",
                    icon: Server,
                    permission: PERMISSIONS.ROUTERS_VIEW,
                    badge: stats.routers,
                    badgeColor: "bg-amber-500/10 text-amber-500"
                },
                { name: "Equipment", href: "#", icon: HardDrive, badge: 0, badgeColor: "bg-amber-500/10 text-amber-500" },
                { name: "Map", href: "/map", icon: MapPin, permission: PERMISSIONS.MAPS_VIEW },
            ]
        }
    ];

    // Filter Logic
    const sections = rawSections.map(section => {
        const visibleItems = section.items.filter(item => {
            if (item.permission && !can(item.permission)) return false;
            // Check children if any
            if (item.children) {
                const visibleChildren = item.children.filter(child => !child.permission || can(child.permission));
                // If item has children but all hidden, hide parent?
                // Or we might want to update the item's children property?
                // Modifying item in place is risky in map/filter chain? No, we need new object.
                return visibleChildren.length > 0;
            }
            return true;
        }).map(item => {
            if (item.children) {
                return { ...item, children: item.children.filter(c => !c.permission || can(c.permission)) };
            }
            return item;
        });

        return { ...section, items: visibleItems };
    }).filter(section => section.items.length > 0);

    // Display helpers
    const settingsItem: NavItem = { name: "Settings", href: "/settings", icon: Settings, permission: PERMISSIONS.SETTINGS_GENERAL };
    const superAdminItem: NavItem = { name: "Super Admin", href: "/super-admin", icon: Shield };
    const displayName = tenant?.businessName || "Rodnet Solutions";
    const sidebarExpanded = isOpen || !collapsed || hovered;

    return (
        <aside
            className={cn(
                "fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col",
                "bg-slate-900/95 backdrop-blur-xl backdrop-saturate-150",
                "border-r border-slate-700/50",
                "transition-all duration-300 ease-in-out",
                sidebarExpanded ? "w-72 lg:w-64" : "w-20",
                hovered && collapsed && "shadow-2xl shadow-black/50",
                isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
            onMouseEnter={() => collapsed && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Logo Section */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    {/* Logo removed */}
                    {sidebarExpanded && (
                        <span className="text-sm font-bold text-slate-100 truncate leading-tight whitespace-normal">
                            {displayName}
                        </span>
                    )}
                </div>
                {/* Collapse Toggles */}
                <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                    <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
                </button>
                <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation Sections */}
            <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        {section.title && sidebarExpanded && (
                            <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {section.title}
                            </p>
                        )}
                        {section.items.map(item => {
                            if (item.permission && !can(item.permission)) return null;

                            const hasChildren = item.children && item.children.length > 0;
                            const isExpanded = expandedItems.includes(item.name);
                            const isActive = hasChildren ? isChildActive(item.children!) : location.pathname === item.href;

                            return (
                                <div key={item.name}>
                                    {hasChildren ? (
                                        <div>
                                            <button
                                                onClick={() => toggleExpand(item.name)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group",
                                                    isActive ? "bg-blue-500/10 text-blue-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-5 h-5" />
                                                    {sidebarExpanded && <span className="font-medium">{item.name}</span>}
                                                </div>
                                                {sidebarExpanded && <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />}
                                            </button>
                                            {sidebarExpanded && isExpanded && (
                                                <div className="ml-4 mt-1 pl-3 border-l border-slate-700 space-y-1">
                                                    {item.children!.map(child => (
                                                        <NavLink
                                                            key={child.name}
                                                            to={child.href!}
                                                            onClick={onClose}
                                                            className={({ isActive }) => cn(
                                                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                                                isActive ? "text-blue-400 bg-blue-500/5" : "text-slate-400 hover:text-slate-200"
                                                            )}
                                                        >
                                                            <child.icon className="w-4 h-4" />
                                                            <span>{child.name}</span>
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <NavLink
                                            to={item.href!}
                                            onClick={onClose}
                                            className={({ isActive }) => cn(
                                                "flex items-center justify-between px-3 py-2 rounded-lg transition-colors group",
                                                isActive
                                                    ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-400 border border-blue-500/20"
                                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={cn("w-5 h-5", isActive && "text-blue-500")} />
                                                {sidebarExpanded && <span className="font-medium">{item.name}</span>}
                                            </div>
                                            {sidebarExpanded && item.badge !== undefined && (
                                                <span className={cn(
                                                    "px-2 py-0.5 text-xs font-medium rounded-full",
                                                    item.badgeColor || "bg-slate-800 text-slate-400"
                                                )}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Footer Items (Super Admin & Settings) */}
            <div className="px-3 py-4 border-t border-slate-800 shrink-0 space-y-1">
                {useAuthStore.getState().user?.email === import.meta.env.VITE_SAAS_OWNER_EMAIL && (
                    <NavLink
                        to={superAdminItem.href!}
                        onClick={onClose}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                            isActive ? "bg-amber-500/10 text-amber-500" : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <superAdminItem.icon className="w-5 h-5 group-hover:text-amber-500" />
                        {sidebarExpanded && <span>{superAdminItem.name}</span>}
                    </NavLink>
                )}

                <NavLink
                    to={settingsItem.href!}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                        isActive ? "bg-slate-800 text-slate-200" : "text-slate-400 hover:text-slate-200"
                    )}
                >
                    <settingsItem.icon className="w-5 h-5" />
                    {sidebarExpanded && <span>{settingsItem.name}</span>}
                </NavLink>
            </div>
        </aside>
    );
}
