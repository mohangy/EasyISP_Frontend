import api from "./api";

// Customer interfaces matching backend schema
export interface Customer {
    id: string;
    username: string;
    name: string;
    email?: string;
    phone?: string;
    connectionType: "PPPOE" | "HOTSPOT" | "DHCP" | "STATIC";
    status: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "DISABLED";
    packageId?: string;
    package?: {
        id: string;
        name: string;
        price: number;
    };
    nasId?: string;
    nas?: {
        id: string;
        name: string;
    };
    expiresAt?: string;
    macAddress?: string;
    ipAddress?: string;
    downloadSpeed?: number;
    uploadSpeed?: number;
    dataLimit?: number;
    dataUsed?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    apartmentNumber?: string;
    houseNumber?: string;
    createdAt: string;
    updatedAt: string;
    // Real-time status (from sessions)
    isOnline?: boolean;
}

export interface CustomerListResponse {
    customers: Customer[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    // Potentially active sessions stats
}

export interface CreateCustomerData {
    username: string;
    password: string;
    name: string;
    email?: string;
    phone?: string;
    connectionType: "PPPOE" | "HOTSPOT";
    packageId?: string;
    nasId?: string;
    expiresAt?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    apartmentNumber?: string;
    houseNumber?: string;
    installationFee?: number;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
    status?: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "DISABLED";
}

export interface CustomerFilters {
    page?: number;
    pageSize?: number;
    connectionType?: "PPPOE" | "HOTSPOT";
    status?: "ACTIVE" | "SUSPENDED" | "EXPIRED" | "DISABLED";
    search?: string;
    nasId?: string;
    packageId?: string;
}

// Extended customer type for details page
export interface CustomerDetails extends Customer {
    password?: string;
    walletBalance?: number;
    totalSpent?: number;
    monthlyUsage?: { download: number; upload: number };
    lastIp?: string;
    lastMac?: string;
    vendor?: string;
    site?: string;
    uptime?: string;
}

// E-Receipt transaction (Mpesa payment)
export interface MpesaTransaction {
    id: string;
    trxDate: string;
    trxCode: string;
    paybill: string;
    amount: number;
    phone: string;
}

// Manual recharge transaction
export interface ManualRechargeTransaction {
    id: string;
    yourRef: string;
    amount: number;
    trxDate: string;
}

export interface TransactionsResponse {
    mpesaTransactions: MpesaTransaction[];
    manualTransactions: ManualRechargeTransaction[];
}

// Package/Plan interface for selection
export interface Package {
    id: string;
    name: string;
    price: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
    dataLimit?: number;
    validityDays?: number;
    serviceType: "PPPOE" | "HOTSPOT";
    isActive: boolean;
}



export const customerApi = {
    // Get list of customers with filters
    getCustomers: async (filters: CustomerFilters = {}): Promise<CustomerListResponse> => {
        const params = new URLSearchParams();
        if (filters.page) params.append("page", filters.page.toString());
        if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());
        if (filters.connectionType) params.append("connectionType", filters.connectionType);
        if (filters.status) params.append("status", filters.status);
        if (filters.search) params.append("search", filters.search);
        if (filters.nasId) params.append("nasId", filters.nasId);
        if (filters.packageId) params.append("packageId", filters.packageId);

        const queryString = params.toString();
        const url = queryString ? `/customers?${queryString}` : "/customers";
        const response = await api.get<CustomerListResponse>(url);
        return response.data;
    },

    // Get single customer by ID
    getCustomer: async (id: string): Promise<Customer> => {
        const response = await api.get<Customer>(`/customers/${id}`);
        return response.data;
    },

