import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Building2, CreditCard, FileText, Key, Settings as SettingsIcon, Loader2, MapPin, Mail, Phone, User, AlertTriangle, Eye, EyeOff, X, HelpCircle, MessageSquare } from "lucide-react";
import { tenantApi, type Tenant, type Invoice } from "../../services/tenantService";
import toast from "react-hot-toast";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS, type Permission } from "../../lib/permissions";
import { SmsSettingsForm } from "../sms/SmsSettingsForm";

type TabId = "general" | "licence" | "invoices" | "payment" | "sms" | "password";

const tabs: { id: TabId; name: string; icon: React.ElementType; permission?: Permission }[] = [
    { id: "general", name: "General", icon: Building2, permission: PERMISSIONS.SETTINGS_GENERAL },
    { id: "licence", name: "Licence", icon: FileText, permission: PERMISSIONS.SETTINGS_LICENCE },
    { id: "invoices", name: "Invoices", icon: CreditCard, permission: PERMISSIONS.SETTINGS_INVOICES },
    { id: "payment", name: "Payment Gateway", icon: CreditCard, permission: PERMISSIONS.SETTINGS_PAYMENT_GATEWAY },
    { id: "sms", name: "SMS", icon: MessageSquare, permission: PERMISSIONS.SETTINGS_SMS },
    { id: "password", name: "Change Password", icon: Key, permission: PERMISSIONS.SETTINGS_PASSWORD },
];

