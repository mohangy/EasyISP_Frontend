import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../lib/permissions';

interface PermissionGateProps {
    /** Single permission required */
    permission?: Permission;
    /** Multiple permissions - user needs ANY of these */
    anyOf?: Permission[];
    /** Multiple permissions - user needs ALL of these */
    allOf?: Permission[];
    /** Content to show when user has permission */
    children: React.ReactNode;
    /** Content to show when user lacks permission (optional) */
    fallback?: React.ReactNode;
}

/**
 * Conditionally render children based on user permissions.
 * 
 * @example
 * // Single permission
 * <PermissionGate permission="customers:delete">
 *   <DeleteButton />
 * </PermissionGate>
 * 
 * @example
 * // Any of multiple permissions
 * <PermissionGate anyOf={["customers:edit", "customers:delete"]}>
 *   <ActionMenu />
 * </PermissionGate>
 * 
 * @example
 * // With fallback for disabled state
 * <PermissionGate permission="customers:delete" fallback={<DisabledDeleteButton />}>
 *   <DeleteButton />
 * </PermissionGate>
 */
export function PermissionGate({
    permission,
    anyOf,
    allOf,
    children,
    fallback = null
}: PermissionGateProps) {
    const { can, canAny, canAll } = usePermissions();

    let hasAccess = false;

    if (permission) {
        hasAccess = can(permission);
    } else if (anyOf && anyOf.length > 0) {
        hasAccess = canAny(anyOf);
    } else if (allOf && allOf.length > 0) {
        hasAccess = canAll(allOf);
    } else {
        // No permission specified, allow access
        hasAccess = true;
    }

    if (hasAccess) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
}

/**
 * Higher-order component version of PermissionGate
 */
export function withPermission<P extends object>(
    Component: React.ComponentType<P>,
    permission: Permission
) {
    return function WrappedComponent(props: P) {
        return (
            <PermissionGate permission={permission}>
                <Component {...props} />
            </PermissionGate>
        );
    };
}
