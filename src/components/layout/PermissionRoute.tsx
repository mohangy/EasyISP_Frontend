import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { usePermissions } from "../../hooks/usePermissions";
import type { Permission } from "../../lib/permissions";

interface PermissionRouteProps {
    /** Permission required to access this route */
    permission: Permission;
    /** Content to render if user has permission */
    children: React.ReactNode;
}

/**
 * Route wrapper that checks both authentication and permission.
 * Redirects to /login if not authenticated, /unauthorized if lacking permission.
 * 
 * @example
 * <Route path="/operators" element={
 *     <PermissionRoute permission={PERMISSIONS.OPERATORS_VIEW}>
 *         <Operators />
 *     </PermissionRoute>
 * } />
 */
export function PermissionRoute({ permission, children }: PermissionRouteProps) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const { can } = usePermissions();

    // Not logged in - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Logged in but lacks permission - redirect to unauthorized page
    if (!can(permission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // Has permission - render children
    return <>{children}</>;
}
