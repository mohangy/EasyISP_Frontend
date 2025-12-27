/**
 * NAS/Router Service
 * Handles API calls for MikroTik router management
 */

import api from "./api";

// Types
export type RouterStatus = "ONLINE" | "OFFLINE" | "PENDING" | "ERROR";
export type ProvisioningStatus = "Provisioned" | "Command Pending" | "Failed" | "Pending";

export interface NASRouter {
    id: string;
    name: string;
    boardName?: string;
    ipAddress: string;
    secret: string;
    coaPort: number;
    status: RouterStatus;
    provisioningStatus: ProvisioningStatus;
    vpnTunnelIp?: string;
    routerOsVersion?: string;
    model?: string;
    serialNumber?: string;
    // System metrics
    cpuLoad?: number;
    memoryUsage?: number;
    memoryTotal?: number;
    uptime?: string;
    // Session counts
    pppoeCount?: number;
    hotspotCount?: number;
    // Remote access
    remoteWinboxPort?: number;
    remoteWinboxEnabled?: boolean;
    // API credentials
    apiUsername?: string;
    apiPort?: number;
    // Timestamps
    lastSeen?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface NASListResponse {
    routers: NASRouter[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface NASDetailsResponse extends NASRouter {
    certificates?: {
        ca: string;
        cert: string;
        key: string;
    };
    configScript?: string;
}

export interface CreateNASRequest {
    name: string;
    ipAddress: string;
    secret?: string;
    coaPort?: number;
    routerOsVersion?: string;
    apiUsername?: string;
    apiPassword?: string;
    apiPort?: number;
}

export interface UpdateNASRequest {
    name?: string;
    ipAddress?: string;
    secret?: string;
    coaPort?: number;
    apiUsername?: string;
    apiPassword?: string;
    apiPort?: number;
}

export interface NASLiveStatus {
    id: string;
    status: RouterStatus;
    uptime?: string;
    lastSeen?: string;
    cpuLoad?: number;
    memoryUsage?: number;
    memoryTotal?: number;
    activeSessions: {
        pppoe: number;
        hotspot: number;
        total: number;
    };
}

export interface SystemStats {
    boardName: string;
    version: string;
    cpuLoad: number;
    memoryUsed: number;
    memoryTotal: number;
    uptime: string;
    architecture: string;
}

export interface ActiveSession {
    id: string; // Internal ID from MikroTik
    username: string;
    ipAddress: string;
    uptime: string;
    macAddress?: string;
    type: 'pppoe' | 'hotspot';
    bytesIn?: number; // Upload
    bytesOut?: number; // Download
}

/**
 * NAS API Service
 */
export const nasApi = {
    /**
     * List all NAS routers with pagination
     */
    async getRouters(params?: {
        page?: number;
        pageSize?: number;
        status?: string;
        search?: string;
    }): Promise<NASListResponse> {
        const response = await api.get<NASListResponse>("/nas", { params });
        return response.data;
    },

    /**
     * Get single router details
     */
    async getRouter(id: string): Promise<NASDetailsResponse> {
        const response = await api.get<NASDetailsResponse>(`/nas/${id}`);
        return response.data;
    },

    /**
     * Create/onboard a new router
     */
    async createRouter(data: CreateNASRequest): Promise<NASRouter> {
        const response = await api.post<NASRouter>("/nas", data);
        return response.data;
    },

    /**
     * Update router configuration
     */
    async updateRouter(id: string, data: UpdateNASRequest): Promise<NASRouter> {
        const response = await api.put<NASRouter>(`/nas/${id}`, data);
        return response.data;
    },

    /**
     * Delete a router
     */
    async deleteRouter(id: string): Promise<void> {
        await api.delete(`/nas/${id}`);
    },

    /**
     * Get live status of a router
     */
    async getLiveStatus(id: string): Promise<NASLiveStatus> {
        const response = await api.get<NASLiveStatus>(`/nas/${id}/live-status`);
        return response.data;
    },

    /**
     * Test connection to a router
     */
    async testConnection(id: string): Promise<{ success: boolean; message: string; latency?: number }> {
        const response = await api.post<{ success: boolean; message: string; latency?: number }>(`/nas/${id}/test`);
        return response.data;
    },

    /**
     * Get system stats from router via MikroTik API
     */
    async getSystemStats(id: string): Promise<SystemStats> {
        const response = await api.get<SystemStats>(`/mikrotik/${id}/system-stats`);
        return response.data;
    },

    /**
     * Generate configuration script for router
     */
    async getConfigScript(id: string): Promise<{ script: string }> {
        const response = await api.get<{ script: string }>(`/wizard/${id}/script`);
        return response.data;
    },

    /**
     * Start wizard for new router onboarding
     */
    async startWizard(): Promise<{ token: string; bootstrapScript: string }> {
        const response = await api.post<{ token: string; bootstrapScript: string }>("/wizard/start");
        return response.data;
    },

    /**
     * Get wizard status for a router
     */
    async getWizardStatus(nasId: string): Promise<{
        step: string;
        progress: number;
        status: string;
        message?: string
    }> {
        const response = await api.get<{ step: string; progress: number; status: string; message?: string }>(`/wizard/${nasId}/status`);
        return response.data;
    },

    /**
     * Execute auto-configuration on router
     */
    async autoConfigureRouter(nasId: string): Promise<{ success: boolean; message: string }> {
        const response = await api.post<{ success: boolean; message: string }>(`/wizard/${nasId}/auto-configure`);
        return response.data;
    },

    /**
     * Disconnect a user from router
     */
    async disconnectUser(nasId: string, username: string): Promise<{ success: boolean }> {
        const response = await api.post<{ success: boolean }>(`/mikrotik/${nasId}/disconnect`, { username });
        return response.data;
    },

    /**
     * Get active sessions from router
     */
    async getActiveSessions(id: string, type?: 'pppoe' | 'hotspot'): Promise<ActiveSession[]> {
        const response = await api.get<ActiveSession[]>(`/mikrotik/${id}/sessions`, { params: { type } });
        return response.data;
    },

    /**
     * Poll provisioning status (Step 2)
     */
    async pollProvisioningStatus(token: string): Promise<{ status: 'PENDING' | 'CONNECTED'; routerId?: string }> {
        const response = await api.get<{ status: 'PENDING' | 'CONNECTED'; routerId?: string }>(`/wizard/${token}/status`);
        return response.data;
    },

    /**
     * Get interfaces from connected router (Step 3)
     */
    async getInterfaces(routerId: string): Promise<string[]> {
        const response = await api.get<{ interfaces: string[] }>(`/wizard/${routerId}/interfaces`);
        return response.data.interfaces;
    },

    /**
     * Configure services on router (Step 3 Action)
     */
    async configureServices(routerId: string, config: {
        services: ('pppoe' | 'hotspot')[];
        ports: string[];
        subnet: string;
    }): Promise<{ success: boolean }> {
        const response = await api.post<{ success: boolean }>(`/wizard/${routerId}/configure`, config);
        return response.data;
    },
};

export default nasApi;
