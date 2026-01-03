import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Loader2, CheckCircle2, User } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../lib/permissions";
import api from "../../services/api";

interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    customerName?: string;
    customerPhone?: string;
    assignedToId?: string;
    assignedToName?: string;
    createdByName: string;
    createdAt: string;
    resolvedAt?: string;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
}

const priorityColors: Record<string, string> = {
    LOW: 'bg-slate-500/20 text-slate-400',
    MEDIUM: 'bg-blue-500/20 text-blue-400',
    HIGH: 'bg-orange-500/20 text-orange-400',
    URGENT: 'bg-red-500/20 text-red-400',
};

const statusColors: Record<string, string> = {
    OPEN: 'bg-yellow-500/20 text-yellow-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    RESOLVED: 'bg-green-500/20 text-green-400',
    CLOSED: 'bg-slate-500/20 text-slate-400',
};

export function Tickets() {
    const { can } = usePermissions();
    const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [stats, setStats] = useState({ open: 0, inProgress: 0, resolved: 0 });

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        customerName: '',
        customerPhone: '',
        assignedToId: '',
    });
    const [submitting, setSubmitting] = useState(false);

    // Fetch tickets
    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch tickets based on active tab
            const response = await api.get(`/tickets?status=${activeTab === 'open' ? 'OPEN' : 'RESOLVED'}`);
            setTickets(response.data.tickets || []);
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    // Fetch stats
    const fetchStats = async () => {
        try {
            const response = await api.get('/tickets/stats');
            setStats({
                open: response.data.open || 0,
                inProgress: response.data.inProgress || 0,
                resolved: response.data.resolved || 0,
            });
        } catch (error) {
            console.error('Failed to fetch ticket stats:', error);
        }
    };

    // Fetch team members for assignment
    const fetchTeamMembers = async () => {
        try {
            const response = await api.get('/tenant/operators');
            setTeamMembers(response.data.operators || []);
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchStats();
        fetchTeamMembers();
    }, [fetchTickets]);

    // Filter tickets by search
    const filteredTickets = tickets.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assignedToName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Create ticket
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description) {
            toast.error('Title and description are required');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/tickets', {
                title: formData.title,
                description: formData.description,
                priority: formData.priority,
                customerName: formData.customerName || undefined,
                customerPhone: formData.customerPhone || undefined,
                assignedToId: formData.assignedToId || undefined,
            });
            toast.success('Ticket created successfully');
            setShowCreateModal(false);
            setFormData({ title: '', description: '', priority: 'MEDIUM', customerName: '', customerPhone: '', assignedToId: '' });
            fetchTickets();
            fetchStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create ticket');
        } finally {
            setSubmitting(false);
        }
    };

    // Assign ticket
    const handleAssign = async (assignedToId: string) => {
        if (!selectedTicket) return;
        try {
            await api.put(`/tickets/${selectedTicket.id}/assign`, { assignedToId });
            toast.success('Ticket assigned successfully');
            setShowAssignModal(false);
            setSelectedTicket(null);
            fetchTickets();
            fetchStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to assign ticket');
        }
    };

    // Resolve ticket
    const handleResolve = async (ticket: Ticket) => {
        try {
            await api.put(`/tickets/${ticket.id}/resolve`, {});
            toast.success('Ticket marked as resolved');
            fetchTickets();
            fetchStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to resolve ticket');
        }
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="bg-slate-800/50 rounded-xl p-4 md:p-6 border border-slate-700/50">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">Support Tickets</h1>
                        <p className="text-sm text-slate-400 mt-1">Manage and track customer support issues</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Stats */}
                        <div className="flex gap-3">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-400">{stats.open}</p>
                                <p className="text-xs text-slate-400">Open</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
                                <p className="text-xs text-slate-400">In Progress</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
                                <p className="text-xs text-slate-400">Resolved</p>
                            </div>
                        </div>
                        {can(PERMISSIONS.TICKETS_CREATE) && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New Ticket
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs and Search */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('open')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'open'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            Open Tickets
                        </button>
                        <button
                            onClick={() => setActiveTab('resolved')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'resolved'
                                ? 'bg-green-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            Resolved
                        </button>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full md:w-64 pl-9 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 placeholder:text-slate-500 text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">#</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Title</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Priority</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Customer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Assigned To</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Created</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                        <p className="text-sm text-slate-400 mt-2">Loading tickets...</p>
                                    </td>
                                </tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                        No tickets found
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket, index) => (
                                    <tr key={ticket.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-400">{index + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-medium text-slate-200">{ticket.title}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-xs">{ticket.description}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[ticket.priority]}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {ticket.customerName || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            {ticket.assignedToName || (
                                                <span className="text-slate-500 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[ticket.status]}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-400">
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                {can(PERMISSIONS.TICKETS_ASSIGN) && ticket.status !== 'RESOLVED' && (
                                                    <button
                                                        onClick={() => { setSelectedTicket(ticket); setShowAssignModal(true); }}
                                                        className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded"
                                                        title="Assign"
                                                    >
                                                        <User className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {can(PERMISSIONS.TICKETS_RESOLVE) && ticket.status !== 'RESOLVED' && (
                                                    <button
                                                        onClick={() => handleResolve(ticket)}
                                                        className="p-1 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded"
                                                        title="Mark as Resolved"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Ticket Modal */}
            <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Ticket">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                            placeholder="Brief summary of the issue"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm resize-none"
                            rows={4}
                            placeholder="Detailed description of the issue"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Assign To</label>
                            <select
                                value={formData.assignedToId}
                                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                            >
                                <option value="">-- Unassigned --</option>
                                {teamMembers.map((member) => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Customer Name</label>
                            <input
                                type="text"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Customer Phone</label>
                            <input
                                type="tel"
                                value={formData.customerPhone}
                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Ticket
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Assign Ticket Modal */}
            <Modal isOpen={showAssignModal} onClose={() => { setShowAssignModal(false); setSelectedTicket(null); }} title="Assign Ticket">
                <div className="space-y-4">
                    <p className="text-slate-300">
                        Select a team member to assign <strong>"{selectedTicket?.title}"</strong>:
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {teamMembers.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => handleAssign(member.id)}
                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                                    {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{member.name}</p>
                                    <p className="text-sm text-slate-400">{member.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
