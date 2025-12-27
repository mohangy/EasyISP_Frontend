import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Server } from "lucide-react";
import { nasApi, type UpdateNASRequest } from "../../services/nasService";
import toast from "react-hot-toast";

interface EditRouterModalProps {
    isOpen: boolean;
    router: {
        id: string;
        boardName: string;
        ipAddress?: string;
    } | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditRouterModal({ isOpen, router, onClose, onSuccess }: EditRouterModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        ipAddress: string;
        secret: string;
        coaPort: number;
        apiUsername: string;
        apiPassword: string;
        apiPort: number;
    }>({
        name: "",
        ipAddress: "",
        secret: "",
        coaPort: 3799,
        apiUsername: "admin",
        apiPassword: "",
        apiPort: 8728,
    });

    // Load router details when modal opens
    useEffect(() => {
        if (isOpen && router) {
            setLoading(true);
            nasApi.getRouter(router.id)
                .then((data) => {
                    setFormData({
                        name: data.name || data.boardName || "",
                        ipAddress: data.ipAddress || "",
                        secret: data.secret || "",
                        coaPort: data.coaPort || 3799,
                        apiUsername: data.apiUsername || "admin",
                        apiPassword: "",
                        apiPort: data.apiPort || 8728,
                    });
                })
                .catch(() => {
                    // Use basic info from prop
                    setFormData({
                        name: router.boardName || "",
                        ipAddress: router.ipAddress || "",
                        secret: "",
                        coaPort: 3799,
                        apiUsername: "admin",
                        apiPassword: "",
                        apiPort: 8728,
                    });
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!router) return;

        if (!formData.name.trim()) {
            toast.error("Router name is required");
            return;
        }

        setSaving(true);
        try {
            const updateData: UpdateNASRequest = {
                name: formData.name,
                ipAddress: formData.ipAddress || undefined,
                secret: formData.secret || undefined,
                coaPort: formData.coaPort,
                apiUsername: formData.apiUsername || undefined,
                apiPassword: formData.apiPassword || undefined,
                apiPort: formData.apiPort,
            };

            await nasApi.updateRouter(router.id, updateData);
            toast.success("Router updated successfully");
            onSuccess();
            onClose();
        } catch {
            toast.error("Failed to update router");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !router) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                            <Server className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Edit Router</h2>
                            <p className="text-sm text-slate-400">{router.boardName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="px-6 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Router Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Router Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Main Office Router"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                />
                            </div>

                            {/* IP Address */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    IP Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.ipAddress}
                                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                                    placeholder="e.g., 192.168.1.1"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                />
                            </div>

                            {/* RADIUS Secret */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    RADIUS Secret
                                </label>
                                <input
                                    type="password"
                                    value={formData.secret}
                                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                                    placeholder="Leave blank to keep current"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                />
                            </div>

                            {/* CoA Port */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    CoA Port
                                </label>
                                <input
                                    type="number"
                                    value={formData.coaPort}
                                    onChange={(e) => setFormData({ ...formData, coaPort: parseInt(e.target.value) || 3799 })}
                                    placeholder="3799"
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Port used for Change of Authorization (disconnect users)
                                </p>
                            </div>

                            {/* API Section */}
                            <div className="border-t border-slate-700 pt-4 mt-4">
                                <h4 className="text-sm font-semibold text-white mb-3">MikroTik API Credentials</h4>
                                <p className="text-xs text-slate-500 mb-4">
                                    Used for remote management features like PPPoE sync, queue management, etc.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            API Username
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.apiUsername}
                                            onChange={(e) => setFormData({ ...formData, apiUsername: e.target.value })}
                                            placeholder="admin"
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            API Port
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.apiPort}
                                            onChange={(e) => setFormData({ ...formData, apiPort: parseInt(e.target.value) || 8728 })}
                                            placeholder="8728"
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        API Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.apiPassword}
                                        onChange={(e) => setFormData({ ...formData, apiPassword: e.target.value })}
                                        placeholder="Leave blank to keep current"
                                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-900/30">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
}
