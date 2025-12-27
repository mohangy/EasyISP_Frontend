import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Search,
    Plus,
    FileDown,
    RotateCcw,
    Filter,
    Eye,
    Send,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    MoreVertical
} from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import toast from "react-hot-toast";

// Currency formatter for KES
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Mock invoice data
const MOCK_INVOICES = Array.from({ length: 50 }).map((_, i) => ({
    id: `INV-${String(2024001 + i).padStart(7, '0')}`,
    customerId: 1000 + i,
    customerName: ["John Doe", "Jane Smith", "Alex Mwangi", "Grace Ochieng", "Peter Kamau"][i % 5],
    customerPhone: ["0712345678", "0723456789", "0734567890", "0745678901", "0756789012"][i % 5],
    amount: [3000, 4500, 5000, 7500, 10000][i % 5],
    status: ["paid", "pending", "overdue", "draft", "cancelled"][i % 5] as "paid" | "pending" | "overdue" | "draft" | "cancelled",
    dueDate: new Date(Date.now() + (i % 5 - 2) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB'),
    items: [
        { description: "Monthly Internet Subscription - 10 Mbps", quantity: 1, unitPrice: [3000, 4500, 5000, 7500, 10000][i % 5] }
    ]
}));

const STATUS_CONFIG = {
    paid: { label: "Paid", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    pending: { label: "Pending", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    overdue: { label: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
    draft: { label: "Draft", color: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300", icon: Clock },
    cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500", icon: XCircle },
};

export function Invoices() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filter logic
    const filteredData = useMemo(() => {
        return MOCK_INVOICES.filter(invoice => {
            const matchesSearch =
                invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                invoice.customerPhone.includes(searchQuery);
            const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchQuery, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    // Stats
    const stats = useMemo(() => {
        const total = MOCK_INVOICES.reduce((sum, inv) => sum + inv.amount, 0);
        const paid = MOCK_INVOICES.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
        const pending = MOCK_INVOICES.filter(inv => inv.status === "pending").reduce((sum, inv) => sum + inv.amount, 0);
        const overdue = MOCK_INVOICES.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + inv.amount, 0);
        return { total, paid, pending, overdue };
    }, []);

    const handleExport = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            { loading: 'Generating Excel...', success: 'Report downloaded!', error: 'Failed to generate' }
        );
    };

    const handleReset = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setCurrentPage(1);
        toast.success("Filters reset");
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage customer invoices and billing
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Create Invoice
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Invoiced</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(stats.total)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Paid</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(stats.paid)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(stats.pending)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Overdue</p>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(stats.overdue)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full">
                    <select
                        value={rowsPerPage}
                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-sm order-1"
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
                            placeholder="Search invoices..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full md:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 placeholder:text-slate-500 text-sm"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-sm order-3"
                    >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="draft">Draft</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <div className="basis-full h-0 md:hidden order-4"></div>

                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm order-5">
                        <FileDown className="w-4 h-4" />
                        Export
                    </button>
                    <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm order-6">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Invoice #</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Due Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Created</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {paginatedData.map((invoice) => {
                                const StatusIcon = STATUS_CONFIG[invoice.status].icon;
                                return (
                                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                                {invoice.id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{invoice.customerName}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.customerPhone}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {formatCurrency(invoice.amount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[invoice.status].color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {STATUS_CONFIG[invoice.status].label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{invoice.dueDate}</td>
                                        <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{invoice.createdAt}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                                    <button className="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Send Reminder">
                                                        <Send className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors" title="More">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} invoices
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <span className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Create Invoice Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Invoice"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        Invoice creation form will be implemented here.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { toast.success("Invoice created!"); setShowCreateModal(false); }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
