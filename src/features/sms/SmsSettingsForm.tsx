import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Edit2, Check, MessageSquare, X, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';
import { tenantApi } from '../../services/tenantService';

interface SmsGateway {
    id: string;
    provider: string;
    name: string | null;
    apiKey?: string;
    username?: string;
    senderId?: string;
    config?: any;
    isDefault: boolean;
    forHotspot: boolean;
    forPppoe: boolean;
}

const PROVIDERS = [
    { id: 'TEXTSMS', name: 'TextSMS Kenya', fields: ['apikey', 'partnerID', 'shortcode'] },
    { id: 'TALKSASA', name: 'Talksasa Kenya', fields: ['proxyApiKey', 'senderId'] },
    { id: 'HOSTPINNACLE', name: 'Hostpinnacle Kenya', fields: ['apiKey', 'senderId', 'userId', 'password'] },
    { id: 'CELCOM', name: 'Celcom Africa', fields: ['apikey', 'partnerID', 'shortcode'] },
    { id: 'BYTEWAVE', name: 'Bytewave Kenya', fields: ['apiToken', 'senderId'] },
    { id: 'BLESSEDTEXT', name: 'Blessedtext Kenya', fields: ['apiKey', 'senderId'] },
    { id: 'ADVANTA', name: 'Advanta Africa', fields: ['apikey', 'partnerID', 'shortcode'] },
];

