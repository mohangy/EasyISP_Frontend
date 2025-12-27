import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Users, Key, Loader2, AlertTriangle } from "lucide-react";
import { tenantApi, type Operator } from "../../services/tenantService";
import toast from "react-hot-toast";
// import { usePermissions } from "../../hooks/usePermissions";
import { PERMISSIONS } from "../../lib/permissions";
import { PermissionGate } from "../../components/auth/PermissionGate";
import { ProtectedButton } from "../../components/auth/ProtectedButton";
import { PermissionEditorModal } from "./PermissionEditorModal";

export function Operators() {
    const [operators, setOperators] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
    const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        role: "ADMIN" | "CUSTOMER_CARE" | "FIELD_TECH";
        password: string;
        addedPermissions: string[];
        removedPermissions: string[];
    }>({
        name: "",
        email: "",
        role: "CUSTOMER_CARE",
        password: "",
        addedPermissions: [],
        removedPermissions: [],
    });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // const { can } = usePermissions();

    const fetchOperators = async () => {
        try {
            setLoading(true);
            const data = await tenantApi.getOperators(page, pageSize);
            setOperators(data.operators);
            setTotal(data.total);
            setTotalPages(Math.ceil(data.total / pageSize));
        } catch (error) {
            console.error("Failed to fetch operators:", error);
            // Demo data for offline
            const demoOperators = [
                { id: "1", name: "John Admin", email: "john@isp.com", role: "ADMIN" as const, status: "ACTIVE" as const, addedPermissions: [], removedPermissions: [], createdAt: new Date().toISOString() },
                { id: "2", name: "Sarah Support", email: "sarah@isp.com", role: "CUSTOMER_CARE" as const, status: "ACTIVE" as const, addedPermissions: [], removedPermissions: [], createdAt: new Date().toISOString() },
                { id: "3", name: "Mike Tech", email: "mike@isp.com", role: "FIELD_TECH" as const, status: "ACTIVE" as const, addedPermissions: ["payments:view"], removedPermissions: [], createdAt: new Date().toISOString() },
            ];
            setOperators(demoOperators);
            setTotal(demoOperators.length);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOperators();
    }, [page]);

    const handleOpenAdd = () => {
        setEditingOperator(null);
        setFormData({ name: "", email: "", role: "CUSTOMER_CARE", password: "", addedPermissions: [], removedPermissions: [] });
        setShowModal(true);
    };

    const handleOpenEdit = (op: Operator) => {
        setEditingOperator(op);
        setFormData({
            name: op.name,
            email: op.email,
            role: op.role === "SUPER_ADMIN" ? "ADMIN" : op.role,
            password: "",
            addedPermissions: op.addedPermissions || [],
            removedPermissions: op.removedPermissions || [],
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast.error("Please fill in all required fields");
            return;
        }
        try {
            setSaving(true);
            if (editingOperator) {
                await tenantApi.updateOperator(editingOperator.id, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    addedPermissions: formData.addedPermissions,
                    removedPermissions: formData.removedPermissions,
                });
                toast.success("Operator updated successfully!");
            } else {
                if (!formData.password) {
                    toast.error("Password is required for new operators");
                    return;
                }
                await tenantApi.addOperator({
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    password: formData.password,
                });
                toast.success("Operator added successfully!");
            }
            setShowModal(false);
            fetchOperators();
        } catch (error) {
            toast.error(editingOperator ? "Failed to update operator" : "Failed to add operator");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (operator: Operator) => {
        setOperatorToDelete(operator);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!operatorToDelete) return;
        try {
            setDeletingId(operatorToDelete.id);
            await tenantApi.deleteOperator(operatorToDelete.id);
            toast.success("Operator deleted successfully!");
            fetchOperators();
        } catch (error) {
            toast.error("Failed to delete operator");
        } finally {
            setDeletingId(null);
            setShowDeleteModal(false);
            setOperatorToDelete(null);
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'Super Admin';
            case 'ADMIN': return 'Admin';
            case 'CUSTOMER_CARE': return 'Customer Care';
            case 'FIELD_TECH': return 'Field Technician';
            default: return role;
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'bg-purple-600/20 text-purple-400';
            case 'ADMIN': return 'bg-blue-600/20 text-blue-400';
            case 'CUSTOMER_CARE': return 'bg-green-600/20 text-green-400';
            case 'FIELD_TECH': return 'bg-orange-600/20 text-orange-400';
            default: return 'bg-slate-600/20 text-slate-400';
        }
    };

    return (
        <PermissionGate permission={PERMISSIONS.OPERATORS_VIEW}>
            <div className="space-y-6 animate-fade-in">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="w-6 h-6 md:w-8 md:h-8" />
                            Team Members
                        </h1>
                        <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                            Manage your staff (Total: {total})
                        </p>
                    </div>
                    <ProtectedButton
                        permission={PERMISSIONS.OPERATORS_CREATE}
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl font-medium shadow-lg shadow-cyan-600/20 hover:shadow-xl hover:shadow-cyan-600/30 transition-all hover:bg-cyan-700"
                    >
                        <Users className="w-5 h-5" />
                        <span>Add Operator</span>
                    </ProtectedButton>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-200/60 dark:border-slate-700/50 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50">
                                <tr>
                                    <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">#</th>
                                    <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">NAME</th>
                                    <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">EMAIL</th>
                                    <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">ROLE</th>
                                    <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">STATUS</th>
                                    <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                                        </td>
                                    </tr>
                                ) : operators.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                            No operators found. Add your first team member.
                                        </td>
                                    </tr>
                                ) : (
                                    operators.map((op, index) => (
                                        <tr key={op.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-3 md:px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{index + 1}</td>
                                            <td className="px-3 md:px-4 py-3 text-sm font-medium">
                                                <Link to={`/operators/${op.id}`} className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:underline transition-colors">
                                                    {op.name}
                                                </Link>
                                            </td>
                                            <td className="px-3 md:px-4 py-3 text-sm text-cyan-500 dark:text-cyan-400 hidden sm:table-cell">{op.email}</td>
                                            <td className="px-3 md:px-4 py-3 text-sm">
                                                <span className={`px-2 py-0.5 rounded text-xs ${getRoleColor(op.role)}`}>
                                                    {getRoleLabel(op.role)}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-4 py-3 text-sm hidden md:table-cell">
                                                <span className={op.status === "ACTIVE" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>
                                                    {op.status}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-4 py-3 text-sm">
                                                <ProtectedButton
                                                    permission={PERMISSIONS.OPERATORS_EDIT}
                                                    onClick={() => handleOpenEdit(op)}
                                                    className="text-cyan-600 dark:text-cyan-400 hover:underline mr-4 font-medium"
                                                >
                                                    Edit
                                                </ProtectedButton>
                                                <ProtectedButton
                                                    permission={PERMISSIONS.OPERATORS_DELETE}
                                                    onClick={() => handleDelete(op)}
                                                    disabled={deletingId === op.id}
                                                    className="text-red-500 dark:text-red-400 hover:underline disabled:opacity-50 font-medium"
                                                >
                                                    {deletingId === op.id ? "..." : "Delete"}
                                                </ProtectedButton>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6 gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="flex items-center px-4 text-sm text-slate-600 dark:text-slate-400">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {showModal && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto shadow-2xl">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                {editingOperator ? "Edit Operator" : "Add Operator"}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            role: e.target.value as "ADMIN" | "CUSTOMER_CARE" | "FIELD_TECH",
                                            // Reset custom permissions when role changes
                                            addedPermissions: [],
                                            removedPermissions: [],
                                        }))}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        <option value="ADMIN">Admin</option>
                                        <option value="CUSTOMER_CARE">Customer Care</option>
                                        <option value="FIELD_TECH">Field Technician</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {formData.role === 'ADMIN' && 'Full access except tenant settings'}
                                        {formData.role === 'CUSTOMER_CARE' && 'Customers, payments, vouchers, tickets'}
                                        {formData.role === 'FIELD_TECH' && 'Routers/NAS configuration, customer view'}
                                    </p>
                                </div>
                                {!editingOperator && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Password *</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                )}

                                {/* Custom Permissions Section */}
                                {editingOperator && (
                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowPermissionModal(true)}
                                            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <Key className="w-4 h-4" />
                                            Customize Permissions
                                            {(formData.addedPermissions.length > 0 || formData.removedPermissions.length > 0) && (
                                                <span className="bg-cyan-600 text-white text-xs px-2 py-0.5 rounded-full">
                                                    {formData.addedPermissions.length + formData.removedPermissions.length} custom
                                                </span>
                                            )}
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
                                    >
                                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingOperator ? "Update" : "Add"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && operatorToDelete && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-4 text-red-600 dark:text-red-500 mb-4">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Operator?</h3>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">{operatorToDelete.name}</span>?
                                This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={deletingId === operatorToDelete.id}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                                >
                                    {deletingId === operatorToDelete.id && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Delete Operator
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Permission Editor Modal */}
                {showPermissionModal && (
                    <PermissionEditorModal
                        role={formData.role}
                        addedPermissions={formData.addedPermissions}
                        removedPermissions={formData.removedPermissions}
                        onSave={(added, removed) => {
                            setFormData(prev => ({ ...prev, addedPermissions: added, removedPermissions: removed }));
                            setShowPermissionModal(false);
                        }}
                        onClose={() => setShowPermissionModal(false)}
                    />
                )}
            </div>
        </PermissionGate>
    );
}


