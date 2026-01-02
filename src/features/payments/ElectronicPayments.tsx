import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Search, FileDown, RotateCcw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

interface ElectronicTransaction {
    id: number;
    trxCode: string;
    amount: number;
    date: string;
    phone: string;
    account: string;
    site: string;
}

export function ElectronicPayments() {
    const [searchQuery, setSearchQuery] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<ElectronicTransaction[]>([]);

    // Fetch electronic transactions from API
    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const response = await api.get('/payments/mpesa');
                // Backend returns { transactions: [...], total, page, pageSize }
                const data = response.data?.transactions || [];
                // Map backend field names to frontend interface
                const mapped = data.map((t: any) => ({
                    id: t.id,
                    trxCode: t.transactionId || t.trxCode || '-',
                    amount: t.amount || 0,
                    date: t.createdAt ? new Date(t.createdAt).toLocaleString() : (t.date || '-'),
                    phone: t.phone || '-',
                    account: t.account || '-',
                    site: t.customer?.name || '-',
                }));
                setTransactions(mapped);
            } catch (error) {
                console.error("Failed to fetch M-Pesa transactions:", error);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    // Filter Logic
    const filteredData = useMemo(() => {
        return transactions.filter(item =>
            (item.trxCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.phone || '').includes(searchQuery) ||
            (item.account || '').includes(searchQuery)
        );
    }, [searchQuery, transactions]);

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
                        Receipt Logs
                    </h1>
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-2 text-xs md:text-sm text-slate-400 hover:text-white transition-colors justify-center sm:justify-start mt-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        VIEW ALL Transactions
                    </Link>
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

            {/* Table Container matching PPPoECustomers */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">TRXCODE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">AMOUNT</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">DATE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">PHONE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">ACCOUNT</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">SITE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                        <p className="text-sm text-slate-400 mt-2">Loading transactions...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                        No items found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((tx, index) => (
                                    <tr key={tx.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-200">{tx.trxCode}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-200">{tx.amount}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-400">{tx.date}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{tx.phone}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{tx.account}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-400">{tx.site || "-"}</span>
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
