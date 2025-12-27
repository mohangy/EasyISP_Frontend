import { useState, useEffect } from "react";
import { PermissionGate } from "../../components/auth/PermissionGate";

import { PackageList } from "./PackageList";
import { HotspotPackageForm } from "./HotspotPackageForm";
import { PPPoEPackageForm } from "./PPPoEPackageForm";
import { packageService } from "../../services/packageService";
import type { Package } from "../../types/package";
// import { usePermissions } from "../../hooks/usePermissions"; 
// Or better, just remove the line. 
import { PERMISSIONS } from "../../lib/permissions";
import { toast } from "react-hot-toast";

export function Packages() {
    // const { can } = usePermissions(); // Removed unused hook if not used elsewhere
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [showHotspotModal, setShowHotspotModal] = useState(false);
    const [showPPPoEModal, setShowPPPoEModal] = useState(false);

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        try {
            setLoading(true);
            const data = await packageService.getPackages();
            setPackages(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load packages");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (data: any) => {
        try {
            await packageService.createPackage(data);
            toast.success("Package created successfully");
            setShowHotspotModal(false);
            setShowPPPoEModal(false);
            loadPackages();
        } catch (error) {
            console.error(error);
            toast.error("Failed to create package");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center justify-center md:justify-start gap-2">
                        Packages ALL <span className="text-slate-400 text-lg">({packages.length})</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Overview of All Hotspot and PPPoE Packages</p>
                </div>
                <PermissionGate permission={PERMISSIONS.PACKAGES_CREATE}>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                        <button
                            onClick={() => setShowHotspotModal(true)}
                            className="bg-transparent border border-slate-500 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors uppercase tracking-wider"
                        >
                            ADD HOTSPOT PACKAGE
                        </button>
                        <button
                            onClick={() => setShowPPPoEModal(true)}
                            className="bg-transparent border border-slate-500 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-lg font-medium text-xs flex items-center gap-2 transition-colors uppercase tracking-wider"
                        >
                            ADD PPPOE PACKAGE
                        </button>
                    </div>
                </PermissionGate>
            </div>

            <PackageList packages={packages} loading={loading} />

            <HotspotPackageForm
                isOpen={showHotspotModal}
                onClose={() => setShowHotspotModal(false)}
                onSubmit={handleCreate}
            />

            <PPPoEPackageForm
                isOpen={showPPPoEModal}
                onClose={() => setShowPPPoEModal(false)}
                onSubmit={handleCreate}
            />
        </div>
    );
}
