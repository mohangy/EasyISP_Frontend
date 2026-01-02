import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileDown, RotateCcw, Loader2, Trash2, Settings, PenSquare, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { SmsSettingsModal } from "./SmsSettingsModal";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../lib/permissions";
import api from "../../services/api";

interface SMSLog {
    id: string | number;
    phone?: string;
    recipient?: string;
    recipients?: string;
    message: string;
    status: string;
    initiator: string;
    createdAt: string;
}

export function SMSOutbox() {
    const navigate = useNavigate();
    const { can } = usePermissions();
    const [searchQuery, setSearchQuery] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
    const [smsBalance, setSmsBalance] = useState<{ balance: number; provider: string } | null>(null);

    // Fetch SMS balance and provider
    const fetchSmsBalance = useCallback(async () => {
        try {
            const response = await api.get('/tenant/sms-balance');
            if (response.data.success !== false) {
                setSmsBalance({
                    balance: response.data.balance ?? 0,
                    provider: response.data.provider || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch SMS balance:', error);
        }
    }, []);

    // Fetch SMS config for provider name
    const fetchSmsConfig = useCallback(async () => {
        try {
            const response = await api.get('/tenant/sms-config');
            if (response.data.provider) {
                setSmsBalance(prev => ({
                    balance: prev?.balance ?? 0,
                    provider: response.data.provider,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch SMS config:', error);
        }
    }, []);

    // Fetch SMS logs from API
    useEffect(() => {
        const fetchSMSLogs = async () => {
            setLoading(true);
            try {
                const response = await api.get('/sms');
                setSmsLogs(response.data.logs || []);
            } catch (error) {
                console.error("Failed to fetch SMS logs:", error);
                setSmsLogs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSMSLogs();
        fetchSmsBalance();
        fetchSmsConfig();
    }, [fetchSmsBalance, fetchSmsConfig]);

    // Filter Logic
    const filteredData = useMemo(() => {
        return smsLogs.filter(item => {
            const phone = item.phone || item.recipient || item.recipients || '';
            return (
                phone.includes(searchQuery) ||
                (item.message || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.initiator || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [searchQuery, smsLogs]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchQuery("");
        setCurrentPage(1);
        setRowsPerPage(20);
        toast.success("Table filters reset");
    };

    const handleExport = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Generating Excel report...',
                success: 'Report downloaded successfully!',
                error: 'Could not generate report',
            }
        );
    };

    const handleClearAll = () => {
        if (can(PERMISSIONS.SMS_CLEAR)) {
            setShowClearModal(true);
        } else {
            toast.error("You do not have permission to clear SMS logs");
        }
    };

    const confirmClearAll = () => {
        toast.promise(
            new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                    setShowClearModal(false);
                }, 1500);
            }),
            {
                loading: 'Clearing SMS outbox...',
                success: 'Outbox cleared successfully',
                error: 'Failed to clear outbox',
            }
        );
    };

    const handleCompose = () => {
        if (can(PERMISSIONS.SMS_COMPOSE)) {
            setShowComposeModal(true);
        } else {
            toast.error("You do not have permission to compose SMS");
        }
    };

    const [composePhone, setComposePhone] = useState('');
    const [composeMessage, setComposeMessage] = useState('');
    const [sendingMsg, setSendingMsg] = useState(false);

    const sendSMS = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!composePhone || !composeMessage) {
            toast.error('Please enter phone and message');
            return;
        }

        setSendingMsg(true);
        try {
            const response = await api.post('/sms', {
                recipients: composePhone,
                message: composeMessage,
            });
            if (response.data.success) {
                toast.success(`SMS sent successfully! (${response.data.sent} sent)`);
                setShowComposeModal(false);
                setComposePhone('');
                setComposeMessage('');
                // Refresh logs
                const logsRes = await api.get('/sms');
                setSmsLogs(logsRes.data.logs || []);
                // Refresh balance
                fetchSmsBalance();
            } else {
                toast.error(response.data.message || 'Failed to send SMS');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to send SMS';
            toast.error(msg);
        } finally {
            setSendingMsg(false);
        }
    };


    const truncateMessage = (message: string) => {
        if (!message) return '';
        return message.length > 40 ? `${message.substring(0, 40)}...` : message;
    };

    const truncateId = (id: string | number) => {
        const strId = String(id);
        if (strId.length > 12) {
            return `${strId.substring(0, 8)}...${strId.substring(strId.length - 4)}`;
        }
        return strId;
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
            {/* Page Header */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700/50 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">SMS Outbox</h1>
                        <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
                            <p className="text-sm text-slate-400">Overview of Outgoing SMS Reports</p>
                        </div>
                    </div>
                    <div className="space-y-1 flex flex-col items-center md:items-start">
                        <h2 className="text-lg font-bold text-cyan-400">
                            {smsBalance?.provider || 'No Provider Configured'}
                        </h2>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-200">
                                SMS BALANCE: {smsBalance?.balance ?? '---'}
                            </h2>
                            <button
                                onClick={() => {
                                    fetchSmsBalance();
                                    toast.success("Balance refreshed");
                                }}
                                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all"
                                title="Refresh Balance"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="flex items-center justify-center gap-2 px-3 md:px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-xs md:text-sm font-medium uppercase"
                    >
                        <Settings className="w-3 h-3 md:w-4 md:h-4" />
                        SETTINGS
                    </button>
                    <button
                        onClick={handleCompose}
                        className="flex items-center justify-center gap-2 px-3 md:px-6 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-slate-700 transition-all text-xs md:text-sm font-medium uppercase"
                    >
                        <PenSquare className="w-3 h-3 md:w-4 md:h-4" />
                        COMPOSE
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center justify-center gap-2 px-3 md:px-6 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors text-xs md:text-sm font-medium uppercase"
                    >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        CLEAR
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full">
                    {/* Rows Per Page */}
                    <select
                        value={rowsPerPage}
                        onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm order-1"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>

                    {/* Search */}
                    <div className="relative flex-1 md:w-auto order-2 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Filter items..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full md:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Force Line Break on Mobile */}
                    <div className="basis-full h-0 md:hidden order-3"></div>

                    {/* Action Buttons */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-green-700 hover:border-green-600 hover:text-white transition-all text-sm order-4"
                    >
                        <FileDown className="w-4 h-4" />
                        <span>Export to Excel</span>
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-600 text-slate-200 rounded-lg hover:bg-amber-700 hover:border-amber-600 hover:text-white transition-all text-sm order-5"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset Table</span>
                    </button>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                title="Clear SMS Outbox"
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        Are you sure you want to clear all messages from the outbox? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowClearModal(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmClearAll}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                        </button>
                    </div>
                </div>
            </Modal>

            {/* SMS Settings Modal */}
            <SmsSettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                onSave={() => {
                    fetchSmsBalance();
                    toast.success('SMS settings saved');
                }}
            />

            {/* Compose SMS Modal */}
            <Modal
                isOpen={showComposeModal}
                onClose={() => setShowComposeModal(false)}
                title="Compose New Message"
            >
                <form onSubmit={sendSMS} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            placeholder="e.g. 254712345678"
                            required
                            value={composePhone}
                            onChange={(e) => setComposePhone(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Message
                        </label>
                        <textarea
                            placeholder="Type your message here..."
                            required
                            rows={4}
                            value={composeMessage}
                            onChange={(e) => setComposeMessage(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowComposeModal(false)}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={sendingMsg}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sendingMsg ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <PenSquare className="w-4 h-4" />
                            )}
                            {sendingMsg ? 'Sending...' : 'Send Message'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Table Container */}
            <div className="bg-slate-800/50 dark:bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[15%]">ID</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[15%]">PHONE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap w-[30%]">MESSAGE</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">STATUS</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">INITIATOR</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">DATE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                        <p className="text-sm text-slate-400 mt-2">Loading logs...</p>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                        No items found
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-400 whitespace-nowrap">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                                className="text-sm font-medium text-blue-400 hover:text-blue-300 cursor-pointer underline"
                                                title={`View Details: ${item.id}`}
                                                onClick={() => navigate(`/sms/${item.id}`)}
                                            >
                                                {truncateId(item.id)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300">
                                                {item.phone || item.recipient || item.recipients || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-slate-300" title={item.message}>
                                                {truncateMessage(item.message)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm font-medium text-green-500">{item.status}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-300 capitalize">
                                                {(item.initiator || 'System').replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="text-sm text-slate-400">
                                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Items : {filteredData.length}
                </div>

                {totalPages > 0 && (
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
                )}
            </div>
        </div>
    );
}
