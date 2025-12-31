import { useState, useEffect } from "react";
import { Modal } from "../../components/ui/Modal";
import { AlertTriangle, Send, Trash2, RefreshCw, WifiOff, Calendar, ArrowRightLeft, MapPin } from "lucide-react";
import { voucherApi } from "../../services/voucherService";
import { LocationPickerModal } from "../../components/ui/LocationPickerModal";

// ============ EDIT USER MODAL ============
interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        username?: string;
        name?: string;
        password?: string;
        email?: string;
        phone?: string;
        location?: string;
        latitude?: number;
        longitude?: number;
    } | null;
    onSave: (data: {
        username: string;
        name: string;
        password: string;
        email: string;
        phone: string;
        location: string;
        latitude?: number;
        longitude?: number;
    }) => Promise<void>;
}

export function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
    const [form, setForm] = useState({
        username: "",
        name: "",
        password: "",
        email: "",
        phone: "",
        location: "",
        latitude: "",
        longitude: ""
    });
    const [loading, setLoading] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            setForm({
                username: user.username || "",
                name: user.name || "",
                password: user.password || "",
                email: user.email || "",
                phone: user.phone || "",
                location: user.location || "",
                latitude: user.latitude?.toString() || "",
                longitude: user.longitude?.toString() || ""
            });
        }
    }, [user, isOpen]);

    const handleLocationSelect = (lat: number, lng: number, address?: string) => {
        setForm(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6),
            location: address || prev.location
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                ...form,
                latitude: form.latitude ? parseFloat(form.latitude) : undefined,
                longitude: form.longitude ? parseFloat(form.longitude) : undefined
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit User Information">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Username / Account Number
                    </label>
                    <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Password
                    </label>
                    <input
                        type="text"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Location
                    </label>
                    <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                </div>

                {/* Coordinates Section */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Coordinates
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowMapPicker(true)}
                            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            Pick on Map
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <input
                                type="number"
                                step="any"
                                value={form.latitude}
                                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                                placeholder="Latitude (e.g., -4.044584)"
                                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                            />
                        </div>
                        <div>
                            <input
                                type="number"
                                step="any"
                                value={form.longitude}
                                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                                placeholder="Longitude (e.g., 39.661911)"
                                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>

            {/* Map Location Picker Modal */}
            <LocationPickerModal
                isOpen={showMapPicker}
                onClose={() => setShowMapPicker(false)}
                onSelect={handleLocationSelect}
                initialLat={form.latitude ? parseFloat(form.latitude) : undefined}
                initialLng={form.longitude ? parseFloat(form.longitude) : undefined}
            />
        </Modal>
    );
}

// ============ ADD CHILD MODAL ============
interface AddChildModalProps {
    isOpen: boolean;
    onClose: () => void;
    parentExpiresAt?: string;
    onSave: (data: {
        username: string;
        password: string;
        name: string;
        phone?: string;
    }) => Promise<void>;
}

