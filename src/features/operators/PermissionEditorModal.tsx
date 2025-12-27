import { useState } from "react";
import { createPortal } from "react-dom";
import { PERMISSION_GROUPS, ROLE_PERMISSIONS, type Permission } from "../../lib/permissions";
import { type UserRole } from "../../types";

interface PermissionEditorModalProps {
    role: UserRole;
    addedPermissions: string[];
    removedPermissions: string[];
    onSave: (added: string[], removed: string[]) => void;
    onClose: () => void;
}

export function PermissionEditorModal({
    role,
    addedPermissions,
    removedPermissions,
    onSave,
    onClose,
}: PermissionEditorModalProps) {
    const [added, setAdded] = useState<string[]>(addedPermissions);
    const [removed, setRemoved] = useState<string[]>(removedPermissions);

    const roleDefaults = ROLE_PERMISSIONS[role] || [];

    const isRoleDefault = (permission: Permission) => roleDefaults.includes(permission);
    const isEffectivelyEnabled = (permission: Permission) => {
        if (removed.includes(permission)) return false;
        if (added.includes(permission)) return true;
        return isRoleDefault(permission);
    };

    const togglePermission = (permission: Permission) => {
        const isDefault = isRoleDefault(permission);
        const isCustomAdded = added.includes(permission);
        const isCustomRemoved = removed.includes(permission);

        if (isDefault) {
            // Role default: toggle between default and removed
            if (isCustomRemoved) {
                setRemoved(prev => prev.filter(p => p !== permission));
            } else {
                setRemoved(prev => [...prev, permission]);
            }
        } else {
            // Not role default: toggle between added and not-added
            if (isCustomAdded) {
                setAdded(prev => prev.filter(p => p !== permission));
            } else {
                setAdded(prev => [...prev, permission]);
            }
        }
    };

    const getCheckboxStyle = (permission: Permission) => {
        const isEnabled = isEffectivelyEnabled(permission);
        const isCustomAdded = added.includes(permission);
        const isCustomRemoved = removed.includes(permission);

        if (isEnabled) {
            return isCustomAdded
                ? 'bg-cyan-600 border-cyan-600' // Custom enabled
                : 'bg-green-600 border-green-600'; // Role default enabled
        }
        return isCustomRemoved
            ? 'bg-red-600/30 border-red-600' // Custom disabled
            : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600'; // Not available
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] overflow-y-auto shadow-2xl">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Customize Permissions</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Override default permissions for this role. Green = role default, Cyan = added, Red border = removed.
                </p>

                <div className="space-y-4">
                    {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                        <div key={groupKey} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{group.label}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {group.permissions.map(({ key, label }) => (
                                    <label
                                        key={key}
                                        className="flex items-center gap-2 cursor-pointer text-sm"
                                    >
                                        <div
                                            onClick={() => togglePermission(key)}
                                            className={`w-4 h-4 rounded border flex items-center justify-center ${getCheckboxStyle(key)} transition-colors duration-200`}
                                        >
                                            {isEffectivelyEnabled(key) && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={isEffectivelyEnabled(key) ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}>
                                            {label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(added, removed)}
                        className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-lg hover:shadow-cyan-600/20"
                    >
                        Save Permissions
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
