/**
 * Payment Service
 * Consolidates Electronic (M-Pesa) and Manual payment data for Finance Dashboard
 */

export interface ElectronicPayment {
    id: number;
    trxCode: string;
    amount: number;
    date: string;
    phone: string;
    account: string;
    site: string;
    type: 'electronic';
}

export interface ManualPayment {
    id: number;
    ref: string;
    account: string;
    amount: number;
    description: string;
    date: string;
    type: 'manual';
}

export type Payment = ElectronicPayment | ManualPayment;

// Shared mock data - used by both payment pages and finance dashboard
// In a real app, this would come from API calls

export const ELECTRONIC_PAYMENTS: ElectronicPayment[] = Array.from({ length: 50 }).map((_, i) => ({
    id: i + 1,
    trxCode: `TLQ${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    amount: [1500, 2000, 4000, 2500, 1000, 3000, 4500, 5000, 7500][i % 9],
    date: new Date(Date.now() - i * 3600000 * (1 + Math.random() * 5)).toISOString(),
    phone: `07${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    account: `07${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    site: '',
    type: 'electronic' as const
}));

export const MANUAL_PAYMENTS: ManualPayment[] = Array.from({ length: 158 }).map((_, i) => ({
    id: i + 1,
    ref: `TL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    account: `07${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    amount: [1500, 2500, 100, 2000, 3000, 4000, 5000][i % 7],
    description: [
        "Paid to Mwachayamu Paybill",
        "Paid Via Till, Not Picked by system",
        "PAID CASH",
        "Paid to Mwachayamu",
        "Bank Transfer"
    ][i % 5],
    date: new Date(Date.now() - i * 3600000 * (2 + Math.random() * 10)).toISOString(),
    type: 'manual' as const
}));

// Helper functions for aggregating payment data
export const paymentService = {
    /**
     * Get all electronic payments
     */
    getElectronicPayments: async (): Promise<ElectronicPayment[]> => {
        // Simulate API call
        return ELECTRONIC_PAYMENTS;
    },

    /**
     * Get all manual payments
     */
    getManualPayments: async (): Promise<ManualPayment[]> => {
        // Simulate API call
        return MANUAL_PAYMENTS;
    },

    /**
     * Get combined payment statistics
     */
    getPaymentStats: async () => {
        const electronic = ELECTRONIC_PAYMENTS;
        const manual = MANUAL_PAYMENTS;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Filter by time periods
        const todayElectronic = electronic.filter(p => new Date(p.date) >= startOfToday);
        const todayManual = manual.filter(p => new Date(p.date) >= startOfToday);

        const thisMonthElectronic = electronic.filter(p => new Date(p.date) >= startOfMonth);
        const thisMonthManual = manual.filter(p => new Date(p.date) >= startOfMonth);

        const lastMonthElectronic = electronic.filter(p => {
            const d = new Date(p.date);
            return d >= startOfLastMonth && d <= endOfLastMonth;
        });
        const lastMonthManual = manual.filter(p => {
            const d = new Date(p.date);
            return d >= startOfLastMonth && d <= endOfLastMonth;
        });

        // Calculate totals
        const totalElectronic = electronic.reduce((sum, p) => sum + p.amount, 0);
        const totalManual = manual.reduce((sum, p) => sum + p.amount, 0);

        const todayElectronicTotal = todayElectronic.reduce((sum, p) => sum + p.amount, 0);
        const todayManualTotal = todayManual.reduce((sum, p) => sum + p.amount, 0);

        const thisMonthElectronicTotal = thisMonthElectronic.reduce((sum, p) => sum + p.amount, 0);
        const thisMonthManualTotal = thisMonthManual.reduce((sum, p) => sum + p.amount, 0);

        const lastMonthTotal = lastMonthElectronic.reduce((sum, p) => sum + p.amount, 0) +
            lastMonthManual.reduce((sum, p) => sum + p.amount, 0);

        // Calculate growth
        const thisMonthTotal = thisMonthElectronicTotal + thisMonthManualTotal;
        const growthPercent = lastMonthTotal > 0
            ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
            : '0.0';

        return {
            // Overall totals
            totalRevenue: totalElectronic + totalManual,
            electronicTotal: totalElectronic,
            manualTotal: totalManual,

            // Today
            todayTotal: todayElectronicTotal + todayManualTotal,
            todayElectronic: todayElectronicTotal,
            todayManual: todayManualTotal,
            todayTransactions: todayElectronic.length + todayManual.length,
            todayElectronicTransactions: todayElectronic.length,
            todayManualTransactions: todayManual.length,

            // This month
            thisMonthTotal,
            thisMonthElectronic: thisMonthElectronicTotal,
            thisMonthManual: thisMonthManualTotal,
            thisMonthTransactions: thisMonthElectronic.length + thisMonthManual.length,

            // Last month (for comparison)
            lastMonthTotal,
            growthPercent,

            // Transaction counts
            totalTransactions: electronic.length + manual.length,
            electronicTransactions: electronic.length,
            manualTransactions: manual.length,

            // Revenue breakdown
            revenueByType: [
                { name: "M-Pesa (Electronic)", amount: totalElectronic, percentage: Math.round(totalElectronic / (totalElectronic + totalManual) * 100) },
                { name: "Manual Recharge", amount: totalManual, percentage: Math.round(totalManual / (totalElectronic + totalManual) * 100) },
            ],

            // Recent transactions (combined, sorted by date)
            recentTransactions: [...electronic.slice(0, 5), ...manual.slice(0, 5)]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map(p => ({
                    id: p.id,
                    type: 'income' as const,
                    description: p.type === 'electronic'
                        ? `M-Pesa Payment - ${(p as ElectronicPayment).phone}`
                        : `Manual Recharge - ${(p as ManualPayment).description}`,
                    amount: p.amount,
                    date: new Date(p.date).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }),
                    method: p.type === 'electronic' ? 'M-Pesa' : 'Cash'
                }))
        };
    },

    /**
     * Get M-Pesa specific statistics
     */
    getMpesaStats: async () => {
        const electronic = ELECTRONIC_PAYMENTS;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const todayPayments = electronic.filter(p => new Date(p.date) >= startOfToday);

        return {
            todayReceived: todayPayments.reduce((sum, p) => sum + p.amount, 0),
            todayTransactions: todayPayments.length,
            totalReceived: electronic.reduce((sum, p) => sum + p.amount, 0),
            totalTransactions: electronic.length
        };
    }
};

export default paymentService;
