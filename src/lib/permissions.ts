import type { User, UserRole } from '../types';

// ============ PERMISSION CONSTANTS ============
export const PERMISSIONS = {
    // Dashboard
    DASHBOARD_VIEW: 'dashboard:view',
    ANALYTICS_VIEW: 'analytics:view',

    // Customers
    CUSTOMERS_VIEW: 'customers:view',
    CUSTOMERS_CREATE: 'customers:create',
    CUSTOMERS_EDIT: 'customers:edit',
    CUSTOMERS_DELETE: 'customers:delete',
    CUSTOMERS_SUSPEND: 'customers:suspend',

    // Packages
    PACKAGES_VIEW: 'packages:view',
    PACKAGES_CREATE: 'packages:create',
    PACKAGES_EDIT: 'packages:edit',
    PACKAGES_DELETE: 'packages:delete',

    // Routers/NAS
    ROUTERS_VIEW: 'routers:view',
    ROUTERS_CREATE: 'routers:create',
    ROUTERS_EDIT: 'routers:edit',
    ROUTERS_DELETE: 'routers:delete',
    ROUTERS_TEST: 'routers:test',
    ROUTERS_CONFIG: 'routers:config',
    ROUTERS_DISCONNECT: 'routers:disconnect',

    // Payments
    PAYMENTS_VIEW: 'payments:view',
    PAYMENTS_PROCESS: 'payments:process',
    PAYMENTS_REFUND: 'payments:refund',
    PAYMENTS_REPORTS: 'payments:reports',

    // Vouchers
    VOUCHERS_VIEW: 'vouchers:view',
    VOUCHERS_GENERATE: 'vouchers:generate',
    VOUCHERS_PRINT: 'vouchers:print',

    // SMS
    SMS_VIEW: 'sms:view',
    SMS_SEND: 'sms:send',
    SMS_DELETE: 'sms:delete',

    // Tickets
    TICKETS_VIEW: 'tickets:view',
    TICKETS_CREATE: 'tickets:create',
    TICKETS_RESPOND: 'tickets:respond',
    TICKETS_CLOSE: 'tickets:close',

    // Operators
    OPERATORS_VIEW: 'operators:view',
    OPERATORS_CREATE: 'operators:create',
    OPERATORS_EDIT: 'operators:edit',
    OPERATORS_DELETE: 'operators:delete',

    // Settings
    SETTINGS_GENERAL: 'settings:general',
    SETTINGS_LICENCE: 'settings:licence',
    SETTINGS_INVOICES: 'settings:invoices',
    SETTINGS_PAYMENT_GATEWAY: 'settings:payment_gateway',
    SETTINGS_SMS: 'settings:sms',
    SETTINGS_PASSWORD: 'settings:password',

    // Finance
    FINANCE_VIEW: 'finance:view',
    FINANCE_DASHBOARD: 'finance:dashboard',
    FINANCE_INCOME_CREATE: 'finance:income_create',
    FINANCE_INVOICES: 'finance:invoices',
    FINANCE_INVOICES_CREATE: 'finance:invoices_create',
    FINANCE_EXPENSES: 'finance:expenses',
    FINANCE_EXPENSES_CREATE: 'finance:expenses_create',
    FINANCE_ACCOUNTS: 'finance:accounts',
    FINANCE_TRANSACTIONS: 'finance:transactions',
    FINANCE_REPORTS: 'finance:reports',
    FINANCE_RECONCILIATION: 'finance:reconciliation',
    FINANCE_TAX: 'finance:tax',
    FINANCE_MPESA: 'finance:mpesa',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ============ ROLE DEFAULT PERMISSIONS ============
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    // Super Admin: Full access
    SUPER_ADMIN: [...ALL_PERMISSIONS],

    // Admin: Full access except sensitive tenant settings
    ADMIN: ALL_PERMISSIONS.filter(p =>
        !['settings:general', 'settings:licence', 'settings:payment_gateway'].includes(p)
    ),

    // Customer Care: Customer management, payments, vouchers, tickets
    CUSTOMER_CARE: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.ANALYTICS_VIEW,
        // Customers
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.CUSTOMERS_EDIT,
        PERMISSIONS.CUSTOMERS_SUSPEND,
        // Packages (view only)
        PERMISSIONS.PACKAGES_VIEW,
        // Routers (view only)
        PERMISSIONS.ROUTERS_VIEW,
        // Payments
        PERMISSIONS.PAYMENTS_VIEW,
        PERMISSIONS.PAYMENTS_PROCESS,
        PERMISSIONS.PAYMENTS_REPORTS,
        // Vouchers
        PERMISSIONS.VOUCHERS_VIEW,
        PERMISSIONS.VOUCHERS_GENERATE,
        PERMISSIONS.VOUCHERS_PRINT,
        // SMS
        PERMISSIONS.SMS_VIEW,
        PERMISSIONS.SMS_SEND,
        PERMISSIONS.SMS_DELETE,
        // Tickets
        PERMISSIONS.TICKETS_VIEW,
        PERMISSIONS.TICKETS_CREATE,
        PERMISSIONS.TICKETS_RESPOND,
        PERMISSIONS.TICKETS_CLOSE,
        // Settings (password only)
        PERMISSIONS.SETTINGS_PASSWORD,
    ],

    // Field Technician: Router/NAS focus, customer view
    FIELD_TECH: [
        PERMISSIONS.DASHBOARD_VIEW,
        // Customers (view only)
        PERMISSIONS.CUSTOMERS_VIEW,
        // Packages (view only)
        PERMISSIONS.PACKAGES_VIEW,
        // Routers (full except delete)
        PERMISSIONS.ROUTERS_VIEW,
        PERMISSIONS.ROUTERS_CREATE,
        PERMISSIONS.ROUTERS_EDIT,
        PERMISSIONS.ROUTERS_TEST,
        PERMISSIONS.ROUTERS_CONFIG,
        PERMISSIONS.ROUTERS_DISCONNECT,
        // Tickets (view and respond)
        PERMISSIONS.TICKETS_VIEW,
        PERMISSIONS.TICKETS_RESPOND,
        // Settings (password only)
        PERMISSIONS.SETTINGS_PASSWORD,
    ],
};

