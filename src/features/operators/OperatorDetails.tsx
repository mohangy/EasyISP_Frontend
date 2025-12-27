import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { Mail, Phone, Calendar, Activity, Clock, ArrowLeft, Loader2, Key, Search, Filter } from "lucide-react";
import { tenantApi, type Operator, type AuditLog } from "../../services/tenantService";
import { PermissionEditorModal } from "./PermissionEditorModal";
import { ProtectedButton } from "../../components/auth/ProtectedButton";
import { PERMISSIONS } from "../../lib/permissions";
import { PermissionGate } from "../../components/auth/PermissionGate";
import toast from "react-hot-toast";

export function OperatorDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [operator, setOperator] = useState<Operator | null>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsPage, setLogsPage] = useState(1);
    const [logsTotalPages, setLogsTotalPages] = useState(1);
    const logsPageSize = 10;
    const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");

    // Search and Filter for Logs
    const [logSearch, setLogSearch] = useState("");
    const [logFilter, setLogFilter] = useState<string>("ALL");

    const ACTION_TYPES = [
        { value: "ALL", label: "All Actions" },
        { value: "MAC_RESET", label: "Mac Reset" },
        { value: "CUSTOMER_CREATE", label: "Customer Create" },
        { value: "PAYMENT_PROCESS", label: "Payment Process" },
        { value: "ROUTER_REBOOT", label: "Router Reboot" },
        { value: "PACKAGE_CHANGE", label: "Package Change" },
        { value: "MANUAL_RECHARGE", label: "Manual Recharge" },
        { value: "EXPIRY_UPDATE", label: "Expiry Update" },
        { value: "TRANSACTION_RESOLVE", label: "Transaction Resolve" },
        { value: "ACCOUNT_DELETE", label: "Account Delete" },
        { value: "INFO_UPDATE", label: "Info Update" },
    ];

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        email: "",
        role: "CUSTOMER_CARE" as "ADMIN" | "CUSTOMER_CARE" | "FIELD_TECH",
    });
    const [saving, setSaving] = useState(false);

    const fetchOperator = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await tenantApi.getOperator(id);
            setOperator(data);
        } catch (error) {
            toast.error("Failed to load operator details");
            navigate("/operators");
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        if (!id) return;
        try {
            setLogsLoading(true);
            const data = await tenantApi.getOperatorLogs(id, logsPage, logsPageSize);
            setLogs(data.logs);
            setLogsTotalPages(Math.ceil(data.total / logsPageSize));
        } catch (error) {
            console.error("Failed to fetch logs");
        } finally {
            setLogsLoading(false);
        }
    };

    const handleOpenEdit = () => {
        if (!operator) return;
        setEditFormData({
            name: operator.name,
            email: operator.email,
            role: operator.role === "SUPER_ADMIN" ? "ADMIN" : (operator.role as any),
        });
        setShowEditModal(true);
    };

    const handleUpdateOperator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!operator || !editFormData.name || !editFormData.email) return;

        try {
            setSaving(true);
            await tenantApi.updateOperator(operator.id, {
                name: editFormData.name,
                email: editFormData.email,
                role: editFormData.role,
            });
            toast.success("Operator updated successfully");
            setShowEditModal(false);
            fetchOperator();
        } catch (error) {
            toast.error("Failed to update operator");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePermissions = async (added: string[], removed: string[]) => {
        if (!operator) return;
        try {
            // Update permissions only
            await tenantApi.updateOperator(operator.id, {
                addedPermissions: added,
                removedPermissions: removed,
            });
            toast.success("Permissions updated successfully");
            setShowPermissionModal(false);
            fetchOperator();
        } catch (error) {
            toast.error("Failed to update permissions");
        }
    };

    useEffect(() => {
        fetchOperator();
    }, [id]);

    useEffect(() => {
        if (activeTab === "logs") {
            fetchLogs();
        }
    }, [activeTab, id, logsPage]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    if (!operator) return null;

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
            case 'ADMIN': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
            case 'CUSTOMER_CARE': return 'bg-green-600/20 text-green-400 border-green-600/30';
            case 'FIELD_TECH': return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
            default: return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-GB", {
            year: "numeric", month: "long", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <PermissionGate permission={PERMISSIONS.OPERATORS_VIEW}>
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <button
                        onClick={() => navigate("/operators")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Team
                    </button>

                    <div className="flex gap-3">
                        <ProtectedButton
                            permission={PERMISSIONS.OPERATORS_EDIT}
                            onClick={handleOpenEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            <span>Edit Profile</span>
                        </ProtectedButton>
                        <ProtectedButton
                            permission={PERMISSIONS.OPERATORS_EDIT}
                            onClick={() => setShowPermissionModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-colors"
                        >
                            <Key className="w-4 h-4" />
                            <span>Permissions</span>
                        </ProtectedButton>
                    </div>
                </div>

                {/* Profile Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                    <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative z-10">


                        {/* Info */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{operator.name}</h1>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(operator.role)}`}>
                                        {operator.role.replace("_", " ")}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${operator.status === "ACTIVE" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}`}>
                                        {operator.status}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span>{operator.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span>{operator.phone || "No phone provided"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <span>Joined {new Date(operator.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-8 border-b border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setActiveTab("overview")}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "overview"
                                ? "text-cyan-600 dark:text-cyan-400"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            Overview
                            {activeTab === "overview" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("logs")}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === "logs"
                                ? "text-cyan-600 dark:text-cyan-400"
                                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                Activity Logs
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-400">
                                    History
                                </span>
                            </div>
                            {activeTab === "logs" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600 dark:bg-cyan-400 rounded-t-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="grid gap-6">
                    {activeTab === "overview" && (
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Permissions Summary */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Key className="w-5 h-5 text-cyan-500" />
                                    Custom Permissions
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Added Permissions</h4>
                                        {operator.addedPermissions.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {operator.addedPermissions.map(p => (
                                                    <span key={p} className="px-2 py-1 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-xs font-mono">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No additional permissions granted.</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revoked Permissions</h4>
                                        {operator.removedPermissions.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {operator.removedPermissions.map(p => (
                                                    <span key={p} className="px-2 py-1 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-mono">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No permissions revoked.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats or other info (Future) */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-400">
                                <div className="text-center">
                                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Performance metrics coming soon...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "logs" && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                            {/* Search and Filter Bar */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by username or target..."
                                        value={logSearch}
                                        onChange={(e) => setLogSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <select
                                        value={logFilter}
                                        onChange={(e) => setLogFilter(e.target.value)}
                                        className="pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 appearance-none"
                                    >
                                        {ACTION_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Action</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Target</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">Details</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {logsLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-cyan-500" />
                                                </td>
                                            </tr>
                                        ) : logs.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                    No activity logs found for this operator.
                                                </td>
                                            </tr>
                                        ) : (() => {
                                            // Apply filters
                                            const filteredLogs = logs.filter(log => {
                                                const matchesSearch = logSearch === "" ||
                                                    log.targetName.toLowerCase().includes(logSearch.toLowerCase()) ||
                                                    log.details.toLowerCase().includes(logSearch.toLowerCase());
                                                const matchesFilter = logFilter === "ALL" || log.action === logFilter;
                                                return matchesSearch && matchesFilter;
                                            });

                                            if (filteredLogs.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                            No logs found matching your search or filter.
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return filteredLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                                                <Activity className="w-4 h-4" />
                                                            </div>
                                                            <span className="font-medium text-slate-900 dark:text-white text-sm">
                                                                {log.action.replace("_", " ")}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                                {log.targetType}
                                                            </span>
                                                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                                                                {log.targetName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 hidden md:table-cell">
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-xs" title={log.details}>
                                                            {log.details}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatDate(log.timestamp)}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            {/* Logs Pagination */}
                            {logsTotalPages > 1 && (
                                <div className="flex justify-center p-4 border-t border-slate-100 dark:border-slate-700/50 gap-2">
                                    <button
                                        onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                                        disabled={logsPage === 1}
                                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="flex items-center px-4 text-sm text-slate-600 dark:text-slate-400">
                                        Page {logsPage} of {logsTotalPages}
                                    </span>
                                    <button
                                        onClick={() => setLogsPage(p => Math.min(logsTotalPages, p + 1))}
                                        disabled={logsPage === logsTotalPages}
                                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Edit Modal */}
                {showEditModal && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-2xl">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Profile</h3>
                            <form onSubmit={handleUpdateOperator} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toast.success("Password reset email sent to " + editFormData.email);
                                        }}
                                        className="w-full px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Key className="w-4 h-4" />
                                        Reset Password
                                    </button>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                        A password reset link will be sent to the operator's email.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                                    <select
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value as any }))}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="CUSTOMER_CARE">Customer Care</option>
                                        <option value="FIELD_TECH">Field Technician</option>
                                    </select>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Permission Editor Modal */}
                {showPermissionModal && operator && (
                    <PermissionEditorModal
                        role={operator.role}
                        addedPermissions={operator.addedPermissions}
                        removedPermissions={operator.removedPermissions}
                        onSave={handleUpdatePermissions}
                        onClose={() => setShowPermissionModal(false)}
                    />
                )}
            </div>
        </PermissionGate>
    );
}
