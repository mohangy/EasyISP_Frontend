import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { Plus, MessageSquare, Download, RotateCcw, X, Loader2 } from "lucide-react";
import { customerApi, type Customer, type CreateCustomerData } from "../../services/customerService";
import api from "../../services/api";
import toast from "react-hot-toast";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../lib/permissions";

// Package interface for dropdown
interface Package {
    id: string;
    name: string;
}

export function PPPoECustomers() {
    const location = useLocation();

    // Data state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { can } = usePermissions();

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [packageFilter, setPackageFilter] = useState<string>("");
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkSmsModal, setShowBulkSmsModal] = useState(false);
    const [bulkSmsMessage, setBulkSmsMessage] = useState('');
    const [sendingBulkSms, setSendingBulkSms] = useState(false);
    const [bulkSmsStatusFilter, setBulkSmsStatusFilter] = useState<string>('');

    // Initialize filters from location state
    useEffect(() => {
        if (location.state) {
            if (location.state.packageId) {
                setPackageFilter(location.state.packageId);
            }
            if (location.state.status) {
                setStatusFilter(location.state.status.toUpperCase());
            }
        }
    }, [location.state]);

    // Form state for new user
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        location: "",
        coordinates: "",
        apartmentNumber: "",
        houseNumber: "",
        packageId: "",
        expiryDate: "",
        installationFee: "",
    });

    // Fetch customers from API
    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await customerApi.getPPPoECustomers({
                page: currentPage,
                pageSize,
                search: searchQuery || undefined,
                status: statusFilter as any || undefined,
                // Cast to any to bypass strict type check until service is updated
                ...({ packageId: packageFilter } as any)
            });
            setCustomers(response.customers);
            setTotalCustomers(response.total);
        } catch (error) {
            console.error("Failed to fetch customers:", error);
            toast.error("Failed to load customers");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, searchQuery, statusFilter, packageFilter]);

    // Fetch packages for dropdown
    const fetchPackages = useCallback(async () => {
        try {
            const response = await customerApi.getPackages('PPPOE');
            setPackages(response || []);
        } catch (error) {
            console.error("Failed to fetch packages:", error);
        }
    }, []);

    // Load data on mount and when filters change
    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            fetchCustomers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Parse coordinates
        let latitude: number | undefined;
        let longitude: number | undefined;
        if (formData.coordinates) {
            const [lat, lon] = formData.coordinates.split(",").map(s => parseFloat(s.trim()));
            if (!isNaN(lat) && !isNaN(lon)) {
                latitude = lat;
                longitude = lon;
            }
        }

        const createData: CreateCustomerData = {
            username: formData.username,
            password: formData.password,
            name: formData.name,
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            connectionType: "PPPOE",
            packageId: formData.packageId || undefined,
            expiresAt: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
            location: formData.location || undefined,
            latitude,
            longitude,
            apartmentNumber: formData.apartmentNumber || undefined,
            houseNumber: formData.houseNumber || undefined,
            installationFee: formData.installationFee ? parseFloat(formData.installationFee) : undefined,
        };

        try {
            setSubmitting(true);
            await customerApi.createCustomer(createData);
            toast.success("Customer created successfully!");
            setShowAddModal(false);
            resetForm();
            fetchCustomers();
        } catch (error: any) {
            console.error("Failed to create customer:", error);
            toast.error(error.response?.data?.message || "Failed to create customer");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: "",
            password: "",
            name: "",
            email: "",
            phone: "",
            location: "",
            coordinates: "",
            apartmentNumber: "",
            houseNumber: "",
            packageId: "",
            expiryDate: "",
            installationFee: "",
        });
    };

    const handleResetTable = () => {
        setSearchQuery("");
        setStatusFilter("");
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalCustomers / pageSize);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE": return "text-green-500";
            case "EXPIRED": return "text-orange-500";
            case "SUSPENDED": return "text-yellow-500";
            case "DISABLED": return "text-red-500";
            default: return "text-slate-400";
        }
    };

    const getActivityColor = (isOnline?: boolean) => {
        return isOnline ? "text-cyan-400" : "text-red-400";
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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
            {/* Bulk SMS Modal */}
            {showBulkSmsModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowBulkSmsModal(false)} />
                    <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-white">Send Bulk SMS</h2>
                            <button onClick={() => setShowBulkSmsModal(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">TARGET CUSTOMERS</label>
                                <select
                                    value={bulkSmsStatusFilter}
                                    onChange={(e) => setBulkSmsStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">All Customers</option>
                                    <option value="ACTIVE">Active Only</option>
                                    <option value="EXPIRED">Expired Only</option>
                                    <option value="SUSPENDED">Suspended Only</option>
                                    <option value="DISABLED">Disabled Only</option>
                                </select>
                            </div>
                            <div className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                Recipients: <strong className="text-cyan-400">{customers.filter(c => c.phone && (!bulkSmsStatusFilter || c.status === bulkSmsStatusFilter)).length}</strong> customers with phone numbers
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">MESSAGE (160 chars max)</label>
                                <textarea
                                    value={bulkSmsMessage}
                                    onChange={(e) => setBulkSmsMessage(e.target.value.slice(0, 160))}
                                    placeholder="Type your message here..."
                                    rows={4}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                                <div className="text-right text-xs text-slate-500 mt-1">{bulkSmsMessage.length}/160</div>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={async () => {
                                        const recipients = customers
                                            .filter(c => c.phone && (!bulkSmsStatusFilter || c.status === bulkSmsStatusFilter))
                                            .map(c => c.phone!);
                                        if (recipients.length === 0) {
                                            toast.error('No customers with phone numbers matching filter');
                                            return;
                                        }
                                        if (!bulkSmsMessage.trim()) {
                                            toast.error('Please enter a message');
                                            return;
                                        }
                                        setSendingBulkSms(true);
                                        try {
                                            const res = await api.post('/sms', { recipients, message: bulkSmsMessage });
                                            toast.success(`Sent to ${res.data.sent} recipients. ${res.data.failed} failed.`);
                                            setShowBulkSmsModal(false);
                                            setBulkSmsMessage('');
                                            setBulkSmsStatusFilter('');
                                        } catch (err) {
                                            toast.error('Failed to send SMS');
                                        } finally {
                                            setSendingBulkSms(false);
                                        }
                                    }}
                                    disabled={sendingBulkSms || !bulkSmsMessage.trim()}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                                >
                                    {sendingBulkSms && <Loader2 className="w-4 h-4 animate-spin" />}
                                    SEND SMS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBulkSmsModal(false)}
                                    className="px-6 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors text-sm"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Add User Modal - uses Portal to render at body level */}
            {showAddModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-md"
                        onClick={() => setShowAddModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h2 className="text-lg font-semibold text-white">New User</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Username & Password */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        <span className="text-blue-400 mr-1">■</span>
                                        PPPOE USERNAME<span className="text-red-500">* REQUIRED</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        placeholder="user1234"
                                        required
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        <span className="text-blue-400 mr-1">■</span>
                                        PPPOE PASSWORD<span className="text-red-500">* REQUIRED</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="user1234"
                                        required
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Names */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    <span className="text-blue-400 mr-1">■</span>
                                    NAMES<span className="text-red-500">* REQUIRED</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="E.g john doe"
                                    required
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    <span className="text-blue-400 mr-1">■</span>
                                    EMAIL <span className="text-cyan-400">OPTIONAL</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="client@email.com"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    <span className="text-blue-400 mr-1">■</span>
                                    PHONE
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="0712345678"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Location & Coordinates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        <span className="text-blue-400 mr-1">■</span>
                                        LOCATION <span className="text-cyan-400">OPTIONAL</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="Kiembeni"
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        <span className="text-blue-400 mr-1">■</span>
                                        COORDINATES <span className="text-cyan-400">OPTIONAL</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="coordinates"
                                        value={formData.coordinates}
                                        onChange={handleInputChange}
                                        placeholder="-3.5000,35.4000"
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Apartment & House Number */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        APARTMENT NUMBER <span className="text-cyan-400">OPTIONAL</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="apartmentNumber"
                                        value={formData.apartmentNumber}
                                        onChange={handleInputChange}
                                        placeholder="Block C"
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        HOUSE NUMBER <span className="text-cyan-400">OPTIONAL</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="houseNumber"
                                        value={formData.houseNumber}
                                        onChange={handleInputChange}
                                        placeholder="C8"
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Package & Expiry Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        <span className="text-blue-400 mr-1">■</span>
                                        SELECT PACKAGE:
                                    </label>
                                    <select
                                        name="packageId"
                                        value={formData.packageId}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select a package</option>
                                        {packages.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1">
                                        <span className="text-blue-400 mr-1">■</span>
                                        Select Expiry Date:
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Installation Fee */}
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1">
                                    <span className="text-blue-400 mr-1">■</span>
                                    INSTALLATION FEE:
                                </label>
                                <input
                                    type="number"
                                    name="installationFee"
                                    value={formData.installationFee}
                                    onChange={handleInputChange}
                                    placeholder="enter amount here"
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-6 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors text-sm disabled:opacity-50"
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    SUBMIT
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors text-sm"
                                >
                                    CANCEL
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Page Header */}
            <div className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700/50">
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-white">
                        PPPoe Users ({totalCustomers})
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400">
                        Overview of All Pppoe Users
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => can(PERMISSIONS.PPPOE_SEND_BULK_SMS) && setShowBulkSmsModal(true)}
                        className={`flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-200 rounded-lg transition-all text-sm ${can(PERMISSIONS.PPPOE_SEND_BULK_SMS) ? 'hover:bg-slate-700' : 'opacity-50 cursor-not-allowed'}`}
                        disabled={!can(PERMISSIONS.PPPOE_SEND_BULK_SMS)}
                        title={!can(PERMISSIONS.PPPOE_SEND_BULK_SMS) ? "You don't have permission to send bulk SMS" : undefined}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>SEND SMS TO MANY</span>
                    </button>
                    <button
                        onClick={() => can(PERMISSIONS.PPPOE_ADD_USER) && setShowAddModal(true)}
                        disabled={!can(PERMISSIONS.PPPOE_ADD_USER)}
                        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-all text-sm ${can(PERMISSIONS.PPPOE_ADD_USER) ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'}`}
                        title={!can(PERMISSIONS.PPPOE_ADD_USER) ? "You don't have permission to add users" : undefined}
                    >
                        <Plus className="w-4 h-4" />
                        <span>ADD USER</span>
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 w-full">
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Filter items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-48 md:w-64 px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm"
                    >
                        <option value="">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="DISABLED">Disabled</option>
                    </select>

                    {/* Action Buttons */}
                    <button className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-700 transition-all text-sm">
                        <Download className="w-4 h-4" />
                        <span>Export to Excel</span>
                    </button>
                    <button
                        onClick={handleResetTable}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-700 transition-all text-sm"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset Table</span>
                    </button>
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">USERNAME</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">NAMES</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">PHONE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">ACTIVITY</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">STATUS</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">EXPIRY</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">PACKAGE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                        <p className="text-sm text-slate-400 mt-2">Loading customers...</p>
                                    </td>
                                </tr>
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                        No customers found
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer, index) => (
                                    <tr key={customer.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{(currentPage - 1) * pageSize + index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <Link
                                                to={`/customers/pppoe/${customer.id}`}
                                                className="text-sm text-cyan-400 hover:underline hover:text-cyan-300 transition-colors"
                                            >
                                                {customer.username}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-200">{customer.name}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{customer.phone || "-"}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`text-sm ${getActivityColor(customer.isOnline)}`}>
                                                {customer.isOnline ? "online" : "offline"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`text-sm font-medium ${getStatusColor(customer.status)}`}>
                                                {customer.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{formatDate(customer.expiresAt)}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">{customer.package?.name || "-"}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
                <div className="flex justify-center">
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
                </div>
            )}
        </div>
    );
}