// ============ PERMISSION HELPERS ============

/**
 * Get effective permissions for a user (role defaults + added - removed)
 */
export function getEffectivePermissions(user: User | null): Permission[] {
    if (!user) return [];

    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const added = (user.addedPermissions || []) as Permission[];
    const removed = (user.removedPermissions || []) as Permission[];

    // Combine role permissions with added, then remove revoked
    const combined = new Set([...rolePermissions, ...added]);
    removed.forEach(p => combined.delete(p));

    return Array.from(combined);
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;

    // Super Admin always has all permissions
    if (user.role === 'SUPER_ADMIN') return true;

    const effective = getEffectivePermissions(user);
    return effective.includes(permission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(user, p));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(user, p));
}

// ============ PERMISSION GROUPS FOR UI ============
export const PERMISSION_GROUPS = {
    customers: {
        label: 'Customers',
        permissions: [
            { key: PERMISSIONS.CUSTOMERS_VIEW, label: 'View' },
            { key: PERMISSIONS.CUSTOMERS_CREATE, label: 'Add' },
            { key: PERMISSIONS.CUSTOMERS_EDIT, label: 'Edit' },
            { key: PERMISSIONS.CUSTOMERS_DELETE, label: 'Delete' },
            { key: PERMISSIONS.CUSTOMERS_SUSPEND, label: 'Suspend/Activate' },
        ],
    },
    packages: {
        label: 'Packages',
        permissions: [
            { key: PERMISSIONS.PACKAGES_VIEW, label: 'View' },
            { key: PERMISSIONS.PACKAGES_CREATE, label: 'Create' },
            { key: PERMISSIONS.PACKAGES_EDIT, label: 'Edit' },
            { key: PERMISSIONS.PACKAGES_DELETE, label: 'Delete' },
        ],
    },
    routers: {
        label: 'Routers/NAS',
        permissions: [
            { key: PERMISSIONS.ROUTERS_VIEW, label: 'View' },
            { key: PERMISSIONS.ROUTERS_CREATE, label: 'Add' },
            { key: PERMISSIONS.ROUTERS_EDIT, label: 'Edit' },
            { key: PERMISSIONS.ROUTERS_DELETE, label: 'Delete' },
            { key: PERMISSIONS.ROUTERS_TEST, label: 'Test Connection' },
            { key: PERMISSIONS.ROUTERS_CONFIG, label: 'Generate Config' },
            { key: PERMISSIONS.ROUTERS_DISCONNECT, label: 'Disconnect User' },
        ],
    },
    payments: {
        label: 'Payments',
        permissions: [
            { key: PERMISSIONS.PAYMENTS_VIEW, label: 'View' },
            { key: PERMISSIONS.PAYMENTS_PROCESS, label: 'Process' },
            { key: PERMISSIONS.PAYMENTS_REFUND, label: 'Refund' },
            { key: PERMISSIONS.PAYMENTS_REPORTS, label: 'Reports' },
        ],
    },
    vouchers: {
        label: 'Vouchers',
        permissions: [
            { key: PERMISSIONS.VOUCHERS_VIEW, label: 'View' },
            { key: PERMISSIONS.VOUCHERS_GENERATE, label: 'Generate' },
            { key: PERMISSIONS.VOUCHERS_PRINT, label: 'Print' },
        ],
    },
    sms: {
        label: 'SMS',
        permissions: [
            { key: PERMISSIONS.SMS_VIEW, label: 'View' },
            { key: PERMISSIONS.SMS_SEND, label: 'Send' },
            { key: PERMISSIONS.SMS_DELETE, label: 'Delete' },
        ],
    },
    tickets: {
        label: 'Tickets',
        permissions: [
            { key: PERMISSIONS.TICKETS_VIEW, label: 'View' },
            { key: PERMISSIONS.TICKETS_CREATE, label: 'Create' },
            { key: PERMISSIONS.TICKETS_RESPOND, label: 'Respond' },
            { key: PERMISSIONS.TICKETS_CLOSE, label: 'Close' },
        ],

    },
    operators: {
        label: 'Team Members',
        permissions: [
            { key: PERMISSIONS.OPERATORS_VIEW, label: 'View' },
            { key: PERMISSIONS.OPERATORS_CREATE, label: 'Add' },
            { key: PERMISSIONS.OPERATORS_EDIT, label: 'Edit' },
            { key: PERMISSIONS.OPERATORS_DELETE, label: 'Delete' },
        ],
    },
    settings: {
        label: 'Settings',
        permissions: [
            { key: PERMISSIONS.SETTINGS_GENERAL, label: 'General' },
            { key: PERMISSIONS.SETTINGS_LICENCE, label: 'Licence' },
            { key: PERMISSIONS.SETTINGS_INVOICES, label: 'Invoices' },
            { key: PERMISSIONS.SETTINGS_PAYMENT_GATEWAY, label: 'Payment Gateway' },
            { key: PERMISSIONS.SETTINGS_SMS, label: 'SMS Configuration' },
            { key: PERMISSIONS.SETTINGS_PASSWORD, label: 'Change Password' },
        ],
    },
    finance: {
        label: 'Finance',
        permissions: [
            { key: PERMISSIONS.FINANCE_VIEW, label: 'View' },
            { key: PERMISSIONS.FINANCE_DASHBOARD, label: 'Dashboard' },
            { key: PERMISSIONS.FINANCE_INCOME_CREATE, label: 'Record Income' },
            { key: PERMISSIONS.FINANCE_INVOICES, label: 'Invoices' },
            { key: PERMISSIONS.FINANCE_INVOICES_CREATE, label: 'Create Invoices' },
            { key: PERMISSIONS.FINANCE_EXPENSES, label: 'Expenses' },
            { key: PERMISSIONS.FINANCE_EXPENSES_CREATE, label: 'Create Expenses' },
            { key: PERMISSIONS.FINANCE_ACCOUNTS, label: 'Chart of Accounts' },
            { key: PERMISSIONS.FINANCE_TRANSACTIONS, label: 'Transactions' },
            { key: PERMISSIONS.FINANCE_REPORTS, label: 'Reports' },
            { key: PERMISSIONS.FINANCE_RECONCILIATION, label: 'Reconciliation' },
            { key: PERMISSIONS.FINANCE_TAX, label: 'Tax Management' },
            { key: PERMISSIONS.FINANCE_MPESA, label: 'M-Pesa Settings' },
        ],
    },
};

// Role display names
export const ROLE_LABELS: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    CUSTOMER_CARE: 'Customer Care',
    FIELD_TECH: 'Field Technician',
};