export function AddChildModal({ isOpen, onClose, parentExpiresAt, onSave }: AddChildModalProps) {
    const [form, setForm] = useState({
        username: "",
        password: "",
        name: "",
        phone: ""
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(form);
            onClose();
            setForm({ username: "", password: "", name: "", phone: "" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Child Account">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-600 dark:text-blue-400">
                    <p>Child account expiry will be linked to parent account.</p>
                    {parentExpiresAt && (
                        <p className="mt-1 font-medium">
                            Parent expires: {new Date(parentExpiresAt).toLocaleString()}
                        </p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Username / Account Number
                    </label>
                    <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Password
                    </label>
                    <input
                        type="text"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number (Optional)
                    </label>
                    <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Creating..." : "Create Child Account"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ============ SEND SMS MODAL ============
interface SendSMSModalProps {
    isOpen: boolean;
    onClose: () => void;
    phone?: string;
    onSend: (message: string) => Promise<void>;
}

export function SendSMSModal({ isOpen, onClose, phone, onSend }: SendSMSModalProps) {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        setLoading(true);
        try {
            await onSend(message);
            onClose();
            setMessage("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send SMS">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        value={phone || ""}
                        readOnly
                        className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-600 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white resize-none"
                        placeholder="Enter your message..."
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">{message.length} characters</p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !message.trim()}
                        className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {loading ? "Sending..." : "Send SMS"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ============ CONFIRMATION MODAL ============
interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    title: string;
    message: string;
    confirmText?: string;
    confirmColor?: "red" | "amber" | "cyan";
    icon?: React.ReactNode;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    confirmColor = "red",
    icon
}: ConfirmModalProps) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const colorClasses = {
        red: "bg-rose-500 hover:bg-rose-600",
        amber: "bg-amber-500 hover:bg-amber-600",
        cyan: "bg-cyan-500 hover:bg-cyan-600"
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    {icon && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            {icon}
                        </div>
                    )}
                    <p className="text-slate-600 dark:text-slate-300">{message}</p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors ${colorClasses[confirmColor]}`}
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ============ CHANGE EXPIRY MODAL ============
interface ChangeExpiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentExpiry?: string;
    onSave: (newExpiry: string) => Promise<void>;
}

export function ChangeExpiryModal({ isOpen, onClose, currentExpiry, onSave }: ChangeExpiryModalProps) {
    const [expiryDate, setExpiryDate] = useState("");
    const [expiryTime, setExpiryTime] = useState("23:59");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentExpiry && isOpen) {
            const date = new Date(currentExpiry);
            setExpiryDate(date.toISOString().split("T")[0]);
            setExpiryTime(date.toTimeString().slice(0, 5));
        }
    }, [currentExpiry, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expiryDate) return;
        setLoading(true);
        try {
            const newExpiry = new Date(`${expiryDate}T${expiryTime}`).toISOString();
            await onSave(newExpiry);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Expiry Date">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-500" />
                    <div>
                        <p className="text-xs text-slate-500">Current Expiry</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {currentExpiry ? new Date(currentExpiry).toLocaleString() : "Not set"}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            New Date
                        </label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            New Time
                        </label>
                        <input
                            type="time"
                            value={expiryTime}
                            onChange={(e) => setExpiryTime(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !expiryDate}
                        className="px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Saving..." : "Update Expiry"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ============ RESOLVE TRANSACTION MODAL ============
interface ResolveTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetCustomerId: string;
    targetCustomerName?: string;
    onResolve: (mpesaCode: string) => Promise<void>;
}

export function ResolveTransactionModal({
    isOpen,
    onClose,
    targetCustomerName,
    onResolve
}: ResolveTransactionModalProps) {
    const [mpesaCode, setMpesaCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mpesaCode.trim()) return;
        setLoading(true);
        try {
            await onResolve(mpesaCode.trim().toUpperCase());
            onClose();
            setMpesaCode("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Resolve Transaction">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                        <ArrowRightLeft className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-600 dark:text-amber-400">
                            <p className="font-medium">Move Transaction</p>
                            <p className="mt-1">
                                Enter the Mpesa transaction code to move it from another account to{" "}
                                <span className="font-semibold">{targetCustomerName || "this account"}</span>.
                            </p>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Mpesa Transaction Code
                    </label>
                    <input
                        type="text"
                        value={mpesaCode}
                        onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                        placeholder="e.g., SJK4H7L2PQ"
                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white uppercase font-mono"
                        required
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !mpesaCode.trim()}
                        className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        {loading ? "Processing..." : "Move Transaction"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ============ CHANGE PLAN MODAL ============
import { customerApi, type Package } from "../../services/customerService";
import { Loader2 } from "lucide-react";

interface ChangePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPackageId?: string;
    currentPackageName?: string;
    onSelect: (packageId: string) => Promise<void>;
    serviceType?: "PPPOE" | "HOTSPOT";
}

export function ChangePlanModal({
    isOpen,
    onClose,
    currentPackageId,
    currentPackageName,
    onSelect,
    serviceType = "PPPOE"
}: ChangePlanModalProps) {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setSelectedId(null);
            customerApi.getPackages(serviceType)
                .then(setPackages)
                .finally(() => setLoading(false));
        }
    }, [isOpen, serviceType]);

    const handleSubmit = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            await onSelect(selectedId);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Plan" className="max-w-xl">
            <div className="space-y-4">
                {currentPackageName && (
                    <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Current Plan</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{currentPackageName}</p>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Select New Plan
                    </label>

                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                        </div>
                    ) : (
                        <select
                            value={selectedId || ""}
                            onChange={(e) => setSelectedId(e.target.value || null)}
                            className="w-full px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            <option value="">-- Select a plan --</option>
                            {packages.filter(pkg => pkg.isActive !== false).map((pkg) => (
                                <option
                                    key={pkg.id}
                                    value={pkg.id}
                                    disabled={pkg.id === currentPackageId}
                                >
                                    {pkg.name} - KES {pkg.price.toLocaleString()} ({pkg.downloadSpeed}Mbps/{pkg.uploadSpeed}Mbps)
                                    {pkg.id === currentPackageId ? " (Current)" : ""}
                                </option>
                            ))}
                        </select>
                    )}

                    {selectedId && (
                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                            {(() => {
                                const pkg = packages.find(p => p.id === selectedId);
                                if (!pkg) return null;
                                return (
                                    <div className="text-sm">
                                        <p className="font-medium text-cyan-600 dark:text-cyan-400">{pkg.name}</p>
                                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                                            {pkg.downloadSpeed}Mbps download / {pkg.uploadSpeed}Mbps upload
                                            {pkg.dataLimit && ` • ${pkg.dataLimit}GB data limit`}
                                        </p>
                                        <p className="font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                                            KES {pkg.price.toLocaleString()}/month
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selectedId || saving}
                        className="px-4 py-2 text-sm font-medium bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                    >
                        {saving ? "Changing..." : "Change Plan"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ============ ADD HOTSPOT USER MODAL ============
export function AddHotspotUserModal({
    isOpen,
    onClose,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [mode, setMode] = useState<"Single" | "Batch">("Single");
    const [username, setUsername] = useState("");
    const [pages, setPages] = useState(1);
    const [vouchersPerPage, setVouchersPerPage] = useState(21);
    const [packageId, setPackageId] = useState("");
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            setMode("Single");
            setUsername("");
            setPages(1);
            setVouchersPerPage(21);
            setPackageId("");
            setPackageId("");
            customerApi.getPackages("HOTSPOT")
                .then(data => setPackages(data || []))
                .catch(err => {
                    console.error(err);
                    setPackages([]);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!packageId) return;
        setSubmitting(true);
        try {
            if (mode === "Single") {
                if (!username) return;
                await customerApi.createCustomer({
                    username,
                    name: username,
                    password: username,
                    connectionType: "HOTSPOT",
                    packageId,
                    phone: username
                } as any);
            } else {
                await voucherApi.generate({
                    count: pages * vouchersPerPage,
                    packageId,
                    type: "HOTSPOT"
                });
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const totalVouchers = pages * vouchersPerPage;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add User(s)" className="max-w-md">
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">VOUCHER TYPE<span className="text-red-500">*</span></label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as "Single" | "Batch")}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                        <option value="Single">Single</option>
                        <option value="Batch">Batch</option>
                    </select>
                </div>

                {mode === "Single" ? (
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">ENTER USERNAME:</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="E.g userxyz"
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                    </div>
                ) : (
                    <>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">ENTER NUMBER OF PAGES (MAX 5):</label>
                            <input
                                type="number"
                                min={1}
                                max={5}
                                value={pages}
                                onChange={(e) => setPages(Math.min(5, Math.max(1, parseInt(e.target.value) || 0)))}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">ENTER NUMBER VOUCHERS PER PAGE (MAX 21):</label>
                            <input
                                type="number"
                                min={1}
                                max={21}
                                value={vouchersPerPage}
                                onChange={(e) => setVouchersPerPage(Math.min(21, Math.max(1, parseInt(e.target.value) || 0)))}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="text-sm text-slate-400">
                            TOTAL VOUCHERS: <span className="text-white font-medium">{totalVouchers}</span>
                        </div>
                    </>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">SELECT PACKAGE:<span className="text-red-500">*</span></label>
                    <select
                        value={packageId}
                        onChange={(e) => setPackageId(e.target.value)}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                        <option value="">{loading ? "Loading packages..." : "Select a package"}</option>
                        {Array.isArray(packages) && packages.filter(pkg => pkg.isActive !== false).map(pkg => (
                            <option key={pkg.id} value={pkg.id}>
                                {pkg.name} @ KES {pkg.price}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-between pt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !packageId || (mode === "Single" && !username)}
                        className="px-6 py-2 bg-transparent border border-cyan-500 text-white rounded hover:bg-cyan-500/10 transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Submitting..." : "Submit"}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-transparent border border-orange-500 text-white rounded hover:bg-orange-500/10 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export const ModalIcons = {
    Delete: <Trash2 className="w-5 h-5" />,
    Warning: <AlertTriangle className="w-5 h-5" />,
    ResetMAC: <RefreshCw className="w-5 h-5" />,
    Purge: <WifiOff className="w-5 h-5" />
};
