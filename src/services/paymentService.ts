/**
 * Payment Service
 * Consolidates Electronic (M-Pesa) and Manual payment data
 */
import api from "./api";

export interface ElectronicPayment {
    id: string;
    transactionId: string;
    amount: number;
    phone: string;
    account: string | null;
    status: string;
    customer: { id: string; name: string } | null;
    createdAt: string;
}

export interface ManualPayment {
    id: string;
    amount: number;
    method: string;
    description: string | null;
    customer: { id: string; name: string } | null;
    createdAt: string;
}

export interface PaymentResponse<T> {
    transactions: T[];
    total: number;
    page: number;
    pageSize: number;
}

export const paymentService = {
    /**
     * Get electronic payments (M-Pesa)
     */
    getElectronicPayments: async (params?: {
        page?: number;
        pageSize?: number;
        status?: string;
        search?: string;
    }): Promise<PaymentResponse<ElectronicPayment>> => {
        const response = await api.get<PaymentResponse<ElectronicPayment>>("/payments/electronic", { params });
        return response.data;
    },

    /**
     * Get manual payments
     */
    getManualPayments: async (params?: {
        page?: number;
        pageSize?: number;
    }): Promise<PaymentResponse<ManualPayment>> => {
        const response = await api.get<PaymentResponse<ManualPayment>>("/payments/manual", { params });
        return response.data;
    },

    /**
     * Create a manual payment
     */
    createManualPayment: async (data: {
        customerId: string;
        amount: number;
        method?: string;
        description?: string;
    }): Promise<ManualPayment> => {
        const response = await api.post<ManualPayment>("/payments/manual", data);
        return response.data;
    },

    /**
     * Clear all manual payments (admin only)
     */
    clearManualPayments: async (): Promise<{ success: boolean; clearedCount: number }> => {
        const response = await api.delete<{ success: boolean; clearedCount: number }>("/payments/manual");
        return response.data;
    },

    /**
     * Get payment statistics from dashboard
     */
    getPaymentStats: async () => {
        // Use dashboard endpoints for stats
        const [statsResponse, revenueResponse] = await Promise.all([
            api.get("/dashboard/stats"),
            api.get("/dashboard/revenue")
        ]);

        const stats = statsResponse.data;
        const revenue = revenueResponse.data;

        return {
            todayTotal: stats.todayRevenue || 0,
            thisMonthTotal: stats.monthlyRevenue || 0,
            totalByPeriod: revenue.totalByPeriod || {
                today: 0,
                thisWeek: 0,
                thisMonth: 0,
                thisYear: 0
            },
            revenueTrend: revenue.revenueTrend || []
        };
    },

    /**
     * Get M-Pesa specific statistics
     */
    getMpesaStats: async () => {
        const response = await api.get("/dashboard/stats");
        const stats = response.data;

        return {
            todayReceived: stats.todayRevenue || 0,
            monthlyReceived: stats.monthlyRevenue || 0
        };
    }
};

export default paymentService;
