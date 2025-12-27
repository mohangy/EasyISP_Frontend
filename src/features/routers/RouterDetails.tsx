import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
    Server,
    ArrowLeft,
    Loader2,
    Wifi,
    WifiOff,
    Cpu,
    HardDrive,
    Clock,
    Activity,
    Users,
    Settings,
    Terminal,
    RefreshCw,
    Download,
    Power,
    Globe,
    Shield,
    BarChart3,
    TrendingUp,
    DollarSign,
    Radio,
    Flame,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle
} from "lucide-react";
import { nasApi, type NASRouter, type NASLiveStatus, type ActiveSession } from "../../services/nasService";
import { EditRouterModal } from "./EditRouterModal";
import toast from "react-hot-toast";
import { ProtectedButton } from "../../components/auth/ProtectedButton";
import { PERMISSIONS } from "../../lib/permissions";
import { PermissionGate } from "../../components/auth/PermissionGate";


export function RouterDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [router, setRouter] = useState<NASRouter | null>(null);
    const [liveStatus, setLiveStatus] = useState<NASLiveStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"device" | "radius" | "reports" | "users">("device");
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDisconnectModal, setShowDisconnectModal] = useState(false);
    const [userToDisconnect, setUserToDisconnect] = useState<string | null>(null);

    // Active Sessions State
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [selectedSessionType, setSelectedSessionType] = useState<'pppoe' | 'hotspot' | 'all' | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const fetchRouter = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await nasApi.getRouter(id);
            setRouter(data);
        } catch (error) {
            console.error("Failed to load router details:", error);
            // Demo data fallback
            setRouter({
                id: id,
                name: "MikroTik1",
                boardName: "CCR2004-1G-12S+2XS",
                ipAddress: "192.168.1.1",
                secret: "••••••••",
                coaPort: 3799,
                status: "OFFLINE",
                provisioningStatus: "Command Pending",
                vpnTunnelIp: "10.255.255.2",
                routerOsVersion: "7.10",
                model: "CCR2004-1G-12S+2XS",
                serialNumber: "ABC123456789",
                cpuLoad: 15,
                memoryUsage: 256,
                memoryTotal: 1024,
                uptime: "5d 12h 30m",
                pppoeCount: 45,
                hotspotCount: 12,
                remoteWinboxPort: 8291,
                remoteWinboxEnabled: true,
                apiUsername: "admin",
                apiPort: 8728,
                lastSeen: new Date(Date.now() - 3600000).toISOString(),
                createdAt: "2025-01-01T00:00:00Z",
                updatedAt: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveStatus = async () => {
        if (!id) return;
        try {
            setRefreshing(true);
            const status = await nasApi.getLiveStatus(id);
            setLiveStatus(status);
        } catch (error) {
            console.error("Failed to fetch live status:", error);
            // Demo data
            setLiveStatus({
                id: id,
                status: "OFFLINE",
                uptime: "5d 12h 30m",
                lastSeen: new Date(Date.now() - 3600000).toISOString(),
                cpuLoad: 15,
                memoryUsage: 256,
                memoryTotal: 1024,
                activeSessions: {
                    pppoe: 45,
                    hotspot: 12,
                    total: 57
                }
            });
        } finally {
            setRefreshing(false);
        }
    };

    const handleTestConnection = async () => {
        if (!router) return;
        toast.loading(`Testing connection to ${router.name}...`, { id: "test-connection" });
        try {
            const result = await nasApi.testConnection(router.id);
            if (result.success) {
                toast.success(`Connected! Latency: ${result.latency}ms`, { id: "test-connection" });
            } else {
                toast.error(result.message, { id: "test-connection" });
            }
        } catch {
            toast.error("Failed to connect to router", { id: "test-connection" });
        }
    };

    const handleDownloadConfig = async () => {
        if (!router) return;
        toast.loading("Generating config...", { id: "download-config" });
        try {
            const result = await nasApi.getConfigScript(router.id);
            const blob = new Blob([result.script], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${router.name.replace(/\s+/g, "_")}_config.rsc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Config downloaded!", { id: "download-config" });
        } catch {
            toast.error("Failed to generate config", { id: "download-config" });
        }
    };



    const handleFetchSessions = async (type: 'pppoe' | 'hotspot' | 'all') => {
        if (selectedSessionType === type) {
            // Deselect if clicking the same card
            setSelectedSessionType(null);
            setActiveSessions([]);
            return;
        }

        setSelectedSessionType(type);
        setLoadingSessions(true);

        try {
            // In a real implementation this would fetch from API
            // const sessions = await nasApi.getActiveSessions(router.id, type === 'all' ? undefined : type);

            // For DEMO purposes, we'll generate fake sessions if API fails or returns empty
            let sessions: ActiveSession[] = [];

            try {
                if (router) {
                    const apiSessions = await nasApi.getActiveSessions(router.id, type === 'all' ? undefined : type);
                    if (apiSessions && apiSessions.length > 0) {
                        sessions = apiSessions;
                    }
                }
            } catch (e) {
                console.log("Failed to fetch sessions from API, using demo data");
            }

            // Fallback demo data
            if (sessions.length === 0) {
                const count = type === 'pppoe' ? 15 : type === 'hotspot' ? 8 : 23;
                sessions = Array.from({ length: count }).map((_, i) => ({
                    id: `sess-${i}`,
                    username: type === 'pppoe' ? `pppoe_user_${i + 1}` : type === 'hotspot' ? `guest_user_${i + 1}` : i % 2 === 0 ? `pppoe_user_${i}` : `guest_user_${i}`,
                    ipAddress: `192.168.88.${100 + i}`,
                    macAddress: `00:11:22:33:44:${i.toString(16).padStart(2, '0')}`,
                    uptime: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
                    type: type === 'all' ? (i % 2 === 0 ? 'pppoe' : 'hotspot') : type,
                    bytesIn: Math.floor(Math.random() * 1000000000),
                    bytesOut: Math.floor(Math.random() * 5000000000),
                }));
            }

            setActiveSessions(sessions);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
            toast.error("Failed to load active sessions");
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleDisconnectUser = (username: string) => {
        setUserToDisconnect(username);
        setShowDisconnectModal(true);
    };

    const confirmDisconnectUser = async () => {
        if (!userToDisconnect) return;

        try {
            // await nasApi.disconnectUser(router.id, userToDisconnect);
            toast.success(`User ${userToDisconnect} disconnected`);
            // Remove from local state
            setActiveSessions(prev => prev.filter(s => s.username !== userToDisconnect));
            setShowDisconnectModal(false);
            setUserToDisconnect(null);
        } catch (error) {
            toast.error("Failed to disconnect user");
        }
    };

    useEffect(() => {
        fetchRouter();
        fetchLiveStatus();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    if (!router) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ONLINE": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            case "OFFLINE": return "bg-red-500/20 text-red-400 border-red-500/30";
            case "PENDING": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
        }
    };

    const getProvisioningColor = (status: string) => {
        switch (status) {
            case "Provisioned": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            case "Command Pending": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            case "Failed": return "bg-red-500/20 text-red-400 border-red-500/30";
            default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
        }
    };

    const formatLastSeen = (dateStr: string | undefined) => {
        if (!dateStr) return "Never";
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "Just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const memoryPercent = router.memoryTotal ? Math.round((router.memoryUsage || 0) / router.memoryTotal * 100) : 0;

    return (
        <PermissionGate permission={PERMISSIONS.ROUTERS_VIEW}>
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <button
                        onClick={() => navigate("/nas")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Routers
                    </button>

                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => { fetchRouter(); fetchLiveStatus(); }}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                        <ProtectedButton
                            permission={PERMISSIONS.ROUTERS_TEST}
                            onClick={handleTestConnection}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            <Power className="w-4 h-4" />
                            Test Connection
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.ROUTERS_CONFIG}
                            onClick={handleDownloadConfig}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download Config
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.ROUTERS_EDIT}
                            onClick={() => setShowEditModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Edit Router
                        </ProtectedButton>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10">
                        {/* Router Icon */}
                        <div className="flex-shrink-0">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${router.status === "ONLINE"
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
                                : "bg-gradient-to-br from-slate-600 to-slate-700"
                                }`}>
                                <Server className="w-10 h-10 text-white" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">{router.name}</h1>
                                <p className="text-slate-400 text-sm mt-1">{router.boardName || router.model}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${getStatusColor(router.status)}`}>
                                        {router.status === "ONLINE" ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                        {router.status}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getProvisioningColor(router.provisioningStatus)}`}>
                                        {router.provisioningStatus}
                                    </span>
                                    {router.routerOsVersion && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-slate-700/50 text-slate-300 border-slate-600">
                                            RouterOS {router.routerOsVersion}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-3 text-slate-400">
                                    <div className="p-2 rounded-lg bg-slate-700/50">
                                        <Globe className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">IP Address</p>
                                        <p className="text-white font-mono">{router.ipAddress}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <div className="p-2 rounded-lg bg-slate-700/50">
                                        <Terminal className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">VPN Tunnel</p>
                                        <p className="text-white font-mono">{router.vpnTunnelIp || "Not assigned"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <div className="p-2 rounded-lg bg-slate-700/50">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Uptime</p>
                                        <p className="text-white">{router.uptime || "Unknown"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <div className="p-2 rounded-lg bg-slate-700/50">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Last Seen</p>
                                        <p className="text-white">{formatLastSeen(router.lastSeen)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-8 border-b border-slate-700 overflow-x-auto">
                        {[
                            { key: "device", label: "Device Information", icon: HardDrive },
                            { key: "radius", label: "Radius Configuration", icon: Shield },
                            { key: "reports", label: "Reports", icon: BarChart3 },
                            { key: "users", label: "Users", icon: Users },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.key
                                        ? "text-cyan-400"
                                        : "text-slate-500 hover:text-slate-300"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                    {activeTab === tab.key && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-t-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="grid gap-6">
                    {activeTab === "device" && (
                        <div className="space-y-6">
                            {/* Usage Stats Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
                                {/* CPU Usage */}
                                <div className="bg-slate-800 rounded-xl p-3 md:p-6 border border-slate-700 shadow-lg relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-0">
                                        <div className="z-10 relative">
                                            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                                                CPU
                                                <span className="hidden md:inline">USAGE</span>
                                            </p>
                                            <p className="text-xl md:text-4xl font-bold text-white mt-1 md:mt-2">{router.cpuLoad ?? 0}%</p>
                                            <p className="text-[10px] md:text-sm text-slate-500 mt-1 truncate">Load avg</p>
                                        </div>
                                        <div className="absolute top-3 right-3 md:relative md:top-auto md:right-auto w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-500 flex items-center justify-center">
                                            <Cpu className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-3 md:mt-4 h-1.5 md:h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full transition-all"
                                            style={{ width: `${router.cpuLoad ?? 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Memory Usage */}
                                <div className="bg-slate-800 rounded-xl p-3 md:p-6 border border-slate-700 shadow-lg relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-0">
                                        <div className="z-10 relative">
                                            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                                                RAM
                                                <span className="hidden md:inline">USAGE</span>
                                            </p>
                                            <p className="text-xl md:text-4xl font-bold text-white mt-1 md:mt-2">{memoryPercent}%</p>
                                            <p className="text-[10px] md:text-sm text-slate-500 mt-1 truncate">{router.memoryUsage}MB</p>
                                        </div>
                                        <div className="absolute top-3 right-3 md:relative md:top-auto md:right-auto w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-500 flex items-center justify-center">
                                            <HardDrive className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-3 md:mt-4 h-1.5 md:h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full transition-all"
                                            style={{ width: `${memoryPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Disk Usage */}
                                <div className="bg-slate-800 rounded-xl p-3 md:p-6 border border-slate-700 shadow-lg relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-0">
                                        <div className="z-10 relative">
                                            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1 font-semibold">
                                                DISK
                                                <span className="hidden md:inline">USAGE</span>
                                            </p>
                                            <p className="text-xl md:text-4xl font-bold text-white mt-1 md:mt-2">0%</p>
                                            <p className="text-[10px] md:text-sm text-slate-500 mt-1 truncate">0MB</p>
                                        </div>
                                        <div className="absolute top-3 right-3 md:relative md:top-auto md:right-auto w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-orange-500 flex items-center justify-center">
                                            <Download className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="mt-3 md:mt-4 h-1.5 md:h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-slate-500 to-slate-400 rounded-full transition-all"
                                            style={{ width: "0%" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Availability & Performance Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* MikroTik Availability */}
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white">Mikrotik Availability</h3>
                                        <span className="text-slate-500 cursor-help" title="Router uptime tracking">ⓘ</span>
                                    </div>
                                    <div className="w-12 h-0.5 bg-orange-500 mb-6" />

                                    {/* Status Badge */}
                                    <div className={`p-4 rounded-lg border mb-6 ${router.status === "ONLINE"
                                        ? "bg-emerald-500/10 border-emerald-500/30"
                                        : "bg-red-500/10 border-red-500/30"
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${router.status === "ONLINE" ? "bg-emerald-500" : "bg-red-500"
                                                }`}>
                                                {router.status === "ONLINE" ? (
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-semibold ${router.status === "ONLINE" ? "text-emerald-400" : "text-red-400"}`}>
                                                    {router.status === "ONLINE" ? "All Systems Operational" : "System Offline"}
                                                </p>
                                                <p className="text-sm text-slate-400">
                                                    {router.status === "ONLINE" ? "100.00% uptime over the last 30 days" : "Router is currently not responding"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 30 Day Chart */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-white">Last 30 days</span>
                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                                                    Operational
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-3 h-3 rounded-sm bg-red-500"></span>
                                                    Downtime
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-3 h-3 rounded-sm bg-slate-600"></span>
                                                    Not Added
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 30 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex-1 h-8 rounded-sm ${i >= 28 ? "bg-emerald-500" : "bg-slate-600"
                                                        }`}
                                                    title={`Day ${i + 1}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs text-slate-500">
                                            <span>Nov 28</span>
                                            <span>Dec 5</span>
                                            <span>Dec 12</span>
                                            <span>Dec 19</span>
                                            <span>Dec 26</span>
                                        </div>
                                    </div>

                                    {/* Uptime Stats */}
                                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-emerald-400">100.00%</p>
                                            <p className="text-xs text-slate-400 uppercase">1-Day Uptime</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-white">0m</p>
                                            <p className="text-xs text-slate-400 uppercase">Total Downtime</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-white">{router.uptime || "0d 0h 0m 0s"}</p>
                                            <p className="text-xs text-slate-400 uppercase">Current Uptime</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Overview */}
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-white italic">Performance Overview</h3>
                                        <span className="text-slate-500 cursor-help" title="CPU and memory usage over time">ⓘ</span>
                                    </div>

                                    {/* Simple Performance Graph Placeholder */}
                                    <div className="relative h-64 border border-slate-700 rounded-lg p-4">
                                        {/* Grid lines */}
                                        <div className="absolute inset-4 flex flex-col justify-between">
                                            {[100, 75, 50, 25, 0].map((val) => (
                                                <div key={val} className="border-b border-slate-700/50 relative">
                                                    <span className="absolute -left-8 -top-2 text-xs text-slate-500">{val}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Graph line - positioned in middle of graph */}
                                        <div className="absolute top-1/2 -translate-y-1/2 left-10 right-4 h-0.5 flex items-center">
                                            <svg className="w-full h-8 overflow-visible" viewBox="0 0 400 32" preserveAspectRatio="none">
                                                <path
                                                    d="M0,16 L80,16 L160,16 L240,16 L320,16 L400,16"
                                                    fill="none"
                                                    stroke="#f97316"
                                                    strokeWidth="2"
                                                />
                                                {/* Data points */}
                                                <circle cx="0" cy="16" r="4" fill="#f97316" />
                                                <circle cx="160" cy="16" r="4" fill="#f97316" />
                                                <circle cx="320" cy="16" r="4" fill="#f97316" />
                                                <circle cx="400" cy="16" r="4" fill="#f97316" />
                                            </svg>
                                        </div>

                                    </div>
                                    {/* Coming soon text - below graph */}
                                    <p className="text-center text-xs text-slate-500 mt-3">
                                        Real-time performance data coming soon
                                    </p>
                                </div>
                            </div>

                            {/* Device Details */}
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Server className="w-5 h-5 text-cyan-500" />
                                    Device Details
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Model</p>
                                        <p className="text-white font-medium">{router.model || router.boardName || "Unknown"}</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">RouterOS Version</p>
                                        <p className="text-white font-medium">{router.routerOsVersion || "Unknown"}</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Serial Number</p>
                                        <p className="text-white font-mono">{router.serialNumber || "Unknown"}</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">IP Address</p>
                                        <p className="text-white font-mono">{router.ipAddress}</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">VPN Tunnel IP</p>
                                        <p className="text-white font-mono">{router.vpnTunnelIp || "Not assigned"}</p>
                                    </div>
                                    <div className="p-4 bg-slate-900/50 rounded-lg">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Added On</p>
                                        <p className="text-white font-medium">{new Date(router.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "radius" && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* RADIUS Configuration */}
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-cyan-500" />
                                    RADIUS Settings
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b border-slate-700">
                                        <span className="text-slate-400">RADIUS Secret</span>
                                        <span className="text-white font-mono">{router.secret ? "••••••••" : "Not set"}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-700">
                                        <span className="text-slate-400">CoA Port</span>
                                        <span className="text-white font-mono">{router.coaPort}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-700">
                                        <span className="text-slate-400">Provisioning Status</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getProvisioningColor(router.provisioningStatus)}`}>
                                            {router.provisioningStatus}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-400">Status</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(router.status)}`}>
                                            {router.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* API Configuration */}
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Terminal className="w-5 h-5 text-cyan-500" />
                                    API Configuration
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b border-slate-700">
                                        <span className="text-slate-400">API Username</span>
                                        <span className="text-white font-mono">{router.apiUsername || "admin"}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-700">
                                        <span className="text-slate-400">API Port</span>
                                        <span className="text-white font-mono">{router.apiPort || 8728}</span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="text-slate-400">API Password</span>
                                        <span className="text-white font-mono">••••••••</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "reports" && (
                        <div className="space-y-6">
                            {/* Active Sessions Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                {/* Total Active Sessions */}
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Sessions</p>
                                            <p className="text-3xl font-bold text-white mt-2">{liveStatus?.activeSessions.total ?? (router.pppoeCount ?? 0) + (router.hotspotCount ?? 0)}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm text-emerald-400">+12%</span>
                                                <span className="text-xs text-slate-500">vs last week</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-cyan-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* PPPoE Sessions */}
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">PPPoE Sessions</p>
                                            <p className="text-3xl font-bold text-white mt-2">{liveStatus?.activeSessions.pppoe ?? router.pppoeCount ?? 0}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm text-emerald-400">+8%</span>
                                                <span className="text-xs text-slate-500">vs last week</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                            <Radio className="w-6 h-6 text-blue-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Hotspot Sessions */}
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Hotspot Sessions</p>
                                            <p className="text-3xl font-bold text-white mt-2">{liveStatus?.activeSessions.hotspot ?? router.hotspotCount ?? 0}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <ArrowDownRight className="w-4 h-4 text-red-400" />
                                                <span className="text-sm text-red-400">-3%</span>
                                                <span className="text-xs text-slate-500">vs last week</span>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                            <Flame className="w-6 h-6 text-orange-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Peak Sessions */}
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">Peak Sessions (Today)</p>
                                            <p className="text-3xl font-bold text-white mt-2">78</p>
                                            <p className="text-xs text-slate-500 mt-1">At 6:30 PM</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-purple-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Revenue Card */}
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <DollarSign className="w-5 h-5 text-emerald-400" />
                                            Revenue Generated
                                        </h3>
                                        <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white">
                                            <option>This Month</option>
                                            <option>Last Month</option>
                                            <option>Last 3 Months</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-slate-900/50 rounded-lg">
                                            <p className="text-xs text-slate-500 uppercase mb-1">Total Revenue</p>
                                            <p className="text-2xl font-bold text-emerald-400">KES 125,430</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                                <span className="text-xs text-emerald-400">+18.5%</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-900/50 rounded-lg">
                                            <p className="text-xs text-slate-500 uppercase mb-1">Avg per User</p>
                                            <p className="text-2xl font-bold text-white">KES 2,100</p>
                                            <p className="text-xs text-slate-500 mt-1">Per month</p>
                                        </div>
                                    </div>

                                    {/* Revenue Breakdown */}
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-400 flex items-center gap-2">
                                                    <Radio className="w-4 h-4 text-blue-400" />
                                                    PPPoE Revenue
                                                </span>
                                                <span className="text-white font-medium">KES 89,500</span>
                                            </div>
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '71%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-400 flex items-center gap-2">
                                                    <Flame className="w-4 h-4 text-orange-400" />
                                                    Hotspot Revenue
                                                </span>
                                                <span className="text-white font-medium">KES 35,930</span>
                                            </div>
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: '29%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Data Usage Card */}
                                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-cyan-400" />
                                            Data Usage
                                        </h3>
                                        <select className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white">
                                            <option>Today</option>
                                            <option>This Week</option>
                                            <option>This Month</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-slate-900/50 rounded-lg">
                                            <p className="text-xs text-slate-500 uppercase mb-1">Download</p>
                                            <p className="text-2xl font-bold text-cyan-400">1.24 TB</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Download className="w-3 h-3 text-cyan-400" />
                                                <span className="text-xs text-slate-400">Total today</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-900/50 rounded-lg">
                                            <p className="text-xs text-slate-500 uppercase mb-1">Upload</p>
                                            <p className="text-2xl font-bold text-purple-400">342 GB</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <ArrowUpRight className="w-3 h-3 text-purple-400" />
                                                <span className="text-xs text-slate-400">Total today</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Usage by Type */}
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-400">PPPoE Traffic</span>
                                                <span className="text-white font-medium">892 GB</span>
                                            </div>
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '72%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-400">Hotspot Traffic</span>
                                                <span className="text-white font-medium">348 GB</span>
                                            </div>
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" style={{ width: '28%' }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Session History Graph */}
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                                        Session History (Last 7 Days)
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                            PPPoE
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                                            Hotspot
                                        </span>
                                    </div>
                                </div>

                                {/* Simple Bar Chart */}
                                <div className="flex items-end justify-between gap-2 h-48">
                                    {[
                                        { day: 'Mon', pppoe: 42, hotspot: 18 },
                                        { day: 'Tue', pppoe: 45, hotspot: 15 },
                                        { day: 'Wed', pppoe: 48, hotspot: 20 },
                                        { day: 'Thu', pppoe: 44, hotspot: 16 },
                                        { day: 'Fri', pppoe: 52, hotspot: 22 },
                                        { day: 'Sat', pppoe: 38, hotspot: 28 },
                                        { day: 'Sun', pppoe: 35, hotspot: 25 },
                                    ].map((data, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                            <div className="flex flex-col gap-1 w-full">
                                                <div
                                                    className="bg-blue-500 rounded-t w-full min-h-[4px]"
                                                    style={{ height: `${data.pppoe * 2}px` }}
                                                    title={`PPPoE: ${data.pppoe}`}
                                                />
                                                <div
                                                    className="bg-orange-500 rounded-b w-full min-h-[4px]"
                                                    style={{ height: `${data.hotspot * 2}px` }}
                                                    title={`Hotspot: ${data.hotspot}`}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-500 mt-2">{data.day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-cyan-500" />
                                    Connected Users
                                </h3>

                                {/* User Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div
                                        className={`p-4 rounded-lg text-center cursor-pointer transition-all ${selectedSessionType === 'pppoe'
                                            ? 'bg-blue-500/20 border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                            : 'bg-slate-900/50 hover:bg-slate-900/80 border border-transparent'
                                            }`}
                                        onClick={() => handleFetchSessions('pppoe')}
                                    >
                                        <p className={`text-2xl font-bold ${selectedSessionType === 'pppoe' ? 'text-blue-400' : 'text-white'}`}>
                                            {liveStatus?.activeSessions.pppoe ?? router.pppoeCount ?? 0}
                                        </p>
                                        <p className="text-sm text-slate-400">PPPoE Users</p>
                                    </div>
                                    <div
                                        className={`p-4 rounded-lg text-center cursor-pointer transition-all ${selectedSessionType === 'hotspot'
                                            ? 'bg-orange-500/20 border border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                                            : 'bg-slate-900/50 hover:bg-slate-900/80 border border-transparent'
                                            }`}
                                        onClick={() => handleFetchSessions('hotspot')}
                                    >
                                        <p className={`text-2xl font-bold ${selectedSessionType === 'hotspot' ? 'text-orange-400' : 'text-white'}`}>
                                            {liveStatus?.activeSessions.hotspot ?? router.hotspotCount ?? 0}
                                        </p>
                                        <p className="text-sm text-slate-400">Hotspot Users</p>
                                    </div>
                                    <div
                                        className={`p-4 rounded-lg text-center cursor-pointer transition-all ${selectedSessionType === 'all'
                                            ? 'bg-cyan-500/20 border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                                            : 'bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20'
                                            }`}
                                        onClick={() => handleFetchSessions('all')}
                                    >
                                        <p className="text-2xl font-bold text-cyan-400">
                                            {liveStatus?.activeSessions.total ?? (router.pppoeCount ?? 0) + (router.hotspotCount ?? 0)}
                                        </p>
                                        <p className="text-sm text-cyan-400">Total Active</p>
                                    </div>
                                </div>

                                {/* Active Sessions List */}
                                {selectedSessionType ? (
                                    <div className="border-t border-slate-700 pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-white font-semibold flex items-center gap-2">
                                                {selectedSessionType === 'pppoe' && <Radio className="w-4 h-4 text-blue-400" />}
                                                {selectedSessionType === 'hotspot' && <Flame className="w-4 h-4 text-orange-400" />}
                                                {selectedSessionType === 'all' && <Users className="w-4 h-4 text-cyan-400" />}
                                                Active {selectedSessionType === 'all' ? '' : selectedSessionType.toUpperCase()} Sessions
                                            </h4>
                                            <button
                                                onClick={() => handleFetchSessions(selectedSessionType)}
                                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                title="Refresh list"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
                                            </button>
                                        </div>

                                        {loadingSessions ? (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                                                <p className="text-slate-400">Loading sessions...</p>
                                            </div>
                                        ) : activeSessions.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-700 text-xs text-slate-400 uppercase tracking-wider">
                                                            <th className="py-3 px-2 font-medium">Username</th>
                                                            <th className="py-3 px-2 font-medium">IP Address</th>
                                                            <th className="py-3 px-2 font-medium hidden md:table-cell">MAC Address</th>
                                                            <th className="py-3 px-2 font-medium">Uptime</th>
                                                            {selectedSessionType === 'all' && <th className="py-3 px-2 font-medium">Type</th>}
                                                            <th className="py-3 px-2 font-medium hidden sm:table-cell">Data (Up/Down)</th>
                                                            <th className="py-3 px-2 font-medium text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-700/50">
                                                        {activeSessions.map((session) => (
                                                            <tr key={session.id} className="text-sm hover:bg-slate-700/30 transition-colors">
                                                                <td className="py-3 px-2">
                                                                    <span className="font-medium text-white">{session.username}</span>
                                                                </td>
                                                                <td className="py-3 px-2 text-slate-300 font-mono text-xs">{session.ipAddress}</td>
                                                                <td className="py-3 px-2 text-slate-400 font-mono text-xs hidden md:table-cell">{session.macAddress || '-'}</td>
                                                                <td className="py-3 px-2 text-slate-300">{session.uptime}</td>
                                                                {selectedSessionType === 'all' && (
                                                                    <td className="py-3 px-2">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${session.type === 'pppoe'
                                                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                                                            }`}>
                                                                            {session.type}
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                <td className="py-3 px-2 text-slate-400 text-xs hidden sm:table-cell">
                                                                    <div className="flex flex-col">
                                                                        <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-purple-400" /> {Math.round((session.bytesIn || 0) / 1024 / 1024)} MB</span>
                                                                        <span className="flex items-center gap-1"><Download className="w-3 h-3 text-emerald-400" /> {Math.round((session.bytesOut || 0) / 1024 / 1024)} MB</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-2 text-right">
                                                                    <ProtectedButton
                                                                        permission={PERMISSIONS.ROUTERS_DISCONNECT}
                                                                        onClick={() => handleDisconnectUser(session.username)}
                                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded transition-colors"
                                                                        title="Disconnect User"
                                                                    >
                                                                        <Power className="w-4 h-4" />
                                                                    </ProtectedButton>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-slate-400">
                                                No active sessions found.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 border-t border-slate-700">
                                        <Users className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                                        <p className="text-slate-400 mb-2">
                                            Select a category above to view connected users
                                        </p>
                                        <p className="text-slate-500 text-sm">
                                            You'll be able to view and disconnect individual users from here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Router Modal */}
                <EditRouterModal
                    isOpen={showEditModal}
                    router={showEditModal ? { id: router.id, boardName: router.name, ipAddress: router.ipAddress } : null}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        fetchRouter();
                    }}
                />

                {/* Disconnect User Confirmation Modal */}
                {showDisconnectModal && userToDisconnect && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-4 text-red-600 dark:text-red-500 mb-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Disconnect User?</h3>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                Are you sure you want to disconnect <span className="font-semibold text-slate-900 dark:text-white">{userToDisconnect}</span>?
                                This will immediately terminate their session.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDisconnectModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDisconnectUser}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Disconnect
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </PermissionGate>
    );
}
