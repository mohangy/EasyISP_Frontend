export interface Package {
    id: string;
    name: string;
    type: 'HOTSPOT' | 'PPPOE';
    price: number;
    downloadSpeed: number; // Mbps
    uploadSpeed: number;   // Mbps

    // Hotspot Specific
    sessionTime?: number;        // Minutes (backend stores raw minutes)
    sessionTimeUnit?: string;    // Optional - for form input only
    dataLimit?: string | number | null; // Bytes as string (BigInt serialized) or number
    dataLimitUnit?: string;      // Optional - for form input only

    // Router Assignment - backend returns array of router objects
    routers?: Array<{ id: string; name: string }>;
    routerIds?: string[]; // For form submission only
    customerCount?: number;
    voucherCount?: number;

    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}
