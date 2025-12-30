import type { Package } from "../types/package";
import api from "./api";

export const packageService = {
    getPackages: async (type?: "PPPOE" | "HOTSPOT"): Promise<Package[]> => {
        const params = type ? { type } : {};
        const response = await api.get<Package[]>("/packages", { params });
        return response.data;
    },

    getPackage: async (id: string): Promise<Package> => {
        const response = await api.get<Package>(`/packages/${id}`);
        return response.data;
    },

    createPackage: async (pkg: Omit<Package, "id" | "createdAt" | "isActive">): Promise<Package> => {
        const response = await api.post<Package>("/packages", pkg);
        return response.data;
    },

    updatePackage: async (id: string, pkg: Partial<Package>): Promise<Package> => {
        const response = await api.put<Package>(`/packages/${id}`, pkg);
        return response.data;
    },

    deletePackage: async (id: string): Promise<void> => {
        await api.delete(`/packages/${id}`);
    },

    getPackageStats: async (id: string): Promise<{
        totalClients: number;
        activeClients: number;
        expiredClients: number;
        suspendedClients: number;
        revenue: number;
    }> => {
        const response = await api.get(`/packages/${id}/stats`);
        return response.data;
    },

    getRouterRevenueStats: async (id: string): Promise<{ routerId: string; routerName: string; revenue: number }[]> => {
        const response = await api.get(`/packages/${id}/router-revenue`);
        return response.data;
    }
};
