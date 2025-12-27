import { useState, useEffect } from "react";
import { Search, Download, Plus, Filter, Loader2, Smartphone, Banknote, CreditCard } from "lucide-react";
import { paymentService } from "../../services/paymentService";
import { Modal } from "../../components/ui/Modal";
import toast from "react-hot-toast";
import { ProtectedButton } from "../../components/auth/ProtectedButton";
import { PERMISSIONS } from "../../lib/permissions";

interface IncomeTransaction {
    id: number;
    date: string;
    customer: string;
    description: string;
    amount: number;
    method: 'M-Pesa' | 'Cash' | 'Bank';
    reference: string;
    status: 'completed' | 'pending';
}

// Currency formatter for KES
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export function Income() {
    const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [methodFilter, setMethodFilter] = useState<string>("all");
    const [stats, setStats] = useState({
        totalIncome: 0,
        mpesaTotal: 0,
        cashTotal: 0,
        transactionCount: 0
    });
    const [showRecordModal, setShowRecordModal] = useState(false);

    useEffect(() => {
        const fetchIncome = async () => {
            try {
                const paymentStats = await paymentService.getPaymentStats();

                // Convert to income transactions
                const incomeData: IncomeTransaction[] = paymentStats.recentTransactions.map((tx) => ({
                    id: tx.id,
                    date: tx.date,
                    customer: tx.description.split(' - ')[1] || 'Customer',
                    description: tx.description,
                    amount: tx.amount,
                    method: tx.method as 'M-Pesa' | 'Cash' | 'Bank',
                    reference: `PAY-${tx.id.toString().padStart(6, '0')}`,
                    status: 'completed' as const
                }));

                setTransactions(incomeData);
                setStats({
                    totalIncome: paymentStats.totalRevenue,
                    mpesaTotal: paymentStats.electronicTotal,
                    cashTotal: paymentStats.manualTotal,
                    transactionCount: paymentStats.totalTransactions
                });
            } catch (error) {
                console.error("Failed to fetch income data:", error);
                toast.error("Failed to load income data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchIncome();
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMethod = methodFilter === "all" || tx.method === methodFilter;
        return matchesSearch && matchesMethod;
    });

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'M-Pesa': return <Smartphone className="w-4 h-4 text-green-500" />;
            case 'Cash': return <Banknote className="w-4 h-4 text-amber-500" />;
            case 'Bank': return <CreditCard className="w-4 h-4 text-blue-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Income</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Track all revenue from customer payments
                    </p>
                </div>
                <ProtectedButton
                    permission={PERMISSIONS.FINANCE_INCOME_CREATE}
                    onClick={() => setShowRecordModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Record Income
                </ProtectedButton>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Income</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-green-500" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">M-Pesa</p>
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(stats.mpesaTotal)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-amber-500" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">Cash/Manual</p>
                    </div>
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(stats.cashTotal)}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Transactions</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.transactionCount}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search customer, reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        value={methodFilter}
                        onChange={(e) => setMethodFilter(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white min-w-[150px]"
                    >
                        <option value="all">All Methods</option>
                        <option value="M-Pesa">M-Pesa</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                    </select>
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm whitespace-nowrap">
                    <Download className="w-4 h-4" />
                    Export
                </button>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reference</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Method</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {tx.date}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {tx.customer}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                                            {tx.reference}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                {getMethodIcon(tx.method)}
                                                {tx.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                                +{formatCurrency(tx.amount)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredTransactions.length === 0 && (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        No income transactions found
                    </div>
                )}
            </div>

            {/* Record Income Modal */}
            <Modal
                isOpen={showRecordModal}
                onClose={() => setShowRecordModal(false)}
                title="Record Income"
            >
                <form onSubmit={(e) => { e.preventDefault(); toast.success("Income recorded!"); setShowRecordModal(false); }} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (KES) *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                placeholder="0"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method *</label>
                            <select
                                required
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="M-Pesa">M-Pesa</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank Transfer</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reference</label>
                            <input
                                type="text"
                                placeholder="e.g. Transaction ID"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                            <input
                                type="date"
                                required
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea
                            rows={2}
                            placeholder="Optional notes..."
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => setShowRecordModal(false)}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            Record Income
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
