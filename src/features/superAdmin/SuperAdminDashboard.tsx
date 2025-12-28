import { useEffect, useState } from "react";
import { superAdminApi, type TenantInfo, type SaaSStats } from "../../services/superAdminService";
import { Building2, Users, Router, UserCog, TrendingUp, AlertCircle, Clock, CheckCircle2, XCircle, Ban } from "lucide-react";
import { Button } from "../../components/ui/Button";

export function SuperAdminDashboard() {
    const [tenants, setTenants] = useState<TenantInfo[]>([]);
    const [stats, setStats] = useState<SaaSStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'trial' | 'active' | 'expired' | 'suspended'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [tenantsData, statsData] = await Promise.all([
                superAdminApi.getTenants(),
                superAdminApi.getStats(),
            ]);
            setTenants(tenantsData.tenants);
            setStats(statsData.stats);
        } catch (error: any) {
            console.error('Failed to load super admin data:', error);
            alert(error.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (tenantId: string) => {
        const months = prompt('Enter subscription months (leave empty for lifetime):');
        if (months === null) return; // Cancelled

        try {
            setActionLoading(tenantId);
            await superAdminApi.activateTenant(
                tenantId,
                months ? parseInt(months) : undefined
            );
            await loadData();
            alert('Tenant activated successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to activate tenant');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspend = async (tenantId: string) => {
        if (!confirm('Are you sure you want to suspend this tenant? They will lose all access.')) return;

        try {
            setActionLoading(tenantId);
            await superAdminApi.suspendTenant(tenantId);
            await loadData();
            alert('Tenant suspended successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to suspend tenant');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReactivate = async (tenantId: string) => {
        try {
            setActionLoading(tenantId);
            await superAdminApi.reactivateTenant(tenantId);
            await loadData();
            alert('Tenant reactivated successfully!');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to reactivate tenant');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExtendTrial = async (tenantId: string) => {
        const days = prompt('Enter number of days to extend trial:');
        if (!days) return;

        try {
            setActionLoading(tenantId);
            await superAdminApi.extendTrial(tenantId, parseInt(days));
            await loadData();
            alert(`Trial extended by ${days} days!`);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to extend trial');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredTenants = tenants.filter(tenant => {
        if (filter === 'all') return true;
        if (filter === 'trial') return tenant.subscriptionStatus === 'trial';
        if (filter === 'active') return tenant.subscriptionStatus === 'active' || tenant.subscriptionStatus === 'subscribed' || tenant.subscriptionStatus === 'lifetime';
        if (filter === 'expired') return tenant.subscriptionStatus === 'expired';
        if (filter === 'suspended') return tenant.subscriptionStatus === 'suspended';
        return true;
    });

    const getStatusBadge = (status: string) => {
        const badges = {
            trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            subscribed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            lifetime: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            suspended: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return badges[status as keyof typeof badges] || badges.trial;
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'trial': return <Clock className="w-4 h-4" />;
            case 'active':
            case 'subscribed':
            case 'lifetime': return <CheckCircle2 className="w-4 h-4" />;
            case 'expired': return <XCircle className="w-4 h-4" />;
            case 'suspended': return <Ban className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Super Admin Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all tenants and view platform statistics</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Tenants</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.tenants.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-3 text-xs">
                            <span className="text-green-600 dark:text-green-400">✓ {stats.tenants.active} Active</span>
                            <span className="text-blue-600 dark:text-blue-400">○ {stats.tenants.trial} Trial</span>
                            <span className="text-red-600 dark:text-red-400">✕ {stats.tenants.expired} Expired</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Customers</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalCustomers}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalUsers}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <UserCog className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Routers</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalRouters}</p>
                            </div>
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                <Router className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {(['all', 'trial', 'active', 'expired', 'suspended'] as const).map((filterType) => (
                    <button
                        key={filterType}
                        onClick={() => setFilter(filterType)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === filterType
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tenants Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tenant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trial/Subscription</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredTenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-slate-900 dark:text-white">{tenant.businessName}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{tenant.email}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(tenant.subscriptionStatus)}`}>
                                            {getStatusIcon(tenant.subscriptionStatus)}
                                            {tenant.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tenant.daysRemaining !== null && tenant.daysRemaining !== undefined ? (
                                            <div className="text-sm">
                                                <span className={tenant.daysRemaining > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-600 dark:text-red-400'}>
                                                    {tenant.daysRemaining > 0 ? `${tenant.daysRemaining} days left` : 'Expired'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-500 dark:text-slate-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-700 dark:text-slate-300">
                                            {tenant._count.users}U / {tenant._count.customers}C / {tenant._count.routers}R
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(tenant.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {!tenant.isActivated && tenant.subscriptionStatus !== 'expired' && (
                                                <Button
                                                    onClick={() => handleActivate(tenant.id)}
                                                    isLoading={actionLoading === tenant.id}
                                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                                                >
                                                    Activate
                                                </Button>
                                            )}
                                            {tenant.subscriptionStatus === 'expired' && (
                                                <Button
                                                    onClick={() => handleActivate(tenant.id)}
                                                    isLoading={actionLoading === tenant.id}
                                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
                                                >
                                                    Renew
                                                </Button>
                                            )}
                                            {tenant.subscriptionStatus === 'trial' && (
                                                <Button
                                                    onClick={() => handleExtendTrial(tenant.id)}
                                                    isLoading={actionLoading === tenant.id}
                                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
                                                >
                                                    Extend
                                                </Button>
                                            )}
                                            {tenant.subscriptionStatus === 'suspended' ? (
                                                <Button
                                                    onClick={() => handleReactivate(tenant.id)}
                                                    isLoading={actionLoading === tenant.id}
                                                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                                                >
                                                    Reactivate
                                                </Button>
                                            ) : (
                                                tenant.subscriptionStatus !== 'expired' && (
                                                    <Button
                                                        onClick={() => handleSuspend(tenant.id)}
                                                        isLoading={actionLoading === tenant.id}
                                                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1"
                                                    >
                                                        Suspend
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTenants.length === 0 && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        No tenants found matching the selected filter.
                    </div>
                )}
            </div>
        </div>
    );
}
