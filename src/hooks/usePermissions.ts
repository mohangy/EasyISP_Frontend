import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import type { Permission } from '../lib/permissions';
import {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getEffectivePermissions,
    ROLE_PERMISSIONS
} from '../lib/permissions';

/**
 * Hook for checking user permissions throughout the app
 */
export function usePermissions() {
    const { user } = useAuthStore();

    /**
     * Check if user has a specific permission
     */
    const can = useCallback((permission: Permission): boolean => {
        return hasPermission(user, permission);
    }, [user]);

    /**
     * Check if user has any of the specified permissions
     */
    const canAny = useCallback((permissions: Permission[]): boolean => {
        return hasAnyPermission(user, permissions);
    }, [user]);

    /**
     * Check if user has all of the specified permissions
     */
    const canAll = useCallback((permissions: Permission[]): boolean => {
        return hasAllPermissions(user, permissions);
    }, [user]);

    /**
     * Get all effective permissions for current user
     */
    const effectivePermissions = useMemo(() => {
        return getEffectivePermissions(user);
    }, [user]);

    /**
     * Get role default permissions (useful for comparing with effective)
     */
    const rolePermissions = useMemo(() => {
        if (!user) return [];
        return ROLE_PERMISSIONS[user.role] || [];
    }, [user]);

    /**
     * Check if a permission is from role default (not custom added)
     */
    const isRoleDefault = useCallback((permission: Permission): boolean => {
        return rolePermissions.includes(permission);
    }, [rolePermissions]);

    /**
     * Check if a permission was custom added
     */
    const isCustomAdded = useCallback((permission: Permission): boolean => {
        if (!user) return false;
        return (user.addedPermissions || []).includes(permission);
    }, [user]);

    /**
     * Check if a permission was custom removed
     */
    const isCustomRemoved = useCallback((permission: Permission): boolean => {
        if (!user) return false;
        return (user.removedPermissions || []).includes(permission);
    }, [user]);

    return {
        // Permission checks
        can,
        canAny,
        canAll,

        // User info
        user,
        role: user?.role,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',

        // Advanced
        effectivePermissions,
        rolePermissions,
        isRoleDefault,
        isCustomAdded,
        isCustomRemoved,
    };
}