export function Settings() {
    const [activeTab, setActiveTab] = useState<TabId>("password"); // Default to password (everyone can access)
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const { can } = usePermissions();

    // Filter tabs based on permissions
    const visibleTabs = useMemo(() => {
        return tabs.filter(tab => !tab.permission || can(tab.permission));
    }, [can]);

    // Set initial tab to first visible tab
    useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        }
    }, [visibleTabs, activeTab]);

    // Fetch tenant data
    const fetchTenant = useCallback(async () => {
        try {
            setLoading(true);
            const data = await tenantApi.getTenant();
            setTenant(data);
        } catch (error) {
            console.error("Failed to fetch tenant:", error);
            // Use fallback data for demo
            setTenant({
                id: "demo",
                name: "demo-isp",
                businessName: "Demo ISP",
                email: "admin@demoisp.com",
                phone: "0712345678",
                location: "Nairobi, Kenya",
                status: "ACTIVE",
                walletBalance: 0,
                activeUsers: 0,
                createdAt: new Date().toISOString(),
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTenant();
    }, [fetchTenant]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-in px-2 sm:px-4 md:flex md:flex-col md:items-center">
            {/* Header */}
            <div className="bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700/50 text-center md:w-fit">
                <h1 className="text-lg md:text-xl font-bold text-white flex items-center justify-center gap-2">
                    <SettingsIcon className="w-5 h-5 md:w-6 md:h-6" />
                    Account Information
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                    Manage your Account Settings and personal details
                </p>
            </div>

            {/* Tabs */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden md:w-fit md:min-w-[600px] lg:min-w-[800px]">
                {/* Tab Navigation - scrollable on mobile, centered on tablet+ */}
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex md:justify-center gap-1 p-2 border-b border-slate-700/50 min-w-max">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-cyan-600 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-3 md:p-6 md:flex md:flex-col md:items-center">
                    {activeTab === "general" && tenant && <GeneralTab tenant={tenant} onUpdate={fetchTenant} />}
                    {activeTab === "licence" && tenant && <LicenceTab tenant={tenant} />}
                    {activeTab === "invoices" && <InvoicesTab />}
                    {activeTab === "payment" && <PaymentGatewayTab />}
                    {activeTab === "sms" && <SmsSettingsForm />}
                    {activeTab === "password" && <ChangePasswordTab />}
                </div>
            </div>
        </div>
    );
}

// ============ GENERAL TAB ============
function GeneralTab({ tenant, onUpdate }: { tenant: Tenant; onUpdate: () => void }) {
    const [formData, setFormData] = useState({
        businessName: tenant.businessName || "",
        email: tenant.email || "",
        location: tenant.location || "",
        phone: tenant.phone || "",
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await tenantApi.updateTenant(formData);
            toast.success("Settings updated successfully!");
            onUpdate();
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-xl">
            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Network Name
                </label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Your Network Name"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="admin@yourisp.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Location
                </label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="City, Country"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Phone No
                </label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="0712345678"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Update
            </button>
        </form>
    );
}

// ============ LICENCE TAB ============
function LicenceTab({ tenant }: { tenant: Tenant }) {
    const [topupAmount, setTopupAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topupAmount || parseFloat(topupAmount) <= 0) return;

        try {
            setSubmitting(true);
            const result = await tenantApi.topUpWallet(parseFloat(topupAmount));
            if (result.paymentUrl) {
                window.open(result.paymentUrl, "_blank");
            }
            toast.success("Payment initiated");
        } catch (error) {
            toast.error("Failed to initiate payment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6 w-full">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="bg-slate-900/50 rounded-lg p-3 md:p-4 border border-slate-700/50">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Current Status</p>
                    <p className={`text-base md:text-lg font-semibold ${tenant.status === "ACTIVE" ? "text-green-400" : "text-orange-400"}`}>
                        {tenant.status}
                    </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 md:p-4 border border-slate-700/50">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Wallet Balance</p>
                    <p className="text-base md:text-lg font-semibold text-white">KES {tenant.walletBalance.toLocaleString()}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 md:p-4 border border-slate-700/50">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Active Users</p>
                    <p className="text-base md:text-lg font-semibold text-white">{tenant.activeUsers}</p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 md:p-4 border border-slate-700/50">
                    <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider mb-1">Total Due</p>
                    <p className="text-base md:text-lg font-semibold text-white">0</p>
                </div>
            </div>

            {/* Top Up Form */}
            <form onSubmit={handleTopup} className="flex flex-col sm:flex-row sm:items-end gap-3 md:gap-4 w-full sm:max-w-md">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                        Enter Amount to Topup:
                    </label>
                    <input
                        type="number"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    SUBMIT
                </button>
            </form>
        </div>
    );
}

// ============ INVOICES TAB ============
function InvoicesTab() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const pageSize = 10;

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                setLoading(true);
                const data = await tenantApi.getInvoices(currentPage, pageSize, searchQuery);
                setInvoices(data.invoices);
                setTotal(data.total);
                setTotalPages(Math.ceil(data.total / pageSize));
            } catch (error) {
                console.error("Failed to fetch invoices:", error);
                // Demo data
                const demoInvoices = [
                    { id: "1", ref: "ref_0001463", reason: "Subscription December 2025", amount: 4000, currency: "KES", createdAt: "2025-12-15T10:00:02Z", dueAt: "2025-12-15T10:00:02Z", status: "PENDING" as const },
                    { id: "2", ref: "ref_0001351", reason: "Subscription November 2025", amount: 4000, currency: "KES", createdAt: "2025-11-15T10:00:03Z", dueAt: "2025-11-15T10:00:03Z", status: "PENDING" as const },
                    { id: "3", ref: "ref_0001255", reason: "Subscription October 2025", amount: 4000, currency: "KES", createdAt: "2025-10-15T10:00:01Z", dueAt: "2025-10-15T10:00:01Z", status: "PENDING" as const },
                    { id: "4", ref: "ref_0001140", reason: "Subscription September 2025", amount: 4000, currency: "KES", createdAt: "2025-09-15T10:00:01Z", dueAt: "2025-09-15T10:00:01Z", status: "PAID" as const },
                    { id: "5", ref: "ref_0001004", reason: "Subscription August 2025", amount: 4000, currency: "KES", createdAt: "2025-08-15T10:00:01Z", dueAt: "2025-08-15T10:00:01Z", status: "PAID" as const },
                ];
                setInvoices(demoInvoices);
                setTotal(demoInvoices.length);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, [currentPage, searchQuery]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-GB", {
            year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
    };

    const handleDownloadInvoice = (invoice: Invoice) => {
        // In a real app, this would generate/download a PDF
        toast.success(`Downloading invoice ${invoice.ref}...`);
    };

    return (
        <div className="space-y-4 w-full max-w-5xl">
            {/* Search and count */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <input
                    type="text"
                    placeholder="Search Invoice"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full sm:w-64 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
                />
                <span className="text-sm text-slate-400">Total: {total} invoices</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-900/50">
                        <tr>
                            <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">#</th>
                            <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">REF</th>
                            <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">REASON</th>
                            <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">AMOUNT</th>
                            <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">CREATED</th>
                            <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">DUE</th>
                            <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">STATUS</th>
                            <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                </td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                    No invoices found
                                </td>
                            </tr>
                        ) : (
                            invoices.map((invoice, index) => (
                                <tr key={invoice.id} className="hover:bg-slate-700/30">
                                    <td className="px-3 md:px-4 py-3 text-sm text-slate-400">{(currentPage - 1) * pageSize + index + 1}</td>
                                    <td className="px-3 md:px-4 py-3 text-sm text-cyan-400">{invoice.ref}</td>
                                    <td className="px-3 md:px-4 py-3 text-sm text-cyan-400 hidden sm:table-cell">{invoice.reason}</td>
                                    <td className="px-3 md:px-4 py-3 text-sm text-white">{invoice.currency} {invoice.amount}</td>
                                    <td className="px-3 md:px-4 py-3 text-sm text-slate-300 hidden md:table-cell">{formatDate(invoice.createdAt)}</td>
                                    <td className="px-3 md:px-4 py-3 text-sm text-slate-300 hidden lg:table-cell">{formatDate(invoice.dueAt)}</td>
                                    <td className="px-3 md:px-4 py-3 text-sm">
                                        <span className={`px-2 py-0.5 rounded text-xs ${invoice.status === "PAID" ? "bg-green-600/20 text-green-400" :
                                            invoice.status === "PENDING" ? "bg-yellow-600/20 text-yellow-400" :
                                                invoice.status === "OVERDUE" ? "bg-red-600/20 text-red-400" :
                                                    "bg-slate-600/20 text-slate-400"
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-3 md:px-4 py-3 text-sm">
                                        <button
                                            onClick={() => setSelectedInvoice(invoice)}
                                            className="text-cyan-400 hover:underline mr-2"
                                        >
                                            VIEW
                                        </button>
                                        <button
                                            onClick={() => handleDownloadInvoice(invoice)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            PDF
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                    >
                        Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-1.5 text-sm rounded-lg ${currentPage === page ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
                            >
                                {page}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-sm bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Invoice Details Modal */}
            {selectedInvoice && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl p-4 md:p-6 w-full max-w-md border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">Invoice Details</h3>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Reference</p>
                                    <p className="text-cyan-400">{selectedInvoice.ref}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Status</p>
                                    <span className={`px-2 py-0.5 rounded text-xs ${selectedInvoice.status === "PAID" ? "bg-green-600/20 text-green-400" :
                                        selectedInvoice.status === "PENDING" ? "bg-yellow-600/20 text-yellow-400" :
                                            "bg-red-600/20 text-red-400"
                                        }`}>
                                        {selectedInvoice.status}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Description</p>
                                <p className="text-white">{selectedInvoice.reason}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Amount</p>
                                    <p className="text-white text-lg font-semibold">{selectedInvoice.currency} {selectedInvoice.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Currency</p>
                                    <p className="text-white">{selectedInvoice.currency}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Created</p>
                                    <p className="text-slate-300 text-sm">{formatDate(selectedInvoice.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase">Due Date</p>
                                    <p className="text-slate-300 text-sm">{formatDate(selectedInvoice.dueAt)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleDownloadInvoice(selectedInvoice)}
                                className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ============ PAYMENT GATEWAY TAB ============
function PaymentGatewayTab() {

    const [paymentOptions, setPaymentOptions] = useState([
        { id: "1", name: "MPESA_API", label: "M-Pesa (API)", isDefault: true, shortcode: "174379", passkey: "***hidden***" },
    ]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState<typeof paymentOptions[0] | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [gatewayToDelete, setGatewayToDelete] = useState<string | null>(null);

    // Config Form State
    const [configGatewayType, setConfigGatewayType] = useState<"MPESA_API" | "MPESA_NO_API" | "">("");
    const [configPaymentMethod, setConfigPaymentMethod] = useState<"PAYBILL" | "TILL" | "">("");
    const [configForm, setConfigForm] = useState({
        paybill: "",
        till: "",
        shortcode: "",
        passkey: "",
        consumerKey: "",
        consumerSecret: ""
    });
    const [showPasskey, setShowPasskey] = useState(false);
    const [showConsumerKey, setShowConsumerKey] = useState(false);
    const [showConsumerSecret, setShowConsumerSecret] = useState(false);
    const [saving, setSaving] = useState(false);

    const handleViewDetails = (option: typeof paymentOptions[0]) => {
        setSelectedOption(option);
        setShowDetailsModal(true);
    };

    const handleMakeDefault = (id: string) => {
        setPaymentOptions(prev => prev.map(opt => ({ ...opt, isDefault: opt.id === id })));
        toast.success("Default payment gateway updated!");
    };

    const handleRemove = (id: string) => {
        setGatewayToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmRemove = () => {
        if (!gatewayToDelete) return;
        setPaymentOptions(prev => prev.filter(opt => opt.id !== gatewayToDelete));
        toast.success("Payment gateway removed!");
        setShowDeleteModal(false);
        setGatewayToDelete(null);
    };

    const openAddGatewayModal = () => {
        // Reset form
        setConfigGatewayType("MPESA_API");
        setConfigPaymentMethod("");
        setConfigForm({
            paybill: "",
            till: "",
            shortcode: "",
            passkey: "",
            consumerKey: "",
            consumerSecret: ""
        });
        setShowConfigModal(true);
    };

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);

            // Build the config object based on type
            const finalConfig = {
                type: configGatewayType,
                method: configPaymentMethod,
                ...configForm
            };

            await tenantApi.updatePaymentGateway({
                type: configGatewayType,
                config: finalConfig
            });

            // Update local state (demo logic)
            setPaymentOptions(prev => [...prev, {
                id: Date.now().toString(),
                name: configGatewayType,
                label: configGatewayType === "MPESA_API" ? "M-Pesa (API)" : "M-Pesa (Manual)",
                isDefault: prev.length === 0,
                shortcode: configForm.shortcode || configForm.paybill || configForm.till,
                passkey: "***hidden***"
            }]);

            toast.success("Payment gateway added successfully!");
            setShowConfigModal(false);
        } catch (error) {
            toast.error("Failed to save payment gateway");
        } finally {
            setSaving(false);
        }
    };

    const handleTestGateway = () => {
        if (paymentOptions.length === 0) {
            toast.error("Please add a payment gateway first");
            return;
        }
        toast.success("Test payment initiated! Check your phone.");
    };

    const handleRegisterUrls = async () => {
        try {
            toast.loading("Registering M-Pesa URLs...");
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.dismiss();
            toast.success("M-Pesa URLs registered successfully!");
        } catch {
            toast.error("Failed to register URLs");
        }
    };

    return (
        <div className="space-y-6 w-full max-w-xl">
            {/* Existing Payment Options */}
            <div>
                <p className="text-sm text-green-400 mb-2">PAYMENT OPTIONS THAT YOU HAVE SET</p>
                {paymentOptions.length === 0 ? (
                    <p className="text-slate-400 text-sm ml-4">No payment gateways configured yet.</p>
                ) : (
                    paymentOptions.map((option, index) => (
                        <div key={option.id} className="ml-4 space-y-1 py-2 border-b border-slate-700/50 last:border-0">
                            <p className="text-white flex items-center gap-2">
                                {index + 1}: {option.name}
                                {option.isDefault && (
                                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded">Default</span>
                                )}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleViewDetails(option)}
                                    className="text-cyan-400 hover:underline text-sm"
                                >
                                    VIEW DETAILS
                                </button>
                                {!option.isDefault && (
                                    <button
                                        onClick={() => handleMakeDefault(option.id)}
                                        className="text-slate-400 hover:text-white text-sm"
                                    >
                                        MAKE DEFAULT
                                    </button>
                                )}
                                <button
                                    onClick={() => handleRemove(option.id)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                >
                                    REMOVE
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Payment Gateway Button */}
            <div className="w-full">
                <button
                    onClick={openAddGatewayModal}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium"
                >
                    <CreditCard className="w-4 h-4" />
                    Connect New Gateway
                </button>
            </div>

            {/* Instructions */}
            <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <div className="text-sm space-y-2">
                    <p className="flex items-center gap-2">
                        <span className="text-slate-400">1. Click </span>
                        <button onClick={handleTestGateway} className="text-cyan-400 hover:underline font-medium">HERE</button>
                        <span className="text-slate-400"> to test your payment gateway.</span>
                    </p>
                    <p className="text-red-400 text-xs italic ml-4">Note: You have to set payment gateway first</p>
                </div>

                <div className="text-sm space-y-2">
                    <p className="flex items-center gap-2">
                        <span className="text-slate-400">2. Click </span>
                        <button onClick={handleRegisterUrls} className="text-cyan-400 hover:underline font-medium">HERE</button>
                        <span className="text-slate-400"> to register mpesa paybill validation and confirmation urls.</span>
                    </p>
                    <p className="text-red-400 text-xs italic ml-4">Note: Only applicable if using safaricom mpesa paybill number not TILL NUMBER or BANK PAYBILL</p>
                </div>
            </div>



            {/* View Details Modal */}
            {showDetailsModal && selectedOption && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl p-4 md:p-6 w-full max-w-md border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">{selectedOption.label} Details</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Gateway Type</p>
                                <p className="text-white">{selectedOption.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Shortcode / Business Code</p>
                                <p className="text-white">{selectedOption.shortcode}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Passkey</p>
                                <p className="text-white">{selectedOption.passkey}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase">Status</p>
                                <p className="text-green-400">Active</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="w-full mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && gatewayToDelete && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 text-red-400 mb-4">
                            <div className="p-3 bg-red-900/20 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Remove Gateway?</h3>
                        </div>

                        <p className="text-slate-300 mb-6">
                            Are you sure you want to remove this payment gateway?
                            This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemove}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Config Modal */}
            {showConfigModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-lg w-full max-w-3xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Payment Gateway Settings</h3>
                                    <p className="text-slate-400 text-sm mt-1">Payment gateway settings clients can use to pay for your internet services.</p>
                                </div>
                                <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSaveConfig} className="p-6 space-y-6">
                            {/* Payment Gateway Selection */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-white">Payment Gateway</label>
                                    <a href="#" className="text-orange-500 text-sm hover:underline flex items-center gap-1">
                                        <HelpCircle className="w-3 h-3" /> Request Payment Gateway
                                    </a>
                                </div>
                                <select
                                    value={configGatewayType}
                                    onChange={(e) => {
                                        setConfigGatewayType(e.target.value as any);
                                        setConfigPaymentMethod(""); // Reset method on gateway change
                                    }}
                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="MPESA_API">M-Pesa Paybill / Till Number With API keys</option>
                                    <option value="MPESA_NO_API">Paybill - Without API keys</option>
                                </select>
                            </div>

                            {/* Additional Fields based on Gateway Type */}
                            {configGatewayType === "MPESA_API" && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-white">Method of Payment</label>
                                        <select
                                            value={configPaymentMethod}
                                            onChange={(e) => setConfigPaymentMethod(e.target.value as any)}
                                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="">Select an option</option>
                                            <option value="PAYBILL">Paybill</option>
                                            <option value="TILL">Till Number</option>
                                        </select>
                                    </div>

                                    {/* Paybill Field */}
                                    {configPaymentMethod === "PAYBILL" && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="text-sm font-semibold text-white">Paybill<span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={configForm.paybill}
                                                onChange={(e) => setConfigForm(prev => ({ ...prev, paybill: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>
                                    )}

                                    {/* Till Number Field */}
                                    {configPaymentMethod === "TILL" && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <label className="text-sm font-semibold text-white">Till Number<span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={configForm.till}
                                                onChange={(e) => setConfigForm(prev => ({ ...prev, till: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-white">Mpesa Shortcode<span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                value={configForm.shortcode}
                                                onChange={(e) => setConfigForm(prev => ({ ...prev, shortcode: e.target.value }))}
                                                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                                placeholder="rodnetsolutionslimited"
                                            />
                                            <div className="text-xs text-slate-400">
                                                This is the shortcode that will be used to receive payments. Get this from Daraja. <a href="#" className="text-orange-500 hover:underline">Get Credentials</a>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-white">Mpesa Passkey<span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    type={showPasskey ? "text" : "password"}
                                                    value={configForm.passkey}
                                                    onChange={(e) => setConfigForm(prev => ({ ...prev, passkey: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                                    placeholder="........."
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasskey(!showPasskey)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                                >
                                                    {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Ensure you get this from Safaricom
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-white">Consumer Key<span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    type={showConsumerKey ? "text" : "password"}
                                                    value={configForm.consumerKey}
                                                    onChange={(e) => setConfigForm(prev => ({ ...prev, consumerKey: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConsumerKey(!showConsumerKey)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                                >
                                                    {showConsumerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                This is the consumer key that will be used to receive payments. Get this from Daraja. <a href="#" className="text-orange-500 hover:underline">Get Credentials</a>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-white">Consumer Secret<span className="text-red-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    type={showConsumerSecret ? "text" : "password"}
                                                    value={configForm.consumerSecret}
                                                    onChange={(e) => setConfigForm(prev => ({ ...prev, consumerSecret: e.target.value }))}
                                                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConsumerSecret(!showConsumerSecret)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                                >
                                                    {showConsumerSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                This is the consumer secret that will be used to receive payments. Get this from Daraja. <a href="#" className="text-orange-500 hover:underline">Get Credentials</a>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {configGatewayType === "MPESA_NO_API" && (
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-slate-400 text-sm">This payment gateway is subject to 1% transaction cost.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-white">Paybill<span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={configForm.paybill}
                                            onChange={(e) => setConfigForm(prev => ({ ...prev, paybill: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                        <p className="text-slate-400 text-sm">Paybill that does not require API keys. This should not be a bank paybill.</p>
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
                                >
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowConfigModal(false)}
                                    className="px-6 py-2.5 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

// ============ CHANGE PASSWORD TAB ============
function ChangePasswordTab() {
    const [formData, setFormData] = useState({ oldPassword: "", newPassword: "" });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.oldPassword || !formData.newPassword) {
            toast.error("Please fill in all fields");
            return;
        }
        try {
            setSaving(true);
            await tenantApi.changePassword(formData.oldPassword, formData.newPassword);
            toast.success("Password updated successfully!");
            setFormData({ oldPassword: "", newPassword: "" });
        } catch (error) {
            toast.error("Failed to update password");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Old Password
                </label>
                <input
                    type="password"
                    value={formData.oldPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    New Password
                </label>
                <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500"
                />
            </div>

            <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Update
            </button>
        </form>
    );
}



