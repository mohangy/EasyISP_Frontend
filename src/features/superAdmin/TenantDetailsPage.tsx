import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { superAdminApi } from "../../services/superAdminService";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog, InputDialog, AlertDialog, DateTimeDialog } from "../../components/ui/DialogModals";
import {
    ArrowLeft, Building2, Mail, Phone, MapPin, Calendar,
    Users, Package, Router, CreditCard, Clock, CheckCircle2,
    XCircle, Ban, Shield, Wallet, Trash2, Settings, Key,
    MessageSquare, RefreshCw, Plus, Save, Edit3
} from "lucide-react";

interface TenantDetails {
    id: string;
    name: string;
    businessName: string;
    email: string;
    phone?: string;
    location?: string;
    logo?: string;
    primaryColor?: string;
    status: string;
    isActivated: boolean;
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
    walletBalance: number;
    smsBalance: number;
    smsProvider?: string;
    smsApiKey?: string;
    smsSenderId?: string;
    createdAt: string;
    updatedAt: string;
    users: Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        status: string;
        createdAt: string;
    }>;
    _count: {
        customers: number;
        packages: number;
        routers: number;
        payments: number;
    };
}

// Dialog state types
type DialogType = 'activate' | 'extend-trial' | 'extend-sub' | 'add-wallet' | 'add-sms' | 'suspend' | 'delete' | 'delete-confirm' | 'reset-password' | null;

