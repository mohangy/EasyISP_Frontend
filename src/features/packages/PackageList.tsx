import { useNavigate } from "react-router-dom";
import type { Package } from "../../types/package";
import { Loader2 } from "lucide-react";

interface PackageListProps {
    packages: Package[];
    loading: boolean;
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
                                    {pkg.sessionTime ? `${pkg.sessionTime} ${pkg.sessionTimeUnit}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-300">
                                    {pkg.dataLimit ? `${pkg.dataLimit}${pkg.dataLimitUnit}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs">
                                    {pkg.routerIds.length > 0 ? (pkg.routerIds.length > 1 ? 'Multiple' : 'ac') : 'no'}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs">active</td>
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
