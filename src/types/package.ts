export interface Package {
    id: string;
    name: string;
    type: 'HOTSPOT' | 'PPPOE';
    price: number;
    downloadSpeed: number; // Mbps
    uploadSpeed: number;   // Mbps

    // Hotspot Specific
    sessionTime?: number;
    sessionTimeUnit?: 'HOURS' | 'DAYS' | 'MINUTES';
    dataLimit?: number;
    dataLimitUnit?: 'MB' | 'GB';

    // Router Assignment
    routerIds: string[]; // List of router IDs this package applies to
    customerCount?: number;
    voucherCount?: number;

    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}
