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
};
