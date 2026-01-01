import type { User, UserRole } from '../types';

// ============ PERMISSION CONSTANTS ============
export const PERMISSIONS = {
    // ==================== DASHBOARD ====================
    DASHBOARD_VIEW: 'dashboard:view',
    DASHBOARD_ACTIVE_SESSIONS: 'dashboard:active_sessions',
    DASHBOARD_TOTAL_CUSTOMERS: 'dashboard:total_customers',
    DASHBOARD_MONTHLY_REVENUE: 'dashboard:monthly_revenue',
    DASHBOARD_TODAY_REVENUE: 'dashboard:today_revenue',
    DASHBOARD_NETWORK_USAGE: 'dashboard:network_usage',
    DASHBOARD_PAYMENTS: 'dashboard:payments',

    // ==================== PPPOE ====================
    PPPOE_VIEW: 'pppoe:view',
    PPPOE_ADD_USER: 'pppoe:add_user',
    PPPOE_SEND_BULK_SMS: 'pppoe:send_bulk_sms',
    // PPPoE Details
    PPPOE_DETAILS_VIEW: 'pppoe:details_view',
    PPPOE_EDIT: 'pppoe:edit',
    PPPOE_ADD_CHILD: 'pppoe:add_child',
    PPPOE_SEND_SMS: 'pppoe:send_sms',
    PPPOE_DELETE: 'pppoe:delete',
    PPPOE_SUSPEND: 'pppoe:suspend',
    PPPOE_RESET_MAC: 'pppoe:reset_mac',
    PPPOE_LOCK_MAC: 'pppoe:lock_mac',
    PPPOE_PURGE: 'pppoe:purge',
    PPPOE_OVERRIDE_PLAN: 'pppoe:override_plan',
    PPPOE_SPEED_BOOST: 'pppoe:speed_boost',
    PPPOE_STATIC_IP: 'pppoe:static_ip',
    PPPOE_CHANGE_PLAN: 'pppoe:change_plan',
    PPPOE_CHANGE_EXPIRY: 'pppoe:change_expiry',
    PPPOE_RESOLVE: 'pppoe:resolve',

    // ==================== HOTSPOT ====================
    HOTSPOT_VIEW: 'hotspot:view',
    HOTSPOT_ADD_USER: 'hotspot:add_user',
    HOTSPOT_DELETE_EXPIRED: 'hotspot:delete_expired',
    HOTSPOT_DELETE_UNUSED: 'hotspot:delete_unused',
    // Hotspot Details
    HOTSPOT_DETAILS_VIEW: 'hotspot:details_view',
    HOTSPOT_DELETE: 'hotspot:delete',
    HOTSPOT_RESET_MAC: 'hotspot:reset_mac',
    HOTSPOT_PURGE: 'hotspot:purge',
    HOTSPOT_RESET_COUNTERS: 'hotspot:reset_counters',
    HOTSPOT_CHANGE_PACKAGE: 'hotspot:change_package',

    // ==================== PAYMENTS ====================
    PAYMENTS_VIEW_ELECTRONIC: 'payments:view_electronic',
    PAYMENTS_VIEW_MANUAL: 'payments:view_manual',
    PAYMENTS_PROCESS: 'payments:process',

    // ==================== CUSTOMERS (General) ====================
    CUSTOMERS_CREATE: 'customers:create',
    CUSTOMERS_EDIT: 'customers:edit',
    CUSTOMERS_DELETE: 'customers:delete',

    // ==================== SMS ====================
    SMS_VIEW: 'sms:view',
    SMS_SETTINGS: 'sms:settings',
    SMS_COMPOSE: 'sms:compose',
    SMS_CLEAR: 'sms:clear',
    SMS_SEND: 'sms:send',
    // SMS Details
    SMS_DELETE: 'sms:delete',
    SMS_RESEND: 'sms:resend',

    // ==================== MAPS ====================
    MAPS_VIEW: 'maps:view',

    // ==================== PACKAGES ====================
    PACKAGES_VIEW: 'packages:view',
    PACKAGES_ADD_HOTSPOT: 'packages:add_hotspot',
    PACKAGES_ADD_PPPOE: 'packages:add_pppoe',
    // Package Details
    PACKAGES_DETAILS_VIEW: 'packages:details_view',
    PACKAGES_EDIT: 'packages:edit',
    PACKAGES_DELETE: 'packages:delete',

    // ==================== ROUTERS ====================
    ROUTERS_VIEW: 'routers:view',
    ROUTERS_ADD: 'routers:add',
    ROUTERS_TUTORIAL: 'routers:tutorial',
    // Router Details
    ROUTERS_DETAILS_VIEW: 'routers:details_view',
    ROUTERS_EDIT: 'routers:edit',
    ROUTERS_DELETE: 'routers:delete',
    ROUTERS_TEST: 'routers:test',
    ROUTERS_CONFIG: 'routers:config',
    ROUTERS_DISCONNECT: 'routers:disconnect',

    // ==================== FINANCE ====================
    FINANCE_DASHBOARD_VIEW: 'finance:dashboard_view',
    FINANCE_VIEW_CHARTS: 'finance:view_charts',
    FINANCE_INCOME_VIEW: 'finance:income_view',
    FINANCE_INCOME_CREATE: 'finance:income_create',
    FINANCE_EXPENSES_VIEW: 'finance:expenses_view',
    FINANCE_EXPENSES_CREATE: 'finance:expenses_create',
    FINANCE_REPORTS_VIEW: 'finance:reports_view',
    FINANCE_REPORTS_GENERATE: 'finance:reports_generate',

    // ==================== TEAM/OPERATORS ====================
    OPERATORS_VIEW: 'operators:view',
    OPERATORS_ADD: 'operators:add',
    // Operator Details
    OPERATORS_DETAILS_VIEW: 'operators:details_view',
    OPERATORS_EDIT: 'operators:edit',
    OPERATORS_DELETE: 'operators:delete',
    OPERATORS_MANAGE_PERMISSIONS: 'operators:manage_permissions',

    // ==================== SETTINGS ====================
    SETTINGS_GENERAL: 'settings:general',
    SETTINGS_LICENCE: 'settings:licence',
    SETTINGS_INVOICES: 'settings:invoices',
    SETTINGS_PAYMENT_GATEWAY: 'settings:payment_gateway',
    SETTINGS_SMS: 'settings:sms',
    SETTINGS_PASSWORD: 'settings:password',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ============ ROLE DEFAULT PERMISSIONS ============
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    // Super Admin: Full access
    SUPER_ADMIN: [...ALL_PERMISSIONS],

    // Admin: Full access except sensitive settings
    ADMIN: ALL_PERMISSIONS.filter(p =>
        !['settings:licence', 'settings:payment_gateway'].includes(p)
    ),

    // Customer Care: Customer management focus
    CUSTOMER_CARE: [
        // Dashboard
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.DASHBOARD_ACTIVE_SESSIONS,
        PERMISSIONS.DASHBOARD_TOTAL_CUSTOMERS,
        PERMISSIONS.DASHBOARD_PAYMENTS,
        // PPPoE
        PERMISSIONS.PPPOE_VIEW,
        PERMISSIONS.PPPOE_DETAILS_VIEW,
        PERMISSIONS.PPPOE_EDIT,
        PERMISSIONS.PPPOE_SEND_SMS,
        PERMISSIONS.PPPOE_SEND_BULK_SMS,
        PERMISSIONS.PPPOE_SUSPEND,
        PERMISSIONS.PPPOE_CHANGE_EXPIRY,
        PERMISSIONS.PPPOE_RESOLVE,
        // Hotspot
        PERMISSIONS.HOTSPOT_VIEW,
        PERMISSIONS.HOTSPOT_DETAILS_VIEW,
        PERMISSIONS.HOTSPOT_CHANGE_PACKAGE,
        // Payments
        PERMISSIONS.PAYMENTS_VIEW_ELECTRONIC,
        PERMISSIONS.PAYMENTS_VIEW_MANUAL,
        // SMS
        PERMISSIONS.SMS_VIEW,
        PERMISSIONS.SMS_COMPOSE,
        // Packages (view only)
        PERMISSIONS.PACKAGES_VIEW,
        PERMISSIONS.PACKAGES_DETAILS_VIEW,
        // Settings
        PERMISSIONS.SETTINGS_PASSWORD,
    ],

    // Field Technician: Router/NAS focus
    FIELD_TECH: [
        // Dashboard (limited)
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.DASHBOARD_ACTIVE_SESSIONS,
        // PPPoE (view + technical actions)
        PERMISSIONS.PPPOE_VIEW,
        PERMISSIONS.PPPOE_DETAILS_VIEW,
        PERMISSIONS.PPPOE_RESET_MAC,
        PERMISSIONS.PPPOE_PURGE,
        PERMISSIONS.PPPOE_RESOLVE,
        // Hotspot (view + technical)
        PERMISSIONS.HOTSPOT_VIEW,
        PERMISSIONS.HOTSPOT_DETAILS_VIEW,
        PERMISSIONS.HOTSPOT_RESET_MAC,
        PERMISSIONS.HOTSPOT_PURGE,
        PERMISSIONS.HOTSPOT_RESET_COUNTERS,
        // Maps
        PERMISSIONS.MAPS_VIEW,
        // Routers (full technical access)
        PERMISSIONS.ROUTERS_VIEW,
        PERMISSIONS.ROUTERS_ADD,
        PERMISSIONS.ROUTERS_DETAILS_VIEW,
        PERMISSIONS.ROUTERS_EDIT,
        PERMISSIONS.ROUTERS_TEST,
        PERMISSIONS.ROUTERS_CONFIG,
        // Packages (view only)
        PERMISSIONS.PACKAGES_VIEW,
        PERMISSIONS.PACKAGES_DETAILS_VIEW,
        // Settings
        PERMISSIONS.SETTINGS_PASSWORD,
    ],
};

