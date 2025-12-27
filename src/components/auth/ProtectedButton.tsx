import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import type { Permission } from '../../lib/permissions';

interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Permission required to enable the button */
    permission?: Permission;
    /** Multiple permissions - user needs ANY of these */
    anyOf?: Permission[];
    /** Multiple permissions - user needs ALL of these */
    allOf?: Permission[];
    /** Tooltip message when disabled due to lack of permission */
    disabledTooltip?: string;
    /** Children (button content) */
    children: React.ReactNode;
}

/**
 * Button that automatically disables when user lacks required permission.
 * Shows a tooltip explaining why the button is disabled.
 * 
 * @example
 * <ProtectedButton 
 *   permission="customers:delete" 
 *   onClick={handleDelete}
 *   className="btn-danger"
 * >
 *   Delete Customer
 * </ProtectedButton>
 */
export function ProtectedButton({
    permission,
    anyOf,
    allOf,
    disabledTooltip = "You don't have permission to perform this action",
    children,
    disabled,
    className = '',
    ...props
}: ProtectedButtonProps) {
    const { can, canAny, canAll } = usePermissions();

    let hasAccess = true;

    if (permission) {
        hasAccess = can(permission);
    } else if (anyOf && anyOf.length > 0) {
        hasAccess = canAny(anyOf);
    } else if (allOf && allOf.length > 0) {
        hasAccess = canAll(allOf);
    }

    const isDisabled = disabled || !hasAccess;

    return (
        <div className="relative inline-block group">
            <button
                {...props}
                disabled={isDisabled}
                className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!hasAccess ? disabledTooltip : props.title}
            >
                {children}
            </button>
            {/* Tooltip for permission-disabled buttons */}
            {!hasAccess && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">
                    {disabledTooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
            )}
        </div>
    );
}

/**
 * Link-style button with permission check
 */
export function ProtectedLink({
    permission,
    anyOf,
    allOf,
    disabledTooltip = "You don't have permission to perform this action",
    children,
    className = '',
    ...props
}: ProtectedButtonProps) {
    const { can, canAny, canAll } = usePermissions();

    let hasAccess = true;

    if (permission) {
        hasAccess = can(permission);
    } else if (anyOf && anyOf.length > 0) {
        hasAccess = canAny(anyOf);
    } else if (allOf && allOf.length > 0) {
        hasAccess = canAll(allOf);
    }

    if (!hasAccess) {
        return (
            <span
                className={`${className} opacity-50 cursor-not-allowed`}
                title={disabledTooltip}
            >
                {children}
            </span>
        );
    }

    return (
        <button {...props} className={className}>
            {children}
        </button>
    );
}
