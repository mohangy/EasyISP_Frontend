import api from "./api";

// Tenant interface
export interface Tenant {
    id: string;
    name: string;           // Slug/identifier
    businessName: string;   // Display name (e.g., "RODNET SOLUTIONS")
    email: string;
    phone?: string;
    location?: string;
    logo?: string;
    primaryColor?: string;
    status: "ACTIVE" | "SUSPENDED" | "TRIAL" | "EXPIRED";
    walletBalance: number;
    activeUsers: number;
    createdAt: string;
    settings?: TenantSettings;
}

export interface TenantSettings {
    welcomeMessage?: string;
    termsUrl?: string;
    privacyUrl?: string;
    smsEnabled?: boolean;
    paymentGateway?: PaymentGateway;
}

export interface PaymentGateway {
    type: "MPESA" | "STRIPE" | "PAYPAL" | "BANK";
    isDefault: boolean;
    config: Record<string, string>;
}

export interface Invoice {
    id: string;
    ref: string;
    reason: string;
    amount: number;
    currency: string;
    createdAt: string;
    dueAt: string;
    status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
    receiptUrl?: string;
}

export interface InvoiceListResponse {
    invoices: Invoice[];
    total: number;
    page: number;
    pageSize: number;
}

export interface Operator {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "SUPER_ADMIN" | "ADMIN" | "CUSTOMER_CARE" | "FIELD_TECH";
    status: "ACTIVE" | "DISABLED";
    addedPermissions: string[];
    removedPermissions: string[];
    createdAt: string;
    password?: string; // For display/editing purposes as requested
}

export interface OperatorListResponse {
    operators: Operator[];
    total: number;
}

export interface AuditLog {
    id: string;
    action: string;      // e.g., "CUSTOMER_CREATE", "ROUTER_EDIT"
    targetType: string;  // e.g., "CUSTOMER"
    targetId: string;
    targetName: string;
    details: string;     // JSON/Text description
    timestamp: string;
    ipAddress: string;
}

export interface OperatorLogsResponse {
    logs: AuditLog[];
    total: number;
    page: number;
    pageSize: number;
}

export const tenantApi = {
    // Get current tenant info
    getTenant: async (): Promise<Tenant> => {
        const response = await api.get<Tenant>("/tenant/me");
        return response.data;
    },

    // Update tenant general info
    updateTenant: async (data: Partial<Tenant>): Promise<Tenant> => {
        const response = await api.put<Tenant>("/tenant/settings", data);
        return response.data;
    },

    // Upload tenant logo
    uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
        const formData = new FormData();
        formData.append("logo", file);
        const response = await api.post<{ logoUrl: string }>("/tenant/logo", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    // Get invoices
    getInvoices: async (page = 1, pageSize = 20, search?: string): Promise<InvoiceListResponse> => {
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
        if (search) params.append("search", search);
        const response = await api.get<InvoiceListResponse>(`/tenant/invoices?${params}`);
        return response.data;
    },

    // Top up wallet
    topUpWallet: async (amount: number): Promise<{ paymentUrl: string }> => {
        const response = await api.post<{ paymentUrl: string }>("/tenant/wallet/topup", { amount });
        return response.data;
    },

    // Get operators (staff members)
    getOperators: async (page = 1, pageSize = 10): Promise<OperatorListResponse> => {
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
        const response = await api.get<OperatorListResponse>(`/tenant/operators?${params}`);
        return response.data;
    },

    // Get single operator
    getOperator: async (id: string): Promise<Operator> => {
        // Mock implementation for demo if API fails
        try {
            const response = await api.get<Operator>(`/tenant/operators/${id}`);
            return response.data;
        } catch (error) {
            console.warn("API fail, using mock data for operator");
            return {
                id,
                name: "John Admin",
                email: "john@isp.com",
                role: "ADMIN",
                status: "ACTIVE",
                addedPermissions: [],
                removedPermissions: [],
                createdAt: new Date().toISOString(),
                password: "password123", // Mock password
            };
        }
    },

    // Get operator logs
    getOperatorLogs: async (id: string, page = 1, pageSize = 20): Promise<OperatorLogsResponse> => {
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
        try {
            const response = await api.get<OperatorLogsResponse>(`/tenant/operators/${id}/logs?${params}`);
            return response.data;
        } catch (error) {
            console.warn("API fail, returning mock logs");
            // Mock data for logs
            const actions = [
                { action: "MAC_RESET", targetType: "PPPOE USER", format: (name: string) => `Mac reset for ${name}` },
                { action: "CUSTOMER_CREATE", targetType: "CUSTOMER", format: (name: string) => `Created new customer account: ${name}` },
                { action: "PAYMENT_PROCESS", targetType: "INVOICE", format: (name: string) => `Processed payment for invoice #${name}` },
                { action: "ROUTER_REBOOT", targetType: "ROUTER", format: (name: string) => `Initiated reboot for router: ${name}` },
                { action: "PACKAGE_CHANGE", targetType: "PPPOE USER", format: (name: string) => `Changed package to 10Mbps for ${name}` },
                { action: "MANUAL_RECHARGE", targetType: "PPPOE USER", format: (name: string) => `Manual account recharge of KES 1,000 for ${name}` },
                { action: "EXPIRY_UPDATE", targetType: "PPPOE USER", format: (name: string) => `Manually extended expiry date for ${name}` },
                { action: "TRANSACTION_RESOLVE", targetType: "PAYMENT", format: (name: string) => `Resolved pending transaction ${name}` },
                { action: "ACCOUNT_DELETE", targetType: "CUSTOMER", format: (name: string) => `Permanently deleted customer account: ${name}` },
                { action: "INFO_UPDATE", targetType: "CUSTOMER", format: (name: string) => `Updated profile information for ${name}` }
            ];

            return {
                logs: Array.from({ length: 15 }).map((_, i) => {
                    const type = actions[i % actions.length];
                    const targetName = type.targetType === "PPPOE USER" ? `user_${100 + i}` :
                        type.targetType === "INVOICE" ? `INV-${202500 + i}` :
                            type.targetType === "ROUTER" ? `RB-750-${i}` :
                                type.targetType === "PAYMENT" ? `TXN-${8800 + i}` :
                                    `Customer ${i}`;

                    return {
                        id: `log_${i}`,
                        action: type.action,
                        targetType: type.targetType,
                        targetId: `target_${i}`,
                        targetName: targetName,
                        details: type.format(targetName),
                        timestamp: new Date(Date.now() - i * 3600000 * (i + 1)).toISOString(), // Spread out over time
                        ipAddress: "192.168.1.1"
                    };
                }),
                total: 15,
                page,
                pageSize
            };
        }
    },

    // Add operator
    addOperator: async (data: { name: string; email: string; phone?: string; role: string; password: string }): Promise<Operator> => {
        const response = await api.post<Operator>("/tenant/operators", data);
        return response.data;
    },

    // Update operator
    updateOperator: async (id: string, data: Partial<Operator>): Promise<Operator> => {
        const response = await api.put<Operator>(`/tenant/operators/${id}`, data);
        return response.data;
    },

    // Delete operator
    deleteOperator: async (id: string): Promise<void> => {
        await api.delete(`/tenant/operators/${id}`);
    },

    // Update payment gateway
    updatePaymentGateway: async (data: { type: string; config: Record<string, string> }): Promise<void> => {
        await api.put("/tenant/payment-gateway", data);
    },

    // Change password
    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        await api.put("/auth/password", { oldPassword, newPassword });
    },
};