export function TenantDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<TenantDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'users'>('overview');
    const [editSettings, setEditSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState<Record<string, string>>({});

    // Dialog states
    const [activeDialog, setActiveDialog] = useState<DialogType>(null);
    const [alertMessage, setAlertMessage] = useState<{ title: string; message: string; variant: 'success' | 'error' } | null>(null);
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');

    useEffect(() => {
        if (id) loadTenant();
    }, [id]);

    const loadTenant = async () => {
        try {
            setLoading(true);
            const data = await superAdminApi.getTenant(id!);
            setTenant(data.tenant);
            setSettingsForm({
                businessName: data.tenant.businessName || '',
                email: data.tenant.email || '',
                phone: data.tenant.phone || '',
                location: data.tenant.location || '',
                smsProvider: data.tenant.smsProvider || '',
                smsApiKey: data.tenant.smsApiKey || '',
                smsSenderId: data.tenant.smsSenderId || '',
            });
        } catch (error: any) {
            setAlertMessage({ title: 'Error', message: error.response?.data?.message || 'Failed to load tenant', variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const showSuccess = (message: string) => {
        setAlertMessage({ title: 'Success', message, variant: 'success' });
    };

    const showError = (message: string) => {
        setAlertMessage({ title: 'Error', message, variant: 'error' });
    };

    // Action handlers
    const handleActivate = async (months: string) => {
        try {
            setActionLoading(true);
            await superAdminApi.activateTenant(id!, months ? parseInt(months) : undefined);
            await loadTenant();
            setActiveDialog(null);
            showSuccess('Tenant activated successfully!');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to activate');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSuspend = async () => {
        try {
            setActionLoading(true);
            await superAdminApi.suspendTenant(id!);
            await loadTenant();
            setActiveDialog(null);
            showSuccess('Tenant suspended successfully!');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to suspend');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReactivate = async () => {
        try {
            setActionLoading(true);
            await superAdminApi.reactivateTenant(id!);
            await loadTenant();
            showSuccess('Tenant reactivated successfully!');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to reactivate');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExtendTrial = async (days: string) => {
        try {
            setActionLoading(true);
            await superAdminApi.extendTrial(id!, parseInt(days));
            await loadTenant();
            setActiveDialog(null);
            showSuccess(`Trial extended by ${days} days!`);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to extend trial');
        } finally {
            setActionLoading(false);
        }
    };

    const handleExtendSubscription = async (newEndDate: Date) => {
        try {
            setActionLoading(true);
            await superAdminApi.extendSubscription(id!, { subscriptionEndsAt: newEndDate });
            await loadTenant();
            setActiveDialog(null);
            showSuccess(`Subscription extended until ${newEndDate.toLocaleDateString()}!`);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to extend subscription');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddWalletBalance = async (amount: string) => {
        try {
            setActionLoading(true);
            await superAdminApi.addBalance(id!, parseFloat(amount), 'wallet');
            await loadTenant();
            setActiveDialog(null);
            showSuccess(`Added KES ${amount} to wallet!`);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to add balance');
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddSmsBalance = async (amount: string) => {
        try {
            setActionLoading(true);
            await superAdminApi.addBalance(id!, parseInt(amount), 'sms');
            await loadTenant();
            setActiveDialog(null);
            showSuccess(`Added ${amount} SMS credits!`);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to add SMS credits');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmName !== tenant?.businessName) {
            showError('Business name does not match. Deletion cancelled.');
            setActiveDialog(null);
            setDeleteConfirmName('');
            return;
        }
        try {
            setActionLoading(true);
            await superAdminApi.deleteTenant(id!);
            setActiveDialog(null);
            showSuccess('Tenant deleted successfully!');
            setTimeout(() => navigate('/super-admin'), 1500);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to delete tenant');
        } finally {
            setActionLoading(false);
        }
    };

    const handleResetPassword = async (newPassword: string) => {
        if (!selectedUser) return;
        try {
            setActionLoading(true);
            await superAdminApi.resetUserPassword(id!, selectedUser.id, newPassword);
            setActiveDialog(null);
            setSelectedUser(null);
            showSuccess('Password reset successfully!');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setActionLoading(true);
            await superAdminApi.updateSettings(id!, settingsForm);
            setEditSettings(false);
            await loadTenant();
            showSuccess('Settings saved successfully!');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string, isActivated: boolean) => {
        if (status === 'SUSPENDED') return { color: 'bg-gray-500', icon: Ban, label: 'Suspended' };
        if (status === 'EXPIRED') return { color: 'bg-red-500', icon: XCircle, label: 'Expired' };
        if (status === 'TRIAL') return { color: 'bg-blue-500', icon: Clock, label: 'Trial' };
        if (isActivated) return { color: 'bg-green-500', icon: CheckCircle2, label: 'Active' };
        return { color: 'bg-yellow-500', icon: Clock, label: 'Pending' };
    };

    const getDaysRemaining = (dateStr?: string) => {
        if (!dateStr) return null;
        const diff = new Date(dateStr).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!tenant) return null;

    const statusInfo = getStatusBadge(tenant.status, tenant.isActivated);
    const StatusIcon = statusInfo.icon;
    const trialDays = getDaysRemaining(tenant.trialEndsAt);
    const subDays = getDaysRemaining(tenant.subscriptionEndsAt);

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Dialogs */}
            <InputDialog
                isOpen={activeDialog === 'activate'}
                onClose={() => setActiveDialog(null)}
                onSubmit={handleActivate}
                title="Activate Tenant"
                message="Enter subscription months (leave empty for lifetime access):"
                placeholder="e.g., 12 for 1 year"
                inputType="number"
                submitText="Activate"
                isLoading={actionLoading}
            />

            <InputDialog
                isOpen={activeDialog === 'extend-trial'}
                onClose={() => setActiveDialog(null)}
                onSubmit={handleExtendTrial}
                title="Extend Trial"
                message="Enter number of days to extend the trial:"
                placeholder="e.g., 7"
                inputType="number"
                submitText="Extend"
                isLoading={actionLoading}
                validation={(v) => !v || parseInt(v) < 1 ? 'Please enter at least 1 day' : null}
            />

            <DateTimeDialog
                isOpen={activeDialog === 'extend-sub'}
                onClose={() => setActiveDialog(null)}
                onSubmit={handleExtendSubscription}
                title="Set Subscription End Date"
                message="Select when the subscription should end:"
                submitText="Save"
                isLoading={actionLoading}
                defaultValue={tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt) : undefined}
            />

            <InputDialog
                isOpen={activeDialog === 'add-wallet'}
                onClose={() => setActiveDialog(null)}
                onSubmit={handleAddWalletBalance}
                title="Add Wallet Balance"
                message="Enter amount in KES to add:"
                placeholder="e.g., 1000"
                inputType="number"
                submitText="Add Balance"
                isLoading={actionLoading}
                validation={(v) => !v || parseFloat(v) <= 0 ? 'Please enter a valid amount' : null}
            />

            <InputDialog
                isOpen={activeDialog === 'add-sms'}
                onClose={() => setActiveDialog(null)}
                onSubmit={handleAddSmsBalance}
                title="Add SMS Credits"
                message="Enter number of SMS credits to add:"
                placeholder="e.g., 100"
                inputType="number"
                submitText="Add Credits"
                isLoading={actionLoading}
                validation={(v) => !v || parseInt(v) <= 0 ? 'Please enter a valid number' : null}
            />

            <ConfirmDialog
                isOpen={activeDialog === 'suspend'}
                onClose={() => setActiveDialog(null)}
                onConfirm={handleSuspend}
                title="Suspend Tenant"
                message={`Are you sure you want to suspend "${tenant.businessName}"?\n\nThey will immediately lose access to:\n• Dashboard & all features\n• Customer connections (RADIUS)\n• API access`}
                confirmText="Suspend"
                variant="warning"
                isLoading={actionLoading}
            />

            <ConfirmDialog
                isOpen={activeDialog === 'delete'}
                onClose={() => setActiveDialog(null)}
                onConfirm={() => setActiveDialog('delete-confirm')}
                title="⚠️ Delete Tenant"
                message={`WARNING: This will PERMANENTLY delete "${tenant.businessName}" and ALL their data:\n\n• ${tenant._count.customers} customers\n• ${tenant._count.packages} packages\n• ${tenant._count.routers} routers\n• ${tenant._count.payments} payments\n• All users and settings\n\nThis action CANNOT be undone!`}
                confirmText="I understand, proceed"
                variant="danger"
            />

            <InputDialog
                isOpen={activeDialog === 'delete-confirm'}
                onClose={() => { setActiveDialog(null); setDeleteConfirmName(''); }}
                onSubmit={(value) => { setDeleteConfirmName(value); handleDeleteConfirm(); }}
                title="Confirm Deletion"
                message={`Type "${tenant.businessName}" to confirm deletion:`}
                placeholder={tenant.businessName}
                submitText="Delete Forever"
                isLoading={actionLoading}
                validation={(v) => v !== tenant?.businessName ? 'Name does not match' : null}
            />

            <InputDialog
                isOpen={activeDialog === 'reset-password'}
                onClose={() => { setActiveDialog(null); setSelectedUser(null); }}
                onSubmit={handleResetPassword}
                title={`Reset Password`}
                message={`Enter new password for "${selectedUser?.name}":`}
                placeholder="New password (min 6 characters)"
                inputType="password"
                submitText="Reset Password"
                isLoading={actionLoading}
                validation={(v) => !v || v.length < 6 ? 'Password must be at least 6 characters' : null}
            />

            <AlertDialog
                isOpen={!!alertMessage}
                onClose={() => setAlertMessage(null)}
                title={alertMessage?.title || ''}
                message={alertMessage?.message || ''}
                variant={alertMessage?.variant || 'info'}
            />

            {/* Back Button */}
            <Link to="/super-admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <ArrowLeft className="w-4 h-4" />
                Back to Tenants
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                    {tenant.logo ? (
                        <img src={tenant.logo} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-white" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{tenant.businessName}</h1>
                        <p className="text-slate-500 dark:text-slate-400">@{tenant.name}</p>
                    </div>
                </div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white ${statusInfo.color}`}>
                    <StatusIcon className="w-5 h-5" />
                    {statusInfo.label}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                    {!tenant.isActivated && tenant.status !== 'EXPIRED' && (
                        <Button onClick={() => setActiveDialog('activate')} className="bg-green-600 hover:bg-green-700 text-sm">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Activate
                        </Button>
                    )}
                    {tenant.status === 'EXPIRED' && (
                        <Button onClick={() => setActiveDialog('activate')} className="bg-green-600 hover:bg-green-700 text-sm">
                            <RefreshCw className="w-4 h-4 mr-1" /> Renew
                        </Button>
                    )}
                    {tenant.status === 'TRIAL' && (
                        <Button onClick={() => setActiveDialog('extend-trial')} className="bg-blue-600 hover:bg-blue-700 text-sm">
                            <Clock className="w-4 h-4 mr-1" /> Extend Trial
                        </Button>
                    )}
                    {tenant.isActivated && (
                        <Button onClick={() => setActiveDialog('extend-sub')} className="bg-purple-600 hover:bg-purple-700 text-sm">
                            <Plus className="w-4 h-4 mr-1" /> Extend Subscription
                        </Button>
                    )}
                    <Button onClick={() => setActiveDialog('add-wallet')} className="bg-amber-600 hover:bg-amber-700 text-sm">
                        <Wallet className="w-4 h-4 mr-1" /> Add Wallet
                    </Button>
                    <Button onClick={() => setActiveDialog('add-sms')} className="bg-cyan-600 hover:bg-cyan-700 text-sm">
                        <MessageSquare className="w-4 h-4 mr-1" /> Add SMS
                    </Button>
                    {tenant.status === 'SUSPENDED' ? (
                        <Button onClick={handleReactivate} isLoading={actionLoading} className="bg-green-600 hover:bg-green-700 text-sm">
                            <RefreshCw className="w-4 h-4 mr-1" /> Reactivate
                        </Button>
                    ) : tenant.status !== 'EXPIRED' && (
                        <Button onClick={() => setActiveDialog('suspend')} className="bg-orange-600 hover:bg-orange-700 text-sm">
                            <Ban className="w-4 h-4 mr-1" /> Suspend
                        </Button>
                    )}
                    <Button onClick={() => setActiveDialog('delete')} className="bg-red-600 hover:bg-red-700 text-sm">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete Tenant
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                {(['overview', 'settings', 'users'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${activeTab === tab
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab === 'overview' && 'Overview'}
                        {tab === 'settings' && 'Settings'}
                        {tab === 'users' && `Users (${tenant.users.length})`}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Contact Info</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    {tenant.email}
                                </div>
                                {tenant.phone && (
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        {tenant.phone}
                                    </div>
                                )}
                                {tenant.location && (
                                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {tenant.location}
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    Joined {new Date(tenant.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Subscription</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Activated</span>
                                    <span className={tenant.isActivated ? 'text-green-600' : 'text-red-600'}>
                                        {tenant.isActivated ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                {tenant.status === 'TRIAL' && trialDays !== null && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Trial Ends</span>
                                        <span className={trialDays > 0 ? 'text-blue-600' : 'text-red-600'}>
                                            {trialDays > 0 ? `${trialDays} days` : 'Expired'}
                                        </span>
                                    </div>
                                )}
                                {tenant.subscriptionEndsAt && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Subscription Ends</span>
                                        <span className={subDays && subDays > 0 ? 'text-green-600' : 'text-red-600'}>
                                            {subDays && subDays > 0 ? `${subDays} days` : 'Expired'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Balances</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-slate-500">
                                        <Wallet className="w-4 h-4" /> Wallet
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        KES {tenant.walletBalance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-slate-500">
                                        <MessageSquare className="w-4 h-4" /> SMS
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {tenant.smsBalance} credits
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                            <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.customers}</p>
                            <p className="text-sm text-slate-500">Customers</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                            <Package className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.packages}</p>
                            <p className="text-sm text-slate-500">Packages</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                            <Router className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.routers}</p>
                            <p className="text-sm text-slate-500">Routers</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 text-center">
                            <CreditCard className="w-8 h-8 mx-auto text-green-500 mb-2" />
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenant._count.payments}</p>
                            <p className="text-sm text-slate-500">Payments</p>
                        </div>
                    </div>
                </>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <Settings className="w-5 h-5" /> Tenant Settings
                        </h3>
                        {!editSettings ? (
                            <Button onClick={() => setEditSettings(true)} className="bg-blue-600 hover:bg-blue-700 text-sm">
                                <Edit3 className="w-4 h-4 mr-1" /> Edit
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button onClick={() => setEditSettings(false)} className="bg-slate-500 hover:bg-slate-600 text-sm">
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveSettings} isLoading={actionLoading} className="bg-green-600 hover:bg-green-700 text-sm">
                                    <Save className="w-4 h-4 mr-1" /> Save
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-slate-700 dark:text-slate-300">Business Information</h4>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    value={settingsForm.businessName}
                                    onChange={e => setSettingsForm({ ...settingsForm, businessName: e.target.value })}
                                    disabled={!editSettings}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={settingsForm.email}
                                    onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                                    disabled={!editSettings}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Phone</label>
                                <input
                                    type="text"
                                    value={settingsForm.phone}
                                    onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                                    disabled={!editSettings}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={settingsForm.location}
                                    onChange={e => setSettingsForm({ ...settingsForm, location: e.target.value })}
                                    disabled={!editSettings}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" /> SMS Configuration
                            </h4>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">SMS Provider</label>
                                <input
                                    type="text"
                                    value={settingsForm.smsProvider}
                                    onChange={e => setSettingsForm({ ...settingsForm, smsProvider: e.target.value })}
                                    disabled={!editSettings}
                                    placeholder="e.g., africastalking, twilio"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">SMS API Key</label>
                                <input
                                    type="password"
                                    value={settingsForm.smsApiKey}
                                    onChange={e => setSettingsForm({ ...settingsForm, smsApiKey: e.target.value })}
                                    disabled={!editSettings}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-500 mb-1">SMS Sender ID</label>
                                <input
                                    type="text"
                                    value={settingsForm.smsSenderId}
                                    onChange={e => setSettingsForm({ ...settingsForm, smsSenderId: e.target.value })}
                                    disabled={!editSettings}
                                    placeholder="e.g., MYISP"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-500" />
                            Team Members ({tenant.users.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Joined</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {tenant.users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{user.name}</td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs ${user.status === 'ACTIVE'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                onClick={() => {
                                                    setSelectedUser({ id: user.id, name: user.name });
                                                    setActiveDialog('reset-password');
                                                }}
                                                className="text-xs bg-amber-600 hover:bg-amber-700"
                                            >
                                                <Key className="w-3 h-3 mr-1" /> Reset Password
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
