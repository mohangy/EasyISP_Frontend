import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    Server,
    Search,
    Wifi,
    WifiOff,
    HelpCircle,
    Monitor,
    MoreVertical,
    Loader2,
    ChevronDown,
    AlertTriangle
} from "lucide-react";

import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../lib/permissions";
import { PermissionGate } from "../../components/auth/PermissionGate";
import { ProtectedButton } from "../../components/auth/ProtectedButton";
import { nasApi, type NASRouter } from "../../services/nasService";
import { LinkRouterWizard } from "./LinkRouterWizard";
import { EditRouterModal } from "./EditRouterModal";
import toast from "react-hot-toast";

// Router status types
type RouterStatus = "ONLINE" | "OFFLINE" | "PENDING" | "ERROR";
type ProvisioningStatus = "Command Pending" | "Provisioned" | "Failed" | "Pending";

interface MikroTikRouter {
    id: string;
    boardName: string;
    provisioning: ProvisioningStatus;
    cpu: number | null;
    memory: number | null; // in MB
    status: RouterStatus;
    remoteWinbox: string | null;
    ipAddress?: string;
    createdAt: string;
}

// Tab type
type TabType = "all" | "online" | "offline";

// Convert API router to display format
const mapRouterToDisplay = (router: NASRouter): MikroTikRouter => ({
    id: router.id,
    boardName: router.boardName || router.name,
    provisioning: router.provisioningStatus as ProvisioningStatus,
    cpu: router.cpuLoad ?? null,
    memory: router.memoryUsage ?? null,
    status: router.status as RouterStatus,
    remoteWinbox: router.remoteWinboxEnabled && router.remoteWinboxPort
        ? `${router.remoteWinboxPort}`
        : null,
    ipAddress: router.ipAddress,
    createdAt: router.createdAt
});

