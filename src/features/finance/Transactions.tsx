import { useState, useEffect } from "react";
import { Search, Download, Filter, Loader2, Calendar } from "lucide-react";
import { paymentService } from "../../services/paymentService";
import toast from "react-hot-toast";

interface Transaction {
    id: string | number;
    date: string;
    description: string;
    reference: string;
    amount: number;
    type: 'credit' | 'debit';
    category: string;
    status: 'posted' | 'pending';
}

// Mock Expense Transactions
const MOCK_EXPENSES: Transaction[] = [
    { id: 'exp-1', date: '2024-12-26T14:00:00', description: 'Safaricom Bandwidth Payment', reference: 'INV-001', amount: 125000, type: 'debit', category: 'Bandwidth', status: 'posted' },
    { id: 'exp-2', date: '2024-12-25T09:00:00', description: 'Office Rent - December', reference: 'RENT-DEC', amount: 45000, type: 'debit', category: 'Rent', status: 'posted' },
    { id: 'exp-3', date: '2024-12-24T16:30:00', description: 'Staff Lunch', reference: 'EXP-102', amount: 2500, type: 'debit', category: 'Meals', status: 'posted' },
    { id: 'exp-4', date: '2024-12-23T11:00:00', description: 'Fiber Cable Purchase', reference: 'PO-405', amount: 15000, type: 'debit', category: 'Equipment', status: 'posted' },
    { id: 'exp-5', date: '2024-12-22T10:00:00', description: 'Electricity Token', reference: 'UTIL-003', amount: 5000, type: 'debit', category: 'Utilities', status: 'posted' },
];

export function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                // Get income from payment service
                const paymentStats = await paymentService.getPaymentStats();

                // Convert payment service transactions to our ledger format
                const incomeTransactions: Transaction[] = paymentStats.recentTransactions.map(pt => ({
                    id: pt.id,
                    date: new Date(pt.date).toISOString(), // rough conversion for sorting
                    description: pt.description,
                    reference: `PAY-${pt.id}`,
                    amount: pt.amount,
                    type: 'credit', // Income is Credit in revenue accounts (simplified view)
                    category: 'Sales',
                    status: 'posted'
                }));

                // Combine with mock expenses
                const allTransactions = [...incomeTransactions, ...MOCK_EXPENSES].sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                setTransactions(allTransactions);
            } catch (error) {
                console.error("Failed to fetch transactions:", error);
                toast.error("Failed to load transactions");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.reference.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || tx.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">General Ledger</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        View and manage all financial transactions
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
                        <Calendar className="w-4 h-4" />
                        Date Range
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search description, reference..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as any)}
                        className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white min-w-[150px]"
                    >
                        <option value="all">All Types</option>
                        <option value="credit">Income (Credit)</option>
                        <option value="debit">Expense (Debit)</option>
                    </select>
                </div>
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
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Description</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Category</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Reference</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Debit</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase text-right">Credit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {formatDate(tx.date)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {tx.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-mono">
                                            {tx.reference}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            {tx.type === 'debit' ? (
                                                <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(tx.amount)}</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm">
                                            {tx.type === 'credit' ? (
                                                <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(tx.amount)}</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredTransactions.length === 0 && (
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                        No transactions found matching your criteria
                    </div>
                )}
            </div>
        </div>
    );
}
