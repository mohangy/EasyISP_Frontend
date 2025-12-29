import api from "./api";

export interface TenantInfo {
    id: string;
    name: string;
    businessName: string;
    email: string;
    phone?: string;
    status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
    isActivated: boolean;
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
    createdAt: string;
    subscriptionStatus: 'trial' | 'active' | 'subscribed' | 'lifetime' | 'expired' | 'suspended';
    daysRemaining?: number;
    _count: {
        users: number;
        customers: number;
        routers: number;
    };
}

export interface SaaSStats {
    tenants: {
        total: number;
        active: number;
        trial: number;
        expired: number;
        suspended: number;
    };
    totalCustomers: number;
    totalUsers: number;
    totalRouters: number;
}

export const superAdminApi = {
    // Get all tenants
    getTenants: async () => {
        const response = await api.get<{ tenants: TenantInfo[] }>('/super-admin/tenants');
        return response.data;
    },

    // Get tenant details
    getTenant: async (id: string) => {
        const response = await api.get<{ tenant: any }>(`/super-admin/tenants/${id}`);
        return response.data;
    },

    // Activate tenant
    activateTenant: async (id: string, subscriptionMonths?: number) => {
        const response = await api.post(`/super-admin/tenants/${id}/activate`, {
            subscriptionMonths,
        });
        return response.data;
    },

    // Suspend tenant
    suspendTenant: async (id: string) => {
        const response = await api.post(`/super-admin/tenants/${id}/suspend`);
        return response.data;
    },

    // Reactivate tenant
    reactivateTenant: async (id: string) => {
        const response = await api.post(`/super-admin/tenants/${id}/reactivate`);
        return response.data;
    },

    // Extend trial
    extendTrial: async (id: string, days: number) => {
        const response = await api.post(`/super-admin/tenants/${id}/extend-trial`, { days });
        return response.data;
    },

    // Get stats
    getStats: async () => {
        const response = await api.get<{ stats: SaaSStats }>('/super-admin/stats');
        return response.data;
    },

    // Extend subscription (by months or to specific date)
    extendSubscription: async (id: string, options: { months?: number; subscriptionEndsAt?: Date }) => {
        const body: any = {};
        if (options.months) body.months = options.months;
        if (options.subscriptionEndsAt) body.subscriptionEndsAt = options.subscriptionEndsAt.toISOString();
        const response = await api.post(`/super-admin/tenants/${id}/extend-subscription`, body);
        return response.data;
    },

    // Add balance (wallet or SMS)
    addBalance: async (id: string, amount: number, type: 'wallet' | 'sms') => {
        const response = await api.post(`/super-admin/tenants/${id}/add-balance`, { amount, type });
        return response.data;
    },

    // Update tenant settings
    updateSettings: async (id: string, settings: Record<string, any>) => {
        const response = await api.put(`/super-admin/tenants/${id}/settings`, settings);
        return response.data;
    },

    // Delete tenant
    deleteTenant: async (id: string) => {
        const response = await api.delete(`/super-admin/tenants/${id}`);
        return response.data;
    },

    // Reset user password
    resetUserPassword: async (tenantId: string, userId: string, newPassword: string) => {
        const response = await api.post(`/super-admin/tenants/${tenantId}/reset-user-password`, { userId, newPassword });
        return response.data;
    },
};
