import { useState } from "react";
import {
    Smartphone,
    CheckCircle2,
    AlertCircle,
    Settings,
    RefreshCw,
    Eye,
    EyeOff,
    Save,
    TestTube2,
    Shield,
    Clock,
    ArrowDownRight
} from "lucide-react";
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

// Mock M-Pesa stats
const MPESA_STATS = {
    todayReceived: 156700,
    todayTransactions: 52,
    thisMonthReceived: 2345600,
    thisMonthTransactions: 823,
    successRate: 98.5,
    avgProcessingTime: 2.3, // seconds
    pendingConfirmations: 3,
    lastSync: "2024-12-27 10:45:32"
};

// Recent M-Pesa transactions
const RECENT_TRANSACTIONS = [
    { id: "QJI4ELP7MU", phone: "254712345678", name: "John Doe", amount: 4500, status: "success", time: "10:23:45" },
    { id: "QJI4ELP7MV", phone: "254723456789", name: "Jane Smith", amount: 3000, status: "success", time: "10:15:22" },
    { id: "QJI4ELP7MW", phone: "254734567890", name: "Alex Mwangi", amount: 5000, status: "pending", time: "10:10:15" },
    { id: "QJI4ELP7MX", phone: "254745678901", name: "Grace Ochieng", amount: 7500, status: "success", time: "09:58:30" },
    { id: "QJI4ELP7MY", phone: "254756789012", name: "Peter Kamau", amount: 2500, status: "failed", time: "09:45:12" },
];

export function MPesaSettings() {
    const [showSecrets, setShowSecrets] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [config, setConfig] = useState({
        environment: "sandbox",
        consumerKey: "your_consumer_key_here",
        consumerSecret: "••••••••••••••••",
        passKey: "••••••••••••••••",
        shortCode: "174379",
        initiatorName: "testapi",
        initiatorPassword: "••••••••••••••••",
        callbackUrl: "https://yourserver.com/api/mpesa/callback",
        accountReference: "EasyISP",
        transactionDesc: "Internet Subscription Payment"
    });

    const handleTestConnection = async () => {
        setIsTestingConnection(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsTestingConnection(false);
        toast.success("M-Pesa connection successful!");
    };

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        toast.success("M-Pesa settings saved!");
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">M-Pesa Integration</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure Safaricom M-Pesa Daraja API settings
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleTestConnection}
                        disabled={isTestingConnection}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        <TestTube2 className={`w-4 h-4 ${isTestingConnection ? 'animate-pulse' : ''}`} />
                        {isTestingConnection ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                        <Smartphone className="w-6 h-6 opacity-80" />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">Today</span>
                    </div>
                    <p className="text-2xl font-bold mt-3">{formatCurrency(MPESA_STATS.todayReceived)}</p>
                    <p className="text-sm opacity-80">{MPESA_STATS.todayTransactions} transactions</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{MPESA_STATS.successRate}%</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Success Rate</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <Clock className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{MPESA_STATS.avgProcessingTime}s</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Avg Processing</p>
                </div>
                <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{MPESA_STATS.pendingConfirmations}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pending Confirmations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* API Credentials */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-500" />
                                API Credentials
                            </h3>
                            <button
                                onClick={() => setShowSecrets(!showSecrets)}
                                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {showSecrets ? 'Hide' : 'Show'} Secrets
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Environment
                                </label>
                                <select
                                    value={config.environment}
                                    onChange={(e) => setConfig({ ...config, environment: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                >
                                    <option value="sandbox">Sandbox (Testing)</option>
                                    <option value="production">Production (Live)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Short Code (Till/Paybill)
                                </label>
                                <input
                                    type="text"
                                    value={config.shortCode}
                                    onChange={(e) => setConfig({ ...config, shortCode: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Consumer Key
                                </label>
                                <input
                                    type={showSecrets ? "text" : "password"}
                                    value={config.consumerKey}
                                    onChange={(e) => setConfig({ ...config, consumerKey: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Consumer Secret
                                </label>
                                <input
                                    type={showSecrets ? "text" : "password"}
                                    value={config.consumerSecret}
                                    onChange={(e) => setConfig({ ...config, consumerSecret: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Pass Key (Lipa Na M-Pesa)
                                </label>
                                <input
                                    type={showSecrets ? "text" : "password"}
                                    value={config.passKey}
                                    onChange={(e) => setConfig({ ...config, passKey: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Callback Settings */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700/50">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-purple-500" />
                            Callback Configuration
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Callback URL
                                </label>
                                <input
                                    type="url"
                                    value={config.callbackUrl}
                                    onChange={(e) => setConfig({ ...config, callbackUrl: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                    placeholder="https://yourserver.com/api/mpesa/callback"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    This URL receives payment confirmations from Safaricom
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Account Reference
                                    </label>
                                    <input
                                        type="text"
                                        value={config.accountReference}
                                        onChange={(e) => setConfig({ ...config, accountReference: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Transaction Description
                                    </label>
                                    <input
                                        type="text"
                                        value={config.transactionDesc}
                                        onChange={(e) => setConfig({ ...config, transactionDesc: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900 dark:text-white">Recent M-Pesa</h3>
                            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                Refresh
                            </button>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {RECENT_TRANSACTIONS.map((tx) => (
                                <div key={tx.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{tx.name}</p>
                                            <p className="text-xs text-slate-500">{tx.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <ArrowDownRight className="w-3 h-3" />
                                                {formatCurrency(tx.amount)}
                                            </p>
                                            <p className="text-xs text-slate-500">{tx.time}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-slate-400 font-mono">{tx.id}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${tx.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                            <button className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                View All Transactions →
                            </button>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-300">M-Pesa Connected</p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Last sync: {MPESA_STATS.lastSync}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