// ============ PERMISSION HELPERS ============

export function getEffectivePermissions(user: User | null): Permission[] {
    if (!user) return [];
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const added = (user.addedPermissions || []) as Permission[];
    const removed = (user.removedPermissions || []) as Permission[];
    const combined = new Set([...rolePermissions, ...added]);
    removed.forEach(p => combined.delete(p));
    return Array.from(combined);
}

export function hasPermission(user: User | null, permission: Permission): boolean {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    const effective = getEffectivePermissions(user);
    return effective.includes(permission);
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
    return permissions.some(p => hasPermission(user, p));
}

export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
    return permissions.every(p => hasPermission(user, p));
}

// ============ PERMISSION GROUPS FOR UI ============
export const PERMISSION_GROUPS = {
    dashboard: {
        label: 'Dashboard',
        permissions: [
            { key: PERMISSIONS.DASHBOARD_VIEW, label: 'View Dashboard' },
            { key: PERMISSIONS.DASHBOARD_ACTIVE_SESSIONS, label: 'Active Sessions Card' },
            { key: PERMISSIONS.DASHBOARD_TOTAL_CUSTOMERS, label: 'Total Customers Card' },
            { key: PERMISSIONS.DASHBOARD_MONTHLY_REVENUE, label: 'Monthly Revenue Card' },
            { key: PERMISSIONS.DASHBOARD_TODAY_REVENUE, label: 'Today Revenue Card' },
            { key: PERMISSIONS.DASHBOARD_NETWORK_USAGE, label: 'Network Usage' },
            { key: PERMISSIONS.DASHBOARD_PAYMENTS, label: 'Payments Card' },
        ],
    },
    pppoe: {
        label: 'PPPoE Customers',
        permissions: [
            { key: PERMISSIONS.PPPOE_VIEW, label: 'View PPPoE Page' },
            { key: PERMISSIONS.PPPOE_ADD_USER, label: 'Add User' },
            { key: PERMISSIONS.PPPOE_SEND_BULK_SMS, label: 'Send Bulk SMS' },
            { key: PERMISSIONS.PPPOE_DETAILS_VIEW, label: 'View Details' },
            { key: PERMISSIONS.PPPOE_EDIT, label: 'Edit User' },
            { key: PERMISSIONS.PPPOE_ADD_CHILD, label: 'Add Child Account' },
            { key: PERMISSIONS.PPPOE_SEND_SMS, label: 'Send SMS' },
            { key: PERMISSIONS.PPPOE_DELETE, label: 'Delete User' },
            { key: PERMISSIONS.PPPOE_SUSPEND, label: 'Suspend/Activate' },
            { key: PERMISSIONS.PPPOE_RESET_MAC, label: 'Reset MAC' },
            { key: PERMISSIONS.PPPOE_LOCK_MAC, label: 'Lock MAC' },
            { key: PERMISSIONS.PPPOE_PURGE, label: 'Purge' },
            { key: PERMISSIONS.PPPOE_OVERRIDE_PLAN, label: 'Override Plan' },
            { key: PERMISSIONS.PPPOE_SPEED_BOOST, label: 'Speed Boost' },
            { key: PERMISSIONS.PPPOE_STATIC_IP, label: 'Static IP' },
            { key: PERMISSIONS.PPPOE_CHANGE_PLAN, label: 'Change Plan' },
            { key: PERMISSIONS.PPPOE_CHANGE_EXPIRY, label: 'Change Expiry' },
            { key: PERMISSIONS.PPPOE_RESOLVE, label: 'Resolve' },
        ],
    },
    hotspot: {
        label: 'Hotspot Customers',
        permissions: [
            { key: PERMISSIONS.HOTSPOT_VIEW, label: 'View Hotspot Page' },
            { key: PERMISSIONS.HOTSPOT_ADD_USER, label: 'Add User' },
            { key: PERMISSIONS.HOTSPOT_DELETE_EXPIRED, label: 'Delete Expired' },
            { key: PERMISSIONS.HOTSPOT_DELETE_UNUSED, label: 'Delete Unused' },
            { key: PERMISSIONS.HOTSPOT_DETAILS_VIEW, label: 'View Details' },
            { key: PERMISSIONS.HOTSPOT_DELETE, label: 'Delete User' },
            { key: PERMISSIONS.HOTSPOT_RESET_MAC, label: 'Reset MAC' },
            { key: PERMISSIONS.HOTSPOT_PURGE, label: 'Purge' },
            { key: PERMISSIONS.HOTSPOT_RESET_COUNTERS, label: 'Reset Counters' },
            { key: PERMISSIONS.HOTSPOT_CHANGE_PACKAGE, label: 'Change Package' },
        ],
    },
    payments: {
        label: 'Payments',
        permissions: [
            { key: PERMISSIONS.PAYMENTS_VIEW_ELECTRONIC, label: 'Electronic Payments' },
            { key: PERMISSIONS.PAYMENTS_VIEW_MANUAL, label: 'Manual Recharge' },
        ],
    },
    sms: {
        label: 'SMS',
        permissions: [
            { key: PERMISSIONS.SMS_VIEW, label: 'View SMS Logs' },
            { key: PERMISSIONS.SMS_SETTINGS, label: 'Settings' },
            { key: PERMISSIONS.SMS_COMPOSE, label: 'Compose SMS' },
            { key: PERMISSIONS.SMS_CLEAR, label: 'Clear All' },
            { key: PERMISSIONS.SMS_DELETE, label: 'Delete Message' },
            { key: PERMISSIONS.SMS_RESEND, label: 'Resend Message' },
        ],
    },
    maps: {
        label: 'Maps',
        permissions: [
            { key: PERMISSIONS.MAPS_VIEW, label: 'View Maps' },
        ],
    },
    packages: {
        label: 'Packages',
        permissions: [
            { key: PERMISSIONS.PACKAGES_VIEW, label: 'View Packages' },
            { key: PERMISSIONS.PACKAGES_ADD_HOTSPOT, label: 'Add Hotspot Package' },
            { key: PERMISSIONS.PACKAGES_ADD_PPPOE, label: 'Add PPPoE Package' },
            { key: PERMISSIONS.PACKAGES_DETAILS_VIEW, label: 'View Details' },
            { key: PERMISSIONS.PACKAGES_EDIT, label: 'Edit Package' },
            { key: PERMISSIONS.PACKAGES_DELETE, label: 'Delete Package' },
        ],
    },
    routers: {
        label: 'Routers/NAS',
        permissions: [
            { key: PERMISSIONS.ROUTERS_VIEW, label: 'View Routers' },
            { key: PERMISSIONS.ROUTERS_ADD, label: 'Add Router' },
            { key: PERMISSIONS.ROUTERS_TUTORIAL, label: 'Tutorial' },
            { key: PERMISSIONS.ROUTERS_DETAILS_VIEW, label: 'View Details' },
            { key: PERMISSIONS.ROUTERS_EDIT, label: 'Edit Router' },
            { key: PERMISSIONS.ROUTERS_DELETE, label: 'Delete Router' },
            { key: PERMISSIONS.ROUTERS_TEST, label: 'Test Connection' },
            { key: PERMISSIONS.ROUTERS_CONFIG, label: 'Generate Config' },
            { key: PERMISSIONS.ROUTERS_DISCONNECT, label: 'Disconnect User' },
        ],
    },
    finance: {
        label: 'Finance',
        permissions: [
            { key: PERMISSIONS.FINANCE_DASHBOARD_VIEW, label: 'View Dashboard' },
            { key: PERMISSIONS.FINANCE_VIEW_CHARTS, label: 'View Charts' },
            { key: PERMISSIONS.FINANCE_INCOME_VIEW, label: 'View Income' },
            { key: PERMISSIONS.FINANCE_INCOME_CREATE, label: 'Record Income' },
            { key: PERMISSIONS.FINANCE_EXPENSES_VIEW, label: 'View Expenses' },
            { key: PERMISSIONS.FINANCE_EXPENSES_CREATE, label: 'Create Expense' },
            { key: PERMISSIONS.FINANCE_REPORTS_VIEW, label: 'View Reports' },
            { key: PERMISSIONS.FINANCE_REPORTS_GENERATE, label: 'Generate Reports' },
        ],
    },
    operators: {
        label: 'Team Members',
        permissions: [
            { key: PERMISSIONS.OPERATORS_VIEW, label: 'View Team' },
            { key: PERMISSIONS.OPERATORS_ADD, label: 'Add Operator' },
            { key: PERMISSIONS.OPERATORS_DETAILS_VIEW, label: 'View Details' },
            { key: PERMISSIONS.OPERATORS_EDIT, label: 'Edit Operator' },
            { key: PERMISSIONS.OPERATORS_DELETE, label: 'Delete Operator' },
            { key: PERMISSIONS.OPERATORS_MANAGE_PERMISSIONS, label: 'Manage Permissions' },
        ],
    },
    settings: {
        label: 'Settings',
        permissions: [
            { key: PERMISSIONS.SETTINGS_GENERAL, label: 'General' },
            { key: PERMISSIONS.SETTINGS_LICENCE, label: 'Licence' },
            { key: PERMISSIONS.SETTINGS_INVOICES, label: 'Invoices' },
            { key: PERMISSIONS.SETTINGS_PAYMENT_GATEWAY, label: 'Payment Gateway' },
            { key: PERMISSIONS.SETTINGS_SMS, label: 'SMS Config' },
            { key: PERMISSIONS.SETTINGS_PASSWORD, label: 'Change Password' },
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
