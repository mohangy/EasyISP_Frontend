import { useState, useMemo } from "react";
import { Search, FileDown, RotateCcw, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";

// Mock Data
const MOCK_RECHARGES = Array.from({ length: 158 }).map((_, i) => ({
    id: i + 1,
    ref: `TL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    account: `07${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    amount: [1500, 2500, 100, 2000][Math.floor(Math.random() * 4)],
    description: [
        "Paid to Mwachayamu Paybill",
        "Paid Via Till, Not Picked by system",
        "PAID CASH",
        "Paid to Mwachayamu"
    ][Math.floor(Math.random() * 4)],
    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(',', '')
}));

const TOTAL_AMOUNT = MOCK_RECHARGES.reduce((sum, item) => sum + item.amount, 0);

export function ManualPayments() {
    const [searchQuery, setSearchQuery] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Filter Logic
    const filteredData = useMemo(() => {
        return MOCK_RECHARGES.filter(item =>
            item.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.account.includes(searchQuery) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
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
        setCurrentPage(1); // Reset to first page on search
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

    const handleDeleteAll = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteAll = () => {
        toast.promise(
            new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                    setShowDeleteModal(false);
                }, 1500);
            }),
            {
                loading: 'Deleting all manual recharges...',
                success: 'All recharges deleted successfully',
                error: 'Failed to delete recharges',
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
            {/* Page Header matching PPPoECustomers */}
            <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700/50">
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-white">
                        Recharge Logs
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">
                        Total Manual Recharges: <span className="text-slate-200 font-medium">KES {TOTAL_AMOUNT}</span>
                    </p>
                </div>
                <div>
                    <button
                        onClick={handleDeleteAll}
                        className="flex items-center gap-2 px-4 py-2 bg-transparent border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors text-sm font-medium uppercase"
                    >
                        <Trash2 className="w-4 h-4" />
                        DELETE ALL
                    </button>
                </div>
            </div>

            {/* Filters Row matching PPPoECustomers */}
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Deletion"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        Are you sure you want to delete all manual recharge logs? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteAll}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete All
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Table Container matching PPPoECustomers */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">REF</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">ACCOUNT</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">AMOUNT</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">DESCRIPTION</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">DATE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                        <p className="text-sm text-slate-400 mt-2">Loading logs...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                        No items found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-200">{item.ref}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{item.account}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-200">{item.amount}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{item.description}</span>
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

            {/* Pagination / Footer matching PPPoECustomers */}
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
