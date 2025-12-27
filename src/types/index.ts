export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CUSTOMER_CARE' | 'FIELD_TECH';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
    // Custom permission overrides
    addedPermissions?: string[];
    removedPermissions?: string[];
}

export interface AuthResponse {
    user: User;
    token: string;
}