    // Create new customer
    createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
        const response = await api.post<Customer>("/customers", data);
        return response.data;
    },

    // Update customer
    updateCustomer: async (id: string, data: UpdateCustomerData): Promise<Customer> => {
        const response = await api.put<Customer>(`/customers/${id}`, data);
        return response.data;
    },

    // Delete customer
    deleteCustomer: async (id: string): Promise<void> => {
        await api.delete(`/customers/${id}`);
    },

    // Get PPPoE customers specifically
    getPPPoECustomers: async (filters: Omit<CustomerFilters, "connectionType"> = {}): Promise<CustomerListResponse> => {
        return await customerApi.getCustomers({ ...filters, connectionType: "PPPOE" });
    },

    // Get single customer by ID
    getCustomerDetails: async (id: string): Promise<CustomerDetails> => {
        const response = await api.get<CustomerDetails>(`/customers/${id}`);
        return response.data;
    },

    // Get customer transactions (Mpesa and Manual)
    getTransactions: async (customerId: string): Promise<TransactionsResponse> => {
        const response = await api.get<TransactionsResponse>(`/customers/${customerId}/transactions`);
        return response.data;
    },

    // Get Hotspot customers specifically
    getHotspotCustomers: async (filters: Omit<CustomerFilters, "connectionType"> = {}): Promise<CustomerListResponse> => {
        return customerApi.getCustomers({ ...filters, connectionType: "HOTSPOT" });
    },

    // Reset customer MAC address
    resetMAC: async (id: string): Promise<void> => {
        await api.post(`/customers/${id}/mac-reset`);
    },

    // Purge/disconnect active session
    purgeSession: async (id: string): Promise<void> => {
        await api.post(`/customers/${id}/disconnect`);
    },

    // Disconnect user (CoA disconnect)
    disconnect: async (id: string): Promise<void> => {
        await api.post(`/customers/${id}/disconnect`);
    },

    // Send SMS to customer (via SMS routes)
    sendSMS: async (id: string, message: string): Promise<void> => {
        // Get customer phone first, then send via SMS API
        const customer = await customerApi.getCustomer(id);
        if (!customer.phone) throw new Error('Customer has no phone number');
        await api.post('/sms/send', { phone: customer.phone, message });
    },

    // Change customer expiry date
    changeExpiry: async (id: string, expiresAt: string): Promise<void> => {
        await api.put(`/customers/${id}/expiry`, { expiresAt });
    },

    // Change customer package
    changePackage: async (id: string, packageId: string): Promise<Customer> => {
        const response = await api.put<Customer>(`/customers/${id}/package`, { packageId });
        return response.data;
    },

    // Resolve pending transaction (recharge customer with manual payment)
    resolveTransaction: async (customerId: string, mpesaCode: string): Promise<void> => {
        // This will do a manual recharge with the mpesa code as reference
        await api.post(`/customers/${customerId}/recharge`, {
            amount: 0, // Amount should be provided by the modal
            description: `Resolved transaction: ${mpesaCode}`
        });
    },

    // Suspend customer account
    suspendCustomer: async (id: string): Promise<void> => {
        await api.post(`/customers/${id}/suspend`);
    },

    // Activate customer account
    activateCustomer: async (id: string): Promise<void> => {
        await api.post(`/customers/${id}/activate`);
    },

    // ==================== MikroTik API Methods ====================

    // Lock customer MAC address
    lockMAC: async (id: string): Promise<{ macAddress: string }> => {
        const response = await api.post<{ success: boolean; macAddress: string }>(`/customers/${id}/mac-lock`);
        return response.data;
    },

    // Get live status from MikroTik
    getLiveStatus: async (id: string): Promise<{
        isOnline: boolean;
        ipAddress?: string;
        macAddress?: string;
        uptime?: string;
        sessionId?: string;
        lastSeenAgo?: string;
        error?: string;
    }> => {
        const response = await api.get(`/customers/${id}/live-status`);
        return response.data;
    },

    // Override plan (custom bandwidth)
    overridePlan: async (id: string, downloadMbps: number, uploadMbps: number): Promise<void> => {
        await api.post(`/customers/${id}/override-plan`, { downloadMbps, uploadMbps });
    },

    // Temporary speed boost
    speedBoost: async (id: string, downloadMbps: number, uploadMbps: number, durationMinutes: number): Promise<void> => {
        await api.post(`/customers/${id}/speed-boost`, { downloadMbps, uploadMbps, durationMinutes });
    },

    // Assign static IP
    assignStaticIp: async (id: string, ipAddress: string): Promise<void> => {
        await api.post(`/customers/${id}/assign-ip`, { ipAddress });
    },

    // Get live bandwidth stats
    getBandwidth: async (id: string): Promise<{
        online: boolean;
        downloadBps?: number;
        uploadBps?: number;
        downloadMbps?: string;
        uploadMbps?: string;
    }> => {
        const response = await api.get(`/customers/${id}/bandwidth`);
        return response.data;
    },

    // Send message to connected user
    sendMessageToUser: async (id: string, message: string): Promise<void> => {
        await api.post(`/customers/${id}/send-message`, { message });
    },

    // Get available packages for selection
    getPackages: async (connectionType?: "PPPOE" | "HOTSPOT"): Promise<Package[]> => {
        const params = connectionType ? `?connectionType=${connectionType}` : "";
        const response = await api.get<Package[]>(`/packages${params}`);
        return response.data;
    },

    // Get active hotspot users from MikroTik via backend
    getMikroTikHotspotUsers: async (nasId: string): Promise<any[]> => {
        try {
            const response = await api.get(`/mikrotik/${nasId}/hotspot-users`);
            return response.data;
        } catch {
            return [];
        }
    },

    // Reset data counters (update dataUsed to 0)
    resetCounters: async (id: string): Promise<void> => {
        await customerApi.updateCustomer(id, { dataUsed: 0 } as any);
    },

    // Get active PPPoE sessions from MikroTik via backend
    getPPPoEActiveSessions: async (nasId?: string): Promise<PPPoESession[]> => {
        try {
            const url = nasId ? `/mikrotik/${nasId}/pppoe-active` : `/radius/active-sessions?connectionType=PPPOE`;
            const response = await api.get(url);
            return response.data;
        } catch {
            return [];
        }
    },

    // Get all active RADIUS sessions
    getActiveRadiusSessions: async (): Promise<ActiveSession[]> => {
        try {
            const response = await api.get<ActiveSession[]>('/radius/sessions');
            return response.data;
        } catch {
            // Fallback: return empty if API unavailable
            return [];
        }
    },

    // Get customers with real-time online status from RADIUS/MikroTik
    getCustomersWithLiveStatus: async (filters: CustomerFilters = {}): Promise<CustomerListResponse> => {
        try {
            // Fetch customers
            const customersResponse = await customerApi.getCustomers(filters);

            // Fetch active sessions to determine online status
            let activeSessions: ActiveSession[] = [];
            try {
                activeSessions = await customerApi.getActiveRadiusSessions();
            } catch {
                // Sessions API might not be available
            }

            // Create a set of online usernames for quick lookup
            const onlineUsernames = new Set(activeSessions.map(s => s.username?.toLowerCase()));

            // Update customer isOnline status based on active sessions
            const customersWithStatus = customersResponse.customers.map(customer => ({
                ...customer,
                isOnline: onlineUsernames.has(customer.username?.toLowerCase())
            }));

            return {
                ...customersResponse,
                customers: customersWithStatus
            };
        } catch {
            // Return original response if live status fetch fails
            return customerApi.getCustomers(filters);
        }
    },
};

// PPPoE Active Session interface
export interface PPPoESession {
    name: string;
    service: string;
    callerId: string;
    address: string;
    uptime: string;
    encoding: string;
    sessionId: string;
    limitBytesIn?: number;
    limitBytesOut?: number;
}

// Generic active session interface for RADIUS
export interface ActiveSession {
    id?: string;
    username: string;
    nasIpAddress?: string;
    nasId?: string;
    framedIpAddress?: string;
    callingStationId?: string;
    sessionId?: string;
    startTime?: string;
    connectionType?: string;
}
