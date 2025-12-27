import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Info } from "lucide-react";

interface PPPoEPackageFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

export function PPPoEPackageForm({ isOpen, onClose, onSubmit, initialData }: PPPoEPackageFormProps) {
    const defaultState = {
        name: "",
        price: "",
        bandwidth: ""
    };

    const [formData, setFormData] = useState(defaultState);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || "",
                    price: initialData.price?.toString() || "",
                    bandwidth: initialData.downloadSpeed?.toString() || initialData.bandwidth || ""
                });
            } else {
                setFormData(defaultState);
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...formData, type: "PPPOE" });
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-200">
                        {initialData ? "EDIT PPPOE PACKAGE" : "NEW PPPOE PACKAGE"}
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
                            placeholder="E.g my home plan 8mbps"
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

                    {/* Bandwidth */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-cyan-500" />
                            <label className="text-xs font-bold text-slate-400 uppercase">
                                BANDWIDTH (INTERNET SPEED) LIMIT (UPLOAD/DOWNLOAD)
                            </label>
                        </div>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="5M"
                            value={formData.bandwidth}
                            onChange={e => setFormData({ ...formData, bandwidth: e.target.value })}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <button
                            type="button"
                            onClick={handleSubmit}
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
