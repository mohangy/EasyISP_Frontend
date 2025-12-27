import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ArrowLeft,
    Edit,
    RefreshCw,
    Trash2,
    MessageSquare,
    WifiOff,
    Loader2,
    User,
    Server,
    Activity,
    Clock,
    Shield,
    MapPinned
} from "lucide-react";
import { customerApi, type CustomerDetails, type MpesaTransaction, type ManualRechargeTransaction } from "../../services/customerService";
import { PERMISSIONS } from "../../lib/permissions";
import { ProtectedButton } from "../../components/auth/ProtectedButton";
import toast from "react-hot-toast";
import {
    EditUserModal,
    AddChildModal,
    SendSMSModal,
    ConfirmModal,
    ChangeExpiryModal,
    ResolveTransactionModal,
    ChangePlanModal,
    ModalIcons
} from "./UserActionModals";

export function PPPoEUserDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"receipts" | "recharge">("receipts");
    const [mpesaTransactions, setMpesaTransactions] = useState<MpesaTransaction[]>([]);
    const [manualTransactions, setManualTransactions] = useState<ManualRechargeTransaction[]>([]);

    // Pagination state
    const [trxPage, setTrxPage] = useState(1);
    const trxPageSize = 3;

    // Reset pagination when tab changes
    useEffect(() => {
        setTrxPage(1);
    }, [activeTab]);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddChildModal, setShowAddChildModal] = useState(false);
    const [showSMSModal, setShowSMSModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetMACModal, setShowResetMACModal] = useState(false);
    const [showPurgeModal, setShowPurgeModal] = useState(false);
    const [showChangeExpiryModal, setShowChangeExpiryModal] = useState(false);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [showChangePlanModal, setShowChangePlanModal] = useState(false);


    useEffect(() => {
        if (!id) return;

        const fetchUser = async () => {
            try {
                setLoading(true);
                const data = await customerApi.getCustomerDetails(id);
                setUser(data);

                // Fetch transactions
                const transactions = await customerApi.getTransactions(id);
                setMpesaTransactions(transactions.mpesaTransactions);
                setManualTransactions(transactions.manualTransactions);
            } catch {
                toast.error("Failed to load user details");
                navigate("/customers/pppoe");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [id, navigate]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleString("en-KE", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const StatusBadge = ({ status }: { status?: string }) => {
        const styles = {
            ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            EXPIRED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
            SUSPENDED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            DISABLED: "bg-slate-500/10 text-slate-500 border-slate-500/20"
        };
        const style = styles[status as keyof typeof styles] || styles.DISABLED;

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
                {status}
            </span>
        );
    };

    // Modal callback handlers
    const handleEditUser = async (data: { username: string; name: string; password: string; email: string; phone: string; location: string }) => {
        if (!id) return;
        try {
            await customerApi.updateCustomer(id, data);
            toast.success("User updated successfully");
            const updatedUser = await customerApi.getCustomerDetails(id);
            setUser(updatedUser);
        } catch {
            toast.error("Failed to update user");
        }
    };

    const handleAddChild = async (data: { username: string; password: string; name: string; phone?: string }) => {
        if (!id) return;
        try {
            await customerApi.createCustomer({
                ...data,
                connectionType: "PPPOE",
                // Note: Backend should handle linking expiry to parent
            });
            toast.success("Child account created successfully");
        } catch {
            toast.error("Failed to create child account");
        }
    };

    const handleSendSMS = async (message: string) => {
        if (!id) return;
        try {
            await customerApi.sendSMS(id, message);
            toast.success("SMS sent successfully");
        } catch {
            toast.error("Failed to send SMS");
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            await customerApi.deleteCustomer(id);
            toast.success("User deleted successfully");
            navigate("/customers/pppoe");
        } catch {
            toast.error("Failed to delete user");
        }
    };

    const handleResetMAC = async () => {
        if (!id) return;
        try {
            await customerApi.resetMAC(id);
            toast.success("MAC address reset successfully");
            const data = await customerApi.getCustomerDetails(id);
            setUser(data);
        } catch {
            toast.error("Failed to reset MAC address");
        }
    };

    const handlePurge = async () => {
        if (!id) return;
        try {
            await customerApi.purgeSession(id);
            toast.success("Session terminated successfully");
            const data = await customerApi.getCustomerDetails(id);
            setUser(data);
        } catch {
            toast.error("Failed to purge session");
        }
    };

    const handleChangeExpiry = async (newExpiry: string) => {
        if (!id) return;
        try {
            await customerApi.updateCustomer(id, { expiresAt: newExpiry });
            toast.success("Expiry date updated successfully");
            const data = await customerApi.getCustomerDetails(id);
            setUser(data);
        } catch {
            toast.error("Failed to update expiry");
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

    const handleResolveTransaction = async (mpesaCode: string) => {
        if (!id) return;
        try {
            await customerApi.resolveTransaction(id, mpesaCode);
            toast.success("Transaction resolved successfully");
            // Refresh transactions
            const transactions = await customerApi.getTransactions(id);
            setMpesaTransactions(transactions.mpesaTransactions);
        } catch {
            toast.error("Failed to resolve transaction");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">User not found</p>
                <Link to="/customers/pppoe" className="text-cyan-400 hover:underline mt-2 inline-block">
                    Back to Users
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between">
                <Link
                    to="/customers/pppoe"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <div className="p-1 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">Back to Users</span>
                </Link>
            </div>

            {/* Main Layout: Personal Details on left, Connection + Plan + Transactions on right */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-4 items-start">

                {/* Personal Details Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                            <span className="w-1 h-4 bg-blue-500 rounded-full" />
                            Personal Details
                        </h3>
                        <StatusBadge status={user.status} />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <span className="text-base text-slate-500 dark:text-slate-400">Name</span>
                            <span className="text-base font-medium text-slate-900 dark:text-slate-200">{user.name || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <span className="text-base text-slate-500 dark:text-slate-400">Username</span>
                            <span className="text-base font-medium text-slate-900 dark:text-slate-200">{user.username || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <span className="text-base text-slate-500 dark:text-slate-400">Password</span>
                            <div className="flex items-center gap-2">
                                <code className="text-base font-mono text-slate-900 dark:text-slate-200">{user.password || user.username}</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(user.password || user.username);
                                        toast.success("Copied to clipboard");
                                    }}
                                    className="text-sm text-cyan-500 hover:text-cyan-600 font-medium"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <span className="text-base text-slate-500 dark:text-slate-400">Location</span>
                            <span className="text-base font-medium text-slate-900 dark:text-slate-200">{user.location || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <span className="text-base text-slate-500 dark:text-slate-400">Coordinates</span>
                            <span className="text-base font-medium text-slate-900 dark:text-slate-200">
                                {user.latitude && user.longitude ? (
                                    <Link
                                        to={`/map?lat=${user.latitude}&lng=${user.longitude}`}
                                        className="text-cyan-500 hover:text-cyan-600 hover:underline flex items-center gap-1"
                                    >
                                        <MapPinned className="w-4 h-4" />
                                        {`${user.latitude}, ${user.longitude}`}
                                    </Link>
                                ) : (
                                    "-"
                                )}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <span className="text-base text-slate-500 dark:text-slate-400">Phone Number</span>
                            <span className="text-base font-medium text-slate-900 dark:text-slate-200">{user.phone || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50">
                            <span className="text-base text-slate-500 dark:text-slate-400">Email</span>
                            <span className="text-base font-medium text-slate-900 dark:text-slate-200 truncate max-w-[180px]" title={user.email}>{user.email || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-base text-slate-500 dark:text-slate-400">Date Registered</span>
                            <span className="text-base font-medium text-slate-900 dark:text-slate-200">{formatDate(user.createdAt).split(',')[0]}</span>
                        </div>
                    </div>

                    {/* Wallet Info */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-6">
                        <div>
                            <span className="text-sm text-slate-400 block">Wallet</span>
                            <span className="text-base font-bold text-emerald-500">KES {user.walletBalance?.toLocaleString() || 0}</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-400 block">Spent</span>
                            <span className="text-base font-bold text-slate-700 dark:text-slate-200">KES {user.totalSpent?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                    {/* Card Actions */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap justify-center gap-2">
                        <ProtectedButton
                            permission={PERMISSIONS.CUSTOMERS_EDIT}
                            onClick={() => setShowEditModal(true)}
                            className="py-2 px-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.CUSTOMERS_EDIT}
                            onClick={() => setShowAddChildModal(true)}
                            className="py-2 px-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <User className="w-3.5 h-3.5" />
                            Child
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.SMS_SEND}
                            onClick={() => setShowSMSModal(true)}
                            className="py-2 px-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            SMS
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.CUSTOMERS_DELETE}
                            onClick={() => setShowDeleteModal(true)}
                            className="py-2 px-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </ProtectedButton>
                    </div>
                </div>

                {/* Right Column: Connection + Plan + Transactions */}
                <div className="space-y-4">
                    {/* Top row: Connection + Current Plan side by side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Connection Status Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-1 h-4 bg-purple-500 rounded-full" />
                                    Connection
                                </h3>
                                {user.isOnline ? (
                                    <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        ONLINE
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-slate-500 text-xs font-bold bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/20">
                                        <WifiOff className="w-3 h-3" />
                                        OFFLINE
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                    <span className="text-base text-slate-400 block mb-0.5">IP Address</span>
                                    <p className="text-base font-mono font-medium text-slate-700 dark:text-slate-200">{user.lastIp || "-"}</p>
                                </div>
                                <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                    <span className="text-base text-slate-400 block mb-0.5">MAC Address</span>
                                    <p className="text-base font-mono font-medium text-slate-700 dark:text-slate-200">{user.lastMac || "-"}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                        <Server className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-base text-slate-400">Router</p>
                                        <p className="text-base font-medium text-slate-900 dark:text-white truncate" title={user.site || "-"}>
                                            {user.site || "-"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <Activity className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                        <p className="text-base text-slate-400">Vendor</p>
                                        <p className="text-base font-medium text-slate-900 dark:text-white">{user.vendor?.split(' ')[0] || "-"}</p>
                                    </div>
                                </div>
                                {user.uptime && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <Clock className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <p className="text-base text-slate-400">Uptime</p>
                                            <p className="text-base font-medium text-emerald-600 dark:text-emerald-400">{user.uptime}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Connection Actions */}
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-wrap justify-center gap-2">
                                <ProtectedButton
                                    permission={PERMISSIONS.CUSTOMERS_EDIT}
                                    onClick={() => setShowResetMACModal(true)}
                                    className="py-2 px-3 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Reset MAC
                                </ProtectedButton>
                                <ProtectedButton
                                    permission={PERMISSIONS.CUSTOMERS_EDIT}
                                    onClick={() => setShowPurgeModal(true)}
                                    className="py-2 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    Purge
                                </ProtectedButton>
                            </div>
                        </div>

                        {/* Current Plan Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-cyan-500/30 transition-all duration-700" />

                            <div className="relative z-10">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-1">Current Plan</h3>
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold">{user.package?.name || "No Plan"}</h2>
                                    <span className="bg-white/10 px-2 py-1 rounded text-base font-medium backdrop-blur-sm">
                                        {user.package?.price ? `KES ${user.package.price.toLocaleString()}` : 'Free'}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div>
                                        <div className="flex justify-between text-sm text-slate-400 mb-1">
                                            <span>Download</span>
                                            <span>{user.monthlyUsage?.download || 0} GB</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-400 rounded-full" style={{ width: '45%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm text-slate-400 mb-1">
                                            <span>Upload</span>
                                            <span>{user.monthlyUsage?.upload || 0} GB</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-400 rounded-full" style={{ width: '20%' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 p-2 rounded-lg backdrop-blur-sm">
                                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                                    <span>Expires: <span className="text-white font-medium">{formatDate(user.expiresAt)}</span></span>
                                </div>

                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    <ProtectedButton
                                        permission={PERMISSIONS.CUSTOMERS_EDIT}
                                        onClick={() => setShowChangePlanModal(true)}
                                        className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors text-center"
                                    >
                                        Change Plan
                                    </ProtectedButton>
                                    <ProtectedButton
                                        permission={PERMISSIONS.CUSTOMERS_EDIT}
                                        onClick={() => setShowChangeExpiryModal(true)}
                                        className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors text-center"
                                    >
                                        Change Expiry
                                    </ProtectedButton>
                                    <ProtectedButton
                                        permission={PERMISSIONS.PAYMENTS_PROCESS}
                                        onClick={() => setShowResolveModal(true)}
                                        className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium transition-colors text-center"
                                    >
                                        Resolve
                                    </ProtectedButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Tabs Section - Full width of right column */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                            <button
                                onClick={() => setActiveTab("receipts")}
                                className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "receipts"
                                    ? "bg-cyan-500 text-white rounded-md"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    }`}
                            >
                                E-Receipts
                            </button>
                            <button
                                onClick={() => setActiveTab("recharge")}
                                className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === "recharge"
                                    ? "bg-cyan-500 text-white rounded-md"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    }`}
                            >
                                MANUAL RECHARGE
                            </button>
                        </div>

                        <div className="p-4">
                            {activeTab === "receipts" ? (
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Latest Payments</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px] text-sm">
                                            <thead>
                                                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">#</th>
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">TRXDATE</th>
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">TRXCODE</th>
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">PAYBILL</th>
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">AMOUNT</th>
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">PHONE</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-slate-700 dark:text-slate-300">
                                                {mpesaTransactions.length > 0 ? (
                                                    mpesaTransactions
                                                        .slice((trxPage - 1) * trxPageSize, trxPage * trxPageSize)
                                                        .map((trx, index) => (
                                                            <tr key={trx.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                                                <td className="px-4 py-3 whitespace-nowrap">{(trxPage - 1) * trxPageSize + index + 1}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap">{formatDate(trx.trxDate)}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{trx.trxCode}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap">{trx.paybill}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap font-medium">KES {trx.amount.toLocaleString()}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap">{trx.phone}</td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                                            No Mpesa payments found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination Controls */}
                                    {Math.ceil(mpesaTransactions.length / trxPageSize) > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                            <span className="text-xs text-slate-500">
                                                Page {trxPage} of {Math.ceil(mpesaTransactions.length / trxPageSize)}
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setTrxPage(Math.max(1, trxPage - 1))}
                                                    disabled={trxPage === 1}
                                                    className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => setTrxPage(Math.min(Math.ceil(mpesaTransactions.length / trxPageSize), trxPage + 1))}
                                                    disabled={trxPage === Math.ceil(mpesaTransactions.length / trxPageSize)}
                                                    className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px] text-sm">
                                            <thead>
                                                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">#</th>
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">YOUR REF</th>
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">AMOUNT</th>
                                                    <th className="px-4 py-3 font-medium whitespace-nowrap">TRXDATE</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-slate-700 dark:text-slate-300">
                                                {manualTransactions.length > 0 ? (
                                                    manualTransactions
                                                        .slice((trxPage - 1) * trxPageSize, trxPage * trxPageSize)
                                                        .map((trx, index) => (
                                                            <tr key={trx.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                                                                <td className="px-4 py-3 whitespace-nowrap">{(trxPage - 1) * trxPageSize + index + 1}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap">{trx.yourRef}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap font-medium">KES {trx.amount.toLocaleString()}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap">{formatDate(trx.trxDate)}</td>
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-slate-400">
                                                            No manual recharges found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination Controls */}
                                    {Math.ceil(manualTransactions.length / trxPageSize) > 1 && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                            <span className="text-xs text-slate-500">
                                                Page {trxPage} of {Math.ceil(manualTransactions.length / trxPageSize)}
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setTrxPage(Math.max(1, trxPage - 1))}
                                                    disabled={trxPage === 1}
                                                    className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => setTrxPage(Math.min(Math.ceil(manualTransactions.length / trxPageSize), trxPage + 1))}
                                                    disabled={trxPage === Math.ceil(manualTransactions.length / trxPageSize)}
                                                    className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EditUserModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                user={user}
                onSave={handleEditUser}
            />

            <AddChildModal
                isOpen={showAddChildModal}
                onClose={() => setShowAddChildModal(false)}
                parentExpiresAt={user?.expiresAt}
                onSave={handleAddChild}
            />

            <SendSMSModal
                isOpen={showSMSModal}
                onClose={() => setShowSMSModal(false)}
                phone={user?.phone}
                onSend={handleSendSMS}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone and will remove all associated data."
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
                message="Are you sure you want to forcefully terminate this session? The client will be disconnected and forced to reconnect."
                confirmText="Disconnect"
                confirmColor="amber"
                icon={ModalIcons.Purge}
            />

            <ChangeExpiryModal
                isOpen={showChangeExpiryModal}
                onClose={() => setShowChangeExpiryModal(false)}
                currentExpiry={user?.expiresAt}
                onSave={handleChangeExpiry}
            />

            <ResolveTransactionModal
                isOpen={showResolveModal}
                onClose={() => setShowResolveModal(false)}
                targetCustomerId={id || ""}
                targetCustomerName={user?.name}
                onResolve={handleResolveTransaction}
            />

            <ChangePlanModal
                isOpen={showChangePlanModal}
                onClose={() => setShowChangePlanModal(false)}
                currentPackageId={user?.packageId}
                currentPackageName={user?.package?.name}
                onSelect={handleChangePackage}
            />
        </div>
    );
}
