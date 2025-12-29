import { useState, useEffect } from 'react';
import { Loader2, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface Provider {
    id: string;
    name: string;
    fields: string[];
}

interface SmsSettingsFormProps {
    onSave?: () => void;
    onCancel?: () => void;
}

// Field labels for better UX
const fieldLabels: Record<string, string> = {
    apikey: 'API Key',
    partnerID: 'Partner ID',
    shortcode: 'Sender ID / Shortcode',
    proxyApiKey: 'Proxy API Key',
    senderId: 'Sender ID',
    apiKey: 'API Key',
    apiToken: 'API Token',
};

export function SmsSettingsForm({ onSave, onCancel }: SmsSettingsFormProps) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [config, setConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [currentConfig, setCurrentConfig] = useState<any>(null);

    // Fetch available providers
    useEffect(() => {
        fetchProviders();
        fetchCurrentConfig();
    }, []);

    const fetchProviders = async () => {
        try {
            const response = await api.get('/tenant/sms-config/providers');
            setProviders(response.data.providers || []);
        } catch (error) {
            console.error('Failed to fetch SMS providers:', error);
            toast.error('Failed to load SMS providers');
        }
    };

    const fetchCurrentConfig = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tenant/sms-config');
            const data = response.data;
            setCurrentConfig(data);
            if (data.provider) {
                setSelectedProvider(data.provider);
                setConfig({
                    ...data.config,
                    senderId: data.senderId || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch SMS config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderChange = (providerId: string) => {
        setSelectedProvider(providerId);
        setConfig({});
        setTestResult(null);
    };

    const handleFieldChange = (field: string, value: string) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        setTestResult(null);
    };

    const getProviderFields = (): string[] => {
        const provider = providers.find(p => p.id === selectedProvider);
        return provider?.fields || [];
    };

    const handleTestConnection = async () => {
        if (!selectedProvider) {
            toast.error('Please select a provider first');
            return;
        }

        setTesting(true);
        setTestResult(null);
        try {
            const response = await api.post('/tenant/sms-config/test', {
                provider: selectedProvider,
                config: config,
            });
            setTestResult(response.data);
            if (response.data.success) {
                toast.success('Connection test successful!');
            } else {
                toast.error(response.data.message || 'Connection test failed');
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Connection test failed';
            setTestResult({ success: false, message });
            toast.error(message);
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        if (!selectedProvider) {
            toast.error('Please select a provider');
            return;
        }

        // Check required fields
        const senderId = config.senderId || config.shortcode || '';
        if (!senderId) {
            toast.error('Sender ID is required');
            return;
        }

        setSaving(true);
        try {
            await api.put('/tenant/sms-config', {
                provider: selectedProvider,
                senderId: senderId,
                config: config,
            });
            toast.success('SMS settings saved successfully!');
            onSave?.();
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to save settings';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                    <span className="ml-2 text-slate-400">Loading settings...</span>
                </div>
            ) : (
                <>
                    {/* Current Status */}
                    {currentConfig?.provider && (
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase">Current Provider</p>
                                    <p className="text-lg font-semibold text-cyan-400">{currentConfig.provider}</p>
                                </div>
                                {currentConfig.hasApiKey && (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase">
                            Select SMS Provider <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedProvider}
                            onChange={(e) => handleProviderChange(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                        >
                            <option value="">--- Select Provider ---</option>
                            {providers.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic Config Fields */}
                    {selectedProvider && (
                        <div className="space-y-4 border-t border-slate-700 pt-4">
                            <p className="text-sm text-slate-400">
                                Enter your {providers.find(p => p.id === selectedProvider)?.name} credentials:
                            </p>
                            {getProviderFields().map(field => (
                                <div key={field} className="space-y-1">
                                    <label className="block text-xs font-medium text-slate-400 uppercase">
                                        {fieldLabels[field] || field} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type={field.toLowerCase().includes('key') || field.toLowerCase().includes('token') ? 'password' : 'text'}
                                        value={config[field] || ''}
                                        onChange={(e) => handleFieldChange(field, e.target.value)}
                                        placeholder={`Enter ${fieldLabels[field] || field}`}
                                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none placeholder:text-slate-500"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Test Result */}
                    {testResult && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${testResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                            {testResult.success ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                                {testResult.message}
                            </span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            onClick={handleTestConnection}
                            disabled={!selectedProvider || testing}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {testing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <TestTube className="w-4 h-4" />
                            )}
                            Test Connection
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedProvider || saving}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save Settings
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