export function MikroTikRouters() {
    const [routers, setRouters] = useState<MikroTikRouter[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingRouter, setEditingRouter] = useState<{ id: string; boardName: string; ipAddress?: string } | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [routerToDelete, setRouterToDelete] = useState<{ id: string; name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    const navigate = useNavigate();
    const { can } = usePermissions();

    // Fetch routers from API
    const fetchRouters = async () => {
        try {
            setLoading(true);
            const response = await nasApi.getRouters({
                page,
                pageSize,
                status: activeTab === "all" ? undefined : activeTab.toUpperCase(),
                search: searchQuery || undefined
            });

            const mapped = response.routers.map(mapRouterToDisplay);
            setRouters(mapped);
        } catch (error) {
            console.error("Failed to fetch routers:", error);
            // Demo data fallback
            const demoRouters: MikroTikRouter[] = [
                {
                    id: "1",
                    boardName: "MikroTik1",
                    provisioning: "Command Pending",
                    cpu: null,
                    memory: 0,
                    status: "OFFLINE",
                    remoteWinbox: null,
                    ipAddress: "192.168.1.1",
                    createdAt: new Date().toISOString()
                },
                {
                    id: "2",
                    boardName: "test",
                    provisioning: "Command Pending",
                    cpu: null,
                    memory: 0,
                    status: "OFFLINE",
                    remoteWinbox: null,
                    ipAddress: "192.168.1.2",
                    createdAt: new Date().toISOString()
                }
            ];
            setRouters(demoRouters);
        } finally {
            setLoading(false);
        }
    };

    // Test connection to a router
    const handleTestConnection = async (routerId: string, routerName: string) => {
        setOpenMenuId(null);
        toast.loading(`Testing connection to ${routerName}...`, { id: `test-${routerId}` });
        try {
            const result = await nasApi.testConnection(routerId);
            if (result.success) {
                toast.success(`${routerName}: Connected (${result.latency}ms)`, { id: `test-${routerId}` });
            } else {
                toast.error(`${routerName}: ${result.message}`, { id: `test-${routerId}` });
            }
        } catch {
            toast.error(`Failed to test connection to ${routerName}`, { id: `test-${routerId}` });
        }
    };

    // Generate config script for a router
    const handleGenerateConfig = async (routerId: string, routerName: string) => {
        setOpenMenuId(null);
        toast.loading(`Generating config for ${routerName}...`, { id: `config-${routerId}` });
        try {
            const result = await nasApi.getConfigScript(routerId);
            // Create download link
            const blob = new Blob([result.script], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${routerName.replace(/\s+/g, "_")}_config.rsc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Config downloaded for ${routerName}`, { id: `config-${routerId}` });
        } catch {
            toast.error(`Failed to generate config for ${routerName}`, { id: `config-${routerId}` });
        }
    };

    // Delete a router
    const handleDeleteRouter = (routerId: string, routerName: string) => {
        setOpenMenuId(null);
        setRouterToDelete({ id: routerId, name: routerName });
        setShowDeleteModal(true);
    };

    const confirmDeleteRouter = async () => {
        if (!routerToDelete) return;
        setDeleting(true);
        toast.loading(`Deleting ${routerToDelete.name}...`, { id: `delete-${routerToDelete.id}` });
        try {
            await nasApi.deleteRouter(routerToDelete.id);
            toast.success(`${routerToDelete.name} deleted successfully`, { id: `delete-${routerToDelete.id}` });
            fetchRouters();
            setShowDeleteModal(false);
            setRouterToDelete(null);
        } catch {
            toast.error(`Failed to delete ${routerToDelete.name}`, { id: `delete-${routerToDelete.id}` });
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        fetchRouters();
    }, [page, pageSize, activeTab]);

    // Filter routers based on tab and search
    const filteredRouters = routers.filter(router => {
        // Tab filter
        if (activeTab === "online" && router.status !== "ONLINE") return false;
        if (activeTab === "offline" && router.status === "ONLINE") return false;

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                router.boardName.toLowerCase().includes(query) ||
                router.ipAddress?.toLowerCase().includes(query)
            );
        }
        return true;
    });

    // Count by status
    const allCount = routers.length;
    const onlineCount = routers.filter(r => r.status === "ONLINE").length;
    const offlineCount = routers.filter(r => r.status !== "ONLINE").length;

    // Get status badge color
    const getStatusBadge = (status: RouterStatus) => {
        switch (status) {
            case "ONLINE":
                return "bg-emerald-900/50 text-emerald-400 border border-emerald-700/50";
            case "OFFLINE":
                return "bg-red-900/50 text-red-400 border border-red-700/50";
            default:
                return "bg-slate-700/50 text-slate-400 border border-slate-600/50";
        }
    };

    // Get provisioning badge color
    const getProvisioningBadge = (status: ProvisioningStatus) => {
        switch (status) {
            case "Provisioned":
                return "bg-emerald-900/50 text-emerald-400 border border-emerald-700/50";
            case "Command Pending":
                return "bg-orange-900/50 text-orange-400 border border-orange-700/50";
            case "Failed":
                return "bg-red-900/50 text-red-400 border border-red-700/50";
            default:
                return "bg-slate-700/50 text-slate-400 border border-slate-600/50";
        }
    };

    // Format memory
    const formatMemory = (mb: number | null) => {
        if (mb === null || mb === undefined) return "0.00 MB";
        return `${mb.toFixed(2)} MB`;
    };

    // Pagination info
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, filteredRouters.length);
    const totalItems = filteredRouters.length;

    return (
        <PermissionGate permission={PERMISSIONS.ROUTERS_VIEW}>
            <div className="space-y-6 animate-fade-in">
                {/* Page Header */}
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:justify-between sm:text-left gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                            MikroTik Routers
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Manage your MikroTik routers on this page
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-800 transition-all"
                        >
                            <HelpCircle className="w-5 h-5" />
                            <span>Tutorial</span>
                        </button>
                        <ProtectedButton
                            permission={PERMISSIONS.ROUTERS_CREATE}
                            onClick={() => setShowLinkModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-lg font-medium shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:shadow-cyan-600/30 transition-all hover:bg-cyan-700"
                        >
                            <Server className="w-5 h-5" />
                            <span>Add Router</span>
                        </ProtectedButton>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 border-b border-slate-700/50">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "all"
                            ? "border-orange-500 text-white"
                            : "border-transparent text-slate-400 hover:text-white"
                            }`}
                    >
                        <Server className="w-4 h-4" />
                        All
                        <span className={`px-2 py-0.5 rounded text-xs ${activeTab === "all"
                            ? "bg-orange-600/20 text-orange-400"
                            : "bg-slate-700/50 text-slate-400"
                            }`}>
                            {allCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("online")}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "online"
                            ? "border-emerald-500 text-white"
                            : "border-transparent text-slate-400 hover:text-white"
                            }`}
                    >
                        <Wifi className="w-4 h-4" />
                        Online
                        <span className={`px-2 py-0.5 rounded text-xs ${activeTab === "online"
                            ? "bg-emerald-600/20 text-emerald-400"
                            : "bg-slate-700/50 text-slate-400"
                            }`}>
                            {onlineCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("offline")}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "offline"
                            ? "border-red-500 text-white"
                            : "border-transparent text-slate-400 hover:text-white"
                            }`}
                    >
                        <WifiOff className="w-4 h-4" />
                        Offline
                        <span className={`px-2 py-0.5 rounded text-xs ${activeTab === "offline"
                            ? "bg-red-600/20 text-red-400"
                            : "bg-slate-700/50 text-slate-400"
                            }`}>
                            {offlineCount}
                        </span>
                    </button>
                </div>

                {/* Table Container */}
                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
                    {/* Search Bar */}
                    <div className="flex justify-end p-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Board Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Provisioning
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        CPU
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Memory
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Remote Winbox
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">

                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
                                            <p className="mt-2 text-slate-400 text-sm">Loading routers...</p>
                                        </td>
                                    </tr>
                                ) : filteredRouters.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <Server className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                                            <p className="text-slate-400">
                                                {searchQuery
                                                    ? "No routers found matching your search"
                                                    : "No routers found. Link your first MikroTik router."
                                                }
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRouters.map((router) => (
                                        <tr
                                            key={router.id}
                                            className="hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => navigate(`/nas/${router.id}`)}
                                                    className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-colors"
                                                >
                                                    {router.boardName}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${getProvisioningBadge(router.provisioning)}`}>
                                                    {router.provisioning}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-cyan-900/50 text-cyan-400 border border-cyan-700/50">
                                                    {router.cpu !== null ? `${router.cpu}%` : "%"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                                                    {formatMemory(router.memory)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${getStatusBadge(router.status)}`}>
                                                    {router.status === "ONLINE" ? "Online" : "Offline"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Monitor className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {router.remoteWinbox || "-"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === router.id ? null : router.id)}
                                                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    {openMenuId === router.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                                                            {can(PERMISSIONS.ROUTERS_EDIT) && (
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenMenuId(null);
                                                                        setEditingRouter({
                                                                            id: router.id,
                                                                            boardName: router.boardName,
                                                                            ipAddress: router.ipAddress
                                                                        });
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                                                                >
                                                                    Edit Router
                                                                </button>
                                                            )}
                                                            {can(PERMISSIONS.ROUTERS_TEST) && (
                                                                <button
                                                                    onClick={() => handleTestConnection(router.id, router.boardName)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                                                                >
                                                                    Test Connection
                                                                </button>
                                                            )}
                                                            {can(PERMISSIONS.ROUTERS_CONFIG) && (
                                                                <button
                                                                    onClick={() => handleGenerateConfig(router.id, router.boardName)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                                                                >
                                                                    Generate Config
                                                                </button>
                                                            )}
                                                            {can(PERMISSIONS.ROUTERS_DELETE) && (
                                                                <button
                                                                    onClick={() => handleDeleteRouter(router.id, router.boardName)}
                                                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/30 transition-colors"
                                                                >
                                                                    Delete Router
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/50">
                        <div className="text-sm text-slate-400">
                            Showing {startItem} to {endItem} of {totalItems} results
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">Per page</span>
                            <div className="relative">
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 pr-8 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Close dropdown when clicking outside */}
                {openMenuId && (
                    <div
                        className="fixed inset-0 z-0"
                        onClick={() => setOpenMenuId(null)}
                    />
                )}

                {/* Link Router Wizard */}
                <LinkRouterWizard
                    isOpen={showLinkModal}
                    onClose={() => setShowLinkModal(false)}
                    onSuccess={() => {
                        fetchRouters();
                        toast.success("Router linked successfully!");
                    }}
                />

                {/* Edit Router Modal */}
                <EditRouterModal
                    isOpen={!!editingRouter}
                    router={editingRouter}
                    onClose={() => setEditingRouter(null)}
                    onSuccess={() => {
                        fetchRouters();
                    }}
                />
            </div>
            {showDeleteModal && routerToDelete && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 text-red-600 dark:text-red-500 mb-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Router?</h3>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">{routerToDelete.name}</span>?
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteRouter}
                                disabled={deleting}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                Delete Router
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </PermissionGate>
    );
}
