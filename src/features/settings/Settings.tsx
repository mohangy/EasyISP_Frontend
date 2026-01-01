import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Building2, CreditCard, FileText, Key, Settings as SettingsIcon, Loader2, MapPin, Mail, Phone, User, MessageSquare } from "lucide-react";
import { tenantApi, type Tenant, type Invoice } from "../../services/tenantService";
import toast from "react-hot-toast";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS, type Permission } from "../../lib/permissions";
import { SmsSettingsForm } from "../sms/SmsSettingsForm";
import { PaymentGatewaySettings } from "./PaymentGatewaySettings";

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
    return <PaymentGatewaySettings />;
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



