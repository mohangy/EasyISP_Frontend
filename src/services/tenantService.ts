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
        const response = await api.get<Operator>(`/tenant/operators/${id}`);
        return response.data;
    },

    // Get operator logs
    getOperatorLogs: async (id: string, page = 1, pageSize = 20): Promise<OperatorLogsResponse> => {
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
        const response = await api.get<OperatorLogsResponse>(`/tenant/operators/${id}/logs?${params}`);
        return response.data;
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

    // Payment Gateways
    getPaymentGateways: async () => {
        const response = await api.get("/payment-gateways");
        return response.data;
    },
    createPaymentGateway: async (data: any) => {
        const response = await api.post("/payment-gateways", data);
        return response.data;
    },
    updatePaymentGateway: async (id: string, data: any) => {
        const response = await api.put(`/payment-gateways/${id}`, data);
        return response.data;
    },
    deletePaymentGateway: async (id: string) => {
        await api.delete(`/payment-gateways/${id}`);
    },
    setPaymentGatewayDefault: async (id: string) => {
        await api.post(`/payment-gateways/${id}/default`);
    },
    testPaymentGateway: async (id: string) => {
        const response = await api.post(`/payment-gateways/${id}/test`);
        return response.data;
    },

    // SMS Gateways
    getSmsGateways: async () => {
        const response = await api.get("/sms-gateways");
        return response.data;
    },
    createSmsGateway: async (data: any) => {
        const response = await api.post("/sms-gateways", data);
        return response.data;
    },
    updateSmsGateway: async (id: string, data: any) => {
        const response = await api.put(`/sms-gateways/${id}`, data);
        return response.data;
    },
    deleteSmsGateway: async (id: string) => {
        await api.delete(`/sms-gateways/${id}`);
    },
    setSmsGatewayDefault: async (id: string) => {
        await api.post(`/sms-gateways/${id}/default`);
    },
    testSmsGateway: async (id: string) => {
        const response = await api.post(`/sms-gateways/${id}/test`);
        return response.data;
    },

    // Change password
    changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        await api.put("/auth/password", { oldPassword, newPassword });
    },
};