export function SmsSettingsForm() {
    const [gateways, setGateways] = useState<SmsGateway[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGateway, setEditingGateway] = useState<SmsGateway | null>(null);

    const fetchGateways = async () => {
        try {
            setLoading(true);
            const data = await tenantApi.getSmsGateways();
            setGateways(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load SMS gateways");
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
                Loading SMS configuration...
            </div>
        );
    }

    if (isEditing) {
        return (
            <SmsGatewayForm
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
                    <h3 className="text-lg font-medium text-white">SMS Gateways</h3>
                    <p className="text-sm text-slate-400">Manage multiple SMS providers</p>
                </div>
                <button
                    onClick={() => {
                        setEditingGateway(null);
                        setIsEditing(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> Add Gateway
                </button>
            </div>

            <div className="grid gap-4">
                {gateways.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                        <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No SMS Gateways Configured</h3>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                            Add an SMS provider to start sending messages to your customers.
                        </p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Gateway
                        </button>
                    </div>
                ) : (
                    gateways.map((gw) => (
                        <SmsGatewayCard
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

function SmsGatewayCard({ gateway, onEdit, onDelete, onDefaultSet }: { gateway: SmsGateway; onEdit: () => void; onDelete: () => void; onDefaultSet: () => void }) {
    const [testing, setTesting] = useState(false);

    const handleTest = async () => {
        setTesting(true);
        const toastId = toast.loading("Testing connection...");
        try {
            const res = await tenantApi.testSmsGateway(gateway.id);
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
            await tenantApi.deleteSmsGateway(gateway.id);
            toast.success("Gateway deleted");
            onDelete();
        } catch (e) {
            toast.error("Failed to delete gateway");
        }
    };

    const handleSetDefault = async () => {
        try {
            await tenantApi.setSmsGatewayDefault(gateway.id);
            toast.success("Set as default");
            onDefaultSet();
        } catch (e) {
            toast.error("Failed to update default gateway");
        }
    };

    return (
        <div className={`p-5 rounded-xl border flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-all ${gateway.isDefault ? "bg-slate-800/80 border-cyan-500/50 shadow-lg shadow-cyan-500/10" : "bg-slate-800/40 border-slate-700/50 hover:border-slate-600"}`}>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-white text-lg">{gateway.name || gateway.provider}</h4>
                    {gateway.isDefault && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
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
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                        Provider: <span className="text-slate-300">{gateway.provider}</span>
                    </div>
                    {gateway.senderId && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            Sender ID: <span className="text-slate-300">{gateway.senderId}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-colors disabled:opacity-50"
                    title="Test Connection"
                >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
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

function SmsGatewayForm({ gateway, onCancel, onSave }: { gateway: SmsGateway | null; onCancel: () => void; onSave: () => void }) {
    const [provider, setProvider] = useState(gateway?.provider || "");
    const [name, setName] = useState(gateway?.name || "");
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [usage, setUsage] = useState({
        forHotspot: gateway?.forHotspot || false,
        forPppoe: gateway?.forPppoe || false,
        isDefault: gateway?.isDefault || false,
    });
    const [saving, setSaving] = useState(false);

    // Initialize formData from gateway config
    useEffect(() => {
        if (gateway) {
            const initialData: Record<string, string> = { ...gateway.config };
            if (gateway.apiKey) {
                // Try to guess which field maps to apiKey based on provider
                if (['TEXTSMS', 'CELCOM', 'ADVANTA', 'BLESSEDTEXT', 'HOSTPINNACLE'].includes(gateway.provider)) initialData['apikey'] = gateway.apiKey;
                if (['TALKSASA'].includes(gateway.provider)) initialData['proxyApiKey'] = gateway.apiKey;
                if (['BYTEWAVE'].includes(gateway.provider)) initialData['apiToken'] = gateway.apiKey;
                // Hostpinnacle uses 'apiKey' case sensitive
                if (['HOSTPINNACLE'].includes(gateway.provider)) initialData['apiKey'] = gateway.apiKey;
            }
            if (gateway.senderId) {
                initialData['senderId'] = gateway.senderId;
                if (['TEXTSMS', 'CELCOM', 'ADVANTA'].includes(gateway.provider)) initialData['shortcode'] = gateway.senderId;
            }
            if (gateway.username) {
                initialData['userId'] = gateway.username;
            }
            setFormData(initialData);
        }
    }, [gateway]);

    const handleProviderChange = (p: string) => {
        setProvider(p);
        // Reset form data only if changing provider
        if (p !== gateway?.provider) {
            setFormData({});
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        // Map fields back to model
        let apiKey = formData['apikey'] || formData['apiKey'] || formData['proxyApiKey'] || formData['apiToken'];
        let senderId = formData['senderId'] || formData['shortcode'];
        let username = formData['userId'] || formData['username'];

        // Everything else in config
        const config: Record<string, any> = {};
        const providerFields = PROVIDERS.find(p => p.id === provider)?.fields || [];

        providerFields.forEach(field => {
            // Exclude mapped fields from strict config if they are already in main columns
            // But keep them if they are unique parameters. 
            // To be safe, put specific details in config too.
            config[field] = formData[field];
        });

        const payload = {
            provider,
            name: name || `${provider} Gateway`,
            apiKey,
            senderId,
            username,
            config,
            ...usage
        };

        try {
            if (gateway) {
                await tenantApi.updateSmsGateway(gateway.id, payload);
                toast.success("Gateway updated");
            } else {
                await tenantApi.createSmsGateway(payload);
                toast.success("Gateway created");
            }
            onSave();
        } catch (error) {
            console.error(error);
            toast.error("Failed to save gateway");
        } finally {
            setSaving(false);
        }
    };

    const selectedProviderDef = PROVIDERS.find(p => p.id === provider);

    return (
        <div className="max-w-2xl bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-lg font-medium text-white">{gateway ? "Edit Gateway" : "Add New SMS Gateway"}</h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Provider</label>
                    <select
                        value={provider}
                        onChange={e => handleProviderChange(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                        required
                    >
                        <option value="">Select Provider...</option>
                        {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {provider && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1.5">Friendly Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                                placeholder={`e.g. ${selectedProviderDef?.name || 'My'} Gateway`}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-700/50">
                            <h4 className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Provider Settings</h4>
                            {selectedProviderDef?.fields.map(field => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5 capitalize">
                                        {field.replace(/([A-Z])/g, ' $1').trim()} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type={field.toLowerCase().includes('key') || field.toLowerCase().includes('token') || field.includes('password') ? "password" : "text"}
                                        value={formData[field] || ''}
                                        onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
                                        required
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                            <h4 className="text-sm font-medium text-slate-300 mb-3 block">Usage Settings</h4>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <label className="flex items-center gap-3 text-slate-300 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={usage.forHotspot}
                                        onChange={e => setUsage({ ...usage, forHotspot: e.target.checked })}
                                        className="peer h-5 w-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 transition-all"
                                    />
                                    <span className="group-hover:text-white transition-colors">Use for Hotspot</span>
                                </label>

                                <label className="flex items-center gap-3 text-slate-300 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={usage.forPppoe}
                                        onChange={e => setUsage({ ...usage, forPppoe: e.target.checked })}
                                        className="peer h-5 w-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 transition-all"
                                    />
                                    <span className="group-hover:text-white transition-colors">Use for PPPoE</span>
                                </label>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex gap-4 pt-4 border-t border-slate-700">
                    <button
                        type="submit"
                        disabled={saving || !provider}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
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
            </form>
        </div>
    );
}
