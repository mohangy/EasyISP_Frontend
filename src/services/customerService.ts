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
    status: "ACTIVE" | "DISABLED";
}

// Mock PPPoE customers for development
const MOCK_PPPOE_CUSTOMERS: Customer[] = [
    {
        id: "pppoe-001",
        username: "0713038483",
        name: "Rehma Omar",
        email: "rehma.omar@gmail.com",
        phone: "0713038483",
        connectionType: "PPPOE",
        status: "ACTIVE",
        packageId: "pkg-001",
        package: { id: "pkg-001", name: "Monthly 7 Mbps", price: 2500 },
        nasId: "nas-001",
        nas: { id: "nas-001", name: "CCR 2004" },
        expiresAt: "2026-01-20T18:37:00Z",
        macAddress: "18DED7D48236",
        ipAddress: "192.25.245.150",
        downloadSpeed: 7,
        uploadSpeed: 7,
        dataLimit: 50,
        dataUsed: 5,
        location: "Mazeras, Kwa Wanubi",
        createdAt: "2025-12-20T18:37:54Z",
        updatedAt: "2025-12-25T10:00:00Z",
        isOnline: true,
    },
    {
        id: "pppoe-002",
        username: "0722345678",
        name: "John Mwangi",
        email: "john.m@email.com",
        phone: "0722345678",
        connectionType: "PPPOE",
        status: "ACTIVE",
        packageId: "pkg-002",
        package: { id: "pkg-002", name: "Monthly 10 Mbps", price: 3500 },
        nasId: "nas-001",
        nas: { id: "nas-001", name: "CCR 2004" },
        expiresAt: "2026-02-15T12:00:00Z",
        macAddress: "A4B7D5C8F123",
        ipAddress: "192.25.245.151",
        downloadSpeed: 10,
        uploadSpeed: 10,
        location: "Kiembeni, Block B",
        createdAt: "2025-11-15T08:00:00Z",
        updatedAt: "2025-12-20T14:30:00Z",
        isOnline: false,
    },
    {
        id: "pppoe-003",
        username: "0733456789",
        name: "Alice Wanjiku",
        email: "alice.wanjiku@email.com",
        phone: "0733456789",
        connectionType: "PPPOE",
        status: "EXPIRED",
        packageId: "pkg-001",
        package: { id: "pkg-001", name: "Monthly 7 Mbps", price: 2500 },
        nasId: "nas-002",
        nas: { id: "nas-002", name: "Main Router" },
        expiresAt: "2025-12-01T00:00:00Z",
        macAddress: "C8D9E0F12345",
        ipAddress: "192.25.245.152",
        location: "Nyali, Beach Road",
        createdAt: "2025-08-10T10:00:00Z",
        updatedAt: "2025-12-01T00:00:00Z",
        isOnline: false,
    },
    {
        id: "pppoe-004",
        username: "0744567890",
        name: "Peter Ochieng",
        phone: "0744567890",
        connectionType: "PPPOE",
        status: "SUSPENDED",
        packageId: "pkg-003",
        package: { id: "pkg-003", name: "Monthly 15 Mbps", price: 5000 },
        nasId: "nas-001",
        nas: { id: "nas-001", name: "CCR 2004" },
        expiresAt: "2026-01-10T00:00:00Z",
        location: "Mombasa CBD",
        createdAt: "2025-09-05T14:00:00Z",
        updatedAt: "2025-12-15T09:00:00Z",
        isOnline: false,
    },
    {
        id: "pppoe-005",
        username: "0755678901",
        name: "Mary Akinyi",
        email: "mary.a@company.com",
        phone: "0755678901",
        connectionType: "PPPOE",
        status: "ACTIVE",
        packageId: "pkg-002",
        package: { id: "pkg-002", name: "Monthly 10 Mbps", price: 3500 },
        nasId: "nas-002",
        nas: { id: "nas-002", name: "Main Router" },
        expiresAt: "2026-03-01T18:00:00Z",
        macAddress: "D1E2F3A4B5C6",
        ipAddress: "192.25.245.155",
        downloadSpeed: 10,
        uploadSpeed: 10,
        dataLimit: 100,
        dataUsed: 45,
        location: "Changamwe Industrial",
        createdAt: "2025-10-20T11:00:00Z",
        updatedAt: "2025-12-22T16:00:00Z",
        isOnline: true,
    },
    {
        id: "pppoe-006",
        username: "0766789012",
        name: "David Kimani",
        phone: "0766789012",
        connectionType: "PPPOE",
        status: "ACTIVE",
        packageId: "pkg-001",
        package: { id: "pkg-001", name: "Monthly 7 Mbps", price: 2500 },
        nasId: "nas-001",
        nas: { id: "nas-001", name: "CCR 2004" },
        expiresAt: "2026-01-28T10:00:00Z",
        macAddress: "E2F3A4B5C6D7",
        ipAddress: "192.25.245.160",
        location: "Likoni Ferry",
        createdAt: "2025-07-15T08:30:00Z",
        updatedAt: "2025-12-28T10:00:00Z",
        isOnline: true,
    },
];

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

    // Get PPPoE customers specifically (with mock fallback)
    getPPPoECustomers: async (filters: Omit<CustomerFilters, "connectionType"> = {}): Promise<CustomerListResponse> => {
        try {
            return await customerApi.getCustomers({ ...filters, connectionType: "PPPOE" });
        } catch {
            // Return mock data for development
            let filtered = [...MOCK_PPPOE_CUSTOMERS];

            // Apply filters
            if (filters.status) {
                filtered = filtered.filter(c => c.status === filters.status);
            }
            if (filters.search) {
                const search = filters.search.toLowerCase();
                filtered = filtered.filter(c =>
                    c.username.toLowerCase().includes(search) ||
                    c.name.toLowerCase().includes(search) ||
                    c.phone?.toLowerCase().includes(search)
                );
            }

            // Pagination
            const page = filters.page || 1;
            const pageSize = filters.pageSize || 20;
            const start = (page - 1) * pageSize;
            const paged = filtered.slice(start, start + pageSize);

            return {
                customers: paged,
                total: filtered.length,
                page,
                pageSize,
                totalPages: Math.ceil(filtered.length / pageSize),
            };
        }
    },

    // Get single customer by ID (with mock fallback)
    getCustomerDetails: async (id: string): Promise<CustomerDetails> => {
        try {
            const response = await api.get<CustomerDetails>(`/customers/${id}`);
            return response.data;
        } catch {
            // Return mock data for development
            const customer = MOCK_PPPOE_CUSTOMERS.find(c => c.id === id);
            if (!customer) {
                throw new Error("Customer not found");
            }
            return {
                ...customer,
                password: customer.username, // Mock: password same as username
                walletBalance: 0,
                totalSpent: 0,
                monthlyUsage: { download: 5, upload: 49 },
                lastIp: customer.ipAddress || "192.25.245.150",
                lastMac: customer.macAddress || "18DED7D48236",
                vendor: "HUAWEI TECHNOLOGIES CO.,LTD",
                site: `${customer.nas?.name || "Main Router"} (100.105.2.112)`,
                uptime: customer.isOnline ? "1d9h19min54s" : undefined,
            };
        }
    },

    // Get customer transactions (Mpesa and Manual)
    getTransactions: async (customerId: string): Promise<TransactionsResponse> => {
        try {
            const response = await api.get<TransactionsResponse>(`/customers/${customerId}/transactions`);
            return response.data;
        } catch {
            // Return empty arrays for development (no transactions yet)
            return {
                mpesaTransactions: [],
                manualTransactions: []
            };
        }
    },

    // Get Hotspot customers specifically
    getHotspotCustomers: async (filters: Omit<CustomerFilters, "connectionType"> = {}): Promise<CustomerListResponse> => {
        return customerApi.getCustomers({ ...filters, connectionType: "HOTSPOT" });
    },

    // Reset customer MAC address
    resetMAC: async (id: string): Promise<void> => {
        await api.post(`/customers/${id}/reset-mac`);
    },

    // Purge/disconnect active session
    purgeSession: async (id: string): Promise<void> => {
        await api.post(`/customers/${id}/purge`);
    },

    // Disconnect user (CoA disconnect)
    disconnect: async (id: string): Promise<void> => {
        await api.post(`/customers/${id}/disconnect`);
    },

    // Send SMS to customer
    sendSMS: async (id: string, message: string): Promise<void> => {
        await api.post(`/customers/${id}/sms`, { message });
    },

    // Extend customer expiry
    extendExpiry: async (id: string, days: number): Promise<Customer> => {
        const response = await api.post<Customer>(`/customers/${id}/extend`, { days });
        return response.data;
    },

    // Change customer package
    changePackage: async (id: string, packageId: string): Promise<Customer> => {
        const response = await api.post<Customer>(`/customers/${id}/change-package`, { packageId });
        return response.data;
    },

    // Resolve pending transaction
    resolveTransaction: async (customerId: string, transactionId: string): Promise<void> => {
        await api.post(`/customers/${customerId}/transactions/${transactionId}/resolve`);
    },

    // Get available packages for selection
    getPackages: async (serviceType?: "PPPOE" | "HOTSPOT"): Promise<Package[]> => {
        try {
            const params = serviceType ? `?serviceType=${serviceType}` : "";
            const response = await api.get<Package[]>(`/packages${params}`);
            return response.data;
        } catch {
            // Return mock packages for development
            const mockPackages: Package[] = [
                { id: "pkg-1", name: "Basic 5Mbps", price: 1500, downloadSpeed: 5, uploadSpeed: 1, serviceType: "PPPOE", status: "ACTIVE" },
                { id: "pkg-2", name: "Standard 10Mbps", price: 2500, downloadSpeed: 10, uploadSpeed: 2, serviceType: "PPPOE", status: "ACTIVE" },
                { id: "pkg-3", name: "Premium 20Mbps", price: 4000, downloadSpeed: 20, uploadSpeed: 5, serviceType: "PPPOE", status: "ACTIVE" },
                { id: "pkg-4", name: "Ultra 50Mbps", price: 7500, downloadSpeed: 50, uploadSpeed: 10, serviceType: "PPPOE", status: "ACTIVE" },
                { id: "pkg-5", name: "Hotspot Daily", price: 20, downloadSpeed: 5, uploadSpeed: 5, serviceType: "HOTSPOT", status: "ACTIVE" },
                { id: "pkg-6", name: "Hotspot Weekly", price: 100, downloadSpeed: 10, uploadSpeed: 10, serviceType: "HOTSPOT", status: "ACTIVE" },
            ];
            return serviceType ? mockPackages.filter(p => p.serviceType === serviceType) : mockPackages;
        }
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
