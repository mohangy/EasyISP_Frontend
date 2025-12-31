import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, Trash2, Clock, MapPin, Gauge, AlertTriangle, Users, UserCheck, UserX, Coins, Power } from "lucide-react";
import { packageService } from "../../services/packageService";
import type { Package } from "../../types/package";
import { toast } from "react-hot-toast";
import { HotspotPackageForm } from "./HotspotPackageForm";
import { PPPoEPackageForm } from "./PPPoEPackageForm";
import { PermissionGate } from "../../components/auth/PermissionGate";
import { PERMISSIONS } from "../../lib/permissions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PackageStats {
    totalClients: number;
    activeClients: number;
    expiredClients: number;
    revenue: number;
}

export function PackageDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pkg, setPkg] = useState<Package | null>(null);
    const [stats, setStats] = useState<PackageStats | null>(null);
    const [routerRevenue, setRouterRevenue] = useState<{ routerName: string; revenue: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                const [packages, statistics] = await Promise.all([
                    packageService.getPackages(),
                    packageService.getPackageStats(id)
                ]);

                const found = packages.find(p => p.id === id);
                if (found) {
                    setPkg(found);
                    setStats(statistics);
                    // Fetch router stats only for hotspot packages
                    if (found.type === 'HOTSPOT') {
                        const routerStats = await packageService.getRouterRevenueStats(id);
                        setRouterRevenue(routerStats);
                    }
                } else {
                    toast.error("Package not found");
                    navigate("/packages");
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load package details");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, navigate]);

    const handleUpdate = async (data: any) => {
        if (!pkg) return;
        try {
            const updatedData: Package = {
                ...pkg,
                name: data.name,
                price: Number(data.price),
                downloadSpeed: Number(data.downloadSpeed) || pkg.downloadSpeed,
                uploadSpeed: Number(data.uploadSpeed) || pkg.uploadSpeed,
                // Handle session time & data limits if Hotspot
                sessionTime: data.sessionTime ? Number(data.sessionTime) : pkg.sessionTime,
                sessionTimeUnit: data.sessionTimeUnit || pkg.sessionTimeUnit,
                dataLimit: data.dataLimit ? Number(data.dataLimit) : pkg.dataLimit,
                dataLimitUnit: data.dataLimitUnit || pkg.dataLimitUnit,
                routerIds: data.routerIds || pkg.routerIds,
            };

            await packageService.updatePackage(pkg.id, updatedData);
            setPkg(updatedData);
            setIsEditOpen(false);
            toast.success("Package updated successfully");
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.error || error.response?.data?.message || "Failed to update package";
            toast.error(message);
        }
    };

    const confirmDelete = async () => {
        if (!pkg) return;
        try {
            await packageService.deletePackage(pkg.id);
            toast.success("Package deleted");
            navigate("/packages");
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.error || error.response?.data?.message || "Failed to delete package";
            toast.error(message);
        }
    };

    const handleToggleStatus = async () => {
        if (!pkg) return;

        if (pkg.isActive && (pkg.customerCount || 0) > 0) {
            toast.error(`Cannot disable package. ${pkg.customerCount} users are currently assigned to it.`);
            return;
        }

        try {
            const updatedData = { ...pkg, isActive: !pkg.isActive };
            await packageService.updatePackage(pkg.id, updatedData);
            setPkg(updatedData);
            toast.success(`Package ${updatedData.isActive ? 'enabled' : 'disabled'} successfully`);
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.error || error.response?.data?.message || "Failed to update package status";
            toast.error(message);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-400">Loading details...</div>;
    }

    if (!pkg) return null;

    const handleStatClick = (statusFilter?: string) => {
        if (!pkg) return;

        // Determine correct route based on package type
        const route = pkg.type === 'HOTSPOT' ? '/customers/hotspot' : '/customers/pppoe';

        // Navigate with state to preset filters
        navigate(route, {
            state: {
                packageId: pkg.id,
                status: statusFilter // 'active', 'expired', or undefined for all
            }
        });
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative flex items-center justify-center md:justify-start w-full md:w-auto flex-1 md:gap-4">
                    <button
                        onClick={() => navigate("/packages")}
                        className="absolute left-0 md:static p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center md:text-left px-10 md:px-0">
                        <h1 className="text-2xl font-bold text-slate-100">{pkg.name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-400 mt-1">
                            <span className="uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs font-semibold">
                                {pkg.type}
                            </span>
                            <span>•</span>
                            <span>Created {new Date(pkg.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-center">
                    <PermissionGate permission={PERMISSIONS.PACKAGES_EDIT}>
                        <button
                            onClick={handleToggleStatus}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${pkg.isActive && (pkg.customerCount || 0) > 0
                                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                    : pkg.isActive
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 hover:bg-amber-500/20'
                                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20'
                                }`}
                        >
                            <Power className="w-4 h-4" />
                            {pkg.isActive ? 'Disable' : 'Enable'}
                        </button>
                    </PermissionGate>
                    <PermissionGate permission={PERMISSIONS.PACKAGES_EDIT}>
                        <button
                            onClick={() => setIsEditOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </button>
                    </PermissionGate>
                    <PermissionGate permission={PERMISSIONS.PACKAGES_DELETE}>
                        <button
                            onClick={() => {
                                if ((pkg.customerCount || 0) > 0) {
                                    toast.error(`Cannot delete package. ${pkg.customerCount} users are currently assigned to it.`);
                                    return;
                                }
                                setIsDeleteOpen(true);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${(pkg.customerCount || 0) > 0
                                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                                : "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/50"
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </PermissionGate>
                </div>
            </div>

            {/* Performance Stats */}
            {stats && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Total Clients Card - Clickable */}
                        <div
                            onClick={() => handleStatClick()}
                            className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-1 cursor-pointer hover:bg-slate-800 transition-colors group"
                        >
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase group-hover:text-slate-300">
                                <Users className="w-4 h-4 text-blue-500" />
                                Total Clients
                            </div>
                            <p className="text-2xl font-bold text-slate-100">{stats.totalClients}</p>
                        </div>

                        {/* Active Clients Card - Clickable */}
                        <div
                            onClick={() => handleStatClick('active')}
                            className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-1 cursor-pointer hover:bg-slate-800 transition-colors group"
                        >
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase group-hover:text-slate-300">
                                <UserCheck className="w-4 h-4 text-emerald-500" />
                                Active
                            </div>
                            <p className="text-2xl font-bold text-slate-100">{stats.activeClients}</p>
                        </div>

                        {/* Expired Clients Card - Clickable */}
                        <div
                            onClick={() => handleStatClick('expired')}
                            className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-1 cursor-pointer hover:bg-slate-800 transition-colors group"
                        >
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase group-hover:text-slate-300">
                                <UserX className="w-4 h-4 text-rose-500" />
                                Expired
                            </div>
                            <p className="text-2xl font-bold text-slate-100">{stats.expiredClients}</p>
                        </div>

                        {/* Revenue Card - Not Clickable */}
                        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-1">
                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                                <Coins className="w-4 h-4 text-amber-500" />
                                Est. Revenue
                            </div>
                            <p className="text-2xl font-bold text-slate-100">KES {stats.revenue.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Revenue Chart for Hotspot Packages */}
                    {pkg.type === 'HOTSPOT' && routerRevenue.length > 0 && (
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 shadow-xl shadow-slate-900/20">
                            <h3 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
                                <Coins className="w-5 h-5 text-amber-500" />
                                Revenue per Router
                            </h3>
                            <div className="w-full overflow-x-auto pb-2">
                                <div style={{ height: '300px', minWidth: `${Math.max(100, routerRevenue.length * 150)}px` }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={routerRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis
                                                dataKey="routerName"
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                axisLine={{ stroke: '#334155' }}
                                                tickLine={false}
                                            />
                                            <YAxis
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                axisLine={{ stroke: '#334155' }}
                                                tickLine={false}
                                                tickFormatter={(value) => `K${(value / 1000).toFixed(0)}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px',
                                                    color: '#f8fafc'
                                                }}
                                                cursor={{ fill: '#334155', opacity: 0.4 }}
                                                formatter={(value: number | undefined) => [value ? `KES ${value.toLocaleString()}` : 'KES 0', 'Revenue']}
                                            />
                                            <Bar
                                                dataKey="revenue"
                                                fill="#6366f1"
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={60}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Basic Info */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">
                        Plan Details
                    </h3>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Cost</label>
                            <p className="text-xl font-bold text-cyan-400">KES {pkg.price.toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Speed (Up/Down)</label>
                            <div className="flex items-center gap-2 text-slate-200">
                                <Gauge className="w-4 h-4 text-slate-400" />
                                <span>{pkg.uploadSpeed}M / {pkg.downloadSpeed}M</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hotspot Limits */}
                {pkg.type === 'HOTSPOT' && (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2">
                            Session Limits
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Time Limit</label>
                                <div className="flex items-center gap-2 text-slate-200">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <span>{pkg.sessionTime} {pkg.sessionTimeUnit}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Data Quota</label>
                                <p className="text-slate-200">
                                    {pkg.dataLimit ? `${pkg.dataLimit} ${pkg.dataLimitUnit}` : 'Unlimited'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Routers */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-4 md:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-200 border-b border-slate-700 pb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        Availability
                    </h3>

                    {pkg.type === 'PPPOE' || !pkg.routerIds || pkg.routerIds.length === 0 ? (
                        <p className="text-slate-500 italic">
                            {pkg.type === 'PPPOE'
                                ? "Available on all routers (PPPoE default)"
                                : "This package is available on all hotspot routers."}
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {pkg.routerIds.map(rid => (
                                <div key={rid} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">Router {rid}</p>
                                        <p className="text-xs text-slate-500">Authorized</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modals */}
            {pkg.type === 'HOTSPOT' && (
                <HotspotPackageForm
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSubmit={handleUpdate}
                    initialData={pkg}
                />
            )}
            {pkg.type === 'PPPOE' && (
                <PPPoEPackageForm
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSubmit={handleUpdate}
                    initialData={pkg}
                />
            )}

            {/* Custom Delete Modal */}
            {isDeleteOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6">
                        <div className="flex items-center gap-4 text-rose-500">
                            <div className="p-3 bg-rose-500/10 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-100 uppercase">Delete Package?</h3>
                        </div>

                        <p className="text-slate-400">
                            Are you sure you want to delete <span className="text-slate-200 font-semibold">{pkg.name}</span>? This action cannot be undone.
                        </p>

                        <div className="flex items-center gap-4 pt-2">
                            <button
                                onClick={() => setIsDeleteOpen(false)}
                                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors uppercase text-sm"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors uppercase text-sm"
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
