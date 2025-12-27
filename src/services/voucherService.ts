import api from "./api";

export interface Voucher {
    id: string;
    code: string;
    status: "AVAILABLE" | "USED" | "EXPIRED" | "REVOKED";
    packageId: string;
    package?: {
        name: string;
        price: number;
    };
    createdAt: string;
    expiresAt?: string;
}

export interface GenerateVouchersData {
    count: number;
    packageId: string;
    type?: "HOTSPOT" | "PPPOE"; // Usually Hotspot
    prefix?: string;
}

export const voucherApi = {
    // Generate vouchers
    generate: async (data: GenerateVouchersData): Promise<Voucher[]> => {
        const response = await api.post<Voucher[]>("/vouchers", data);
        return response.data;
    },

    // Get all vouchers
    getAll: async (): Promise<Voucher[]> => {
        const response = await api.get<Voucher[]>("/vouchers");
        return response.data;
    },

    // Delete voucher
    delete: async (id: string): Promise<void> => {
        await api.delete(`/vouchers/${id}`);
    }
};
