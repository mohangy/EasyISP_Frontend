import { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCw,
    Calendar,
    Download,
    CreditCard,
    Smartphone,
    Banknote,
    PiggyBank,
    AlertCircle,
    CheckCircle2,
    Clock,
    Loader2
} from "lucide-react";
import { paymentService } from "../../services/paymentService";

// Currency formatter for KES
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Static expense data (would come from expense service in production)
const EXPENSE_DATA = {
    totalExpenses: 892340,
    expensesByCategory: [
        { name: "Bandwidth", amount: 423400, percentage: 47.4, color: "bg-blue-500" },
        { name: "Salaries", amount: 245000, percentage: 27.5, color: "bg-purple-500" },
        { name: "Equipment", amount: 98500, percentage: 11.0, color: "bg-cyan-500" },
        { name: "Rent & Utilities", amount: 65440, percentage: 7.3, color: "bg-amber-500" },
        { name: "Marketing", amount: 35000, percentage: 3.9, color: "bg-green-500" },
        { name: "Other", amount: 25000, percentage: 2.8, color: "bg-slate-500" },
    ],
};

// Type for payment stats
interface PaymentStats {
    totalRevenue: number;
    electronicTotal: number;
    manualTotal: number;
    todayTotal: number;
    todayElectronic: number;
    todayTransactions: number;
    todayElectronicTransactions: number;
    thisMonthTotal: number;
    growthPercent: string;
    totalTransactions: number;
    revenueByType: { name: string; amount: number; percentage: number }[];
    recentTransactions: { id: number; type: string; description: string; amount: number; date: string; method: string }[];
}

export function FinanceDashboard() {
    const [selectedPeriod, setSelectedPeriod] = useState("this_month");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);

    // Fetch payment data on mount and refresh
    const fetchPaymentData = async () => {
        try {
            const stats = await paymentService.getPaymentStats();
            setPaymentStats(stats);
        } catch (error) {
            console.error("Failed to fetch payment stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentData();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchPaymentData();
        setIsRefreshing(false);
    };

    // Calculate derived values
    const totalRevenue = paymentStats?.totalRevenue || 0;
    const totalExpenses = EXPENSE_DATA.totalExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';
    const mrr = paymentStats?.thisMonthTotal || 0;
    const activeSubscriptions = paymentStats?.totalTransactions || 0;
    const arpu = activeSubscriptions > 0 ? Math.round(totalRevenue / activeSubscriptions) : 0;

    // M-Pesa specific
    const mpesaToday = paymentStats?.todayElectronic || 0;
    const mpesaTransactions = paymentStats?.todayElectronicTransactions || 0;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finance Dashboard</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Financial overview and key metrics
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* Period Selector */}
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 text-sm"
                    >
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                        <option value="this_quarter">This Quarter</option>
                        <option value="this_year">This Year</option>
                    </select>
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm">
                        <Calendar className="w-4 h-4" />
                        Custom
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards - Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Revenue */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <ArrowUpRight className="w-3 h-3" />
                            +12.5%
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {formatCurrency(totalRevenue)}
                        </p>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
                            <ArrowUpRight className="w-3 h-3" />
                            +5.2%
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Total Expenses</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {formatCurrency(totalExpenses)}
                        </p>
                    </div>
                </div>

                {/* Net Profit */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {profitMargin}% margin
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Net Profit</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                            {formatCurrency(netProfit)}
                        </p>
                    </div>
                </div>

                {/* MRR */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <PiggyBank className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                            <ArrowUpRight className="w-3 h-3" />
                            +8.3%
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Recurring Revenue</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {formatCurrency(mrr)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Metrics Cards - Row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* ARPU */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                            <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">ARPU (Avg Revenue/User)</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {formatCurrency(arpu)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{activeSubscriptions} transactions</p>
                    </div>
                </div>

                {/* Collection Rate */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Collection Rate</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                            94.2%
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                            <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `94.2%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Outstanding Invoices */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Outstanding Invoices</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                            {formatCurrency(445600)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">156 invoices pending</p>
                    </div>
                </div>

                {/* Overdue */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Overdue Amount</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                            {formatCurrency(67800)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">23 invoices overdue</p>
                    </div>
                </div>
            </div>

            {/* M-Pesa Quick Stats */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">M-Pesa Today</h3>
                            <p className="text-green-100 text-sm">Real-time payment tracking</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">{formatCurrency(mpesaToday)}</p>
                            <p className="text-green-100 text-sm">Received Today</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-white">{mpesaTransactions}</p>
                            <p className="text-green-100 text-sm">Transactions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts and Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue by Type */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue Breakdown</h3>
                    <div className="space-y-4">
                        {(paymentStats?.revenueByType || []).map((item: { name: string; amount: number; percentage: number }, index: number) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {formatCurrency(item.amount)} ({item.percentage}%)
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expenses by Category */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Expense Categories</h3>
                    <div className="space-y-4">
                        {EXPENSE_DATA.expensesByCategory.map((item: { name: string; amount: number; percentage: number; color: string }, index: number) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {formatCurrency(item.amount)} ({item.percentage}%)
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div
                                        className={`${item.color} h-2 rounded-full transition-all duration-500`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Transactions</h3>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            View All →
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {(paymentStats?.recentTransactions || []).map((tx: { id: number; type: string; description: string; amount: number; date: string; method: string }) => (
                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'income'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {tx.type === 'income' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                            {tx.type === 'income' ? 'Income' : 'Expense'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{tx.description}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                                            {tx.method === 'M-Pesa' && <Smartphone className="w-3 h-3 text-green-500" />}
                                            {tx.method === 'Bank' && <CreditCard className="w-3 h-3 text-blue-500" />}
                                            {tx.method === 'Cash' && <Banknote className="w-3 h-3 text-amber-500" />}
                                            {tx.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{tx.date}</td>
                                    <td className={`px-6 py-4 text-sm font-medium text-right ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
