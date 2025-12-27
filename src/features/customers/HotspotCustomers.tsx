import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Download, RotateCcw, Loader2, Search } from "lucide-react";
import { customerApi, type Customer } from "../../services/customerService";
import toast from "react-hot-toast";
import { PERMISSIONS } from "../../lib/permissions";
import { ProtectedButton } from "../../components/auth/ProtectedButton";
import { AddHotspotUserModal, ConfirmModal, ModalIcons } from "./UserActionModals";

export function HotspotCustomers() {
    const location = useLocation();

    // Data state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showDeleteExpiredModal, setShowDeleteExpiredModal] = useState(false);
    const [showDeleteUnusedModal, setShowDeleteUnusedModal] = useState(false);
    // const { can } = usePermissions();

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // New Filters from Navigation
    const [packageFilter, setPackageFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");

    // Initialize filters from location state
    useEffect(() => {
        if (location.state) {
            if (location.state.packageId) {
                setPackageFilter(location.state.packageId);
            }
            if (location.state.status) {
                setStatusFilter(location.state.status.toUpperCase());
            }
            // Clear state so it doesn't persist on refresh if desired, 
            // but keeping it is fine for now.
            // window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // Fetch customers from API
    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await customerApi.getCustomers({
                page: currentPage,
                pageSize,
                connectionType: "HOTSPOT",
                search: searchQuery || undefined,
                packageId: packageFilter || undefined,
                status: statusFilter as any || undefined,
            });
            setCustomers(response.customers);
            setTotalCustomers(response.total);
        } catch (error) {
            console.error("Failed to fetch hotspot customers:", error);
            setCustomers([]);
            setTotalCustomers(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchQuery, packageFilter, statusFilter]);

    // Load data on mount and when filters change
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleResetTable = () => {
        setSearchQuery("");
        setCurrentPage(1);
    };

    const confirmDeleteExpired = async () => {
        try {
            // await customerApi.deleteExpiredHotspotUsers();
            toast.success("Expired users deleted");
            fetchCustomers();
            setShowDeleteExpiredModal(false);
        } catch {
            toast.error("Failed to delete expired users");
        }
    };

    const confirmDeleteUnused = async () => {
        try {
            // await customerApi.deleteUnusedHotspotUsers();
            toast.success("Unused users deleted");
            fetchCustomers();
            setShowDeleteUnusedModal(false);
        } catch {
            toast.error("Failed to delete unused users");
        }
    };

    const totalPages = Math.ceil(totalCustomers / pageSize);

    const getActivityColor = (isOnline?: boolean) => {
        return isOnline ? "text-cyan-400" : "text-orange-400";
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-white">
                        Hotspot Users ({totalCustomers})
                    </h1>
                    <p className="text-xs text-slate-400">
                        Overview of all Hotspot Users
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ProtectedButton
                        permission={PERMISSIONS.CUSTOMERS_CREATE}
                        onClick={() => setShowAddUserModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        ADD USER
                    </ProtectedButton>
                    <ProtectedButton
                        permission={PERMISSIONS.CUSTOMERS_DELETE}
                        onClick={() => setShowDeleteExpiredModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-orange-500 text-orange-500 rounded-lg font-medium hover:bg-orange-500/10 transition-all text-sm"
                    >
                        Delete Expired
                    </ProtectedButton>
                    <ProtectedButton
                        permission={PERMISSIONS.CUSTOMERS_DELETE}
                        onClick={() => setShowDeleteUnusedModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-rose-500 text-rose-500 rounded-lg font-medium hover:bg-rose-500/10 transition-all text-sm"
                    >
                        Delete Unused
                    </ProtectedButton>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full">
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm order-1"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>

                    <div className="relative flex-1 md:w-auto order-2 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Force Line Break on Mobile */}
                    <div className="basis-full h-0 md:hidden order-3"></div>

                    {/* Action Buttons */}
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-700 transition-all text-sm order-4">
                        <Download className="w-4 h-4" />
                        Export to Excel
                    </button>
                    <button
                        onClick={handleResetTable}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-700 transition-all text-sm order-5"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset Table
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">USERNAME</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">ACTIVITY</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">PACKAGE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">IP</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">MAC</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">SITE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">CREATED</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                        <p className="text-sm text-slate-400 mt-2">Loading hotspot users...</p>
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                        No hotspot users found
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer, index) => (
                                    <tr key={customer.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Link
                                                to={`/customers/hotspot/${customer.id}`}
                                                className="text-sm text-cyan-400 hover:underline hover:text-cyan-300 transition-colors"
                                            >
                                                {customer.username}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`text-sm ${getActivityColor(customer.isOnline)}`}>
                                                {customer.isOnline ? "online" : "offline"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-200">
                                                {customer.package?.name || "-"} @ KES {customer.package?.price || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{customer.ipAddress || "-"}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300 font-mono">{customer.macAddress || "-"}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{customer.nas?.name || "-"}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{formatDate(customer.createdAt)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
                <div className="flex justify-center">
                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            « Prev
                        </button>
                        {getPageNumbers().map((page, idx) => (
                            typeof page === "number" ? (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1.5 text-sm rounded ${currentPage === page
                                        ? "bg-cyan-500 text-white"
                                        : "text-slate-400 hover:text-white hover:bg-slate-700"
                                        }`}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={idx} className="px-2 text-slate-500">...</span>
                            )
                        ))}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next »
                        </button>
                    </div>
                </div>
            )}

            {/* Items count */}
            <div className="text-center text-sm text-slate-400">
                Items : {totalCustomers}
            </div>

            <AddHotspotUserModal
                isOpen={showAddUserModal}
                onClose={() => setShowAddUserModal(false)}
                onSuccess={() => {
                    toast.success("Added successfully");
                    fetchCustomers();
                }}
            />

            <ConfirmModal
                isOpen={showDeleteExpiredModal}
                onClose={() => setShowDeleteExpiredModal(false)}
                onConfirm={confirmDeleteExpired}
                title="Delete Expired Users"
                message="Are you sure you want to delete all expired hotspot users? This action cannot be undone."
                confirmText="Delete Expired"
                confirmColor="amber"
                icon={ModalIcons.Delete}
            />

            <ConfirmModal
                isOpen={showDeleteUnusedModal}
                onClose={() => setShowDeleteUnusedModal(false)}
                onConfirm={confirmDeleteUnused}
                title="Delete Unused Users"
                message="Are you sure you want to delete all unused hotspot users? This action cannot be undone."
                confirmText="Delete Unused"
                confirmColor="red"
                icon={ModalIcons.Delete}
            />
        </div>
    );
}
