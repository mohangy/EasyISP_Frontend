import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Info, Loader2 } from "lucide-react";
import { nasApi } from "../../services/nasService";

interface HotspotPackageFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

interface Router {
    id: string;
    name: string;
}

export function HotspotPackageForm({ isOpen, onClose, onSubmit, initialData }: HotspotPackageFormProps) {
    const defaultState = {
        name: "",
        price: "",
        downloadSpeed: "",
        uploadSpeed: "",
        sessionTime: "",
        sessionTimeUnit: "HOURS",
        dataLimit: "",
        dataLimitUnit: "MB",
        routerIds: [] as string[]
    };

    const [formData, setFormData] = useState(defaultState);
    const [showDataLimit, setShowDataLimit] = useState(false);
    const [routers, setRouters] = useState<Router[]>([]);
    const [loadingRouters, setLoadingRouters] = useState(false);

    // Fetch routers from API
    useEffect(() => {
        if (isOpen) {
            setLoadingRouters(true);
            nasApi.getRouters({ pageSize: 100 })
                .then(response => {
                    setRouters(response.routers.map(r => ({ id: r.id, name: `${r.name}-${r.ipAddress}` })));
                })
                .catch(err => {
                    console.error("Failed to load routers:", err);
                    setRouters([]);
                })
                .finally(() => setLoadingRouters(false));
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || "",
                    price: initialData.price?.toString() || "",
                    downloadSpeed: initialData.downloadSpeed?.toString() || "",
                    uploadSpeed: initialData.uploadSpeed?.toString() || "",
                    sessionTime: initialData.sessionTime?.toString() || "",
                    sessionTimeUnit: initialData.sessionTimeUnit || "HOURS",
                    dataLimit: initialData.dataLimit?.toString() || "",
                    dataLimitUnit: initialData.dataLimitUnit || "MB",
                    routerIds: initialData.routerIds || []
                });
                setShowDataLimit(!!initialData.dataLimit);
            } else {
                setFormData(defaultState);
                setShowDataLimit(false);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            type: "HOTSPOT",
            price: parseFloat(formData.price),
            downloadSpeed: parseInt(formData.downloadSpeed),
            uploadSpeed: parseInt(formData.uploadSpeed),
            sessionTime: formData.sessionTime ? parseInt(formData.sessionTime) : undefined,
            dataLimit: formData.dataLimit ? parseInt(formData.dataLimit) : undefined
        });
    };

    const toggleRouter = (id: string) => {
        setFormData(prev => ({
            ...prev,
            routerIds: prev.routerIds.includes(id)
                ? prev.routerIds.filter(r => r !== id)
                : [...prev.routerIds, id]
        }));
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-200">
                        {initialData ? "EDIT HOTSPOT PACKAGE" : "NEW HOTSPOT PACKAGE"}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                            PACKAGE NAME:<span className="text-red-500">* REQUIRED</span>
                        </label>
                        <input
                            type="text"
                            placeholder="E.g 1 hour at x shillings"
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-cyan-500" />
                            <label className="text-xs font-bold text-slate-400 uppercase">
                                AMOUNT:<span className="text-red-500">* REQUIRED</span>
                            </label>
                        </div>
                        <input
                            type="number"
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </div>

                    {/* Bandwidth (Speeds) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">
                                DOWNLOAD SPEED (MBPS)<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="e.g 8"
                                value={formData.downloadSpeed}
                                onChange={e => setFormData({ ...formData, downloadSpeed: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">
                                UPLOAD SPEED (MBPS)<span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                                placeholder="e.g 4"
                                value={formData.uploadSpeed}
                                onChange={e => setFormData({ ...formData, uploadSpeed: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Session Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-cyan-500" />
                                <label className="text-xs font-bold text-slate-400 uppercase">
                                    HOTSPOT SESSION TIME:<span className="text-red-500"> REQUIRED</span>
                                </label>
                            </div>
                            <input
                                type="number"
                                placeholder="ENTER NUMBER"
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.sessionTime}
                                onChange={e => setFormData({ ...formData, sessionTime: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">SELECT TIME</label>
                            <select
                                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                value={formData.sessionTimeUnit}
                                onChange={e => setFormData({ ...formData, sessionTimeUnit: e.target.value })}
                            >
                                <option value="MINUTES">MINUTE(S)</option>
                                <option value="HOURS">HOUR(S)</option>
                                <option value="DAYS">DAY(S)</option>
                            </select>
                        </div>
                    </div>

                    {/* Data Limit Toggle */}
                    {!showDataLimit ? (
                        <button
                            type="button"
                            onClick={() => setShowDataLimit(true)}
                            className="text-cyan-500 text-sm font-medium hover:text-cyan-400 uppercase tracking-wide"
                        >
                            CLICK TO ADD DATA LIMIT
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Info className="w-4 h-4 text-cyan-500" />
                                    <label className="text-xs font-bold text-slate-400 uppercase">
                                        HOTSPOT USER DATA LIMIT:
                                    </label>
                                </div>
                                <input
                                    type="number"
                                    placeholder="ENTER NUMBER"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                                    value={formData.dataLimit}
                                    onChange={e => setFormData({ ...formData, dataLimit: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">SELECT DATA UNIT</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                    value={formData.dataLimitUnit}
                                    onChange={e => setFormData({ ...formData, dataLimitUnit: e.target.value })}
                                >
                                    <option value="MB">MB</option>
                                    <option value="GB">GB</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Router Selection */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-cyan-500 uppercase">
                                MAP TO SPECIFIC ROUTER(s)
                            </label>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            <Info className="w-5 h-5 text-cyan-500" />
                            <span className="text-sm text-slate-200 font-bold">HOTSPOT ROUTER:</span>
                        </div>

                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {loadingRouters ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                                    <span className="ml-2 text-sm text-slate-400">Loading routers...</span>
                                </div>
                            ) : routers.length === 0 ? (
                                <p className="text-sm text-slate-500">No routers available</p>
                            ) : (
                                routers.map(router => (
                                    <label key={router.id} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${formData.routerIds.includes(router.id)
                                            ? 'bg-cyan-500 border-cyan-500'
                                            : 'border-slate-600 group-hover:border-slate-500'
                                            }`}>
                                            {formData.routerIds.includes(router.id) && <span className="text-white text-xs">✓</span>}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={formData.routerIds.includes(router.id)}
                                            onChange={() => toggleRouter(router.id)}
                                        />
                                        <span className="text-slate-300 text-sm">{router.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={handleSubmit} // Submit normally
                            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors uppercase text-sm"
                        >
                            SUBMIT
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-colors uppercase text-sm"
                        >
                            CANCEL
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
