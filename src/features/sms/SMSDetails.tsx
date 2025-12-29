import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Calendar, User, Phone, MessageSquare, CheckCircle, XCircle, Trash2, RefreshCw, Activity } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

interface SMSDetails {
    id: string;
    recipient: string;
    message: string;
    status: string;
    initiator: string;
    createdAt: string;
    provider: string;
    cost: number | null;
}

export function SMSDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sms, setSms] = useState<SMSDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [deliveryInfo, setDeliveryInfo] = useState<{ status: string; description?: string } | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/sms/${id}`);
                setSms(response.data);
            } catch (error) {
                console.error("Failed to fetch SMS details", error);
                toast.error("Failed to load SMS details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this SMS log?")) return;
        try {
            await api.delete(`/sms/${id}`);
            toast.success("SMS log deleted");
            navigate('/sms');
        } catch (error) {
            toast.error("Failed to delete SMS log");
        }
    };

    const handleResend = async () => {
        if (!sms || !window.confirm("Resend this message?")) return;
        try {
            await api.post('/sms', {
                recipients: [sms.recipient],
                message: sms.message
            });
            toast.success("Message resent successfully");
        } catch (error) {
            toast.error("Failed to resend message");
        }
    };

    const checkDeliveryStatus = async () => {
        if (!id) return;
        setCheckingStatus(true);
        try {
            const response = await api.get(`/sms/${id}/delivery-status`);
            if (response.data.success) {
                setDeliveryInfo({
                    status: response.data.status,
                    description: response.data.description
                });
                toast.success(`Status: ${response.data.status}`);
            } else {
                setDeliveryInfo({ status: response.data.status || 'Error', description: response.data.error });
                toast.error(response.data.error || "Failed to check status");
            }
        } catch (error) {
            toast.error("Failed to connect to provider");
        } finally {
            setCheckingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="mt-4 text-slate-400">Loading details...</p>
            </div>
        );
    }

    if (!sms) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <p>SMS log not found</p>
                <button
                    onClick={() => navigate('/sms')}
                    className="mt-4 px-4 py-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                    Back to Outbox
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/sms')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Outbox
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={handleResend}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Resend
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/50 pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-1">SMS Details</h1>
                        <p className="text-sm text-slate-400">ID: {sms.id}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${sms.status === 'sent' || sms.status === 'delivered' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                        {sms.status === 'sent' || sms.status === 'delivered' ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <XCircle className="w-4 h-4" />
                        )}
                        {sms.status.toUpperCase()}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Recipient</label>
                        <div className="flex items-center gap-2 text-slate-200 bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                            <Phone className="w-4 h-4 text-blue-400" />
                            {sms.recipient}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Initiator</label>
                        <div className="flex items-center gap-2 text-slate-200 bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                            <User className="w-4 h-4 text-purple-400" />
                            <span className="capitalize">{(sms.initiator || 'System').replace(/_/g, ' ')}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Date Sent</label>
                        <div className="flex items-center gap-2 text-slate-200 bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                            <Calendar className="w-4 h-4 text-amber-400" />
                            {new Date(sms.createdAt).toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Delivery Status (Live)</label>
                        <div className="flex items-center justify-between text-slate-200 bg-slate-900/50 p-2 pl-3 rounded-lg border border-slate-700/30">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-400" />
                                <span className={deliveryInfo ? 'text-white font-medium' : 'text-slate-400'}>
                                    {deliveryInfo ? `${deliveryInfo.status} ${deliveryInfo.description ? `(${deliveryInfo.description})` : ''}` : 'Unknown'}
                                </span>
                            </div>
                            <button
                                onClick={checkDeliveryStatus}
                                disabled={checkingStatus}
                                className="px-3 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors border border-slate-600 disabled:opacity-50"
                            >
                                {checkingStatus ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    'Check'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Message Content
                    </label>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-300 text-base leading-relaxed whitespace-pre-wrap">
                        {sms.message}
                    </div>
                </div>
            </div>
        </div>
    );
}
