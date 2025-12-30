import api from "./api";

export interface DashboardStats {
    activeSessions: number;
    totalCustomers: number;
    monthlyRevenue: number;
    todayRevenue: number;
    pppoeCustomers: number;
    hotspotCustomers: number;
    activeVouchers: number;
    usedVouchers: number;
}

export interface SessionStats {
    total: number;
    pppoe: number;
    hotspot: number;
    byNas: { nasId: string; nasName: string; count: number }[];
}

export interface PaymentTrend {
    month: string;
    amount: number;
}

export interface NetworkUsageTrend {
    month: string;
    usage: number; // in bytes or GB
}

export interface RevenueData {
    revenueTrend: PaymentTrend[];
    totalByPeriod: {
        today: number;
        thisWeek: number;
        thisMonth: number;
        thisYear: number;
    };
}

export interface NetworkData {
    usageTrend: NetworkUsageTrend[];
    totalByPeriod: {
        today: number;
        thisWeek: number;
        thisMonth: number;
        thisYear: number;
    };
}

export const dashboardApi = {
    // Fetch dashboard statistics
    getStats: async (): Promise<DashboardStats> => {
        const response = await api.get<DashboardStats>("/dashboard/stats");
        return response.data;
    },

    // Fetch session statistics
    getSessionStats: async (): Promise<SessionStats> => {
        const response = await api.get<SessionStats>("/sessions/stats");
        return response.data;
    },

    // Fetch revenue/payment trend data
    getRevenueTrend: async (): Promise<RevenueData> => {
        const response = await api.get<RevenueData>("/dashboard/revenue");
        return response.data;
    },

    // Fetch network usage trend data
    getNetworkUsage: async (): Promise<NetworkData> => {
        const response = await api.get<NetworkData>("/dashboard/network-usage");
        return response.data;
    },
};
