import { useNavigate } from "react-router-dom";
import type { Package } from "../../types/package";
import { Loader2 } from "lucide-react";

interface PackageListProps {
    packages: Package[];
    loading: boolean;
}

// Helper function to format session time (stored in minutes)
function formatSessionTime(minutes?: number): string {
    if (!minutes) return '-';

    if (minutes < 60) {
        return `${minutes} min`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(minutes / 1440);
        return `${days} day${days > 1 ? 's' : ''}`;
    }
}

// Helper function to format data limit (stored in bytes as string)
function formatDataLimit(bytes?: string | number | null): string {
    if (!bytes) return '-';

    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(numBytes) || numBytes <= 0) return '-';

    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;

    if (numBytes >= GB) {
        return `${(numBytes / GB).toFixed(numBytes % GB === 0 ? 0 : 1)} GB`;
    } else if (numBytes >= MB) {
        return `${(numBytes / MB).toFixed(numBytes % MB === 0 ? 0 : 1)} MB`;
    } else if (numBytes >= KB) {
        return `${(numBytes / KB).toFixed(0)} KB`;
    }
    return `${numBytes} B`;
}

export function PackageList({ packages, loading }: PackageListProps) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="rounded-lg overflow-hidden border border-slate-700/50 bg-slate-800/50">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                    <thead className="bg-slate-900/50 text-xs text-slate-400 uppercase font-semibold">
                        <tr>
                            <th className="px-4 py-3 text-left w-12">#</th>

                            <th className="px-4 py-3 text-left">PACKAGE NAME</th>
                            <th className="px-4 py-3 text-left">SERVICE TYPE</th>
                            <th className="px-4 py-3 text-left">AMOUNT (KES)</th>
                            <th className="px-4 py-3 text-left">QUEUE</th>
                            <th className="px-4 py-3 text-left">SESSION TIME</th>
                            <th className="px-4 py-3 text-left">BYTES QUOTA</th>
                            <th className="px-4 py-3 text-left">ROUTER</th>
                            <th className="px-4 py-3 text-left">STATUS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 text-sm">
                        {packages.map((pkg, index) => (
                            <tr key={pkg.id} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-4 py-3 text-slate-500">{index + 1}</td>

                                <td
                                    className="px-4 py-3 font-bold text-cyan-500 cursor-pointer hover:text-cyan-400 hover:underline transition-colors block"
                                    onClick={() => navigate(`/packages/${pkg.id}`)}
                                >
                                    {pkg.name}
                                </td>
                                <td className="px-4 py-3 text-slate-400 lowercase">{pkg.type.toLowerCase()}</td>
                                <td className="px-4 py-3 text-slate-300">{pkg.price.toFixed(2)}</td>
                                <td className="px-4 py-3 text-slate-300">
                                    {pkg.uploadSpeed}M/{pkg.downloadSpeed}M
                                </td>
                                <td className="px-4 py-3 text-slate-300">
                                    {formatSessionTime(pkg.sessionTime)}
                                </td>
                                <td className="px-4 py-3 text-slate-300">
                                    {formatDataLimit(pkg.dataLimit)}
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs">
                                    {(pkg.routers?.length || 0) > 0 ? (pkg.routers!.length > 1 ? 'Multiple' : pkg.routers![0].name) : 'no'}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs ${pkg.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                        {pkg.isActive ? 'active' : 'inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {packages.length === 0 && (
                            <tr>
                                <td colSpan={9} className="text-center py-8 text-slate-500">
                                    No packages found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
