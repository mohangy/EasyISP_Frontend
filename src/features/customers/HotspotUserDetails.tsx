import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    RefreshCw,
    Trash2,
    Loader2,
    Wifi,
    Shield,
    Smartphone,
    Package,
    RotateCcw
} from "lucide-react";
import { customerApi, type CustomerDetails, type MpesaTransaction } from "../../services/customerService";
import { PERMISSIONS } from "../../lib/permissions";
import { ProtectedButton } from "../../components/auth/ProtectedButton";
import toast from "react-hot-toast";
import {
    ConfirmModal,
    ChangePlanModal,
    ModalIcons
} from "./UserActionModals";

// Extended interface for Hotspot user with session info
interface HotspotUser extends CustomerDetails {
    registeredAt?: string;
    accountingStartTime?: string;
    uptime?: string;
    hostName?: string;
}

// Connection log entry
interface ConnectionLog {
    id: string;
    timestamp: string;
    nasInfo: string;
    authReply: string;
    password: string;
    mac: string;
}

export function HotspotUserDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<HotspotUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [mpesaTransactions, _setMpesaTransactions] = useState<MpesaTransaction[]>([]);
    const [connectionLogs, setConnectionLogs] = useState<ConnectionLog[]>([]);

    // Pagination state for transactions
    const [txPage, setTxPage] = useState(1);
    const txPageSize = 5;
    const totalTxPages = Math.ceil(mpesaTransactions.length / txPageSize);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetMACModal, setShowResetMACModal] = useState(false);
    const [showPurgeModal, setShowPurgeModal] = useState(false);
    const [showResetCountersModal, setShowResetCountersModal] = useState(false);
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);

    useEffect(() => {
        if (id) {
            loadUserData();
        }
    }, [id]);

    const parseUptime = (str: string): number => {
        if (!str) return 0;
        let seconds = 0;
        const weeks = str.match(/(\d+)w/);
        const days = str.match(/(\d+)d/);
        const hours = str.match(/(\d+)h/);
        const minutes = str.match(/(\d+)m/);
        const secs = str.match(/(\d+)s/);

        if (weeks) seconds += parseInt(weeks[1]) * 604800;
        if (days) seconds += parseInt(days[1]) * 86400;
        if (hours) seconds += parseInt(hours[1]) * 3600;
        if (minutes) seconds += parseInt(minutes[1]) * 60;
        if (secs) seconds += parseInt(secs[1]);

        return seconds;
    };

    const loadUserData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await customerApi.getCustomerDetails(id);
            let updatedUser = { ...data } as HotspotUser;

            // Fetch live session data from MikroTik if NAS is assigned
            if (updatedUser.nasId) {
                try {
                    const activeUsers = await customerApi.getMikroTikHotspotUsers(updatedUser.nasId);
                    const activeSession = activeUsers.find((u: any) =>
                        u.name === updatedUser.username ||
                        u['mac-address'] === updatedUser.macAddress
                    );

                    if (activeSession) {
                        updatedUser.isOnline = true;
                        updatedUser.uptime = activeSession.uptime;
                        updatedUser.ipAddress = activeSession.address;
                        updatedUser.macAddress = activeSession['mac-address'];
                        // Calculate current session data if needed, or stick to DB total
                        // updatedUser.dataUsed = (parseInt(activeSession['bytes-in']) + parseInt(activeSession['bytes-out'])); 

                        // Add active session to logs
                        const loginTime = new Date(Date.now() - (parseUptime(activeSession.uptime) * 1000));
                        setConnectionLogs([{
                            id: "active-session",
                            timestamp: loginTime.toISOString(),
                            nasInfo: `${updatedUser.nas?.name || "NAS"} - ${updatedUser.ipAddress}`,
                            authReply: "Access-Accept",
                            password: updatedUser.password || "****",
                            mac: activeSession['mac-address']
                        }]);
                    } else {
                        // If not in active list but marked online, might be stale or delay
                        // For now, trust MikroTik list for "Online" status display
                        // updatedUser.isOnline = false; 
                    }
                } catch (err) {
                    console.error("Failed to fetch live MikroTik data", err);
                }
            }

            setUser(updatedUser);

            // Fetch transactions
            // const transactions = await customerApi.getTransactions(id);
            // setMpesaTransactions(transactions.mpesaTransactions);
        } catch (error) {
            console.error("Failed to load user:", error);
            toast.error("Failed to load user details");
            navigate("/customers/hotspot");
        } finally {
            setLoading(false);
        }
    };

    // Handler functions
    const handleDelete = async () => {
        if (!id) return;
        try {
            await customerApi.deleteCustomer(id);
            toast.success("User deleted successfully");
            navigate("/customers/hotspot");
        } catch {
            toast.error("Failed to delete user");
        }
    };

    const handleResetMAC = async () => {
        if (!id) return;
        try {
            await customerApi.resetMAC(id);
            toast.success("MAC address reset successfully");
            loadUserData();
        } catch {
            toast.error("Failed to reset MAC address");
        }
    };

    const handlePurge = async () => {
        if (!id) return;
        try {
            await customerApi.purgeSession(id);
            toast.success("Session purged successfully");
            loadUserData();
        } catch {
            toast.error("Failed to purge session");
        }
    };

    const handleResetCounters = async () => {
        if (!id) return;
        try {
            await customerApi.resetCounters(id);
            toast.success("Counters reset successfully");
            loadUserData();
        } catch {
            toast.error("Failed to reset counters");
        }
    };

    const handleChangePackage = async (packageId: string) => {
        if (!id) return;
        try {
            const updatedUser = await customerApi.changePackage(id, packageId);
            setUser(prev => prev ? { ...prev, ...updatedUser } : null);
            toast.success("Package changed successfully");
        } catch {
            toast.error("Failed to change package");
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const day = date.getDate().toString().padStart(2, "0");
        const month = date.toLocaleString("en-US", { month: "short" });
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const dayName = date.toLocaleString("en-US", { weekday: "short" });
        return `${day} ${month} ${year} ${hours}:${minutes} - ${dayName}`;
    };

    const formatLogDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const day = date.getDate();
        const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
        const month = date.toLocaleString("en-US", { month: "short" });
        const year = date.getFullYear();
        return `${hours}:${minutes}, ${day}${suffix}-${month}-${year}`;
    };

    const formatDataUsage = (kb?: number) => {
        if (!kb || kb === 0) return "0.00KB";
        if (kb >= 1048576) return `${(kb / 1048576).toFixed(2)}GB`;
        if (kb >= 1024) return `${(kb / 1024).toFixed(2)}MB`;
        return `${kb.toFixed(2)}KB`;
    };

    // Paginated transactions
    const paginatedTransactions = mpesaTransactions.slice(
        (txPage - 1) * txPageSize,
        txPage * txPageSize
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <p className="text-slate-500">User not found</p>
                <Link to="/customers/hotspot" className="text-orange-500 hover:underline">
                    Back to Hotspot Users
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
                <Link
                    to="/customers/hotspot"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">
                        Hotspot User Details
                    </h1>
                    <p className="text-sm text-slate-400">
                        {user.username}
                    </p>
                </div>
            </div>

            {/* Info Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Username</p>
                    <p className="text-lg font-bold text-white">{user.username}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Data Used</p>
                    <p className="text-lg font-bold text-white">{formatDataUsage(user.dataUsed)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Expiry Date</p>
                    <p className="text-lg font-bold text-white">{formatDate(user.expiresAt)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Mac Address</p>
                    <p className="text-lg font-bold text-white font-mono text-sm">{user.macAddress || "-"}</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column: Account Details */}
                <div className="lg:col-span-2 space-y-4 min-w-0">
                    {/* Status and Details Card */}
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Left Side */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-400">Status :</span>
                                    <span className={`font-medium ${user.isOnline ? "text-cyan-400" : "text-orange-400"}`}>
                                        {user.isOnline ? "online" : "offline"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Registered: </span>
                                    <span className="text-white">{formatLogDate(user.registeredAt || user.createdAt)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Accounting Start Time: </span>
                                    <span className="text-white">{formatLogDate(user.accountingStartTime)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Package: </span>
                                    <span className="text-white">{user.package?.name} @ KES {user.package?.price}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Phone: </span>
                                    <span className="text-white">{user.phone || "-"}</span>
                                    {user.phone && <span className="text-slate-500 text-sm ml-2">- FROM ARCHIVE</span>}
                                </div>
                            </div>
                            {/* Right Side */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                                    <span className="text-slate-400">IP</span>
                                    <span className="text-white font-mono">{user.ipAddress || "-"}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                                    <span className="text-slate-400">NAS</span>
                                    <span className="text-white">{user.nas?.name || "-"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Session and Host Cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-cyan-500/20">
                                    <Wifi className="w-5 h-5 text-cyan-400" />
                                </div>
                                <span className="text-slate-400 font-medium">SESSION</span>
                            </div>
                            <p className={`text-2xl font-bold ${user.isOnline ? "text-cyan-400" : "text-slate-400"}`}>
                                {user.isOnline ? "online" : "offline"} {user.uptime || ""}
                            </p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                    <Smartphone className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-slate-400 font-medium">HOST</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {user.hostName || "-"}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons - Only: Delete, Reset MAC, Purge, Reset Counters, Change Package */}
                    <div className="flex flex-wrap gap-2">
                        <ProtectedButton
                            permission={PERMISSIONS.CUSTOMERS_DELETE}
                            onClick={() => setShowDeleteModal(true)}
                            className="py-2 px-4 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.CUSTOMERS_EDIT}
                            onClick={() => setShowResetMACModal(true)}
                            className="py-2 px-4 bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reset Mac
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.CUSTOMERS_EDIT}
                            onClick={() => setShowPurgeModal(true)}
                            className="py-2 px-4 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Shield className="w-4 h-4" />
                            Purge
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.CUSTOMERS_EDIT}
                            onClick={() => setShowResetCountersModal(true)}
                            className="py-2 px-4 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Reset Counters
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.CUSTOMERS_EDIT}
                            onClick={() => setShowChangePlanModal(true)}
                            className="py-2 px-4 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Package className="w-4 h-4" />
                            Change Package
                        </ProtectedButton>
                    </div>

                </div>

                {/* Right Column: Transactions & Logs */}
                <div className="space-y-4 min-w-0">
                    {/* Transactions Card */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-700/50">
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                                LAST 5 TRANSACTIONS FOR THIS DEVICE
                            </h3>
                        </div>
                        <div className="overflow-x-auto p-1">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">USERNAME</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">AMOUNT</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">DATE</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase whitespace-nowrap">PHONE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {paginatedTransactions.length > 0 ? (
                                        paginatedTransactions.map((tx, index) => (
                                            <tr key={tx.id} className="hover:bg-slate-700/30">
                                                <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{(txPage - 1) * txPageSize + index + 1}</td>
                                                <td className="px-4 py-3 text-sm text-cyan-400 whitespace-nowrap">{tx.trxCode}</td>
                                                <td className="px-4 py-3 text-sm text-white whitespace-nowrap">{tx.amount.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{formatDate(tx.trxDate)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">{tx.phone}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {totalTxPages > 1 && (
                            <div className="px-4 py-3 border-t border-slate-700/50 flex items-center justify-between">
                                <span className="text-xs text-slate-400">
                                    Page {txPage} of {totalTxPages}
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setTxPage(Math.max(1, txPage - 1))}
                                        disabled={txPage === 1}
                                        className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setTxPage(Math.min(totalTxPages, txPage + 1))}
                                        disabled={txPage === totalTxPages}
                                        className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Connection Logs Card (Moved to Right Column) */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-700/50">
                            <h3 className="text-sm font-semibold text-slate-300">User Connection Logs</h3>
                        </div>
                        <div className="p-5">
                            {connectionLogs.length > 0 ? (
                                connectionLogs.map((log) => (
                                    <div key={log.id} className="relative pl-6 pb-4">
                                        {/* Timeline dot */}
                                        <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-amber-500" />
                                        {/* Timeline line */}
                                        <div className="absolute left-1.5 top-4 bottom-0 w-px bg-slate-700" />

                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-cyan-400 text-sm">{formatLogDate(log.timestamp)}</span>
                                            <span className="text-cyan-400 text-sm">{log.nasInfo}</span>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-emerald-400">AUTH REPLY: {log.authReply}</p>
                                            <p className="text-emerald-400">PASSWORD : {log.password}</p>
                                            <p className="text-emerald-400">MAC : {log.mac}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-center py-4">No connection logs found</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete User"
                message="Are you sure you want to delete this hotspot user? This action cannot be undone."
                confirmText="Delete"
                confirmColor="red"
                icon={ModalIcons.Delete}
            />

            <ConfirmModal
                isOpen={showResetMACModal}
                onClose={() => setShowResetMACModal(false)}
                onConfirm={handleResetMAC}
                title="Reset MAC Address"
                message="Are you sure you want to clear the existing MAC address? This will allow a new device to use this account."
                confirmText="Reset MAC"
                confirmColor="cyan"
                icon={ModalIcons.ResetMAC}
            />

            <ConfirmModal
                isOpen={showPurgeModal}
                onClose={() => setShowPurgeModal(false)}
                onConfirm={handlePurge}
                title="Force Disconnect"
                message="Are you sure you want to forcefully terminate this session?"
                confirmText="Disconnect"
                confirmColor="amber"
                icon={ModalIcons.Purge}
            />

            <ConfirmModal
                isOpen={showResetCountersModal}
                onClose={() => setShowResetCountersModal(false)}
                onConfirm={handleResetCounters}
                title="Reset Counters"
                message="Are you sure you want to reset the data usage counters for this user?"
                confirmText="Reset"
                confirmColor="cyan"
                icon={ModalIcons.ResetMAC}
            />

            <ChangePlanModal
                isOpen={showChangePlanModal}
                onClose={() => setShowChangePlanModal(false)}
                currentPackageId={user?.packageId}
                currentPackageName={user?.package?.name}
                onSelect={handleChangePackage}
                serviceType="HOTSPOT"
            />
        </div>
    );
}
