import { useState, useMemo } from "react";
import { Search, FileDown, RotateCcw, Loader2, Trash2, Settings, PenSquare, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../lib/permissions";

// Mock Data
const MOCK_SMS_LOGS = Array.from({ length: 313 }).map((_, i) => ({
    id: 1420120 - i,
    phone: ["254721731746", "0706663600", "0727660369", "254712345678"][Math.floor(Math.random() * 4)],
    message: [
        "Dear CHARLSE, your Monthly 7 Mbps internet subscription has expired.",
        "Dear Hindawiya, KES 4000.00 for account 0706663600 has been received.",
        "Dear Hindawiya, Your Monthly 30 Mbps internet package has been renewed.",
        "Dear CHRISTINE, your Monthly 7 Mbps internet subscription is active."
    ][Math.floor(Math.random() * 4)],
    status: "success",
    initiator: ["subscription expiry", "lipa na paybill", "renew subscription"][Math.floor(Math.random() * 3)],
    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(',', '')
}));

export function SMSOutbox() {
    const { can } = usePermissions();
    const [searchQuery, setSearchQuery] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Filter Logic
    const filteredData = useMemo(() => {
        return MOCK_SMS_LOGS.filter(item =>
            item.phone.includes(searchQuery) ||
            item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.initiator.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchQuery("");
        setCurrentPage(1);
        setRowsPerPage(20);
        toast.success("Table filters reset");
    };

    const handleExport = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Generating Excel report...',
                success: 'Report downloaded successfully!',
                error: 'Could not generate report',
            }
        );
    };

    const handleClearAll = () => {
        if (can(PERMISSIONS.SMS_DELETE)) {
            setShowClearModal(true);
        } else {
            toast.error("You do not have permission to clear SMS logs");
        }
    };

    const confirmClearAll = () => {
        toast.promise(
            new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                    setShowClearModal(false);
                }, 1500);
            }),
            {
                loading: 'Clearing SMS outbox...',
                success: 'Outbox cleared successfully',
                error: 'Failed to clear outbox',
            }
        );
    };

    const handleCompose = () => {
        if (can(PERMISSIONS.SMS_SEND)) {
            setShowComposeModal(true);
        } else {
            toast.error("You do not have permission to send SMS");
        }
    };

    const sendSMS = (e: React.FormEvent) => {
        e.preventDefault();
        toast.promise(
            new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                    setShowComposeModal(false);
                }, 1500);
            }),
            {
                loading: 'Sending SMS...',
                success: 'Message sent successfully',
                error: 'Failed to send message',
            }
        );
    };


    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push("...");
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Page Header */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700/50 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">SMS Outbox</h1>
                        <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
                            <p className="text-sm text-slate-400">Overview of Outgoing SMS Reports</p>
                        </div>
                    </div>
                    <div className="space-y-1 flex flex-col items-center md:items-start">
                        <h2 className="text-lg font-bold text-slate-200">BLESSEDTEXTS</h2>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-200">SMS BALANCE: 201</h2>
                            <button
                                onClick={() => toast.success("Balance refreshed: 201")}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all"
                                title="Refresh Balance"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="flex items-center justify-center gap-2 px-3 md:px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs md:text-sm font-medium uppercase"
                    >
                        <Settings className="w-3 h-3 md:w-4 md:h-4" />
                        SETTINGS
                    </button>
                    <button
                        onClick={handleCompose}
                        className="flex items-center justify-center gap-2 px-3 md:px-6 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-700 transition-all text-xs md:text-sm font-medium uppercase"
                    >
                        <PenSquare className="w-3 h-3 md:w-4 md:h-4" />
                        COMPOSE
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center justify-center gap-2 px-3 md:px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors text-xs md:text-sm font-medium uppercase"
                    >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        CLEAR
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full">
                    {/* Rows Per Page */}
                    <select
                        value={rowsPerPage}
                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm order-1"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>

                    {/* Search */}
                    <div className="relative flex-1 md:w-auto order-2 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter items..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full md:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Force Line Break on Mobile */}
                    <div className="basis-full h-0 md:hidden order-3"></div>

                    {/* Action Buttons */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-green-700 hover:border-green-600 hover:text-white transition-all text-sm order-4"
                    >
                        <FileDown className="w-4 h-4" />
                        <span>Export to Excel</span>
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-amber-700 hover:border-amber-600 hover:text-white transition-all text-sm order-5"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset Table</span>
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                title="Clear SMS Outbox"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        Are you sure you want to clear all messages from the outbox? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowClearModal(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmClearAll}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                        </button>
                    </div>
                </div>
            </Modal>

            {/* SMS Settings Modal */}
            <Modal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                title="SMS Settings"
            >
                <div className="space-y-6">
                    <div className="text-center space-y-4">
                        <p className="text-slate-400 text-sm">Manage your SMS Settings and details</p>
                        <button className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all text-sm uppercase">
                            SMS Templates
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase">
                            Select SMS Provider: <span className="text-red-500">*</span>
                        </label>
                        <select className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none">
                            <option value="">---Select---</option>
                            <option value="BLESSEDTEXTS">BLESSEDTEXTS KENYA</option>
                            <option value="BYTEWAVE">Bytewave KENYA</option>
                            <option value="TEXTSMS">TextSMS KENYA</option>
                            <option value="TALKSASA">TALKSASA KENYA</option>
                            <option value="CELCOM">CELCOM KENYA</option>
                            <option value="AFRICAISTALKING">Africa Is Talking</option>
                            <option value="ADVANTA">Advanta AFRICA Limited</option>
                            <option value="HOSTPINNACLE">HOSTPINNACLE KENYA</option>
                            <option value="TILIL">TILIL KENYA</option>
                            <option value="NEXTSMS">NEXTSMS TANZANIA</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Compose SMS Modal */}
            <Modal
                isOpen={showComposeModal}
                onClose={() => setShowComposeModal(false)}
                title="Compose New Message"
            >
                <form onSubmit={sendSMS} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            placeholder="e.g. 254712345678"
                            required
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Message
                        </label>
                        <textarea
                            placeholder="Type your message here..."
                            required
                            rows={4}
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowComposeModal(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <PenSquare className="w-4 h-4" />
                            Send Message
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Table Container */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">PHONE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[40%]">MESSAGE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">STATUS</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">INITIATOR</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">DATE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                        <p className="text-sm text-slate-400 mt-2">Loading logs...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                        No items found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer">{item.id}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{item.phone}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-300 truncate max-w-[400px]" title={item.message}>
                                                {item.message}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-medium text-green-500">{item.status}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{item.initiator}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-400">{item.date}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Items : {filteredData.length}
                </div>

                {totalPages > 0 && (
                    <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            « Prev
                        </button>
                        {getPageNumbers().map((page, index) => (
                            typeof page === "number" ? (
                                <button
                                    key={index}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-2 text-sm rounded-lg transition-colors min-w-[40px] ${currentPage === page
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-300 hover:bg-slate-700"
                                        }`}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={index} className="px-2 py-2 text-slate-500">...</span>
                            )
                        ))}
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next »
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
