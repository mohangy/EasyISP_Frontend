import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, Wifi, AlertCircle, Loader2, Save, X } from "lucide-react";
import { tenantApi } from "../../services/tenantService";
import toast from "react-hot-toast";

interface PaymentGateway {
    id: string;
    type: string;
    subType: 'PAYBILL' | 'BUYGOODS' | 'BANK';
    name: string | null;
    shortcode: string;
    storeNumber?: string;
    accountNumber?: string;
    consumerKey?: string;
    consumerSecret?: string;
    passkey: string | null;
    env: 'sandbox' | 'production';
    isDefault: boolean;
    forHotspot: boolean;
    forPppoe: boolean;
}

export function PaymentGatewaySettings() {
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);

    const fetchGateways = async () => {
        try {
            setLoading(true);
            const data = await tenantApi.getPaymentGateways();
            setGateways(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load payment gateways");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGateways();
    }, []);

    if (loading && !gateways.length) {
        return (
            <div className="flex items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading configuration...
            </div>
        );
    }

    if (isEditing) {
        return (
            <PaymentGatewayForm
                gateway={editingGateway}
                onCancel={() => {
                    setIsEditing(false);
                    setEditingGateway(null);
                }}
                onSave={() => {
                    setIsEditing(false);
                    setEditingGateway(null);
                    fetchGateways();
                }}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-white">Payment Gateways</h3>
                    <p className="text-sm text-slate-400">Manage M-Pesa Paybills and Tills</p>
                </div>
                <button
                    onClick={() => {
                        setEditingGateway(null);
                        setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Add Gateway
                </button>
            </div>

            <div className="grid gap-4">
                {gateways.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                        <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No Gateways Configured</h3>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                            Add your first M-Pesa Paybill or Till connection to start accepting payments.
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" /> Configure M-Pesa
                        </button>
                    </div>
                ) : (
                    gateways.map((gw) => (
                        <PaymentGatewayCard
                            key={gw.id}
                            gateway={gw}
                            onEdit={() => {
                                setEditingGateway(gw);
                                setIsEditing(true);
                            }}
                            onDelete={fetchGateways}
                            onDefaultSet={fetchGateways}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

function PaymentGatewayCard({ gateway, onEdit, onDelete, onDefaultSet }: { gateway: PaymentGateway; onEdit: () => void; onDelete: () => void; onDefaultSet: () => void }) {
    const [testing, setTesting] = useState(false);

    const handleTest = async () => {
        setTesting(true);
        const toastId = toast.loading("Connecting to Safaricom...");
        try {
            const res = await tenantApi.testPaymentGateway(gateway.id);
            if (res.success) {
                toast.success(res.message, { id: toastId });
            } else {
                toast.error(res.message, { id: toastId });
            }
        } catch (e) {
            toast.error("Connection failed", { id: toastId });
        } finally {
            setTesting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this gateway?")) return;
        try {
            await tenantApi.deletePaymentGateway(gateway.id);
            toast.success("Gateway deleted");
            onDelete();
        } catch (e) {
            toast.error("Failed to delete gateway");
        }
    };

    const handleSetDefault = async () => {
        try {
            await tenantApi.setPaymentGatewayDefault(gateway.id);
            toast.success("Set as default");
            onDefaultSet();
        } catch (e) {
            toast.error("Failed to update default gateway");
        }
    };

    return (
        <div className={`p-5 rounded-xl border flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-all ${gateway.isDefault ? "bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10" : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600"}`}>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-white text-lg">{gateway.name || "Unnamed Gateway"}</h4>
                    {gateway.isDefault && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                            Default
                        </span>
                    )}
                    {gateway.forHotspot && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full border border-orange-500/30">
                            Hotspot
                        </span>
                    )}
                    {gateway.forPppoe && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                            PPPoE
                        </span>
                    )}
                    {gateway.subType === 'BUYGOODS' && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-teal-500/20 text-teal-400 rounded-full border border-teal-500/30">
                            Buy Goods
                        </span>
                    )}
                    {gateway.subType === 'BANK' && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                            Bank
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        Shortcode: <span className="text-slate-300 font-mono">{gateway.shortcode}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${gateway.env === 'production' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        Env: <span className="capitalize text-slate-300">{gateway.env}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors disabled:opacity-50"
                    title="Test Connection"
                >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                    <span className="md:hidden">Test</span>
                </button>

                <div className="w-px h-6 bg-slate-700 hidden md:block mx-1"></div>

                {!gateway.isDefault && (
                    <button
                        onClick={handleSetDefault}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
                        title="Set as Default"
                    >
                        <Check className="w-4 h-4" />
                        <span className="md:hidden">Make Default</span>
                    </button>
                )}

                <button
                    onClick={onEdit}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors"
                    title="Edit"
                >
                    <Edit2 className="w-4 h-4" />
                    <span className="md:hidden">Edit</span>
                </button>

                <button
                    onClick={handleDelete}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm transition-colors"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                    <span className="md:hidden">Delete</span>
                </button>
            </div>
        </div>
    );
}

function PaymentGatewayForm({ gateway, onCancel, onSave }: { gateway: PaymentGateway | null; onCancel: () => void; onSave: () => void }) {
    const [formData, setFormData] = useState({
        name: gateway?.name || "",
        shortcode: gateway?.shortcode || "",
        subType: gateway?.subType || "PAYBILL",
        storeNumber: gateway?.storeNumber || "",
        accountNumber: gateway?.accountNumber || "",
        consumerKey: gateway?.consumerKey || "",
        consumerSecret: gateway?.consumerSecret || "",
        passkey: gateway?.passkey || "",
        env: gateway?.env || "production",
        forHotspot: gateway?.forHotspot || false,
        forPppoe: gateway?.forPppoe || false,
        type: "MPESA_API"
    });
    const [saving, setSaving] = useState(false);
    const [showSecret, setShowSecret] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (gateway) {
                await tenantApi.updatePaymentGateway(gateway.id, formData);
                toast.success("Gateway updated successfully");
            } else {
                await tenantApi.createPaymentGateway(formData);
                toast.success("Gateway added successfully");
            }
            onSave();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save gateway configuration");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-lg font-medium text-white">{gateway ? "Edit Gateway" : "Add New Gateway"}</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Friendly Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                placeholder="e.g. Main Shop Paybill"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Gateway Type</label>
                            <select
                                value={formData.subType}
                                onChange={e => setFormData({ ...formData, subType: e.target.value as any })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            >
                                <option value="PAYBILL">Paybill</option>
                                <option value="BUYGOODS">Buy Goods (Till Number)</option>
                                <option value="BANK">M-Pesa to Bank</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                {formData.subType === 'BUYGOODS' ? 'Till Number' :
                                    formData.subType === 'BANK' ? 'Bank Paybill Number' :
                                        'Paybill Number'}
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.shortcode}
                                onChange={e => setFormData({ ...formData, shortcode: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                placeholder={formData.subType === 'BUYGOODS' ? "e.g. 123456" : "e.g. 247247"}
                            />
                        </div>

                        {formData.subType === 'BUYGOODS' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                    Store Number (Head Office)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.storeNumber}
                                    onChange={e => setFormData({ ...formData, storeNumber: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                    placeholder="e.g. 7760637"
                                />
                                <p className="text-xs text-slate-500 mt-1">This is the 'Business Shortcode' used for STK Push initiation.</p>
                            </div>
                        )}

                        {formData.subType === 'BANK' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">
                                    Target Bank Account
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.accountNumber}
                                    onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                    placeholder="e.g. 011000..."
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Environment</label>
                            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, env: 'production' })}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.env === 'production' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Production
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, env: 'sandbox' })}
                                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formData.env === 'sandbox' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    Sandbox
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Consumer Key</label>
                            <input
                                type="text"
                                required
                                value={formData.consumerKey}
                                onChange={e => setFormData({ ...formData, consumerKey: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                                placeholder="Daraja Consumer Key"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Consumer Secret</label>
                            <div className="relative">
                                <input
                                    type={showSecret ? "text" : "password"}
                                    required
                                    value={formData.consumerSecret}
                                    onChange={e => setFormData({ ...formData, consumerSecret: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm pr-10"
                                    placeholder="Daraja Consumer Secret"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                >
                                    {showSecret ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Passkey</label>
                            <input
                                type="password"
                                value={formData.passkey}
                                onChange={e => setFormData({ ...formData, passkey: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
                                placeholder="SimToolKit Passkey"
                            />
                            <p className="text-xs text-slate-500 mt-1">Required for STK Push.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-medium text-slate-300 mb-3 block">Usage Settings</h4>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <label className="flex items-center gap-3 text-slate-300 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.forHotspot}
                                    onChange={e => setFormData({ ...formData, forHotspot: e.target.checked })}
                                    className="peer h-5 w-5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 transition-all"
                                />
                            </div>
                            <span className="group-hover:text-white transition-colors">Use for Hotspot</span>
                        </label>

                        <label className="flex items-center gap-3 text-slate-300 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.forPppoe}
                                    onChange={e => setFormData({ ...formData, forPppoe: e.target.checked })}
                                    className="peer h-5 w-5 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-0 transition-all"
                                />
                            </div>
                            <span className="group-hover:text-white transition-colors">Use for PPPoE</span>
                        </label>
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-700">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? "Saving Changes..." : "Save Gateway"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form >
        </div >
    );
}
