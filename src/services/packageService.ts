import api from "./api";
import type { Package } from "../types/package";

// Mock data based on screenshots
const mockPackages: Package[] = [
    {
        id: "1", name: "1.5 Hours @ KES 10", type: "HOTSPOT", price: 10,
        downloadSpeed: 50, uploadSpeed: 50,
        sessionTime: 90, sessionTimeUnit: "MINUTES",
        isActive: true, routerIds: ["r1"], createdAt: "2024-01-01"
    },
    {
        id: "2", name: "500 mb for 1 day @ KES 10", type: "HOTSPOT", price: 10,
        downloadSpeed: 20, uploadSpeed: 20,
        sessionTime: 1, sessionTimeUnit: "DAYS",
        dataLimit: 500, dataLimitUnit: "MB",
        isActive: true, routerIds: ["r1"], createdAt: "2024-01-01"
    },
    {
        id: "3", name: "4 hours @ KES 15", type: "HOTSPOT", price: 15,
        downloadSpeed: 10, uploadSpeed: 10,
        sessionTime: 4, sessionTimeUnit: "HOURS",
        isActive: true, routerIds: ["r1"], createdAt: "2024-01-01"
    },
    {
        id: "4", name: "5 gb for 1 day @ KES 20", type: "HOTSPOT", price: 20,
        downloadSpeed: 100, uploadSpeed: 100,
        sessionTime: 1, sessionTimeUnit: "DAYS",
        dataLimit: 5, dataLimitUnit: "GB",
        isActive: true, routerIds: ["r1"], createdAt: "2024-01-01"
    },
    {
        id: "5", name: "Home Fiber 5Mbps", type: "PPPOE", price: 2500,
        downloadSpeed: 5, uploadSpeed: 5,
        isActive: true, routerIds: ["r1", "r2"], createdAt: "2024-01-02"
    },
    {
        id: "6", name: "Business 10Mbps", type: "PPPOE", price: 4000,
        downloadSpeed: 10, uploadSpeed: 10,
        isActive: true, routerIds: ["r3"], createdAt: "2024-01-03"
    },
    {
        id: "7", name: "Gold 20Mbps", type: "PPPOE", price: 6000,
        downloadSpeed: 20, uploadSpeed: 20,
        isActive: true, routerIds: [], createdAt: "2024-01-04"
    }
];

export const packageService = {
    getPackages: async (): Promise<Package[]> => {
        // TODO: Replace with real API
        // return api.get<Package[]>("/packages").then(res => res.data);
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockPackages;
    },

    createPackage: async (pkg: Omit<Package, "id" | "createdAt" | "isActive">): Promise<Package> => {
        // TODO: Replace with real API
        // return api.post<Package>("/packages", pkg).then(res => res.data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            ...pkg,
            id: Math.random().toString(36).substr(2, 9),
            isActive: true,
            createdAt: new Date().toISOString()
        };
    },

    deletePackage: async (_id: string): Promise<void> => {
        // TODO: Replace with real API
        // return api.delete("/packages/" + id).then(res => res.data);
        await new Promise(resolve => setTimeout(resolve, 500));
    },

    updatePackage: async (pkg: Package): Promise<Package> => {
        // TODO: Replace with real API
        // return api.put<Package>("/packages/" + pkg.id, pkg).then(res => res.data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { ...pkg, updatedAt: new Date().toISOString() };
    },

    async getPackageStats(id: string): Promise<{
        totalClients: number;
        activeClients: number;
        expiredClients: number;
        revenue: number;
    }> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock different stats based on ID to make it feel real
        const multiplier = id.charCodeAt(0) % 5 + 1;

        return {
            totalClients: 50 * multiplier + 17,
            activeClients: 30 * multiplier + 10,
            expiredClients: 20 * multiplier - 5,
            revenue: (50 * multiplier + 17) * 450 // rough estimate
        };
    },

    async getRouterRevenueStats(_id: string): Promise<{ routerName: string; revenue: number }[]> {
        await new Promise(resolve => setTimeout(resolve, 600));

        // Mock data
        return [
            { routerName: "5009", revenue: 25000 },
            { routerName: "Aziz Haplite Mzeras", revenue: 5000 },
            { routerName: "ccr2004", revenue: 65000 },
        ];
    }
};
