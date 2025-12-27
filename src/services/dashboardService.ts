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
        try {
            const response = await api.get<RevenueData>("/dashboard/revenue");
            return response.data;
        } catch {
            // Return mock data if endpoint not available
            return {
                revenueTrend: [
                    { month: "Jan", amount: 45000 },
                    { month: "Feb", amount: 52000 },
                    { month: "Mar", amount: 48000 },
                    { month: "Apr", amount: 61000 },
                    { month: "May", amount: 55000 },
                    { month: "Jun", amount: 67000 },
                    { month: "Jul", amount: 72000 },
                    { month: "Aug", amount: 69000 },
                    { month: "Sep", amount: 84000 },
                    { month: "Oct", amount: 91000 },
                    { month: "Nov", amount: 847200 },
                    { month: "Dec", amount: 78000 },
                ],
                totalByPeriod: {
                    today: 28400,
                    thisWeek: 156800,
                    thisMonth: 847200,
                    thisYear: 9456000,
                },
            };
        }
    },

    // Fetch network usage trend data
    getNetworkUsage: async (): Promise<NetworkData> => {
        try {
            const response = await api.get<NetworkData>("/dashboard/network-usage");
            return response.data;
        } catch {
            // Return mock data if endpoint not available
            return {
                usageTrend: [
                    { month: "Jan", usage: 1250 },
                    { month: "Feb", usage: 1480 },
                    { month: "Mar", usage: 1320 },
                    { month: "Apr", usage: 1650 },
                    { month: "May", usage: 1890 },
                    { month: "Jun", usage: 2100 },
                    { month: "Jul", usage: 2340 },
                    { month: "Aug", usage: 2180 },
                    { month: "Sep", usage: 2560 },
                    { month: "Oct", usage: 2890 },
                    { month: "Nov", usage: 3120 },
                    { month: "Dec", usage: 2950 },
                ],
                totalByPeriod: {
                    today: 85,
                    thisWeek: 580,
                    thisMonth: 3120,
                    thisYear: 28340,
                },
            };
        }
    },
};
