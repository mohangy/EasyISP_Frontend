import { Lock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import {
    dashboardApi,
    type DashboardStats,
    type PaymentTrend,
    type NetworkUsageTrend
} from "../../services/dashboardService";
import { PermissionGate } from "../../components/auth/PermissionGate";
import { PERMISSIONS, type Permission } from "../../lib/permissions";

export function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentTrend[]>([]);
    const [networkUsageData, setNetworkUsageData] = useState<NetworkUsageTrend[]>([]);
    const [loading, setLoading] = useState(true);
    const [_error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);

                // Fetch all dashboard data in parallel
                const [statsData, revenueData, networkData] = await Promise.all([
                    dashboardApi.getStats(),
                    dashboardApi.getRevenueTrend(),
                    dashboardApi.getNetworkUsage(),
                ]);

                setStats(statsData);
                setPaymentData(revenueData.revenueTrend);
                setNetworkUsageData(networkData.usageTrend);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                setError("Failed to load dashboard data");
                // Use fallback data on error
                setStats({
                    activeSessions: 0,
                    totalCustomers: 0,
                    monthlyRevenue: 0,
                    todayRevenue: 0,
                    pppoeCustomers: 0,
                    hotspotCustomers: 0,
                    activeVouchers: 0,
                    usedVouchers: 0,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
        // Refresh every 30 seconds for real-time data
        const interval = setInterval(fetchAllData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Format large numbers
    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
        return num.toLocaleString();
    };

    // Build stats cards from real data with permission mappings
    const statCards: { name: string; value: string; permission: Permission }[] = [
        {
            name: "Active Sessions",
            value: loading ? "..." : formatNumber(stats?.activeSessions || 0),
            permission: PERMISSIONS.CUSTOMERS_VIEW,
        },
        {
            name: "Total Customers",
            value: loading ? "..." : formatNumber(stats?.totalCustomers || 0),
            permission: PERMISSIONS.CUSTOMERS_VIEW,
        },
        {
            name: "Monthly Revenue",
            value: loading ? "..." : `KES ${formatNumber(stats?.monthlyRevenue || 0)}`,
            permission: PERMISSIONS.PAYMENTS_VIEW,
        },
        {
            name: "Today's Revenue",
            value: loading ? "..." : `KES ${formatNumber(stats?.todayRevenue || 0)}`,
            permission: PERMISSIONS.PAYMENTS_VIEW,
        },
    ];

    // Check if data exists
    const hasNetworkData = networkUsageData.some(d => d.usage > 0);
    const hasPaymentData = paymentData.some(d => d.amount > 0);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade-in">
            {/* Page Title */}
            <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    Overview of your ISP performance and metrics.
                </p>
            </div>

            {/* Stats Grid - 2x2 on mobile, 4 cols on large */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={stat.name}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className="group relative bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-3 md:p-6 border border-slate-200/60 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                    >
                        {/* Background Gradient Accent */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-5 rounded-xl md:rounded-2xl transition-opacity duration-300"></div>

                        <PermissionGate
                            permission={stat.permission}
                            fallback={
                                <div className="relative flex flex-col items-center justify-center py-4 text-slate-400">
                                    <Lock className="w-6 h-6 mb-2 opacity-50" />
                                    <span className="text-xs font-medium">{stat.name}</span>
                                    <span className="text-xs opacity-60">No Permission</span>
                                </div>
                            }
                        >
                            <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-0">
                                <div className="space-y-1 md:space-y-2">
                                    <span className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                                        {stat.name}
                                    </span>
                                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
                                        {stat.value}
                                    </h3>
                                </div>
                            </div>
                        </PermissionGate>
                    </div>
                ))}
            </div>

            {/* Network Usage & Payments Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Network Data Usage Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200/60 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-sm md:text-lg font-semibold text-slate-900 dark:text-white">Network Usage</h2>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Total bandwidth consumption</p>
                        </div>
                        <select className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option>This Year</option>
                            <option>This Month</option>
                            <option>This Week</option>
                            <option>Last Year</option>
                            <option>Last Month</option>
                        </select>
                    </div>
                    <PermissionGate
                        permission={PERMISSIONS.ANALYTICS_VIEW}
                        fallback={
                            <div className="h-48 md:h-64 flex flex-col items-center justify-center text-slate-400">
                                <Lock className="w-10 h-10 mb-3 opacity-50" />
                                <span className="text-sm font-medium">Analytics Permission Required</span>
                                <span className="text-xs opacity-60">Contact admin for access</span>
                            </div>
                        }
                    >
                        <div className="h-48 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={networkUsageData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    {hasNetworkData && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />}
                                    {hasNetworkData && (
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            tickLine={false}
                                        />
                                    )}
                                    {hasNetworkData && (
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            tickLine={false}
                                            tickFormatter={(value) => `${value} GB`}
                                        />
                                    )}
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                        labelStyle={{ color: '#fff' }}
                                        itemStyle={{ color: '#10b981' }}
                                        formatter={(value) => value ? [`${Number(value).toLocaleString()} GB`, 'Usage'] : ['', '']}
                                    />
                                    <Bar
                                        dataKey="usage"
                                        fill="url(#usageGradient)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                    <defs>
                                        <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </PermissionGate>
                </div>

                {/* Payments Chart */}
                <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200/60 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-sm md:text-lg font-semibold text-slate-900 dark:text-white">Payments</h2>
                            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Payments and revenue trend</p>
                        </div>
                        <select className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option>This Year</option>
                            <option>This Month</option>
                            <option>This Week</option>
                            <option>Last Year</option>
                            <option>Last Month</option>
                        </select>
                    </div>
                    <PermissionGate
                        permission={PERMISSIONS.PAYMENTS_REPORTS}
                        fallback={
                            <div className="h-48 md:h-64 flex flex-col items-center justify-center text-slate-400">
                                <Lock className="w-10 h-10 mb-3 opacity-50" />
                                <span className="text-sm font-medium">Payments Permission Required</span>
                                <span className="text-xs opacity-60">Contact admin for access</span>
                            </div>
                        }
                    >
                        <div className="h-48 md:h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    {hasPaymentData && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />}
                                    {hasPaymentData && (
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            tickLine={false}
                                        />
                                    )}
                                    {hasPaymentData && (
                                        <YAxis
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            tickLine={false}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                                        />
                                    )}
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '12px'
                                        }}
                                        labelStyle={{ color: '#fff' }}
                                        itemStyle={{ color: '#3b82f6' }}
                                        formatter={(value) => value ? [`KES ${Number(value).toLocaleString()}`, 'Revenue'] : ['', '']}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        fill="url(#paymentGradient)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                    <defs>
                                        <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#1d4ed8" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </PermissionGate>
                </div>
            </div>
        </div>
    );
}
